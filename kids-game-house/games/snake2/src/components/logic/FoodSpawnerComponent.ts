// ============================================================================
// 🍎 食物生成逻辑组件
// ============================================================================
// 
// 📌 说明:
//   负责随机生成食物位置
//   避免与蛇和障碍物重叠
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type { Position, SnakeSegment } from './SnakeMovementComponent'
import { FoodType, createFood, getFoodConfig, type Food as NewFood } from '../../types/FoodTypes'

/**
 * 食物类型
 */
type FoodType = 'normal' | 'bonus' | 'special'

/**
 * 🍎 食物接口（兼容新系统）
 */
interface Food {
  x: number
  y: number
  type: FoodType
  score: number  // 新增分数字段
}

/**
 * 障碍物接口
 */
interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 🍎 食物生成组件参数
 */
interface FoodSpawnerParams {
  /** 可用的食物类型 */
  availableTypes: FoodType[]
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 单元格大小 */
  cellSize: number
  /** 生成概率配置 */
  typeProbabilities?: {
    normal: number    // 普通食物概率（默认 0.7）
    bonus: number     // 奖励食物概率（默认 0.15）
    special: number   // 特殊食物概率（默认 0.05）
    speed_up?: number      // 加速食物概率（默认 0.05）
    slow_down?: number     // 减速食物概率（默认 0.05）
    invincible?: number    // 无敌食物概率（默认 0.03）
  }
}

/**
 * 食物生成逻辑组件类
 * 
 * @remarks
 * 职责：
 * - 随机生成食物位置
 * - 避免与蛇身和障碍物重叠
 * - 按概率分布生成不同类型食物
 * - 发射食物生成事件
 * 
 * @example
 * ```typescript
 * const foodSpawner = new FoodSpawnerComponent(scene)
 * container.add(foodSpawner)
 * 
 * foodSpawner.init({
 *   availableTypes: ['normal', 'bonus', 'special'],
 *   gridCols: 32,
 *   gridRows: 18,
 *   cellSize: 40
 * })
 * 
 * // 生成食物
 * const food = foodSpawner.spawnFood(snake, obstacles)
 * ```
 */
export class FoodSpawnerComponent extends ComponentBase {
  /** 当前食物对象 */
  private currentFood: Food | null = null
  
  /** 当前参数 */
  private params: FoodSpawnerParams | null = null
  
