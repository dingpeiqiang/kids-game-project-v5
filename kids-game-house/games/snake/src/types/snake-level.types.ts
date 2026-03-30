// ============================================================================
// 🐍 贪吃蛇关卡类型定义（符合 GCRS 规范）
// ============================================================================

import { 
  ILevelConfig, 
  ILevelObjective, 
  ILevelResult,
  ILevelState 
} from '../../../kids-game-frame-factory/src/index'

/**
 * ⭐ 贪吃蛇关卡参数配置
 */
export interface SnakeLevelParams {
  /** 网格大小 */
  gridSize: number
  
  /** 蛇初始长度 */
  initialLength: number
  
  /** 蛇初始速度（毫秒/格） */
  speed: number
  
  /** 障碍物数量 */
  obstacleCount: number
  
  /** 特殊食物生成概率 */
  specialFoodChance: number
  
  /** 金币生成概率 */
  coinChance: number
  
  /** 普通食物分数 */
  foodScore: number
  
  /** 奖励食物分数 */
  bonusScore: number
  
  /** 金币分数 */
  coinScore: number
  
  /** 地图布局（可选） */
  mapLayout?: number[][]
}

/**
 * ⭐ 贪吃蛇关卡目标类型
 */
export type SnakeObjectiveType = 
  | 'score'         // 达到指定分数
  | 'collect_food'  // 收集普通食物
  | 'collect_bonus' // 收集奖励食物
  | 'collect_coin'  // 收集金币
  | 'survive_time'  // 存活时间
  | 'length_goal'   // 达到指定长度

/**
 * ⭐ 贪吃蛇关卡目标（扩展通用目标）
 */
export interface SnakeLevelObjective extends ILevelObjective {
  type: SnakeObjectiveType
}

/**
 * ⭐ 贪吃蛇关卡配置（符合 GCRS 规范）
 */
export type SnakeLevelConfig = ILevelConfig<SnakeLevelParams>

/**
 * ⭐ 贪吃蛇关卡状态（扩展通用状态）
 */
export interface SnakeLevelState extends ILevelState {
  gameData: {
    snakeLength: number
    foodsEaten: number
    bonusFoodsEaten: number
    coinsCollected: number
    maxCombo: number
    currentPosition?: { x: number, y: number }
  }
}

/**
 * ⭐ 贪吃蛇关卡结果（扩展通用结果）
 */
export interface SnakeLevelResult extends ILevelResult {
  statistics: {
    snakeLength: number
    foodsEaten: number
    bonusFoodsEaten: number
    coinsCollected: number
    accuracy: number
    maxCombo: number
    movesCount: number
  }
}
