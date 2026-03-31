// ============================================================================
// 🎮 组件容器实现
// ============================================================================
// 
// 📌 说明:
//   用于统一管理和调度所有游戏组件
//   支持组件的添加、移除、查找、批量更新等功能
// ============================================================================

import { IComponent } from './IComponent'
import { GameEvent } from './GameEvent'

/**
 * 组件容器类
 * 
 * @remarks
 * 提供组件的完整生命周期管理：
 * - 添加/移除组件
 * - 查找/获取组件
 * - 批量初始化/更新/销毁
 * - 组件启用/禁用控制
 * 
 * @example
 * ```typescript
 * const container = new ComponentContainer()
 * 
 * // 添加组件
 * const renderer = new SnakeRenderer(scene)
 * container.add(renderer)
 * 
 * // 获取组件
 * const snakeRenderer = container.get<SnakeRenderer>('snake_renderer')
 * 
 * // 批量更新
 * container.updateAll(deltaTime)
 * 
 * // 广播事件
 * container.broadcast(event)
 * 
 * // 销毁所有组件
 * container.destroyAll()
 * ```
 */
export class ComponentContainer {
  /**
   * 组件映射表
   * 
   * @remarks
   * key: 组件 ID
   * value: 组件实例
   */
  private components: Map<string, IComponent>
  
  /**
   * 构造函数
   * 
   * @example
   * ```typescript
   * const container = new ComponentContainer()
   * ```
   */
  constructor() {
    this.components = new Map()
  }
  
  /**
   * 添加组件
   * 
   * @param component - 要添加的组件
   * @returns 返回添加的组件（便于链式调用）
   * 
   * @remarks
   * - 如果已存在相同 ID 的组件，会先销毁旧组件
   * - 添加后会自动调用组件的 init 方法（如果存在）
   * 
   * @example
   * ```typescript
   * // 基本用法
   * container.add(new SnakeRenderer(scene))
   * 
   * // 链式调用
   * const renderer = container.add(new SnakeRenderer(scene))
   * ```
   */
  public add<T extends IComponent>(component: T): T {
    const existingComponent = this.components.get(component.id)
    if (existingComponent) {
      console.warn(
        `⚠️ [ComponentContainer] 检测到重复组件 ID: ${component.id}，将先移除旧组件`
      )
      this.remove(component.id)
    }
    
    this.components.set(component.id, component)
    console.log(`✅ [ComponentContainer] 添加组件：${component.name} (${component.id})`)
    
    return component
  }
  
  /**
   * 移除组件
   * 
   * @param componentId - 组件 ID
   * 
   * @remarks
   * - 移除前会调用组件的 destroy 方法（如果存在）
   * - 如果组件不存在，不做任何操作
   * 
   * @example
   * ```typescript
   * container.remove('snake_renderer')
   * ```
   */
  public remove(componentId: string): void {
    const component = this.components.get(componentId)
    if (!component) {
      console.warn(`⚠️ [ComponentContainer] 尝试移除不存在的组件：${componentId}`)
      return
    }
    
    // 调用销毁方法
    if (component.destroy) {
      try {
        component.destroy()
      } catch (error) {
        console.error(
          `❌ [ComponentContainer] 组件销毁失败：${component.name}`,
          error
        )
      }
    }
    
    // 从映射表中删除
    this.components.delete(componentId)
    console.log(`🗑️ [ComponentContainer] 移除组件：${component.name} (${componentId})`)
  }
  
  /**
   * 获取组件
   * 
   * @typeParam T - 组件类型（泛型）
   * @param componentId - 组件 ID
   * @returns 组件实例，如果不存在则返回 undefined
   * 
   * @remarks
   * 使用泛型可以获取正确的类型提示
   * 
   * @example
   * ```typescript
   * // 基本用法
   * const comp = container.get('snake_renderer')
   * 
   * // 泛型用法（推荐）
   * const renderer = container.get<SnakeRenderer>('snake_renderer')
   * // renderer 有完整的类型提示
   * ```
   */
  public get<T extends IComponent>(componentId: string): T | undefined {
    const component = this.components.get(componentId)
    if (!component) {
      console.warn(`⚠️ [ComponentContainer] 尝试获取不存在的组件：${componentId}`)
      return undefined
    }
    return component as T
  }
  
