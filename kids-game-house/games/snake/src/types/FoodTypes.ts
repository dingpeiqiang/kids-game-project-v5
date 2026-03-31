// ============================================================================
// 🍎 食物类型和效果定义
// ============================================================================
// 
// 📌 说明:
//   定义所有食物类型及其效果
//   支持普通食物、奖励食物、特殊食物等
// ============================================================================

/**
 * 🍎 食物类型枚举
 * 
 * @remarks
 * 每种食物类型有不同的分数和效果
 */
export enum FoodType {
  /** 普通食物（红色，10 分） */
  NORMAL = 'normal',
  
  /** 奖励食物（金色，50 分，增加 2 节长度） */
  BONUS = 'bonus',
  
  /** 特殊食物（紫色，100 分，稀有） */
  SPECIAL = 'special',
  
  /** 加速食物（蓝色，20 分，临时加速） */
  SPEED_UP = 'speed_up',
  
  /** 减速食物（绿色，15 分，临时减速） */
  SLOW_DOWN = 'slow_down',
  
  /** 无敌食物（白色，30 分，临时穿墙） */
  INVINCIBLE = 'invincible'
}

/**
 * ⭐ 食物效果接口
 * 
 * @remarks
 * 定义食物被吃掉后产生的临时效果
 */
export interface FoodEffect {
  /** 效果类型 */
  type: 'speed_change' | 'length_change' | 'invincibility' | 'score_multiplier'
  
  /** 效果值（倍数或绝对值） */
  value: number
  
  /** 效果持续时间（毫秒） */
  duration: number
  
  /** 效果描述 */
  description?: string
}

/**
 * 🍎 食物配置接口
 * 
 * @remarks
 * 定义每种食物类型的属性
 */
export interface FoodConfig {
  /** 食物类型 */
  type: FoodType
  
  /** 基础分数 */
  baseScore: number
  
  /** 颜色（用于渲染） */
  color: string
  
  /** 生成概率（0-1） */
  spawnProbability: number
  
  /** 是否增加蛇长度 */
  growsSnake: boolean
  
  /** 增加的长度（如果 growsSnake 为 true） */
  lengthIncrease?: number
  
  /** 食物效果（如果有） */
  effect?: FoodEffect
  
  /** 食物描述 */
  description: string
}

/**
 * 🍎 食物对象接口
 * 
 * @remarks
 * 运行时食物实例的数据结构
 */
export interface Food {
  /** 位置（网格坐标） */
  position: { x: number; y: number }
  
  /** 食物类型 */
  type: FoodType
  
  /** 当前分数（可能受效果影响） */
  score: number
  
  /** 是否激活 */
  isActive: boolean
  
  /** 效果剩余时间（毫秒） */
  effectTimeRemaining?: number
}

/**
 * ⭐ 食物配置数据库
 * 
 * @remarks
 * 包含所有食物类型的默认配置
 */
export const FOOD_DATABASE: Record<FoodType, FoodConfig> = {
  [FoodType.NORMAL]: {
    type: FoodType.NORMAL,
    baseScore: 10,
    color: '#ff4444',      // 红色
    spawnProbability: 0.7,  // 70% 概率
    growsSnake: true,
    lengthIncrease: 1,
    description: '普通食物，增加 1 节长度，得 10 分'
  },
  
  [FoodType.BONUS]: {
    type: FoodType.BONUS,
    baseScore: 50,
    color: '#ffd700',      // 金色
    spawnProbability: 0.15, // 15% 概率
    growsSnake: true,
    lengthIncrease: 2,
    description: '奖励食物，增加 2 节长度，得 50 分'
  },
  
  [FoodType.SPECIAL]: {
    type: FoodType.SPECIAL,
    baseScore: 100,
    color: '#da70d6',      // 紫色
    spawnProbability: 0.05, // 5% 概率
    growsSnake: false,
    description: '特殊食物，直接得 100 分'
  },
  
  [FoodType.SPEED_UP]: {
    type: FoodType.SPEED_UP,
    baseScore: 20,
    color: '#4488ff',      // 蓝色
    spawnProbability: 0.05, // 5% 概率
    growsSnake: true,
    lengthIncrease: 1,
    effect: {
      type: 'speed_change',
      value: 1.5,          // 1.5 倍速
      duration: 5000,       // 持续 5 秒
      description: '加速 50%，持续 5 秒'
    },
    description: '加速食物，移动速度 +50%，持续 5 秒'
  },
  
  [FoodType.SLOW_DOWN]: {
    type: FoodType.SLOW_DOWN,
    baseScore: 15,
    color: '#44ff44',      // 绿色
    spawnProbability: 0.05, // 5% 概率
    growsSnake: true,
    lengthIncrease: 1,
    effect: {
      type: 'speed_change',
      value: 0.7,          // 0.7 倍速
      duration: 5000,       // 持续 5 秒
      description: '减速 30%，持续 5 秒'
    },
    description: '减速食物，移动速度 -30%，持续 5 秒'
  },
  
  [FoodType.INVINCIBLE]: {
    type: FoodType.INVINCIBLE,
    baseScore: 30,
    color: '#ffffff',      // 白色
    spawnProbability: 0.03, // 3% 概率
    growsSnake: true,
    lengthIncrease: 1,
    effect: {
      type: 'invincibility',
      value: 1,
      duration: 3000,       // 持续 3 秒
      description: '可以穿墙，持续 3 秒'
    },
    description: '无敌食物，可以穿墙，持续 3 秒'
  }
}

