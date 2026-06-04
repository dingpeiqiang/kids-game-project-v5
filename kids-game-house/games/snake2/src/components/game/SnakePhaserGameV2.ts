// ============================================================================
// 🐍 Snake2 PhaserGame - 实体系统重构版
// ============================================================================
// 
// 📌 说明:
//   集成新的实体系统（BaseEntity + CollisionSystem）到 PhaserGame
//   保留原有 GTRS 主题支持和屏幕适配能力
// ============================================================================

import { EntityManager, CollisionDetector } from '../../utils/CollisionSystem'
import { FoodPoolManager } from '../../utils/FoodPoolManager'
import { SnakeHead } from './entities/SnakeHead'
import { SnakeBody } from './entities/SnakeBody'
import { Food } from './entities/Food'
import { Obstacle } from './entities/Obstacle'
import { handleSnakeCollision } from '../../logic/handleSnakeCollision'
import { FoodType, type Direction } from '../../types/entity'
import { EventBus } from '../core/EventBus'
import { GameEventType } from '../core/GameEvent'

/**
 * 🐍 Snake2 游戏主控制器（实体系统重构版）
 * 
 * @remarks
 * 使用新的实体架构：
 * - EntityManager 统一管理所有实体
 * - CollisionDetector 处理碰撞检测
 * - FoodPoolManager 管理食物对象池
 * - 保留 GTRS 主题支持
 */
export class SnakePhaserGameV2 {
  // === 实体管理系统 ===
  private entityManager = new EntityManager()
  private collisionDetector: CollisionDetector
  private foodPool: FoodPoolManager
  
  // === 蛇相关 ===
  private snakeHead: SnakeHead | null = null
  private snakeBodySegments: SnakeBody[] = []
  
  // === 游戏配置 ===
  private gridCols: number = 32
  private gridRows: number = 18
  private cellSize: number = 50
  
  /**
   * 构造函数
   * 
   * @param cellSize - 单元格大小（像素）
   * @param gridCols - 网格列数
   * @param gridRows - 网格行数
   */
  constructor(cellSize: number = 50, gridCols: number = 32, gridRows: number = 18) {
    this.cellSize = cellSize
    this.gridCols = gridCols
    this.gridRows = gridRows
    
    // 初始化碰撞检测器（贪吃蛇实体少，不用四叉树）
    this.collisionDetector = new CollisionDetector(
      this.entityManager,
      false,  // 不启用四叉树
      gridCols * cellSize,  // 世界宽度
      gridRows * cellSize   // 世界高度
    )
    
    // 初始化食物池
    this.foodPool = FoodPoolManager.getInstance()
    this.foodPool.initialize({
      initialCapacity: 5,
      maxCapacity: 20,
      debugMode: (import.meta as any).env?.DEV ?? false
    })
    
    console.log('🐍 [SnakePhaserGameV2] 初始化完成', {
      cellSize,
      grid: `${gridCols}x${gridRows}`,
      worldSize: `${gridCols * cellSize}x${gridRows * cellSize}`
    })
  }
  
  // ============================================================================
  // ⭐ 游戏控制方法
  // ============================================================================
  
  /**
   * 启动游戏
   */
  start(): void {
    console.log('🎮 [SnakePhaserGameV2] 游戏启动')
    
    // 创建蛇
    this.createSnake()
    
    // 创建障碍物
    this.createObstacles()
    
    // 生成第一个食物
    this.spawnFood()
  }
  
  /**
   * 更新游戏状态（每帧调用）
   * 
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  update(deltaTime: number): void {
    // 1. 更新所有实体
    this.entityManager.updateAll(deltaTime)
    
    // 2. 执行碰撞检测
    this.collisionDetector.detectCollisions(handleSnakeCollision)
    
    // 3. 🎁 检测蛇与道具的碰撞（通过 EventBus 通知 ItemSystem）
    this.checkEntityItemCollision()
    
    // 4. 检查蛇头是否死亡
    if (this.snakeHead && !this.snakeHead.alive) {
      this.handleGameOver()
    }
  }
  
  /**
   * 渲染所有实体
   * 
   * @param ctx - Phaser 场景或 Canvas 上下文
   */
  render(ctx: any): void {
    this.entityManager.renderAll(ctx)
  }
  
