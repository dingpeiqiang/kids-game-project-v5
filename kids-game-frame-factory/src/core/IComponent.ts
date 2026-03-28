// ============================================================================
// 🎮 组件接口定义
// ============================================================================
// 
// 📌 说明:
//   所有游戏组件必须实现的基础接口
//   定义了组件的生命周期方法和通信机制
// ============================================================================

/**
 * 组件接口
 * 
 * @remarks
 * 这是所有游戏组件的基接口，定义了：
 * - 组件标识（id, name）
 * - 生命周期方法（init, update, destroy）
 * - 事件处理机制（on, emit）
 * 
 * @example
 * ```typescript
 * class MyComponent extends ComponentBase implements IComponent {
 *   constructor(scene: Phaser.Scene) {
 *     super(scene, 'my_component', '我的组件')
 *   }
 *   
 *   init(params?: any): void {
 *     // 初始化逻辑
 *   }
 *   
 *   update(deltaTime: number): void {
 *     // 每帧更新逻辑
 *   }
 *   
 *   protected handleEvent(event: GameEvent): void {
 *     // 事件处理逻辑
 *   }
 * }
 * ```
 */
export interface IComponent {
  /**
   * 组件唯一标识符
   * 
   * @remarks
   * 用于在组件容器中查找和管理组件
   * 建议使用蛇形命名法（snake_case），如：'snake_renderer'
   */
  readonly id: string
  
  /**
   * 组件显示名称
   * 
   * @remarks
   * 用于日志输出和调试信息
   * 建议使用中文描述，如：'蛇渲染器'
   */
  readonly name: string
  
  /**
   * 组件启用状态
   * 
   * @remarks
   * - true: 组件正常工作，响应事件和更新
   * - false: 组件暂停工作，不响应任何调用
   * 
   * 可通过此属性实现组件的热插拔功能
   */
  enabled: boolean
  
  /**
   * 初始化方法
   * 
   * @remarks
   * - 在组件创建后首次调用
   * - 用于设置初始状态、加载资源等
   * - 参数类型由具体组件定义
   * 
   * @param params - 初始化参数（可选）
   */
  init?(params: any): void
  
  /**
   * 更新方法
   * 
   * @remarks
   * - 每帧自动调用（当组件启用时）
   * - 用于处理时间相关的逻辑（如移动、动画等）
   * - 参数为距离上一帧的时间间隔（毫秒）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  update?(deltaTime: number): void
  
  /**
   * 销毁方法
   * 
   * @remarks
   * - 在组件移除前调用
   * - 用于清理资源、取消事件订阅等
   * - 必须实现以防止内存泄漏
   */
  destroy?(): void
  
  /**
   * 事件处理方法
   * 
   * @remarks
   * - 当有组件事件发布时调用
   * - 组件可根据自身状态决定是否处理事件
   * - 如果 enabled 为 false，不应处理事件
   * 
   * @param event - 游戏事件对象
   */
  on?(event: any): void
  
  /**
   * 事件发布方法
   * 
   * @remarks
   * - 用于向其他组件发布事件
   * - 通过事件总线实现组件间解耦通信
   * 
   * @param event - 游戏事件对象
   */
  emit?(event: any): void
}
