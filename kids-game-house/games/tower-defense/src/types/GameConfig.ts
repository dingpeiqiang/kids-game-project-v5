/**
 * 游戏配置接口定义
 * 用于塔防游戏的类型安全配置
 */

/**
 * 关卡初始配置
 */
export interface LevelInitialConfig {
  /** 基地生命值 */
  baseHealth: number
  /** 初始炮塔数量 */
  numOfTurrets: number
  /** 初始敌人数量 */
  numOfEnemies: number
  /** 子弹伤害 */
  bulletDamage: number
  /** 敌人初始生命值 */
  enemyHealth: number
  /** 敌人初始速度 */
  enemySpeed: number
}

/**
 * 关卡递增配置（每关增加的数值）
 */
export interface LevelIncrementalConfig {
  /** 每关增加的敌人数量 */
  numOfEnemies: number
  /** 每关增加的炮塔数量 */
  numOfTurrets: number
  /** 每关增加的敌人生命值 */
  enemyHealth: number
  /** 每关增加的敌人速度倍率 */
  enemySpeed: number
}

/**
 * 完整的关卡配置
 */
export interface LevelConfig {
  initial: LevelInitialConfig
  incremental: LevelIncrementalConfig
}

/**
 * 敌人配置
 */
export interface EnemyConfig {
  /** 移动速度（像素/秒） */
  speed: number
  /** 生命值 */
  health: number
  /** 击杀奖励金币 */
  reward: number
  /** 精灵图 key */
  spriteKey: string
}

/**
 * 炮塔配置
 */
export interface TurretConfig {
  /** 射程范围（像素） */
  range: number
  /** 伤害值 */
  damage: number
  /** 射击间隔（毫秒） */
  fireRate: number
  /** 子弹速度 */
  bulletSpeed: number
  /** 精灵图 key */
  spriteKey: string
}

/**
 * 游戏难度设置
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/**
 * 难度倍率配置
 */
export interface DifficultyMultipliers {
  enemyHealth: number
  enemySpeed: number
  rewardMultiplier: number
}
