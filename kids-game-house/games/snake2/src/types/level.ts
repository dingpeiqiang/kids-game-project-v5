/**
 * 🏰 关卡系统类型定义
 */

/**
 * 单个关卡的参数配置
 * 每关通过调整这些参数来制造差异感
 */
export interface LevelConfig {
  /** 关卡编号（1-based） */
  level: number

  /** 关卡名称（中文，如 "初出茅庐"） */
  name: string

  /** 升级所需分数（从游戏开始累计） */
  scoreToNext: number

  // ===== 以下参数为该关卡的"最终值"，直接覆盖当前游戏设置 =====

  /** 蛇的移动速度（像素/秒）。数值越大越快 */
  speed: number

  /** 场上障碍物数量 */
  obstacleCount: number

  /** 普通食物分数（apple） */
  foodScore: number

  /** 奖励食物分数（banana / cherry） */
  bonusScore: number

  /** 金币分数（coin） */
  coinScore: number

  /** 金币出现概率（0-1） */
  coinChance: number
}

/**
 * 关卡进度（可持久化到 localStorage）
 */
export interface LevelProgress {
  /** 已解锁的最高关卡 */
  maxUnlockedLevel: number
  /** 各关最高分：key = 关卡号, value = 该关结束时累计分数 */
  levelHighScores: Record<number, number>
}

/**
 * 关卡过渡状态（UI 层使用，不持久化）
 */
export interface LevelTransition {
  /** 是否正在过渡 */
  isActive: boolean
  /** 刚完成的关卡 */
  fromLevel: number
  /** 进入的新关卡 */
  toLevel: number
  /** 新关卡名称 */
  toLevelName: string
}

/**
 * 获取关卡配置（按基础难度缩放）
 *
 * @param level  关卡号 1-20
 * @param difficulty  基础难度
 * @returns 该关卡在本难度下的最终参数
 */
export function getLevelConfig(
  level: number,
  difficulty: 'easy' | 'medium' | 'hard',
): LevelConfig {
  const base = LEVEL_TABLE[level]
  if (!base) {
    // 超过 20 关后，使用第 20 关参数（难度锁定）
    return { ...LEVEL_TABLE[20], level }
  }

  // 根据难度缩放
  const scale = DIFFICULTY_SCALE[difficulty]
  return {
    ...base,
    speed: Math.round(base.speed * scale.speed),
    obstacleCount: Math.round(base.obstacleCount * scale.obstacleCount),
    foodScore: Math.round(base.foodScore * scale.food),
    bonusScore: Math.round(base.bonusScore * scale.food),
    coinScore: Math.round(base.coinScore * scale.food),
  }
}

// ─── 难度缩放因子 ───

const DIFFICULTY_SCALE: Record<
  'easy' | 'medium' | 'hard',
  { speed: number; obstacleCount: number; food: number }
> = {
  easy:   { speed: 0.75, obstacleCount: 0.5, food: 0.8 },
  medium: { speed: 1.0,  obstacleCount: 1.0, food: 1.0 },
  hard:   { speed: 1.3,  obstacleCount: 1.5, food: 1.5 },
}

// ─── 20 关参数表（"标准/中等"难度基准值） ───

export const LEVEL_TABLE: Record<number, LevelConfig> = {
  1:  { level: 1,  name: '初出茅庐',   scoreToNext: 50,   speed: 120, obstacleCount: 0,  foodScore: 10, bonusScore: 20, coinScore: 30,  coinChance: 0.02 },
  2:  { level: 2,  name: '小试牛刀',   scoreToNext: 100,  speed: 130, obstacleCount: 0,  foodScore: 10, bonusScore: 20, coinScore: 30,  coinChance: 0.03 },
  3:  { level: 3,  name: '渐入佳境',   scoreToNext: 160,  speed: 140, obstacleCount: 0,  foodScore: 10, bonusScore: 25, coinScore: 35,  coinChance: 0.03 },
  4:  { level: 4,  name: '初见障碍',   scoreToNext: 220,  speed: 150, obstacleCount: 2,  foodScore: 10, bonusScore: 25, coinScore: 40,  coinChance: 0.04 },
  5:  { level: 5,  name: '步步为营',   scoreToNext: 300,  speed: 160, obstacleCount: 3,  foodScore: 15, bonusScore: 30, coinScore: 45,  coinChance: 0.04 },
  6:  { level: 6,  name: '加速前进',   scoreToNext: 400,  speed: 175, obstacleCount: 3,  foodScore: 15, bonusScore: 30, coinScore: 50,  coinChance: 0.05 },
  7:  { level: 7,  name: '铜墙铁壁',   scoreToNext: 500,  speed: 185, obstacleCount: 4,  foodScore: 15, bonusScore: 35, coinScore: 55,  coinChance: 0.05 },
  8:  { level: 8,  name: '勇往直前',   scoreToNext: 620,  speed: 200, obstacleCount: 4,  foodScore: 20, bonusScore: 35, coinScore: 60,  coinChance: 0.05 },
  9:  { level: 9,  name: '荆棘密布',   scoreToNext: 750,  speed: 210, obstacleCount: 5,  foodScore: 20, bonusScore: 40, coinScore: 65,  coinChance: 0.06 },
  10: { level: 10, name: '里程碑',     scoreToNext: 900,  speed: 220, obstacleCount: 5,  foodScore: 20, bonusScore: 40, coinScore: 70,  coinChance: 0.06 },
  11: { level: 11, name: '风暴将至',   scoreToNext: 1100, speed: 235, obstacleCount: 6,  foodScore: 25, bonusScore: 45, coinScore: 80,  coinChance: 0.06 },
  12: { level: 12, name: '疾风骤雨',   scoreToNext: 1300, speed: 250, obstacleCount: 6,  foodScore: 25, bonusScore: 45, coinScore: 85,  coinChance: 0.07 },
  13: { level: 13, name: '重重险阻',   scoreToNext: 1500, speed: 260, obstacleCount: 7,  foodScore: 25, bonusScore: 50, coinScore: 90,  coinChance: 0.07 },
  14: { level: 14, name: '极限挑战',   scoreToNext: 1750, speed: 275, obstacleCount: 7,  foodScore: 30, bonusScore: 50, coinScore: 95,  coinChance: 0.07 },
  15: { level: 15, name: '巅峰之路',   scoreToNext: 2000, speed: 285, obstacleCount: 8,  foodScore: 30, bonusScore: 55, coinScore: 100, coinChance: 0.08 },
  16: { level: 16, name: '精英领域',   scoreToNext: 2300, speed: 300, obstacleCount: 8,  foodScore: 30, bonusScore: 55, coinScore: 110, coinChance: 0.08 },
  17: { level: 17, name: '无人之境',   scoreToNext: 2600, speed: 315, obstacleCount: 9,  foodScore: 35, bonusScore: 60, coinScore: 120, coinChance: 0.08 },
  18: { level: 18, name: '最后冲刺',   scoreToNext: 3000, speed: 330, obstacleCount: 9,  foodScore: 35, bonusScore: 60, coinScore: 130, coinChance: 0.09 },
  19: { level: 19, name: '王者试炼',   scoreToNext: 3500, speed: 345, obstacleCount: 10, foodScore: 40, bonusScore: 65, coinScore: 140, coinChance: 0.09 },
  20: { level: 20, name: '传说之巅',   scoreToNext: 9999, speed: 360, obstacleCount: 10, foodScore: 40, bonusScore: 70, coinScore: 150, coinChance: 0.10 },
}
