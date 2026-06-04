/**
 * 切饼干游戏 - 关卡配置
 * 
 * 10个关卡，难度逐步提升
 * 从简单到困难，适合不同水平的玩家
 */

import type { LevelConfig } from './types'

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '新手烘焙师',
    description: '欢迎来到饼干世界！慢慢来，享受切割的乐趣～',
    duration: 60000,        // 60秒
    spawnInterval: 2200,    // 2.2秒生成一个（超慢）
    maxCookies: 2,          // 最多2个饼干
    verticalSpeed: 2.0,     // 很慢的上升速度
    horizontalSpeed: 0.8,   // 很小的左右移动
    targetScore: 80,        // 目标分数（降低）
    rotationSpeed: 0.03,    // 几乎不旋转
  },
  {
    level: 2,
    name: '学徒厨师',
    description: '你已经掌握基础技巧了，试试更快的节奏！',
    duration: 60000,
    spawnInterval: 1900,    // 加快
    maxCookies: 2,
    verticalSpeed: 2.5,     // 稍快
    horizontalSpeed: 1.0,
    targetScore: 150,
    rotationSpeed: 0.04,
  },
  {
    level: 3,
    name: '熟练刀工',
    description: '不错的进步！现在要同时处理更多饼干了。',
    duration: 60000,
    spawnInterval: 1700,
    maxCookies: 3,          // 增加到3个
    verticalSpeed: 3.0,
    horizontalSpeed: 1.3,
    targetScore: 250,
    rotationSpeed: 0.05,
  },
  {
    level: 4,
    name: '专业切手',
    description: '速度加快了，保持专注！',
    duration: 60000,
    spawnInterval: 1500,
    maxCookies: 3,
    verticalSpeed: 3.5,
    horizontalSpeed: 1.6,
    targetScore: 400,
    rotationSpeed: 0.06,
  },
  {
    level: 5,
    name: '切割高手',
    description: ' halfway 了！挑战真正开始...',
    duration: 60000,
    spawnInterval: 1350,
    maxCookies: 3,
    verticalSpeed: 4.0,
    horizontalSpeed: 1.9,
    targetScore: 600,
    rotationSpeed: 0.07,
  },
  {
    level: 6,
    name: '大师级刀法',
    description: '你的技术令人印象深刻！但要更快！',
    duration: 60000,
    spawnInterval: 1200,    // 明显加快
    maxCookies: 4,          // 增加到4个
    verticalSpeed: 4.5,
    horizontalSpeed: 2.2,
    targetScore: 850,
    rotationSpeed: 0.08,
  },
  {
    level: 7,
    name: '极速切割',
    description: '速度狂飙！反应要快！',
    duration: 60000,
    spawnInterval: 1100,
    maxCookies: 4,
    verticalSpeed: 5.2,
    horizontalSpeed: 2.5,
    targetScore: 1150,
    rotationSpeed: 0.09,
  },
  {
    level: 8,
    name: '旋风刀客',
    description: '饼干像旋风一样飞来，你能应付吗？',
    duration: 60000,
    spawnInterval: 1000,    // 1秒一个，很快
    maxCookies: 4,
    verticalSpeed: 5.8,
    horizontalSpeed: 2.8,
    targetScore: 1500,
    rotationSpeed: 0.10,
  },
  {
    level: 9,
    name: '传奇切手',
    description: '接近顶峰了！这是最后的考验！',
    duration: 60000,
    spawnInterval: 900,
    maxCookies: 5,          // 增加到5个
    verticalSpeed: 6.5,
    horizontalSpeed: 3.2,
    targetScore: 1900,
    rotationSpeed: 0.12,
  },
  {
    level: 10,
    name: '饼干之神',
    description: '终极挑战！证明你是真正的切割大师！🏆',
    duration: 60000,
    spawnInterval: 800,     // 0.8秒一个，超快！
    maxCookies: 5,
    verticalSpeed: 7.5,     // 超快速度
    horizontalSpeed: 3.8,   // 超大摆动
    targetScore: 2500,      // 超高目标
    rotationSpeed: 0.15,    // 疯狂旋转
  },
]

/**
 * 根据关卡等级获取配置
 */
export function getLevelConfig(level: number): LevelConfig {
  const clampedLevel = Math.max(1, Math.min(level, LEVELS.length))
  return LEVELS[clampedLevel - 1]
}

/**
 * 获取所有关卡信息（用于关卡选择界面）
 */
export function getAllLevels(): LevelConfig[] {
  return LEVELS
}

/**
 * 检查是否解锁下一关
 */
export function isLevelUnlocked(currentLevel: number, score: number): boolean {
  if (currentLevel >= LEVELS.length) return false
  const currentLevelConfig = LEVELS[currentLevel - 1]
  return score >= currentLevelConfig.targetScore
}
