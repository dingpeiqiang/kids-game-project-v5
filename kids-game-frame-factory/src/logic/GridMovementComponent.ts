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
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import type { Direction } from '../types/common'
import type { IMovableObject } from '../interfaces/movable-object'

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
  /** 单元格大小（像素） */
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
  constructor(scene: Phaser.Scene) {
    super(scene, 'grid_movement', '网格移动逻辑')
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
    
    // 累积时间
    this.moveTimer += deltaTime
    
    // 检查是否需要移动
    while (this.moveTimer >= this.moveInterval) {
      this.moveTimer -= this.moveInterval
      
      // 更新所有对象的位置
      this.movableObjects.forEach(obj => {
        if (obj.enabled) {
          this.updatePosition(obj)
        }
      })
    }
  }
  
  /**
   * ⭐ 设置移动速度
   * 
   * @param speed - 新的速度值（像素/秒）
   */
  public setSpeed(speed: number): void {
    if (this.params) {
      this.params.speed = speed
      this.calculateMoveInterval()
      console.log(`⚡ [GridMovement] 速度已更新：${speed}px/s`)
    }
  }
  
  /**
   * ⭐ 获取当前管理的对象列表
   * 
   * @returns 可移动对象数组
   */
  public getMovableObjects(): IMovableObject[] {
    return [...this.movableObjects]
  }
  
  /**
   * ⭐ 清除所有注册的对象
   */
  public clearObjects(): void {
    this.movableObjects = []
    console.log(`🗑️ [GridMovement] 已清除所有对象`)
  }
  
  /**
   * ⭐ 计算移动间隔
   * 
   * @protected
   * @remarks
   * 根据速度和单元格大小计算每次移动的时间间隔
   */
  protected calculateMoveInterval(): void {
    if (!this.params) return
    
    // 移动间隔 = 单元格大小 / 速度 * 1000(转换为毫秒)
    this.moveInterval = (this.params.cellSize / this.params.speed) * 1000
    
    console.log(`🔧 [GridMovement] 移动间隔：${this.moveInterval.toFixed(2)}ms`)
  }
  
  /**
   * ⭐ 更新单个对象的位置
   * 
   * @param obj - 要更新的对象
   * @protected
   */
  protected updatePosition(obj: IMovableObject): void {
    const delta = this.params!.cellSize
    
    switch (obj.direction) {
      case 'up':
        obj.position.y -= delta
        break
      case 'down':
        obj.position.y += delta
        break
      case 'left':
        obj.position.x -= delta
        break
      case 'right':
        obj.position.x += delta
        break
    }
    
    // 边界检测
    this.checkBoundary(obj)
    
    // 发送移动事件
    this.emit({
      type: GameEventType.SNAKE_MOVE,
      payload: {
        objectId: this.getObjectId(obj),
        position: obj.position,
        direction: obj.direction
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * ⭐ 边界检测
   * 
   * @param obj - 要检测的对象
   * @protected
   * @remarks
   * 检查对象是否超出边界，可配置是否允许穿越
   */
  protected checkBoundary(obj: IMovableObject): void {
    if (!this.params) return
    
    const maxX = this.params.gridCols * this.params.cellSize
    const maxY = this.params.gridRows * this.params.cellSize
    
    // 简单的边界限制（可以根据需要扩展为穿越或死亡）
    if (obj.position.x < 0) obj.position.x = 0
    if (obj.position.x >= maxX) obj.position.x = maxX - this.params.cellSize
    if (obj.position.y < 0) obj.position.y = 0
    if (obj.position.y >= maxY) obj.position.y = maxY - this.params.cellSize
  }
  
  /**
   * ⭐ 获取对象 ID（用于事件）
   * 
   * @param obj - 对象
   * @returns 对象标识符
   * @protected
   */
  protected getObjectId(obj: IMovableObject): string {
    return obj.constructor.name
  }
  
  /**
   * ⭐ 改变对象移动方向
   * 
   * @param obj - 要改变方向的对象
   * @param newDirection - 新的方向
   * @param prevent180Turn - 是否防止 180 度转向（默认 true）
   * @returns 是否成功改变方向
   */
  public changeDirection(
    obj: IMovableObject, 
    newDirection: Direction, 
    prevent180Turn: boolean = true
  ): boolean {
    if (!obj.enabled) return false
    
    // 检查是否为相反方向
    if (prevent180Turn) {
      const opposites: Record<Direction, Direction> = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
      }
      
      if (opposites[obj.direction] === newDirection) {
        console.warn(`⚠️ [GridMovement] 禁止 180 度转向：${obj.direction} → ${newDirection}`)
        return false
      }
    }
    
    const oldDirection = obj.direction
    obj.direction = newDirection
    
    console.log(`🔄 [GridMovement] 方向改变：${oldDirection} → ${newDirection}`)
    
    // 发送方向改变事件
    this.emit({
      type: GameEventType.INPUT_DIRECTION_CHANGED,
      payload: {
        objectId: this.getObjectId(obj),
        oldDirection,
        newDirection
      },
      timestamp: Date.now()
    })
    
    return true
  }
  
  /**
   * ⭐ 暂停所有对象移动
   */
  public pauseMovement(): void {
    this.enabled = false
    console.log(`⏸️ [GridMovement] 移动已暂停`)
  }
  
  /**
   * ⭐ 恢复所有对象移动
   */
  public resumeMovement(): void {
    this.enabled = true
    console.log(`▶️ [GridMovement] 移动已恢复`)
  }
  
  /**
   * ⭐ 停止所有对象移动
   */
  public stopAllMovement(): void {
    this.movableObjects.forEach(obj => {
      obj.enabled = false
    })
    console.log(`⏹️ [GridMovement] 所有对象移动已停止`)
  }
  
  /**
   * ⭐ 启动所有对象移动
   */
  public startAllMovement(): void {
    this.movableObjects.forEach(obj => {
      obj.enabled = true
    })
    console.log(`▶️ [GridMovement] 所有对象移动已启动`)
  }
  
  /**
   * ⭐ 获取当前统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    registeredObjects: number
    activeObjects: number
    speed: number
    moveInterval: number
  } {
    return {
      registeredObjects: this.movableObjects.length,
      activeObjects: this.movableObjects.filter(obj => obj.enabled).length,
      speed: this.params?.speed ?? 0,
      moveInterval: this.moveInterval
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(_event: GameEvent): void {
    // GridMovementComponent 主要响应外部事件来改变方向
    // 目前不需要处理特定事件
  }
}
