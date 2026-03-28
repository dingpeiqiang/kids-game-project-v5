// ============================================================================
// 🔄 通用网格移动组件
// ============================================================================
// 
// 📌 说明:
//   负责处理任何游戏对象在网格上的平滑移动
//   基于物理引擎的 deltaTime 实现帧率无关移动
//   ⭐ 通用化设计：适用于蛇、火车、蠕虫等任何网格移动物体
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { EventBus } from '../core/EventBus'
import type { GameEvent } from '../core/GameEvent' // 只导入类型
import { GameEventType } from '../core/GameEvent'   // 导入枚举值

/**
 * ⭐ 方向枚举（通用）
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * ⭐ 位置接口（像素坐标）
 */
export interface Position {
  x: number  // X 坐标（像素）
  y: number  // Y 坐标（像素）
}

/**
 * ⭐ 可移动游戏对象接口（通用）
 * 
 * @remarks
 * 任何需要在网格上移动的物体都应实现此接口
 */
export interface IMovableObject {
  /** 当前位置 */
  position: Position
  /** 当前方向 */
  direction: Direction
  /** 移动速度（像素/秒） */
  speed: number
  /** 是否启用移动 */
  enabled: boolean
}

/**
 * ⭐ 网格移动组件参数
 */
interface GridMovementParams {
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
 * ⭐ 通用网格移动组件类
 * 
 * @remarks
 * 职责：
 * - 处理任何对象的平滑移动（基于时间增量）
 * - 管理移动方向和速度
 * - 边界检测
 * - 发射移动事件通知其他组件
 * 
 * @example
 * ```typescript
 * // 用于蛇
 * const snakeMovement = new GridMovementComponent(scene)
 * snakeMovement.init({ speed: 200, gridCols: 32, gridRows: 18, cellSize: 40 })
 * snakeMovement.setObject(snakeObject)
 * 
 * // 用于火车
 * const trainMovement = new GridMovementComponent(scene)
 * trainMovement.init({ speed: 150, gridCols: 20, gridRows: 15, cellSize: 50 })
 * trainMovement.setObject(trainObject)
 * ```
 */
export class GridMovementComponent extends ComponentBase {
  /** ⭐ 管理的可移动对象列表 */
  protected movableObjects: IMovableObject[] = []
  
  /** 当前参数 */
  protected params: GridMovementParams | null = null
  
  /** 移动累积时间（毫秒） */
  protected moveTimer: number = 0
  
  /** 移动间隔（毫秒）- 根据速度动态计算 */
  protected moveInterval: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene, name: string = 'grid_movement', displayName: string = '网格移动逻辑') {
    super(scene, name, displayName)
  }
  
  /**
   * ⭐ 初始化网格移动组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as GridMovementParams
    this.calculateMoveInterval()
    
    console.log(`✅ [GridMovement] 网格移动组件初始化完成，速度=${this.params.speed}px/s`)
  }
  
  /**
   * ⭐ 注册可移动对象
   * 
   * @param obj - 实现了 IMovableObject 接口的对象
   */
  public registerObject(obj: IMovableObject): void {
    if (!this.movableObjects.includes(obj)) {
      this.movableObjects.push(obj)
      console.log(`📝 [GridMovement] 注册新对象：${obj.constructor.name}`)
    }
  }
  
  /**
   * ⭐ 移除可移动对象
   * 
   * @param obj - 要移除的对象
   */
  public unregisterObject(obj: IMovableObject): void {
    const index = this.movableObjects.indexOf(obj)
    if (index !== -1) {
      this.movableObjects.splice(index, 1)
      console.log(`🗑️ [GridMovement] 移除对象：${obj.constructor.name}`)
    }
  }
  