/**
 * ⭐ 获取食物配置
 * 
 * @param type - 食物类型
 * @returns 食物配置对象
 * 
 * @example
 * ```typescript
 * const config = getFoodConfig(FoodType.BONUS)
 * console.log(config.baseScore) // 50
 * ```
 */
export function getFoodConfig(type: FoodType): FoodConfig {
  return FOOD_DATABASE[type]
}

/**
 * ⭐ 根据概率随机选择食物类型
 * 
 * @returns 随机选择的食物类型
 * 
 * @example
 * ```typescript
 * const randomType = selectRandomFoodType()
 * console.log(randomType) // FoodType.NORMAL (大概率)
 * ```
 */
export function selectRandomFoodType(): FoodType {
  const rand = Math.random()
  let cumulative = 0
  
  for (const foodType of Object.values(FoodType)) {
    cumulative += FOOD_DATABASE[foodType].spawnProbability
    
    if (rand <= cumulative) {
      return foodType
    }
  }
  
  // 默认返回普通食物
  return FoodType.NORMAL
}

/**
 * ⭐ 创建食物对象
 * 
 * @param position - 食物位置
 * @param type - 食物类型（可选，默认随机）
 * @returns 食物对象
 * 
 * @example
 * ```typescript
 * const food = createFood({ x: 10, y: 10 }, FoodType.BONUS)
 * console.log(food.score) // 50
 * ```
 */
export function createFood(position: { x: number; y: number }, type?: FoodType): Food {
  const selectedType = type ?? selectRandomFoodType()
  const config = FOOD_DATABASE[selectedType]
  
  return {
    position,
    type: selectedType,
    score: config.baseScore,
    isActive: true
  }
}

/**
 * ⭐ 应用食物效果
 * 
 * @param effect - 食物效果
 * @param gameState - 游戏状态对象
 * 
 * @example
 * ```typescript
 * applyFoodEffect(food.effect, {
 *   speed: 200,
 *   invincible: false
 * })
 * ```
 */
export function applyFoodEffect(effect: FoodEffect | undefined, gameState: any): void {
  if (!effect) return
  
  switch (effect.type) {
    case 'speed_change':
      // 修改移动速度
      gameState.originalSpeed = gameState.speed
      gameState.speed = gameState.originalSpeed * effect.value
      
      // 设置效果计时器
      setTimeout(() => {
        gameState.speed = gameState.originalSpeed
      }, effect.duration)
      break
    
    case 'invincibility':
      // 设置无敌状态
      gameState.invincible = true
      
      // 设置效果计时器
      setTimeout(() => {
        gameState.invincible = false
      }, effect.duration)
      break
    
    case 'length_change':
      // 修改蛇长度
      if (effect.value > 0) {
        // 增长
        for (let i = 0; i < effect.value; i++) {
          gameState.snake.push({ ...gameState.snake[gameState.snake.length - 1] })
        }
      } else {
        // 缩短
        gameState.snake.splice(effect.value)
      }
      break
    
    case 'score_multiplier':
      // 分数倍增
      gameState.scoreMultiplier = effect.value
      
      setTimeout(() => {
        gameState.scoreMultiplier = 1
      }, effect.duration)
      break
  }
}
