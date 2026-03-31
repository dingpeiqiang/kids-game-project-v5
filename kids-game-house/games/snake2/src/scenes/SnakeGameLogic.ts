// ============================================================================
// 🐍 贪吃蛇游戏核心逻辑
// ============================================================================
// 
// 📌 说明:
//   负责贪吃蛇游戏的核心逻辑实现
//   包括网格创建、蛇控制、食物生成、碰撞检测等
// ============================================================================

import { EventBus } from '../components/core/EventBus'
import { GameEventType } from '../components/core/GameEvent'
import type { Direction, Position } from '../components/logic/GridMovementComponent'
import { FoodType, createFood, applyFoodEffect, type Food, type FoodConfig } from '../types/FoodTypes'

/**
 * ⭐ 位置接口（如果未从 GridMovementComponent 导出）
 */
// interface Position {
//   x: number
//   y: number
// }

/**
 * 🎮 贪吃蛇游戏核心逻辑类
 * 
 * @remarks
 * 职责：
 * - 创建和渲染游戏网格
 * - 管理蛇的创建和控制
 * - 处理食物生成系统
 * - 实现碰撞检测逻辑
 * 
 * @example
 * ```typescript
 * const gameLogic = new SnakeGameLogic(scene)
 * gameLogic.createGrid(20)
 * gameLogic.createSnake(4, { x: 10, y: 10 })
 * gameLogic.spawnFood()
 * ```
 */
export class SnakeGameLogic {
  /** Phaser 场景对象（any 类型，避免 Phaser 命名空间问题）*/
  private scene: any
  
  /** 事件总线实例 */
  private eventBus: EventBus
  
  /** 网格配置 */
  private gridSize: number = 20
  private gridCols: number = 32
  private gridRows: number = 18
  private cellSize: number = 40
  
  /** 游戏区域偏移 */
  private offsetX: number = 0
  private offsetY: number = 0
  
  /** 蛇身体分段数组 */
  private snake: Position[] = []
  
  /** 当前移动方向 */
  private direction: Direction = 'right'
  
  /** 下一个移动方向（缓冲） */
  private nextDirection: Direction = 'right'
  
  /** 移动间隔（毫秒） */
  private moveInterval: number = 200
  
  /** 移动累积时间 */
  private moveTimer: number = 0
  
  /** 当前食物对象 */
  private currentFood: Food | null = null
  
  /** 激活的食物效果列表 */
  private activeEffects: Array<{ type: string; endTime: number }> = []
  
  /** 分数 */
  private score: number = 0
  
