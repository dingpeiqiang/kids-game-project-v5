// ============================================================================
// 🎮【游戏特定层】游戏循环组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：封装原有的 update() 方法，保持逻辑不变
// ⚠️ 注意：这是游戏特定的游戏循环组件，其他游戏需要实现自己的循环
// ============================================================================

import type { SnakeSegment } from './SnakeRenderer'
import type { Food } from './FoodRenderer'
import { CollisionDetector } from './CollisionDetector'

/**
 * ⭐ 游戏循环组件
 * 
 * 📌 说明：封装游戏循环逻辑 (update 方法)
 * 
 * 使用方式:
 * ```typescript
 * const gameLoop = new GameLoop(collisionDetector)
 * gameLoop.update(snake, food, direction)
 * ```
 */
export class GameLoop {
  private collisionDetector: CollisionDetector
  private onCollisionDetected?: (type: 'wall' | 'self' | 'food') => void

  /**
   * 构造函数
   * @param collisionDetector 碰撞检测器实例
   * @param onCollisionDetected 碰撞检测回调
   */
  constructor(
    collisionDetector: CollisionDetector,
    onCollisionDetected?: (type: 'wall' | 'self' | 'food') => void
  ) {
    this.collisionDetector = collisionDetector
    this.onCollisionDetected = onCollisionDetected
  }

  /**
   * ⭐ 更新游戏状态 - 游戏循环核心方法 (保持原有逻辑不变)
   * 
   * @param snake 蛇身数组
   * @param food 食物对象
   * @param direction 移动方向
   * @param cellSize 单元格大小
   * @returns 游戏状态更新结果
   */
  update(
    snake: SnakeSegment[],
    food: Food | null,
    direction: { x: number, y: number },
    cellSize: number
  ): {
    shouldGrow: boolean
    gameOver: boolean
    newHead?: SnakeSegment
  } {
    if (!snake || snake.length === 0) {
      return { shouldGrow: false, gameOver: true }
    }

    // 计算新的蛇头位置 (保持原有移动逻辑)
    const head = snake[0]
    const newHead: SnakeSegment = {
      x: head.x + direction.x * cellSize,
      y: head.y + direction.y * cellSize
    }

    // 检测碰撞 (保持原有检测逻辑)
    const wallCollision = this.collisionDetector.checkSnakeWallCollision(newHead)
    const selfCollision = this.collisionDetector.checkSnakeSelfCollision(snake)
    
    // 如果发生碰撞，触发游戏结束
    if (wallCollision || selfCollision) {
      this.onCollisionDetected?.(wallCollision ? 'wall' : 'self')
      return { shouldGrow: false, gameOver: true }
    }

    // 检测是否吃到食物 (保持原有检测逻辑)
    let shouldGrow = false
    if (food) {
      const foodCollision = this.collisionDetector.checkSnakeFoodCollision(snake, food)
      if (foodCollision) {
        shouldGrow = true
        this.onCollisionDetected?.('food')
      }
    }

    // 返回更新结果
    return {
      shouldGrow,
      gameOver: false,
      newHead
    }
  }

  /**
   * ⭐ 移动蛇 - 更新蛇身位置 (保持原有移动逻辑)
   * 
   * @param snake 蛇身数组
   * @param newHead 新的蛇头位置
   * @param shouldGrow 是否应该生长
   */
  moveSnake(snake: SnakeSegment[], newHead: SnakeSegment, shouldGrow: boolean): void {
    if (!snake || snake.length === 0) return

    // 将新头添加到蛇身前面
    snake.unshift(newHead)

    // 如果不生长，移除尾部 (保持原有逻辑)
    if (!shouldGrow) {
      snake.pop()
    }
  }

  /**
   * ⭐ 设置碰撞检测回调 (用于通知游戏管理器)
   */
  setCollisionCallback(callback: (type: 'wall' | 'self' | 'food') => void): void {
    this.onCollisionDetected = callback
  }

  /**
   * ⭐ 更新碰撞检测器的适配参数 (用于 resize 后重新计算)
   */
  updateCollisionDetector(adaptParams: any): void {
    this.collisionDetector.setAdaptParams(adaptParams)
  }
}
