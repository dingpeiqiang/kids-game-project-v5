// ============================================================================
// 🎮 实体系统类型定义
// ============================================================================

/**
 * ⭐ AABB 矩形碰撞盒
 */
export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 🐍 蛇身段接口
 */
export interface SnakeSegment {
  x: number
  y: number
}

/**
 * 🍎 食物类型枚举（统一所有可收集物）
 */
export enum FoodType {
  /** 普通食物（红色，10 分，+1 节） */
  NORMAL = 'normal',
  
  /** 奖励食物（金色，50 分，+2 节） */
  BONUS = 'bonus',
  
  /** 特殊食物（紫色，100 分，不增长） */
  SPECIAL = 'special',
  
  /** 加速食物（蓝色，20 分，+1 节，加速 5 秒） */
  SPEED_UP = 'speed_up',
  
  /** 减速食物（绿色，15 分，+1 节，减速 5 秒） */
  SLOW_DOWN = 'slow_down',
  
  /** 无敌食物（白色，30 分，+1 节，无敌 3 秒） */
  INVINCIBLE = 'invincible'
}

/**
 * 🍎 食物配置接口
 */
export interface FoodConfig {
  type: FoodType
  baseScore: number
  color: string
  spawnProbability: number
  growsSnake: boolean
  lengthIncrease?: number
  
  // 特效配置（可选）
  hasEffect?: boolean
  effectType?: 'speed_change' | 'invincibility'
  effectValue?: number
  effectDuration?: number
  lifetime?: number
  
  description: string
}

/**
 * 🍎 食物对象（运行时实例）
 */
export interface Food {
  position: { x: number; y: number }
  type: FoodType
  score: number
  active: boolean
}

/**
 * 🎯 方向枚举
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * ⭐ 游戏状态接口
 */
export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  snakeLength: number
}