  /** 游戏是否结束 */
  private isGameOver: boolean = false
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: any) {
    this.scene = scene
    this.eventBus = EventBus.getInstance()
    console.log('🐍 [SnakeGameLogic] 游戏逻辑已创建')
  }
  
  // ===========================================================================
  // 🎯 网格系统
  // ===========================================================================
  
  /**
   * ⭐ 创建游戏网格
   * 
   * @param gridSize - 单元格大小（像素）
   * @param cols - 网格列数（可选，默认从配置读取）
   * @param rows - 网格行数（可选，默认从配置读取）
   */
  public createGrid(gridSize: number, cols?: number, rows?: number): void {
    this.gridSize = gridSize
    this.gridCols = cols ?? this.gridCols
    this.gridRows = rows ?? this.gridRows
    
    console.log(`📐 [SnakeGameLogic] 创建网格：${this.gridCols}x${this.gridRows}, cellSize=${this.gridSize}px`)
    
    // 计算游戏区域大小
    const gameWidth = this.gridCols * this.gridSize
    const gameHeight = this.gridRows * this.gridSize
    
    // 计算居中偏移
    this.offsetX = (window.innerWidth - gameWidth) / 2
    this.offsetY = (window.innerHeight - gameHeight) / 2
    
    console.log(`📍 [SnakeGameLogic] 游戏区域偏移：(${this.offsetX}, ${this.offsetY})`)
    
    // 渲染网格
    this.renderGrid()
  }
  
  /**
   * 渲染网格
   * 
   * @private
   */
  private renderGrid(): void {
    const graphics = this.scene.add.graphics()
    
    // 绘制网格线
    graphics.lineStyle(1, 0x444444, 0.3)
    
    // 垂直线
    for (let x = 0; x <= this.gridCols; x++) {
      const px = this.offsetX + x * this.gridSize
      graphics.moveTo(px, this.offsetY)
      graphics.lineTo(px, this.offsetY + this.gridRows * this.gridSize)
    }
    
    // 水平线
    for (let y = 0; y <= this.gridRows; y++) {
      const py = this.offsetY + y * this.gridSize
      graphics.moveTo(this.offsetX, py)
      graphics.lineTo(this.offsetX + this.gridCols * this.gridSize, py)
    }
    
    graphics.strokePath()
    
    console.log('🎨 [SnakeGameLogic] 网格渲染完成')
  }
  
  // ===========================================================================
  // 🐍 蛇系统
  // ===========================================================================
  
  /**
   * ⭐ 创建蛇
   * 
   * @param length - 初始长度
   * @param startPosition - 起始位置（网格坐标）
   */
  public createSnake(length: number, startPosition: Position): void {
    console.log(`🐍 [SnakeGameLogic] 创建蛇：length=${length}, start=(${startPosition.x}, ${startPosition.y})`)
    
    this.snake = []
    
    // 创建蛇的身体分段
    for (let i = 0; i < length; i++) {
      this.snake.push({
        x: startPosition.x - i,
        y: startPosition.y
      })
    }
    
    // 重置方向
    this.direction = 'right'
    this.nextDirection = 'right'
    
    console.log(`✅ [SnakeGameLogic] 蛇已创建，共 ${this.snake.length} 节`)
  }
  
  /**
   * ⭐ 更新蛇的位置
   * 
   * @param delta - 距离上一帧的时间间隔（毫秒）
   */
  public updateSnake(delta: number): void {
    if (this.isGameOver) return
    
    // 累积移动时间
    this.moveTimer += delta
    
    // 检查是否达到移动间隔
    if (this.moveTimer < this.moveInterval) {
      return
    }
    
    this.moveTimer = 0
    
    // 更新方向
    this.direction = this.nextDirection
    
    // 计算新的蛇头位置
    const head = this.snake[0]
    const newHead: Position = { ...head }
    
    switch (this.direction) {
      case 'up':
        newHead.y -= 1
        break
      case 'down':
        newHead.y += 1
        break
      case 'left':
        newHead.x -= 1
        break
      case 'right':
        newHead.x += 1
        break
    }
    
    // 检查是否撞墙
    if (this.checkWallCollision(newHead)) {
      this.gameOver()
      return
    }
    
    // 检查是否撞到自己
    if (this.checkSelfCollision(newHead)) {
      this.gameOver()
      return
    }
    
    // 将新蛇头添加到数组开头
    this.snake.unshift(newHead)
    
    // 检查是否吃到食物
    if (this.currentFood && newHead.x === this.currentFood.x && newHead.y === this.currentFood.y) {
      // 吃到食物，不移除蛇尾（蛇变长）
      this.onFoodEaten()
    } else {
      // 没吃到食物，移除蛇尾（保持长度）
      this.snake.pop()
    }
    
    // 发射移动事件
    this.emitSnakeMoved()
  }
  
  /**
   * 改变蛇的移动方向
   * 
   * @param newDirection - 新的方向
   */
  public changeDirection(newDirection: Direction): void {
    // 防止直接反向
    const opposites: Record<Direction, Direction> = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    }
    
    if (opposites[newDirection] !== this.direction) {
      this.nextDirection = newDirection
    }
  }
  
  /**
   * 设置移动速度
   * 
   * @param speed - 速度（毫秒/格）
   */
  public setMoveSpeed(speed: number): void {
    this.moveInterval = speed
    console.log(`⚡ [SnakeGameLogic] 移动速度已设置为 ${speed}ms/格`)
  }
  
  // ===========================================================================
  // 🍎 食物系统
  // ===========================================================================
  
  /**
   * ⭐ 生成食物
   * 
   * @param minCount - 最小数量（默认 1）
   * @param maxCount - 最大数量（默认 1）
   * @param forceType - 强制指定类型（可选，用于测试）
   */
  public spawnFood(minCount: number = 1, maxCount: number = 1, forceType?: FoodType): void {
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
    
    console.log(`🍎 [SnakeGameLogic] 生成 ${count} 个食物`)
    
    for (let i = 0; i < count; i++) {
      let position: Position
      
      // 寻找不与蛇重叠的位置
      do {
        position = {
          x: Math.floor(Math.random() * this.gridCols),
          y: Math.floor(Math.random() * this.gridRows)
        }
      } while (this.isPositionOccupied(position))
      
      // 创建食物（随机类型或指定类型）
      this.currentFood = createFood(position, forceType)
      
      console.log(`✨ [SnakeGameLogic] 生成 ${this.currentFood.type} 食物，分数：${this.currentFood.score}`)
      
      // 发射食物生成事件
      this.emitFoodSpawned(this.currentFood)
    }
  }
  
  /**
   * 检查位置是否被占用
   * 
   * @param position - 要检查的位置
   * @returns 如果被占用返回 true
   * 
   * @private
   */
  private isPositionOccupied(position: Position): boolean {
    // 检查是否与蛇重叠
    return this.snake.some(segment => 
      segment.x === position.x && segment.y === position.y
    )
  }
  
  /**
   * 食物被吃掉时的处理
   * 
   * @private
   */
  private onFoodEaten(): void {
    if (!this.currentFood) return
    
    // 增加分数
    this.score += this.currentFood.score
    
    console.log(`🎉 [SnakeGameLogic] 吃到 ${this.currentFood.type} 食物！分数：${this.score}`)
    
    // 发射得分事件
    this.emitScoreChanged(this.score)
    
    // 应用食物效果（如果有）
    const foodConfig = createFood({ x: 0, y: 0 }, this.currentFood.type)
    // TODO: 获取完整的配置并应用效果
    
    // 重新生成食物
    setTimeout(() => this.spawnFood(), 100)
  }
  
  // ===========================================================================
  // 💥 碰撞检测
  // ===========================================================================
  
  /**
   * ⭐ 检测撞墙
   * 
   * @param position - 要检查的位置
   * @returns 如果撞墙返回 true
   */
  public checkWallCollision(position: Position): boolean {
    const hitLeft = position.x < 0
    const hitRight = position.x >= this.gridCols
    const hitTop = position.y < 0
    const hitBottom = position.y >= this.gridRows
    
    if (hitLeft || hitRight || hitTop || hitBottom) {
      console.log('💥 [SnakeGameLogic] 撞墙检测：失败')
      return true
    }
    
    return false
  }
  
  /**
   * ⭐ 检测撞自己
   * 
   * @param position - 要检查的位置
   * @returns 如果撞到自己返回 true
   */
  public checkSelfCollision(position: Position): boolean {
    // 检查是否与身体重叠（跳过蛇头）
    for (let i = 1; i < this.snake.length; i++) {
      if (this.snake[i].x === position.x && this.snake[i].y === position.y) {
        console.log('💥 [SnakeGameLogic] 撞自己检测：失败')
        return true
      }
    }
    
    return false
  }
  
  /**
   * ⭐ 检测吃食物
   * 
   * @returns 如果吃到食物返回 true
   */
  public checkFoodCollision(): boolean {
    if (!this.currentFood) return false
    
    const head = this.snake[0]
    return head.x === this.currentFood.x && head.y === this.currentFood.y
  }
  
  // ===========================================================================
  // 🎮 游戏状态管理
  // ===========================================================================
  
  /**
   * 游戏结束
   * 
   * @private
   */
  private gameOver(): void {
    this.isGameOver = true
    console.log('😢 [SnakeGameLogic] 游戏结束!')
    
    // 发射游戏结束事件
    this.emitGameOver(this.score)
  }
  
  /**
   * 重新开始游戏
   */
  public restart(initialLength: number, startPosition: Position): void {
    console.log('🔄 [SnakeGameLogic] 重新开始游戏')
    
    this.isGameOver = false
    this.score = 0
    this.direction = 'right'
    this.nextDirection = 'right'
    
    this.createSnake(initialLength, startPosition)
    this.spawnFood()
  }
  
  // ===========================================================================
  // 📊 Getter 方法
  // ===========================================================================
  
  /**
   * 获取蛇身体数组
   */
  public getSnake(): Position[] {
    return [...this.snake]
  }
  
  /**
   * 获取当前分数
   */
  public getScore(): number {
    return this.score
  }
  
  /**
   * 获取游戏是否结束
   */
  public getIsGameOver(): boolean {
    return this.isGameOver
  }
  
  /**
   * 获取当前食物
   */
  public getCurrentFood(): Food | null {
    return this.currentFood
  }
  
  // ===========================================================================
  // 📡 事件发射（待实现）
  // ===========================================================================
  
  /**
   * 发射蛇移动事件
   * 
   * @private
   */
  private emitSnakeMoved(): void {
    this.eventBus.emit({
      type: GameEventType.SNAKE_MOVE,
      payload: { snake: [...this.snake], direction: this.direction },
      timestamp: Date.now()
    })
  }
  
  /**
   * 发射食物生成事件
   * 
   * @param food - 食物对象
   * 
   * @private
   */
  private emitFoodSpawned(food: Food): void {
    this.eventBus.emit({
      type: GameEventType.FOOD_SPAWN,
      payload: { 
        position: food.position,
        type: food.type,
        score: food.score
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * 发射分数变化事件
   * 
   * @param score - 新分数
   * 
   * @private
   */
  private emitScoreChanged(score: number): void {
    this.eventBus.emit({
      type: GameEventType.SCORE_CHANGED,
      payload: { score },
      timestamp: Date.now()
    })
  }
  
  /**
   * 发射游戏结束事件
   * 
   * @param score - 最终分数
   * 
   * @private
   */
  private emitGameOver(score: number): void {
    this.eventBus.emit({
      type: GameEventType.GAME_OVER,
      payload: { score },
      timestamp: Date.now()
    })
  }
}
