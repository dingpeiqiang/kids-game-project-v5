// ============================================================================
// 🐍 蛇移动逻辑组件（⭐ 基于通用 GridMovementComponent）
// ============================================================================
// 
// 📌 说明:
//   负责处理蛇的平滑移动逻辑（基于平滑移动算法）
//   使用物理引擎的 deltaTime 实现帧率无关移动
//   ⭐ 优化：继承自 GridMovementComponent，只保留蛇特有的逻辑
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import { GridMovementComponent, type Direction, type Position } from './GridMovementComponent'

/**
 * ⭐ 蛇分段接口（蛇特定）
 */
export interface SnakeSegment {
  x: number  // X 坐标（像素）
  y: number  // Y 坐标（像素）
}

/**
 * 蛇移动组件参数
 */
interface SnakeMovementParams {
  /** 初始长度 */
  initialLength: number
  /** 移动速度（像素/秒） */
  speed: number
  /** 网格列数 */
  gridCols: number
  /** 网格行数 */
  gridRows: number
  /** 单元格大小 */
  cellSize: number
}

/**
 * ⭐ 蛇移动逻辑组件类（基于通用 GridMovementComponent）
 * 
 * @remarks
 * 职责：
 * - 处理蛇的平滑移动（使用基类的通用移动逻辑）
 * - 管理蛇的身体分段（蛇特有的逻辑）
 * - 响应方向改变输入
 * - 发射移动事件通知渲染
 * 
 * @example
 * ```typescript
 * const snakeMovement = new SnakeMovementComponent(scene)
 * container.add(snakeMovement)
 * 
 * snakeMovement.init({
 *   initialLength: 3,
 *   speed: 200,  // 200 像素/秒
 *   gridCols: 32,
 *   gridRows: 18,
 *   cellSize: 40
 * })
 * ```
 */
export class SnakeMovementComponent extends GridMovementComponent {
  /** 蛇身体分段数组 */
  private snake: SnakeSegment[] = []
  
  /** 当前移动方向 */
  private direction: Direction = 'right'
  
  /** 下一个移动方向（缓冲） */
  private nextDirection: Direction = 'right'
  
  /** 移动累积时间（毫秒） */
  private moveTimer: number = 0
  
  /** 移动间隔（毫秒） */
  private moveInterval: number = 0
  
  /** 当前参数 */
  private params: SnakeMovementParams | null = null
  