  /** 最大尝试次数（防止死循环） */
  private readonly MAX_SPAWN_ATTEMPTS = 100
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'food_spawner', '食物生成器')
  }
  
  /**
   * 初始化食物生成组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as FoodSpawnerParams
    
    console.log(`✅ [FoodSpawner] 食物生成组件初始化完成`)
  }
  
  /**
   * ⭐ 生成新食物（集成新系统）
   * 
   * @param snake - 蛇身体数组
   * @param obstacles - 障碍物数组（可选）
   * @returns 生成的食物对象
   * 
   * @public
   */
  public spawnFood(snake: SnakeSegment[], obstacles: Obstacle[] = []): Food {
    if (!this.params) {
      throw new Error('[FoodSpawner] 组件未初始化')
    }
    
    let position: Position | null = null
    let attempts = 0
    
    // 寻找有效位置
    while (attempts < this.MAX_SPAWN_ATTEMPTS) {
      const candidatePosition = this.randomPosition()
      
      // 检查是否与蛇身重叠
      if (this.overlapsWithSnake(candidatePosition, snake)) {
        attempts++
        continue
      }
      
      // 检查是否与障碍物重叠
      if (obstacles.length > 0 && this.overlapsWithObstacles(candidatePosition, obstacles)) {
        attempts++
        continue
      }
      
      // 找到有效位置
      position = candidatePosition
      break
    }
    
    if (!position) {
      console.error('❌ [FoodSpawner] 无法找到有效的食物生成位置！')
      // 返回一个默认位置（即使可能重叠）
      position = {
        x: this.params.cellSize,
        y: this.params.cellSize
      }
    }
    
    // ⭐ 使用新的工厂函数创建食物
    const newFood = createFood({ x: position.x, y: position.y })
    
    // ⭐ 更新当前食物（兼容旧接口）
    this.currentFood = {
      x: newFood.position.x,
      y: newFood.position.y,
      type: newFood.type,
      score: newFood.score
    }
    
    // ⭐ 发射包含完整信息的事件
    this.emit({
      type: GameEventType.FOOD_SPAWN,
      payload: { 
        food: this.currentFood,
        position: newFood.position,
        type: newFood.type,
        score: newFood.score
      },
      timestamp: Date.now()
    })
    
    console.log(`🍎 [FoodSpawner] 生成新食物：类型=${newFood.type}, 分数=${newFood.score}, 位置=(${position.x}, ${position.y})`)
    
    return this.currentFood
  }
  
  /**
   * 获取当前食物
   * 
   * @returns 当前食物对象
   * 
   * @public
   */
  public getCurrentFood(): Food | null {
    return this.currentFood
  }
  
  /**
   * 清除当前食物
   * 
   * @public
   */
  public clearFood(): void {
    this.currentFood = null
  }
  
  /**
   * 随机生成位置
   * 
   * @returns 随机位置（像素坐标）
   * 
   * @private
   */
  private randomPosition(): Position {
    if (!this.params) {
      throw new Error('[FoodSpawner] 组件未初始化')
    }
    
    const { gridCols, gridRows, cellSize } = this.params
    
    // 随机网格坐标
    const gridX = Math.floor(Math.random() * gridCols)
    const gridY = Math.floor(Math.random() * gridRows)
    
    // 转换为像素坐标（加中心点偏移）
    return {
      x: gridX * cellSize + cellSize / 2,
      y: gridY * cellSize + cellSize / 2
    }
  }
  
  /**
   * 检查位置是否与蛇身重叠
   * 
   * @param position - 待检查位置
   * @param snake - 蛇身体数组
   * @returns 是否重叠
   * 
   * @private
   */
  private overlapsWithSnake(position: Position, snake: SnakeSegment[]): boolean {
    for (const segment of snake) {
      const distance = Math.sqrt(
        Math.pow(position.x - segment.x, 2) + 
        Math.pow(position.y - segment.y, 2)
      )
      
      // 如果距离小于单元格大小，认为重叠
      if (distance < this.params!.cellSize) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 检查位置是否与障碍物重叠
   * 
   * @param position - 待检查位置
   * @param obstacles - 障碍物数组
   * @returns 是否重叠
   * 
   * @private
   */
  private overlapsWithObstacles(position: Position, obstacles: Obstacle[]): boolean {
    const halfCell = this.params!.cellSize / 2
    
    for (const obstacle of obstacles) {
      // AABB 碰撞检测
      const inX = (
        position.x + halfCell > obstacle.x &&
        position.x - halfCell < obstacle.x + obstacle.width
      )
      
      const inY = (
        position.y + halfCell > obstacle.y &&
        position.y - halfCell < obstacle.y + obstacle.height
      )
      
      if (inX && inY) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 随机生成食物类型
   * 
   * @returns 食物类型
   * 
   * @private
   */
  private randomFoodType(): FoodType {
    if (!this.params?.availableTypes || this.params.availableTypes.length === 0) {
      return 'normal'
    }
    
    // 如果有概率配置，使用概率分布
    if (this.params.typeProbabilities) {
      const rand = Math.random()
      const { normal, bonus, special } = this.params.typeProbabilities
      
      let cumulative = 0
      
      if (this.params.availableTypes.includes('normal')) {
        cumulative += normal
        if (rand <= cumulative) return 'normal'
      }
      
      if (this.params.availableTypes.includes('bonus')) {
        cumulative += bonus
        if (rand <= cumulative) return 'bonus'
      }
      
      if (this.params.availableTypes.includes('special')) {
        return 'special'
      }
    }
    
    // 否则均匀随机
    const randomIndex = Math.floor(Math.random() * this.params.availableTypes.length)
    return this.params.availableTypes[randomIndex]
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.FOOD_CONSUMED:
        // 食物被吃掉，立即生成新食物
        const snake = event.payload.snake
        const obstacles = event.payload.obstacles || []
        this.spawnFood(snake, obstacles)
        break
        
      case GameEventType.GAME_START:
        // 游戏开始，生成第一个食物
        this.spawnFood([], [])
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