  /**
   * 🎨 渲染到 Canvas（用于 PhaserGame 纹理更新）
   * 
   * @param ctx - Canvas 2D 上下文
   * @param width - 画布宽度
   * @param height - 画布高度
   */
  renderToCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 直接使用 Canvas API 渲染
    this.entityManager.renderAll(ctx)
  }
  
  // ============================================================================
  // 🐍 蛇管理方法
  // ============================================================================
  
  /**
   * 创建蛇
   */
  private createSnake(): void {
    const startX = Math.floor(this.gridCols / 2) * this.cellSize
    const startY = Math.floor(this.gridRows / 2) * this.cellSize
    
    // 创建蛇头
    this.snakeHead = new SnakeHead(startX, startY)
    this.entityManager.add(this.snakeHead)
    
    // 创建初始蛇身（3 节）
    this.snakeBodySegments = []
    for (let i = 1; i <= 3; i++) {
      const body = new SnakeBody(startX - i * this.cellSize, startY, i - 1)
      this.snakeBodySegments.push(body)
      this.entityManager.add(body)
    }
    
    console.log('🐍 [SnakePhaserGameV2] 蛇创建完成', {
      headPosition: { x: startX, y: startY },
      bodyLength: this.snakeBodySegments.length
    })
  }
  
  /**
   * 改变蛇的方向
   * 
   * @param direction - 新方向
   */
  setSnakeDirection(direction: Direction): void {
    if (this.snakeHead) {
      this.snakeHead.setDirection(direction)
    }
  }
  
  /**
   * 增长蛇身
   * 
   * @param count - 增长的节数
   */
  growSnake(count: number): void {
    const lastSegment = this.snakeBodySegments[this.snakeBodySegments.length - 1]
    
    for (let i = 0; i < count; i++) {
      // 在最后一节后面添加新节
      const newX = lastSegment.x - (this.snakeBodySegments.length + i) * this.cellSize
      const newY = lastSegment.y
      
      const newBody = new SnakeBody(newX, newY, this.snakeBodySegments.length + i)
      this.snakeBodySegments.push(newBody)
      this.entityManager.add(newBody)
    }
    
    console.log(`🐍 [SnakePhaserGameV2] 蛇身增长 +${count}节`, {
      totalLength: this.snakeBodySegments.length + 1  // +1 是蛇头
    })
  }
  
  // ============================================================================
  // 🍎 食物管理方法
  // ============================================================================
  
  /**
   * 生成食物
   */
  spawnFood(): void {
    // 随机位置（网格对齐）
    const col = Math.floor(Math.random() * this.gridCols)
    const row = Math.floor(Math.random() * this.gridRows)
    
    const x = col * this.cellSize + this.cellSize / 2
    const y = row * this.cellSize + this.cellSize / 2
    
    // 随机食物类型（这里使用简单概率，实际应该用配置表）
    const rand = Math.random()
    let foodType: FoodType = FoodType.NORMAL
    
    if (rand < 0.05) {
      foodType = FoodType.SPECIAL  // 5% 概率
    } else if (rand < 0.20) {
      foodType = FoodType.BONUS    // 15% 概率
    } else {
      foodType = FoodType.NORMAL   // 70% 概率
    }
    
    // 从对象池获取食物
    const config = {
      type: foodType,
      baseScore: foodType === FoodType.NORMAL ? 10 : foodType === FoodType.BONUS ? 50 : 100,
      color: foodType === FoodType.NORMAL ? '#ef4444' : foodType === FoodType.BONUS ? '#fbbf24' : '#a855f7',
      spawnProbability: foodType === FoodType.NORMAL ? 0.7 : foodType === FoodType.BONUS ? 0.15 : 0.05,
      growsSnake: true,
      lengthIncrease: foodType === FoodType.BONUS ? 2 : 1,
      description: foodType === FoodType.NORMAL ? '普通食物' : foodType === FoodType.BONUS ? '奖励食物' : '特殊食物'
    }
    
    const food = this.foodPool.acquire(x, y, config)
    if (food) {
      this.entityManager.add(food)
      console.log('🍎 [SnakePhaserGameV2] 食物生成', {
        position: { x, y },
        type: foodType
      })
    }
  }
  
  // ============================================================================
  // 🧱 障碍物管理方法
  // ============================================================================
  
  /**
   * 创建边界障碍物
   */
  private createObstacles(): void {
    const worldWidth = this.gridCols * this.cellSize
    const worldHeight = this.gridRows * this.cellSize
    const wallThickness = this.cellSize
    
    // 创建四个边界墙
    const obstacles = [
      // 上边界
      new Obstacle(0, 0, worldWidth, wallThickness),
      // 下边界
      new Obstacle(0, worldHeight - wallThickness, worldWidth, wallThickness),
      // 左边界
      new Obstacle(0, 0, wallThickness, worldHeight),
      // 右边界
      new Obstacle(worldWidth - wallThickness, 0, wallThickness, worldHeight)
    ]
    
    obstacles.forEach(obs => this.entityManager.add(obs))
    
    console.log('🧱 [SnakePhaserGameV2] 边界障碍物创建完成', {
      worldSize: `${worldWidth}x${worldHeight}`
    })
  }
  
  // ============================================================================
  // 🎮 游戏结束处理
  // ============================================================================
  
  /**
   * 处理游戏结束
   */
  private handleGameOver(): void {
    console.log('💥 [SnakePhaserGameV2] 游戏结束')
    
    // TODO: 触发游戏结束事件
    // TODO: 清理实体
    // TODO: 显示游戏结束 UI
  }
  
  // ============================================================================
  // 🔧 Getter 方法
  // ============================================================================
  
  /**
   * 获取蛇头
   */
  getSnakeHead(): SnakeHead | null {
    return this.snakeHead
  }
  
  /**
   * 🎁 获取蛇身段数组（用于渲染或碰撞）
   * 
   * @returns 蛇身段数组
   */
  public getSnakeBody(): SnakeBody[] {
    return this.snakeBodySegments
  }
  
  /**
   * 🎁 获取蛇头碰撞盒（AABB 格式，用于道具碰撞检测）
   * 
   * @returns AABB 碰撞盒，如果蛇头不存在则返回 null
   */
  public getSnakeHeadBounds(): { x: number, y: number, width: number, height: number } | null {
    if (!this.snakeHead) return null
    // 手动计算碰撞盒（因为 BaseEntity 没有 getBounds 方法）
    return {
      x: this.snakeHead.x,
      y: this.snakeHead.y,
      width: this.snakeHead.width,
      height: this.snakeHead.height
    }
  }
  
  /**
   * 获取蛇身段数
   */
  getSnakeLength(): number {
    return this.snakeBodySegments.length + 1  // +1 是蛇头
  }
  
  // ============================================================================
  // 🎁 道具碰撞检测（通过 EventBus）
  // ============================================================================
  
  /**
   * 🎁 检测蛇与道具的碰撞，并发出 ENTITY_ITEM_COLLISION 事件
   * 
   * @remarks
   * 使用 EventBus 通知 ItemSystem 有道具被收集
   * 实现 SnakePhaserGameV2 和 ItemSystem 之间的解耦
   */
  private checkEntityItemCollision(): void {
    if (!this.snakeHead) return
    
    // 获取蛇头位置和大小
    const headBounds = this.getSnakeHeadBounds()
    if (!headBounds) return
    
    // 👉 发出碰撒事件，让 ItemSystem 处理
    const eventBus = EventBus.getInstance()
    eventBus.emit({
      type: GameEventType.ENTITY_ITEM_COLLISION,
      payload: {
        entityBounds: headBounds,
        entityType: 'snake_head'
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * 获取实体管理器
   */
  getEntityManager(): EntityManager {
    return this.entityManager
  }
}