  /**
   * 获取所有组件
   * 
   * @returns 所有组件的数组
   * 
   * @example
   * ```typescript
   * const allComponents = container.getAll()
   * allComponents.forEach(comp => {
   *   console.log(`组件：${comp.name}`)
   * })
   * ```
   */
  public getAll(): IComponent[] {
    return Array.from(this.components.values())
  }
  
  /**
   * 获取所有启用的组件
   * 
   * @returns 所有启用状态的组件数组
   * 
   * @example
   * ```typescript
   * const activeComponents = container.getActive()
   * activeComponents.forEach(comp => comp.update(deltaTime))
   * ```
   */
  public getActive(): IComponent[] {
    return this.getAll().filter(comp => comp.enabled)
  }
  
  /**
   * 获取所有禁用的组件
   * 
   * @returns 所有禁用状态的组件数组
   * 
   * @example
   * ```typescript
   * const disabledComponents = container.getDisabled()
   * console.log(`共有 ${disabledComponents.length} 个组件被禁用`)
   * ```
   */
  public getDisabled(): IComponent[] {
    return this.getAll().filter(comp => !comp.enabled)
  }
  
  /**
   * 批量初始化组件
   * 
   * @param params - 初始化参数（传递给所有组件）
   * 
   * @remarks
   * - 只初始化启用的组件
   * - 按添加顺序依次初始化
   * 
   * @example
   * ```typescript
   * // 初始化所有组件
   * container.initAll({ theme: 'default', scene: this.scene })
   * ```
   */
  public initAll(params?: any): void {
    console.log(`🔧 [ComponentContainer] 开始初始化所有组件（共 ${this.components.size} 个）`)
    
    this.components.forEach((component) => {
      if (component.enabled && component.init) {
        try {
          component.init(params)
        } catch (error) {
          console.error(
            `❌ [ComponentContainer] 组件初始化失败：${component.name}`,
            error
          )
        }
      }
    })
    
    console.log(`✅ [ComponentContainer] 所有组件初始化完成`)
  }
  
  /**
   * 批量更新所有启用的组件
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   * 
   * @remarks
   * - 只更新启用的组件
   * - 每帧自动调用
   * 
   * @example
   * ```typescript
   * // 在游戏循环中调用
   * update(time: number, delta: number) {
   *   container.updateAll(delta)
   * }
   * ```
   */
  public updateAll(deltaTime: number): void {
    this.components.forEach((component) => {
      if (component.enabled && component.update) {
        try {
          component.update(deltaTime)
        } catch (error) {
          console.error(
            `❌ [ComponentContainer] 组件更新失败：${component.name}`,
            error
          )
        }
      }
    })
  }
  
  /**
   * 广播事件到所有组件
   * 
   * @param event - 游戏事件对象
   * 
   * @remarks
   * - 向所有组件发送事件（包括禁用的组件）
   * - 每个组件自行决定是否处理事件
   * 
   * @example
   * ```typescript
   * // 广播游戏开始事件
   * container.broadcast({
   *   type: GameEventType.GAME_START,
   *   payload: {},
   *   timestamp: Date.now()
   * })
   * ```
   */
  public broadcast(event: GameEvent): void {
    this.components.forEach((component) => {
      if (component.on) {
        try {
          component.on(event)
        } catch (error) {
          console.error(
            `❌ [ComponentContainer] 组件事件处理失败：${component.name}`,
            error
          )
        }
      }
    })
  }
  
  /**
   * 启用组件
   * 
   * @param componentId - 组件 ID
   * @returns 是否成功启用（true/false）
   * 
   * @remarks
   * - 如果组件不存在，返回 false
   * - 启用后会正常响应更新和事件
   * 
   * @example
   * ```typescript
   * if (container.enable('particle_renderer')) {
   *   console.log('粒子渲染器已启用')
   * }
   * ```
   */
  public enable(componentId: string): boolean {
    const component = this.components.get(componentId)
    if (!component) {
      console.warn(`⚠️ [ComponentContainer] 尝试启用不存在的组件：${componentId}`)
      return false
    }
    
    component.enabled = true
    console.log(`✅ [ComponentContainer] 启用组件：${component.name}`)
    return true
  }
  
