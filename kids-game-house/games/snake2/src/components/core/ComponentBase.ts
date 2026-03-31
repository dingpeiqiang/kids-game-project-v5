// ============================================================================
// 🎮 组件基类实现
// ============================================================================
// 
// 📌 说明:
//   所有游戏组件的抽象基类
//   实现了 IComponent 接口的通用逻辑
//   提供事件总线的便捷访问
// ============================================================================

import { IComponent } from './IComponent'
import { GameEvent, GameEventType } from './GameEvent'
import { EventBus } from './EventBus'

/**
 * 组件基类（抽象类）
 * 
 * @remarks
 * 提供所有组件的通用实现：
 * - 基础属性（id, name, enabled）
 * - 生命周期方法框架
 * - 事件处理机制
 * - 事件总线访问
 * 
 * @example
 * ```typescript
 * class SnakeRenderer extends ComponentBase {
 *   constructor(scene: Phaser.Scene) {
 *     super(scene, 'snake_renderer', '蛇渲染器')
 *   }
 *   
 *   init(params?: any): void {
 *     // 初始化渲染逻辑
 *   }
 *   
 *   update(deltaTime: number): void {
 *     // 每帧更新渲染
 *   }
 *   
 *   protected handleEvent(event: GameEvent): void {
 *     // 处理相关事件
 *     switch (event.type) {
 *       case GameEventType.SNAKE_MOVE:
 *         this.renderSnake(event.payload)
 *         break
 *     }
 *   }
 * }
 * ```
 */
export abstract class ComponentBase implements IComponent {
  /**
   * 组件唯一标识符
   * 
   * @remarks
   * 在构造函数中设置，不可修改
   */
  public readonly id: string
  
  /**
   * 组件显示名称
   * 
   * @remarks
   * 在构造函数中设置，不可修改
   */
  public readonly name: string
  
  /**
   * 组件启用状态
   * 
   * @remarks
   * 默认为 true，可动态切换
   */
  public enabled: boolean = true
  
  /**
   * 受保护的事件总线实例
   * 
   * @remarks
   * 子类可直接访问 eventBus 发布/订阅事件
   */
  protected eventBus: EventBus
  
  /**
   * Phaser 场景引用
   * 
   * @remarks
   * 用于访问 Phaser 引擎功能
   */
  protected scene: Phaser.Scene
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   * @param id - 组件唯一标识符
   * @param name - 组件显示名称
   * 
   * @example
   * ```typescript
   * constructor(scene: Phaser.Scene) {
   *   super(scene, 'my_component', '我的组件')
   * }
   * ```
   */
  constructor(scene: Phaser.Scene, id: string, name: string) {
    this.scene = scene
    this.id = id
    this.name = name
    this.eventBus = EventBus.getInstance()
    
    console.log(`🧩 [ComponentBase] 组件已创建：${this.name} (${this.id})`)
  }
  
  /**
   * 初始化方法
   * 
   * @remarks
   * 默认空实现，子类可选重写
   * 
   * @param params - 初始化参数（可选）
   */
  public init(params?: any): void {
    if (!this.enabled) {
      console.warn(`⚠️ [ComponentBase] 组件未启用，跳过初始化：${this.name}`)
      return
    }
    
    console.log(`🔧 [ComponentBase] 初始化组件：${this.name}`)
  }
  
  /**
   * 更新方法
   * 
   * @remarks
   * 默认空实现，子类可选重写
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(deltaTime: number): void {
    if (!this.enabled) {
      return
    }
    
    // 默认不做任何操作
    // 需要更新的组件应重写此方法
  }
  
  /**
   * 销毁方法
   * 
   * @remarks
   * 默认空实现，子类可选重写
   * 建议在子类中清理资源和取消事件订阅
   */
  public destroy(): void {
    console.log(`🗑️ [ComponentBase] 销毁组件：${this.name}`)
    // 子类应在重写的方法中清理资源
  }
  
  /**
   * 事件处理方法
   * 
   * @remarks
   * 外部调用此方法接收事件
   * 如果组件未启用，不处理事件
   * 
   * @param event - 游戏事件对象
   */
  public on(event: GameEvent): void {
    if (!this.enabled) {
      return
    }
    
    try {
      this.handleEvent(event)
    } catch (error) {
      console.error(
        `❌ [ComponentBase] 组件事件处理失败：${this.name}`,
        error
      )
    }
  }
  
  /**
   * 发布事件方法
   * 
   * @remarks
   * 向事件总线发布事件
   * 其他订阅了该事件的组件会收到通知
   * 
   * @param event - 游戏事件对象
   * 
   * @example
   * ```typescript
   * this.emit({
   *   type: GameEventType.SCORE_CHANGED,
   *   payload: { score: 100 },
   *   timestamp: Date.now()
   * })
   * ```
   */
  public emit(event: GameEvent): void {
    this.eventBus.emit(event)
  }
  
  /**
   * 处理事件的抽象方法
   * 
   * @remarks
   * 子类必须实现此方法来处理具体事件
   * 通常使用 switch-case 语句根据事件类型分发处理
   * 
   * @param event - 游戏事件对象
   * 
   * @example
   * ```typescript
   * protected handleEvent(event: GameEvent): void {
   *   switch (event.type) {
   *     case GameEventType.SNAKE_MOVE:
   *       this.onSnakeMove(event.payload)
   *       break
   *     case GameEventType.FOOD_SPAWN:
   *       this.onFoodSpawn(event.payload)
   *       break
   *     default:
   *       // 忽略未知事件
   *       break
   *   }
   * }
   * ```
   */
  protected abstract handleEvent(event: GameEvent): void
}
