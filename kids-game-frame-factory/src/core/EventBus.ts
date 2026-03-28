// ============================================================================
// 🎮 事件总线实现
// ============================================================================
// 
// 📌 说明:
//   单例模式的事件总线，用于组件间解耦通信
//   支持事件的发布/订阅、一次性监听、取消订阅等功能
// ============================================================================

import { GameEvent, EventListener, EventSubscription, GameEventType } from './GameEvent'

/**
 * 事件总线类（单例模式）
 * 
 * @remarks
 * 提供全局的事件管理机制：
 * - 发布/订阅模式
 * - 支持多个监听器
 * - 支持一次性监听
 * - 支持按事件类型取消订阅
 * 
 * @example
 * ```typescript
 * // 获取事件总线实例
 * const eventBus = EventBus.getInstance()
 * 
 * // 订阅事件
 * eventBus.on(GameEventType.SNAKE_MOVE, (event) => {
 *   console.log('蛇移动了:', event.payload)
 * })
 * 
 * // 发布事件
 * eventBus.emit({
 *   type: GameEventType.SNAKE_MOVE,
 *   payload: { snake: [...], direction: Direction.RIGHT },
 *   timestamp: Date.now()
 * })
 * ```
 */
export class EventBus {
  /** 单例实例 */
  private static instance: EventBus | null = null
  
  /** 事件映射表：事件类型 -> 订阅列表 */
  private events: Map<GameEventType, EventSubscription[]>
  
  /** 订阅计数器（生成唯一订阅 ID） */
  private subscriptionCounter: number = 0
  
  /**
   * 私有构造函数（防止外部实例化）
   * 
   * @remarks
   * 必须通过 getInstance() 静态方法获取实例
   */
  private constructor() {
    this.events = new Map()
  }
  
  /**
   * 获取事件总线单例实例
   * 
   * @returns EventBus 单例实例
   * 
   * @example
   * ```typescript
   * const eventBus = EventBus.getInstance()
   * ```
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }
  
  /**
   * 订阅事件
   * 
   * @param eventType - 事件类型
   * @param listener - 监听器函数
   * @param once - 是否只触发一次（可选，默认 false）
   * @returns 订阅 ID（用于取消订阅）
   * 
   * @example
   * ```typescript
   * // 普通订阅
   * const subId = eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
   *   updateScoreDisplay(event.payload.score)
   * })
   * 
   * // 一次性订阅
   * eventBus.on(GameEventType.GAME_OVER, handleGameOver, true)
   * ```
   */
  public on(
    eventType: GameEventType,
    listener: EventListener,
    once: boolean = false
  ): string {
    // 生成唯一订阅 ID
    const subscriptionId = `sub_${++this.subscriptionCounter}`
    
    // 创建订阅对象
    const subscription: EventSubscription = {
      subscriptionId,
      eventType,
      listener,
      once
    }
    
    // 获取或创建事件类型的订阅列表
    let subscriptions = this.events.get(eventType)
    if (!subscriptions) {
      subscriptions = []
      this.events.set(eventType, subscriptions)
    }
    
    // 添加订阅
    subscriptions.push(subscription)
    
    console.log(`📡 [EventBus] 订阅事件：${eventType} (ID: ${subscriptionId})`)
    
    return subscriptionId
  }
  
  /**
   * 一次性订阅事件
   * 
   * @param eventType - 事件类型
   * @param listener - 监听器函数
   * @returns 订阅 ID
   * 
   * @example
   * ```typescript
   * eventBus.once(GameEventType.GAME_OVER, () => {
   *   console.log('游戏结束了')
   * })
   * ```
   */
  public once(eventType: GameEventType, listener: EventListener): string {
    return this.on(eventType, listener, true)
  }
  
  /**
   * 取消订阅
   * 
   * @param subscriptionId - 订阅 ID
   * 
   * @example
   * ```typescript
   * const subId = eventBus.on(GameEventType.SNAKE_MOVE, handler)
   * // ... 稍后取消订阅
   * eventBus.off(subId)
   * ```
   */
  public off(subscriptionId: string): void {
    let removed = false
    
    // 遍历所有事件类型，查找并移除订阅
    for (const [eventType, subscriptions] of this.events.entries()) {
      const index = subscriptions.findIndex(sub => sub.subscriptionId === subscriptionId)
      if (index !== -1) {
        subscriptions.splice(index, 1)
        removed = true
        
        // 如果该事件类型没有订阅了，删除该事件类型
        if (subscriptions.length === 0) {
          this.events.delete(eventType)
        }
        
        break
      }
    }
    
    if (removed) {
      console.log(`📡 [EventBus] 取消订阅：${subscriptionId}`)
    } else {
      console.warn(`⚠️ [EventBus] 未找到订阅：${subscriptionId}`)
    }
  }
  