  /**
   * ⭐ 更新所有对象的移动（每帧调用）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(deltaTime: number): void {
    if (!this.enabled || !this.params) return
    
    // 累积移动时间
    this.moveTimer += deltaTime
    
    // 达到移动间隔时移动所有对象
    if (this.moveTimer >= this.moveInterval) {
      this.movableObjects.forEach(obj => {
        if (obj.enabled) {
          this.moveObject(obj)
        }
      })
      this.moveTimer = 0
    }
  }
  
  /**
   * ⭐ 移动单个对象（基础实现：直线移动）
   * 
   * @param obj - 要移动的对象
   * 
   * @protected
   */
  protected moveObject(obj: IMovableObject): void {
    // 基础实现：根据方向和速度移动
    const distance = this.params!.cellSize
    
    switch (obj.direction) {
      case 'up':
        obj.position.y -= distance
        break
      case 'down':
        obj.position.y += distance
        break
      case 'left':
        obj.position.x -= distance
        break
      case 'right':
        obj.position.x += distance
        break
    }
    
    // 边界检测
    this.checkBounds(obj)
    
    // 发射移动事件
    this.emitMoveEvent(obj)
  }
  
  /**
   * ⭐ 边界检测
   * 
   * @param obj - 要检测的对象
   * 
   * @protected
   */
  protected checkBounds(obj: IMovableObject): void {
    if (!this.params) return
    
    const maxX = this.params.gridCols * this.params.cellSize
    const maxY = this.params.gridRows * this.params.cellSize
    
    // 简单的边界限制（子类可以重写为穿墙、死亡等逻辑）
    obj.position.x = Math.max(0, Math.min(obj.position.x, maxX - this.params.cellSize))
    obj.position.y = Math.max(0, Math.min(obj.position.y, maxY - this.params.cellSize))
  }
  
  /**
   * ⭐ 设置对象的速度
   * 
   * @param obj - 目标对象
   * @param speed - 新的速度（像素/秒）
   */
  public setSpeed(obj: IMovableObject, speed: number): void {
    obj.speed = speed
    this.calculateMoveInterval()
    console.log(`⚙️ [GridMovement] 设置速度：${speed}px/s`)
  }
  
  /**
   * ⭐ 设置对象的方向
   * 
   * @param obj - 目标对象
   * @param direction - 新的方向
   * @param preventOpposite - 是否防止 180 度掉头（默认 true）
   */
  public setDirection(obj: IMovableObject, direction: Direction, preventOpposite: boolean = true): void {
    if (preventOpposite && this.isOppositeDirection(obj.direction, direction)) {
      console.warn('⚠️ [GridMovement] 禁止 180 度掉头')
      return
    }
    
    obj.direction = direction
    console.log(`⚙️ [GridMovement] 设置方向：${direction}`)
  }
  
  /**
   * ⭐ 判断两个方向是否相反
   * 
   * @param current - 当前方向
   * @param target - 目标方向
   * @returns 如果相反返回 true
   * 
   * @protected
   */
  protected isOppositeDirection(current: Direction, target: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    }
    return opposites[current] === target
  }
  
  /**
   * ⭐ 计算移动间隔
   * 
   * @protected
   */
  protected calculateMoveInterval(): void {
    if (!this.params || this.params.speed <= 0) {
      this.moveInterval = 100 // 默认 100ms
      return
    }
    
    // 速度越快，间隔越小
    // 例如：speed=200px/s, cellSize=40px → interval=200ms
    this.moveInterval = (this.params.cellSize / this.params.speed) * 1000
  }
  
  /**
   * ⭐ 发射移动事件
   * 
   * @param obj - 移动的对象
   * 
   * @protected
   */
  protected emitMoveEvent(obj: IMovableObject): void {
    const event = new GameEvent(GameEventType.SNAKE_MOVE, { // 使用现有的 SNAKE_MOVE 事件
      object: obj,
      position: obj.position,
      direction: obj.direction
    })
    this.eventBus.emit(event)
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 基类实现，暂不处理特定事件
    // 子类可以重写以处理特定事件
  }
  
  /**
   * ⭐ 获取当前速度
   * 
   * @returns 速度值（像素/秒）
   */
  public getSpeed(): number {
    return this.params?.speed ?? 0
  }
  
  /**
   * ⭐ 获取移动间隔
   * 
   * @returns 移动间隔（毫秒）
   */
  public getMoveInterval(): number {
    return this.moveInterval
  }
  
  /**
   * ⭐ 获取管理的对象数量
   * 
   * @returns 对象数量
   */
  public getObjectCount(): number {
    return this.movableObjects.length
  }
}