  /** 蛇头当前位置 */
  private headPosition: Position = { x: 0, y: 0 }
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'snake_movement', '蛇移动逻辑')
  }
  
  /**
   * 初始化蛇移动组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as SnakeMovementParams
    this.initializeSnake()
    this.calculateMoveInterval()
    
    console.log(`✅ [SnakeMovement] 蛇移动组件初始化完成，长度=${this.snake.length}`)
  }
  
  /**
   * 更新蛇移动（每帧调用）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(deltaTime: number): void {
    if (!this.enabled || !this.params) return
    
    // 累积移动时间
    this.moveTimer += deltaTime
    
    // 达到移动间隔时移动
    if (this.moveTimer >= this.moveInterval) {
      this.moveSnake()
      this.moveTimer = 0
    }
  }
  
  /**
   * 设置移动方向
   * 
   * @param newDirection - 新的移动方向
   * 
   * @public
   */
  public setDirection(newDirection: Direction): void {
    // 防止 180 度掉头
    if (!this.isOppositeDirection(newDirection)) {
      this.nextDirection = newDirection
      console.log(`🔄 [SnakeMovement] 方向改变：${this.direction} → ${newDirection}`)
    } else {
      console.warn(`⚠️ [SnakeMovement] 禁止 180 度掉头：${newDirection}`)
    }
  }
  
  /**
   * 获取当前蛇身体
   * 
   * @returns 蛇身体分段数组
   * 
   * @public
   */
  public getSnake(): SnakeSegment[] {
    return [...this.snake]
  }
  
  /**
   * 获取当前方向
   * 
   * @returns 当前移动方向
   * 
   * @public
   */
  public getDirection(): Direction {
    return this.direction
  }
  
  /**
   * 增加蛇的长度
   * 
   * @param segments - 增加的分段数量
   * 
   * @public
   */
  public grow(segments: number = 1): void {
    const tail = this.snake[this.snake.length - 1]
    
    for (let i = 0; i < segments; i++) {
      this.snake.push({ ...tail })
    }
    
    console.log(`📈 [SnakeMovement] 蛇长度增加 ${segments}，当前长度=${this.snake.length}`)
  }
  
  /**
   * 初始化蛇
   * 
   * @private
   */
  private initializeSnake(): void {
    if (!this.params) return
    
    const { initialLength, gridCols, gridRows, cellSize } = this.params
    
    // 计算初始位置（网格中心）
    const startX = Math.floor(gridCols / 2) * cellSize
    const startY = Math.floor(gridRows / 2) * cellSize
    
    // 创建初始蛇身
    this.snake = []
    for (let i = 0; i < initialLength; i++) {
      this.snake.push({
        x: startX - i * cellSize,
        y: startY
      })
    }
    
    this.headPosition = { ...this.snake[0] }
    
    console.log(`🐍 [SnakeMovement] 蛇初始化：起始位置=(${startX}, ${startY})`)
  }
  
  /**
   * 计算移动间隔
   * 
   * @private
   */
  private calculateMoveInterval(): void {
    if (!this.params) return
    
    // 移动间隔 = 单元格大小 / 速度 * 1000（转换为毫秒）
    this.moveInterval = (this.params.cellSize / this.params.speed) * 1000
    
    console.log(`⏱️ [SnakeMovement] 移动间隔：${this.moveInterval.toFixed(2)}ms (速度=${this.params.speed}px/s)`)
  }
  
  /**
   * 移动蛇
   * 
   * @private
   */
  private moveSnake(): void {
    if (this.snake.length === 0 || !this.params) return
    
    // 更新实际方向
    this.direction = this.nextDirection
    
    // 计算新蛇头位置
    const newHead = this.calculateNewHeadPosition()
    
    // 边界检测
    if (this.checkBoundaryCollision(newHead)) {
      this.emit({
        type: GameEventType.SNAKE_COLLIDE_WALL,
        payload: { position: newHead },
        timestamp: Date.now()
      })
      console.log(`💥 [SnakeMovement] 撞墙！位置=(${newHead.x}, ${newHead.y})`)
      return
    }
    
    // 自身碰撞检测
    if (this.checkSelfCollision(newHead)) {
      this.emit({
        type: GameEventType.SNAKE_COLLIDE_SELF,
        payload: { position: newHead },
        timestamp: Date.now()
      })
      console.log(`💥 [SnakeMovement] 撞到自己！位置=(${newHead.x}, ${newHead.y})`)
      return
    }
    
    // 移动蛇身（从后往前）
    for (let i = this.snake.length - 1; i > 0; i--) {
      this.snake[i] = { ...this.snake[i - 1] }
    }
    
    // 更新蛇头
    this.snake[0] = newHead
    this.headPosition = newHead
    
    // 发射移动事件
    this.emit({
      type: GameEventType.SNAKE_MOVE,
      payload: {
        snake: this.snake,
        direction: this.direction
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * 计算新蛇头位置
   * 
   * @returns 新蛇头位置
   * 
   * @private
   */
  private calculateNewHeadPosition(): Position {
    const { cellSize } = this.params!
    const { x, y } = this.headPosition
    
    switch (this.direction) {
      case 'up':
        return { x, y: y - cellSize }
      case 'down':
        return { x, y: y + cellSize }
      case 'left':
        return { x: x - cellSize, y }
      case 'right':
        return { x: x + cellSize, y }
      default:
        return { x, y }
    }
  }
  
  /**
   * 检查边界碰撞
   * 
   * @param position - 待检查位置
   * @returns 是否碰撞
   * 
   * @private
   */
  private checkBoundaryCollision(position: Position): boolean {
    if (!this.params) return false
    
    const gameWidth = this.params.gridCols * this.params.cellSize
    const gameHeight = this.params.gridRows * this.params.cellSize
    
    return (
      position.x < 0 ||
      position.x >= gameWidth ||
      position.y < 0 ||
      position.y >= gameHeight
    )
  }
  
  /**
   * 检查自身碰撞
   * 
   * @param position - 待检查位置
   * @returns 是否碰撞
   * 
   * @private
   */
  private checkSelfCollision(position: Position): boolean {
    // 检查是否与蛇身碰撞（跳过蛇头）
    for (let i = 1; i < this.snake.length; i++) {
      if (
        Math.abs(position.x - this.snake[i].x) < this.params!.cellSize * 0.5 &&
        Math.abs(position.y - this.snake[i].y) < this.params!.cellSize * 0.5
      ) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 检查是否是相反方向
   * 
   * @param newDirection - 新方向
   * @returns 是否是相反方向
   * 
   * @private
   */
  private isOppositeDirection(newDirection: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    }
    
    return opposites[this.direction] === newDirection
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
      case GameEventType.INPUT_DIRECTION_CHANGED:
        // 收到输入事件，改变方向
        this.setDirection(event.payload.direction)
        break
        
      case GameEventType.GAME_START:
        // 游戏开始，重置状态
        if (this.params) {
          this.initializeSnake()
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