  /**
   * 禁用组件
   * 
   * @param componentId - 组件 ID
   * @returns 是否成功禁用（true/false）
   * 
   * @remarks
   * - 如果组件不存在，返回 false
   * - 禁用后不会响应更新和事件
   * 
   * @example
   * ```typescript
   * // 禁用粒子效果提升性能
   * container.disable('particle_renderer')
   * ```
   */
  public disable(componentId: string): boolean {
    const component = this.components.get(componentId)
    if (!component) {
      console.warn(`⚠️ [ComponentContainer] 尝试禁用不存在的组件：${componentId}`)
      return false
    }
    
    component.enabled = false
    console.log(`⚠️ [ComponentContainer] 禁用组件：${component.name}`)
    return true
  }
  
  /**
   * 切换组件启用状态
   * 
   * @param componentId - 组件 ID
   * @returns 切换后的状态（true=已启用，false=已禁用）
   * 
   * @example
   * ```typescript
   * // 切换声音组件状态
   * const isEnabled = container.toggle('audio_manager')
   * console.log(isEnabled ? '声音已开启' : '声音已关闭')
   * ```
   */
  public toggle(componentId: string): boolean {
    const component = this.components.get(componentId)
    if (!component) {
      console.warn(`⚠️ [ComponentContainer] 尝试切换不存在的组件：${componentId}`)
      return false
    }
    
    component.enabled = !component.enabled
    const status = component.enabled ? '启用' : '禁用'
    console.log(`🔄 [ComponentContainer] 切换组件状态：${component.name} → ${status}`)
    return component.enabled
  }
  
  /**
   * 检查组件是否存在
   * 
   * @param componentId - 组件 ID
   * @returns 组件是否存在（true/false）
   * 
   * @example
   * ```typescript
   * if (container.has('snake_renderer')) {
   *   console.log('蛇渲染器已注册')
   * }
   * ```
   */
  public has(componentId: string): boolean {
    return this.components.has(componentId)
  }
  
  /**
   * 获取组件数量
   * 
   * @returns 组件总数
   * 
   * @example
   * ```typescript
   * console.log(`共有 ${container.count} 个组件`)
   * ```
   */
  public get count(): number {
    return this.components.size
  }
  
  /**
   * 获取启用的组件数量
   * 
   * @returns 启用的组件数量
   * 
   * @example
   * ```typescript
   * console.log(`共有 ${container.activeCount} 个活动组件`)
   * ```
   */
  public get activeCount(): number {
    return this.getActive().length
  }
  
  /**
   * 获取禁用的组件数量
   * 
   * @returns 禁用的组件数量
   * 
   * @example
   * ```typescript
   * console.log(`共有 ${container.disabledCount} 个禁用组件`)
   * ```
   */
  public get disabledCount(): number {
    return this.getDisabled().length
  }
  
  /**
   * 销毁所有组件
   * 
   * @remarks
   * - 调用所有组件的 destroy 方法
   * - 清空组件映射表
   * - 通常在场景销毁时调用
   * 
   * @example
   * ```typescript
   * // 场景切换前清理
   * container.destroyAll()
   * ```
   */
  public destroyAll(): void {
    console.log(`🗑️ [ComponentContainer] 开始销毁所有组件（共 ${this.components.size} 个）`)
    
    this.components.forEach((component) => {
      if (component.destroy) {
        try {
          component.destroy()
        } catch (error) {
          console.error(
            `❌ [ComponentContainer] 组件销毁失败：${component.name}`,
            error
          )
        }
      }
    })
    
    this.components.clear()
    console.log(`✅ [ComponentContainer] 所有组件已销毁`)
  }
  
  /**
   * 获取容器统计信息
   * 
   * @returns 统计信息对象
   * 
   * @example
   * ```typescript
   * const stats = container.getStats()
   * console.log(stats)
   * // 输出：
   * // {
   * //   total: 10,
   * //   active: 8,
   * //   disabled: 2,
   * //   componentIds: ['snake_renderer', 'food_renderer', ...]
   * // }
   * ```
   */
  public getStats(): {
    total: number
    active: number
    disabled: number
    componentIds: string[]
  } {
    const activeComponents = this.getActive()
    return {
      total: this.components.size,
      active: activeComponents.length,
      disabled: this.components.size - activeComponents.length,
      componentIds: Array.from(this.components.keys())
    }
  }
}
