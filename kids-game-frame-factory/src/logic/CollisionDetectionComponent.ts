// ============================================================================
// 💥 碰撞检测组件
// ============================================================================
// 
// 📌 说明:
//   负责检测游戏对象之间的碰撞
//   支持多种碰撞体类型（矩形、圆形、点）
//   通过事件通知其他组件碰撞结果
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'
import type { Position, Rectangle } from '../types/common'
import type { ICollider } from '../interfaces/movable-object'
import { ColliderType } from '../interfaces/movable-object'
import { checkRectangleIntersection, isPointInRectangle, getSquaredDistance } from '../utils/helpers'

/**
 * ⭐ 碰撞检测结果
 */
interface CollisionResult {
  /** 是否发生碰撞 */
  collided: boolean
  /** 碰撞的对象 A */
  objectA?: any
  /** 碰撞的对象 B */
  objectB?: any
  /** 碰撞点位置 */
  contactPoint?: Position
  /** 碰撞法向量 */
  normal?: Position
}

/**
 * ⭐ 碰撞对
 */
interface CollisionPair {
  /** 对象 A */
  objectA: any
  /** 对象 B */
  objectB: any
  /** 碰撞体 A */
  colliderA: ICollider
  /** 碰撞体 B */
  colliderB: ICollider
}

/**
 * ⭐ 碰撞检测组件参数
 */
interface CollisionDetectionParams {
  /** 是否启用连续碰撞检测（可选，默认 false） */
  enableContinuous?: boolean
  /** 是否调试模式（可选，默认 false） */
  debugMode?: boolean
}

/**
 * ⭐ 碰撞检测组件类
 * 
 * @remarks
 * 职责：
 * - 注册和管理碰撞体
 * - 检测碰撞对之间的碰撞
 * - 发送碰撞事件
 * - 优化碰撞检测性能
 * 
 * @example
 * ```typescript
 * const collisionDetection = new CollisionDetectionComponent(scene)
 * collisionDetection.init({ debugMode: true })
 * 
 * // 注册碰撞对象
 * collisionDetection.registerCollider(player, playerCollider)
 * collisionDetection.registerCollider(enemy, enemyCollider)
 * 
 * // 每帧检测碰撞
 * collisionDetection.update(deltaTime)
 * ```
 */
export class CollisionDetectionComponent extends ComponentBase {
  /** 注册的碰撞体映射表 */
  private colliders: Map<any, ICollider> = new Map()
  
  /** 碰撞对列表 */
  private collisionPairs: CollisionPair[] = []
  
  /** 是否启用连续碰撞检测 */
  private enableContinuous: boolean = false
  
  /** 是否调试模式 */
  private debugMode: boolean = false
  
  /** 上次检测到的碰撞集合 */
  private previousCollisions: Set<string> = new Set()
  
