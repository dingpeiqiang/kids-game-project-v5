// ============================================================================
// 🎮【游戏特定层】碰撞检测组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：封装碰撞检测逻辑，保持原有计算方式不变
// ⚠️ 注意：这是游戏特定的碰撞检测组件，其他游戏需要实现自己的检测器
// ============================================================================

/**
 * ⭐ 食物对象接口 (兼容原有代码)
 */
export interface Food {
  type: string
  position: {
    x: number
    y: number
  }
}

/**
 * ⭐ 蛇分段接口 (兼容原有代码)
 */
export interface SnakeSegment {
  x: number
  y: number
}

/**
 * ⭐ 碰撞检测组件
 * 
 * 📌 说明：封装碰撞检测逻辑
 * 
 * 使用方式:
 * ```typescript
 * const detector = new CollisionDetector(adaptParams, gridCols, gridRows)
 * const collision = detector.checkSnakeFoodCollision(snake, food)
 * ```
 */
export class CollisionDetector {
  private adaptParams: any
  private gridCols: number
  private gridRows: number

  /**
   * 构造函数
   * @param adaptParams 适配参数 (包含 cellSize 等)
   * @param gridCols 网格列数，默认 32
   * @param gridRows 网格行数，默认 18
   */
  constructor(
    adaptParams: any,
    gridCols: number = 32,
    gridRows: number = 18
  ) {
    this.adaptParams = adaptParams
    this.gridCols = gridCols
    this.gridRows = gridRows
  }

  /**
   * ⭐ 检测蛇与食物的碰撞 (圆形碰撞判定，保持原有逻辑)
   * 
   * @param snake 蛇身数组
   * @param food 食物对象
   * @returns 是否发生碰撞
   */
  checkSnakeFoodCollision(snake: SnakeSegment[], food: Food): boolean {
    if (!food || snake.length === 0) return false

    const head = snake[0]
    const cellSize = this.adaptParams.cellSize
    
    // 使用圆形碰撞判定（更精确）(保持原有计算逻辑)
    const distance = Math.hypot(head.x - food.position.x, head.y - food.position.y)
    const collisionThreshold = cellSize * 0.5  // 碰撞阈值
    
    return distance < collisionThreshold
  }

  /**
   * ⭐ 检测蛇与墙壁的碰撞 (保持原有逻辑)
   * 
   * @param head 蛇头坐标
   * @returns 是否撞墙
   */
  checkSnakeWallCollision(head: SnakeSegment): boolean {
    const cellSize = this.adaptParams.cellSize
    
    // 计算游戏区域边界 (保持原有计算逻辑)
    const gameWidth = this.gridCols * cellSize
    const gameHeight = this.gridRows * cellSize
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + 
      (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    // 检测是否超出游戏区域边界
    const leftBound = offsetX
    const rightBound = offsetX + gameWidth
    const topBound = offsetY
    const bottomBound = offsetY + gameHeight

    return head.x < leftBound || head.x > rightBound || 
           head.y < topBound || head.y > bottomBound
  }

  /**
   * ⭐ 检测蛇与自身的碰撞 (保持原有逻辑)
   * 
   * @param snake 蛇身数组
   * @returns 是否撞到自己
   */
  checkSnakeSelfCollision(snake: SnakeSegment[]): boolean {
    if (snake.length <= 3) return false  // 太短不会撞到自己

    const head = snake[0]
    const cellSize = this.adaptParams.cellSize
    const collisionThreshold = cellSize * 0.5  // 碰撞阈值

    // 检查蛇头是否与蛇身任何部分碰撞 (保持原有遍历逻辑)
    for (let i = 1; i < snake.length; i++) {
      const segment = snake[i]
      const distance = Math.hypot(head.x - segment.x, head.y - segment.y)
      
      if (distance < collisionThreshold) {
        return true  // 撞到自己了
      }
    }

    return false
  }

  /**
   * ⭐ 通用圆形碰撞检测 (辅助方法，保持原有实现)
   * 
   * @param x1 圆心 1 X 坐标
   * @param y1 圆心 1 Y 坐标
   * @param x2 圆心 2 X 坐标
   * @param y2 圆心 2 Y 坐标
   * @param threshold 碰撞阈值
   * @returns 是否发生碰撞
   */
  checkCircleCollision(x1: number, y1: number, x2: number, y2: number, threshold: number): boolean {
    const distance = Math.hypot(x1 - x2, y1 - y2)
    return distance < threshold
  }

  /**
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 获取游戏区域边界 (辅助方法)
   */
  getGameBounds(): {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
  } {
    const cellSize = this.adaptParams.cellSize
    const gameWidth = this.gridCols * cellSize
    const gameHeight = this.gridRows * cellSize
    const offsetX = (this.adaptParams.screenW - gameWidth) / 2
    const offsetY = this.adaptParams.safeTop + 
      (this.adaptParams.screenH - this.adaptParams.safeTop - this.adaptParams.safeBottom - gameHeight) / 2

    return {
      left: offsetX,
      right: offsetX + gameWidth,
      top: offsetY,
      bottom: offsetY + gameHeight,
      width: gameWidth,
      height: gameHeight
    }
  }
}