  /**
   * 取消指定事件类型的所有订阅
   * 
   * @param eventType - 事件类型
   * 
   * @example
   * ```typescript
   * // 取消所有分数事件的订阅
   * eventBus.offAll(GameEventType.SCORE_CHANGED)
   * ```
   */
  public offAll(eventType: GameEventType): void {
    const count = this.events.get(eventType)?.length ?? 0
    this.events.delete(eventType)
    console.log(`📡 [EventBus] 取消所有 ${eventType} 事件的订阅（共 ${count} 个）`)
  }
  
  /**
   * 发布事件
   * 
   * @param event - 事件对象
   * 
   * @remarks
   * 按订阅顺序调用所有监听器
   * 自动移除一次性监听器（once=true）
   * 
   * @example
   * ```typescript
   * eventBus.emit({
   *   type: GameEventType.FOOD_SPAWN,
   *   payload: { food: newFood },
   *   timestamp: Date.now()
   * })
   * ```
   */
  public emit(event: GameEvent): void {
    const subscriptions = this.events.get(event.type)
    if (!subscriptions || subscriptions.length === 0) {
      return // 没有订阅者，直接返回
    }
    
    console.log(`📡 [EventBus] 发布事件：${event.type}`, event.payload ? event.payload : '')
    
    // 复制订阅列表（防止在回调中修改导致问题）
    const subscriptionsCopy = [...subscriptions]
    
    // 调用所有监听器
    subscriptionsCopy.forEach(subscription => {
      try {
        subscription.listener(event)
        
        // 如果是一次性订阅，调用后移除
        if (subscription.once) {
          this.off(subscription.subscriptionId)
        }
      } catch (error) {
        console.error(`❌ [EventBus] 事件处理失败：${event.type}`, error)
      }
    })
  }
  
  /**
   * 清除所有事件订阅
   * 
   * @remarks
   * 在游戏结束或场景切换时调用，防止内存泄漏
   * 
   * @example
   * ```typescript
   * // 场景销毁前清除所有订阅
   * eventBus.clearAll()
   * ```
   */
  public clearAll(): void {
    const totalEvents = this.events.size
    const totalSubscriptions = Array.from(this.events.values()).reduce(
      (sum, subs) => sum + subs.length,
      0
    )
    
    this.events.clear()
    
    console.log(`🗑️ [EventBus] 清除所有订阅（事件类型：${totalEvents}, 订阅数：${totalSubscriptions}）`)
  }
  
  /**
   * 获取指定事件类型的订阅数量
   * 
   * @param eventType - 事件类型
   * @returns 订阅数量
   * 
   * @example
   * ```typescript
   * const count = eventBus.getSubscriberCount(GameEventType.SNAKE_MOVE)
   * console.log(`蛇移动事件有 ${count} 个订阅者`)
   * ```
   */
  public getSubscriberCount(eventType: GameEventType): number {
    return this.events.get(eventType)?.length ?? 0
  }
  
  /**
   * 获取所有事件类型的订阅统计信息
   * 
   * @returns 统计信息对象
   * 
   * @example
   * ```typescript
   * const stats = eventBus.getStats()
   * console.log(stats)
   * // 输出：
   * // {
   * //   totalEventTypes: 5,
   * //   totalSubscriptions: 12,
   * //   eventTypes: ['SNAKE_MOVE', 'FOOD_SPAWN', ...]
   * // }
   * ```
   */
  public getStats(): {
    totalEventTypes: number
    totalSubscriptions: number
    eventTypes: string[]
  } {
    const eventTypes = Array.from(this.events.keys()).map(String)
    const totalSubscriptions = Array.from(this.events.values()).reduce(
      (sum, subs) => sum + subs.length,
      0
    )
    
    return {
      totalEventTypes: this.events.size,
      totalSubscriptions,
      eventTypes
    }
  }
}