  /** 当前检测到的碰撞集合 */
  private currentCollisions: Set<string> = new Set()
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'collision_detection', '碰撞检测器')
  }
  
  /**
   * ⭐ 初始化碰撞检测组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    const typedParams = params as CollisionDetectionParams
    
    this.enableContinuous = typedParams.enableContinuous ?? false
    this.debugMode = typedParams.debugMode ?? false
    
    console.log(`✅ [CollisionDetection] 碰撞检测器初始化完成`)
    console.log(`   连续检测：${this.enableContinuous ? '✓' : '✗'}`)
    console.log(`   调试模式：${this.debugMode ? '✓' : '✗'}`)
  }
  
  /**
   * ⭐ 注册碰撞体
   * 
   * @param owner - 碰撞体所有者
   * @param collider - 碰撞体对象
   */
  public registerCollider(owner: any, collider: ICollider): void {
    this.colliders.set(owner, collider)
    
    if (this.debugMode) {
      console.log(`📝 [CollisionDetection] 注册碰撞体：${owner.constructor.name}`)
    }
  }
  
  /**
   * ⭐ 移除碰撞体
   * 
   * @param owner - 要移除的所有者
   */
  public unregisterCollider(owner: any): void {
    if (this.colliders.has(owner)) {
      this.colliders.delete(owner)
      
      // 清除相关的碰撞对
      this.collisionPairs = this.collisionPairs.filter(
        pair => pair.objectA !== owner && pair.objectB !== owner
      )
      
      if (this.debugMode) {
        console.log(`🗑️ [CollisionDetection] 移除碰撞体：${owner.constructor.name}`)
      }
    }
  }
  
  /**
   * ⭐ 添加碰撞对（需要检测碰撞的两个对象）
   * 
   * @param objectA - 对象 A
   * @param objectB - 对象 B
   */
  public addCollisionPair(objectA: any, objectB: any): void {
    const colliderA = this.colliders.get(objectA)
    const colliderB = this.colliders.get(objectB)
    
    if (!colliderA || !colliderB) {
      console.warn(`⚠️ [CollisionDetection] 无法添加碰撞对：缺少碰撞体`)
      return
    }
    
    // 检查是否已存在
    const exists = this.collisionPairs.some(
      pair => (pair.objectA === objectA && pair.objectB === objectB) ||
              (pair.objectA === objectB && pair.objectB === objectA)
    )
    
    if (!exists) {
      this.collisionPairs.push({ objectA, objectB, colliderA, colliderB })
      
      if (this.debugMode) {
        console.log(`🔗 [CollisionDetection] 添加碰撞对：${objectA.constructor.name} ↔ ${objectB.constructor.name}`)
      }
    }
  }
  
  /**
   * ⭐ 每帧更新（检测碰撞）
   * 
   * @param _deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    // 保存上一次的碰撞状态
    this.previousCollisions = new Set(this.currentCollisions)
    this.currentCollisions.clear()
    
    // 检测所有碰撞对的碰撞
    this.collisionPairs.forEach(pair => {
      if (pair.colliderA.enabled && pair.colliderB.enabled) {
        const collision = this.detectCollision(pair.colliderA, pair.colliderB)
        
        if (collision.collided) {
          const collisionId = this.getCollisionId(pair.objectA, pair.objectB)
          this.currentCollisions.add(collisionId)
          
          // 如果是新碰撞，发送碰撞开始事件
          if (!this.previousCollisions.has(collisionId)) {
            this.emitCollisionStart(pair.objectA, pair.objectB, collision)
          }
          
          // 发送持续碰撞事件
          if (this.enableContinuous) {
            this.emitCollisionStay(pair.objectA, pair.objectB, collision)
          }
        } else {
          // 如果碰撞结束，发送碰撞结束事件
          const collisionId = this.getCollisionId(pair.objectA, pair.objectB)
          if (this.previousCollisions.has(collisionId)) {
            this.emitCollisionEnd(pair.objectA, pair.objectB)
          }
        }
      }
    })
  }
  
  /**
   * ⭐ 检测两个碰撞体之间的碰撞
   * 
   * @param colliderA - 碰撞体 A
   * @param colliderB - 碰撞体 B
   * @returns 碰撞检测结果
   */
  public detectCollision(colliderA: ICollider, colliderB: ICollider): CollisionResult {
    // 根据碰撞体类型选择不同的检测算法
    if (colliderA.type === ColliderType.RECTANGLE && colliderB.type === ColliderType.RECTANGLE) {
      return this.detectRectangleCollision(
        colliderA.position,
        colliderA.width!,
        colliderA.height!,
        colliderB.position,
        colliderB.width!,
        colliderB.height!
      )
    }
    
    if (colliderA.type === ColliderType.CIRCLE && colliderB.type === ColliderType.CIRCLE) {
      return this.detectCircleCollision(
        colliderA.position,
        colliderA.radius!,
        colliderB.position,
        colliderB.radius!
      )
    }
    
    if (colliderA.type === ColliderType.POINT && colliderB.type === ColliderType.RECTANGLE) {
      return {
        collided: isPointInRectangle(colliderA.position, {
          x: colliderB.position.x,
          y: colliderB.position.y,
          width: colliderB.width!,
          height: colliderB.height!
        }),
        objectA: colliderA,
        objectB: colliderB,
        contactPoint: colliderA.position
      }
    }
    
    // 不支持的碰撞体类型组合
    console.warn(`⚠️ [CollisionDetection] 不支持的碰撞体类型组合：${colliderA.type} + ${colliderB.type}`)
    return { collided: false }
  }
  
  /**
   * ⭐ 获取所有注册的碰撞体
   * 
   * @returns 碰撞体映射表的副本
   */
  public getColliders(): Map<any, ICollider> {
    return new Map(this.colliders)
  }
  
  /**
   * ⭐ 清除所有碰撞对
   */
  public clearCollisionPairs(): void {
    this.collisionPairs = []
    console.log(`🗑️ [CollisionDetection] 已清除所有碰撞对`)
  }
  
  /**
   * ⭐ 设置调试模式
   * 
   * @param enabled - 是否启用调试模式
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
    console.log(`🔧 [CollisionDetection] 调试模式：${enabled ? '开启' : '关闭'}`)
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    registeredColliders: number
    collisionPairs: number
    currentCollisions: number
    debugMode: boolean
  } {
    return {
      registeredColliders: this.colliders.size,
      collisionPairs: this.collisionPairs.length,
      currentCollisions: this.currentCollisions.size,
      debugMode: this.debugMode
    }
  }
  
  /**
   * ⭐ 检测矩形碰撞
   * 
   * @param posA - 矩形 A 位置
   * @param widthA - 矩形 A 宽度
   * @param heightA - 矩形 A 高度
   * @param posB - 矩形 B 位置
   * @param widthB - 矩形 B 宽度
   * @param heightB - 矩形 B 高度
   * @returns 碰撞检测结果
   * @protected
   */
  protected detectRectangleCollision(
    posA: Position,
    widthA: number,
    heightA: number,
    posB: Position,
    widthB: number,
    heightB: number
  ): CollisionResult {
    const rectA: Rectangle = { x: posA.x, y: posA.y, width: widthA, height: heightA }
    const rectB: Rectangle = { x: posB.x, y: posB.y, width: widthB, height: heightB }
    
    const collided = checkRectangleIntersection(rectA, rectB)
    
    return {
      collided,
      objectA: rectA,
      objectB: rectB,
      contactPoint: collided ? {
        x: Math.max(rectA.x, rectB.x),
        y: Math.max(rectA.y, rectB.y)
      } : undefined
    }
  }
  
  /**
   * ⭐ 检测圆形碰撞
   * 
   * @param posA - 圆心 A
   * @param radiusA - 半径 A
   * @param posB - 圆心 B
   * @param radiusB - 半径 B
   * @returns 碰撞检测结果
   * @protected
   */
  protected detectCircleCollision(
    posA: Position,
    radiusA: number,
    posB: Position,
    radiusB: number
  ): CollisionResult {
    const distanceSquared = getSquaredDistance(posA, posB)
    const radiusSumSquared = (radiusA + radiusB) ** 2
    
    const collided = distanceSquared <= radiusSumSquared
    
    // 计算接触点和法向量
    let contactPoint: Position | undefined
    let normal: Position | undefined
    
    if (collided) {
      const distance = Math.sqrt(distanceSquared)
      const overlap = (radiusA + radiusB) - distance
      
      // 法向量（从 A 指向 B）
      normal = {
        x: (posB.x - posA.x) / distance,
        y: (posB.y - posA.y) / distance
      }
      
      // 接触点在两个圆心的连线上
      contactPoint = {
        x: posA.x + normal.x * (radiusA - overlap / 2),
        y: posA.y + normal.y * (radiusA - overlap / 2)
      }
    }
    
    return {
      collided,
      objectA: posA,
      objectB: posB,
      contactPoint,
      normal
    }
  }
  
  /**
   * ⭐ 生成碰撞 ID
   * 
   * @param objectA - 对象 A
   * @param objectB - 对象 B
   * @returns 碰撞 ID 字符串
   * @protected
   */
  protected getCollisionId(objectA: any, objectB: any): string {
    const idA = this.getObjectId(objectA)
    const idB = this.getObjectId(objectB)
    // 确保 ID 顺序一致，避免重复
    return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`
  }
  
  /**
   * ⭐ 获取对象 ID
   * 
   * @param object - 对象
   * @returns 对象 ID
   * @protected
   */
  protected getObjectId(object: any): string {
    return object.constructor?.name || String(object)
  }
  
  /**
   * ⭐ 发送碰撞开始事件
   * 
   * @param objectA - 对象 A
   * @param objectB - 对象 B
   * @param collision - 碰撞结果
   * @protected
   */
  protected emitCollisionStart(objectA: any, objectB: any, collision: CollisionResult): void {
    this.emit({
      type: GameEventType.COLLISION_DETECTED,
      payload: {
        eventType: 'start',
        objectA: this.getObjectId(objectA),
        objectB: this.getObjectId(objectB),
        ...collision
      },
      timestamp: Date.now()
    })
    
    if (this.debugMode) {
      console.log(`💥 [CollisionDetection] 碰撞开始：${this.getObjectId(objectA)} ↔ ${this.getObjectId(objectB)}`)
    }
  }
  
  /**
   * ⭐ 发送碰撞持续事件
   * 
   * @param objectA - 对象 A
   * @param objectB - 对象 B
   * @param collision - 碰撞结果
   * @protected
   */
  protected emitCollisionStay(objectA: any, objectB: any, collision: CollisionResult): void {
    this.emit({
      type: GameEventType.COLLISION_DETECTED,
      payload: {
        eventType: 'stay',
        objectA: this.getObjectId(objectA),
        objectB: this.getObjectId(objectB),
        ...collision
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * ⭐ 发送碰撞结束事件
   * 
   * @param objectA - 对象 A
   * @param objectB - 对象 B
   * @protected
   */
  protected emitCollisionEnd(objectA: any, objectB: any): void {
    this.emit({
      type: GameEventType.COLLISION_DETECTED,
      payload: {
        eventType: 'end',
        objectA: this.getObjectId(objectA),
        objectB: this.getObjectId(objectB)
      },
      timestamp: Date.now()
    })
    
    if (this.debugMode) {
      console.log(`✅ [CollisionDetection] 碰撞结束：${this.getObjectId(objectA)} ↔ ${this.getObjectId(objectB)}`)
    }
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来管理碰撞体
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时清除所有碰撞对
        this.clearCollisionPairs()
        break
        
      case GameEventType.ITEM_COLLECTED:
        // 物品被收集时移除其碰撞体
        if (event.payload?.itemId) {
          this.unregisterCollider(event.payload.itemId)
        }
        break
    }
  }
}
