// ============================================================================
// 💥 碰撞检测组件
// ============================================================================
// 
// 📌 说明:
//   负责处理所有碰撞检测逻辑
//   提供精确的圆形碰撞判定算法
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type { Position, SnakeSegment } from './SnakeMovementComponent'

/**
 * 食物接口
 */
interface Food {
  x: number
  y: number
  type: string
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
 * 碰撞检测组件参数
 */
interface CollisionDetectionParams {
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 单元格大小 */
  cellSize: number
}

/**
 * 碰撞检测组件类
 * 
 * @remarks
 * 职责：
 * - 墙壁碰撞检测
 * - 自身碰撞检测
 * - 食物碰撞检测（圆形判定）
 * - 障碍物碰撞检测
 * 
 * @example
 * ```typescript
 * const collisionDetector = new CollisionDetectionComponent(scene)
 * container.add(collisionDetector)
 * 
 * collisionDetector.init({
 *   gridCols: 32,
 *   gridRows: 18,
 *   cellSize: 40
 * })
 * 
 * // 检测碰撞
 * if (collisionDetector.checkFoodCollision(snakeHead, food)) {
 *   console.log('吃到食物了!')
 * }
 * ```
 */
export class CollisionDetectionComponent extends ComponentBase {
  /** 当前参数 */
  private params: CollisionDetectionParams | null = null
  
  /** 碰撞容差（像素，用于圆形判定） */
  private tolerance: number = 0.5
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'collision_detection', '碰撞检测器')
  }
  
  /**
   * 初始化碰撞检测组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as CollisionDetectionParams
    
    console.log(`✅ [CollisionDetection] 碰撞检测组件初始化完成`)
  }
  
  /**
   * 检查墙壁碰撞
   * 
   * @param position - 待检查位置
   * @returns 是否碰撞
   * 
   * @public
   */
  public checkWallCollision(position: Position): boolean {
    if (!this.params) return false
    
    const gameWidth = this.params.gridCols * this.params.cellSize
    const gameHeight = this.params.gridRows * this.params.cellSize
    
    const collided = (
      position.x < 0 ||
      position.x >= gameWidth ||
      position.y < 0 ||
      position.y >= gameHeight
    )
    
    if (collided) {
      console.log(`🧱 [CollisionDetection] 检测到墙壁碰撞：(${position.x}, ${position.y})`)
    }
    
    return collided
  }
  
  /**
   * 检查自身碰撞
   * 
   * @param position - 待检查位置
   * @param snake - 蛇身体数组
   * @returns 是否碰撞
   * 
   * @public
   */
  public checkSelfCollision(position: Position, snake: SnakeSegment[]): boolean {
    if (snake.length < 2) return false
    
    // 检查是否与蛇身碰撞（跳过蛇头）
    for (let i = 1; i < snake.length; i++) {
      const segment = snake[i]
      const distance = this.calculateDistance(position, segment)
      
      // 圆形碰撞判定
      if (distance < this.params!.cellSize * this.tolerance) {
        console.log(`💥 [CollisionDetection] 检测到自身碰撞：(${position.x}, ${position.y})`)
        return true
      }
    }
    
    return false
  }
  
  /**
   * 检查食物碰撞（圆形判定）
   * 
   * @param snakeHead - 蛇头位置
   * @param food - 食物对象
   * @returns 是否碰撞
   * 
   * @public
   */
  public checkFoodCollision(snakeHead: Position, food: Food): boolean {
    if (!this.params) return false
    
    const distance = this.calculateDistance(snakeHead, food)
    
    // 圆形碰撞判定：距离 < (蛇头半径 + 食物半径)
    const collisionThreshold = this.params.cellSize * 0.8
    const collided = distance < collisionThreshold
    
    if (collided) {
      console.log(`🍎 [CollisionDetection] 检测到食物碰撞！距离=${distance.toFixed(2)}`)
    }
    
    return collided
  }
  
  /**
   * 检查障碍物碰撞
   * 
   * @param position - 待检查位置
   * @param obstacles - 障碍物数组
   * @returns 是否碰撞
   * 
   * @public
   */
  public checkObstacleCollision(position: Position, obstacles: Obstacle[]): boolean {
    if (obstacles.length === 0 || !this.params) return false
    
    for (const obstacle of obstacles) {
      // AABB 碰撞检测（矩形）
      const halfCell = this.params.cellSize / 2
      
      const inX = (
        position.x + halfCell > obstacle.x &&
        position.x - halfCell < obstacle.x + obstacle.width
      )
      
      const inY = (
        position.y + halfCell > obstacle.y &&
        position.y - halfCell < obstacle.y + obstacle.height
      )
      
      if (inX && inY) {
        console.log(`🚧 [CollisionDetection] 检测到障碍物碰撞`)
        return true
      }
    }
    
    return false
  }
  
  /**
   * 检查道具碰撞
   * 
   * @param snakeHead - 蛇头位置
   * @param itemPosition - 道具位置
   * @returns 是否碰撞
   * 
   * @public
   */
  public checkItemCollision(snakeHead: Position, itemPosition: Position): boolean {
    if (!this.params) return false
    
    const distance = this.calculateDistance(snakeHead, itemPosition)
    const collisionThreshold = this.params.cellSize * 0.9
    
    return distance < collisionThreshold
  }
  
  /**
   * 计算两点间距离
   * 
   * @param pos1 - 位置 1
   * @param pos2 - 位置 2
   * @returns 欧几里得距离
   * 
   * @private
   */
  private calculateDistance(pos1: Position, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 碰撞检测组件通常作为工具类使用
    // 不主动响应事件，由其他组件调用检测方法
  }
}
