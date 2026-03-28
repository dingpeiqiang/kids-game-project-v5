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
   */
  public getAll(): IComponent[] {
    return Array.from(this.components.values())
  }
  
  /**
   * 获取所有启用的组件
   * 
   * @returns 所有启用状态的组件数组
   */
  public getActive(): IComponent[] {
    return this.getAll().filter(comp => comp.enabled)
  }
  
  /**
   * 获取所有禁用的组件
   * 
   * @returns 所有禁用状态的组件数组
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
   * 批量启用/禁用组件
   * 
   * @param enabled - 启用状态（true=启用，false=禁用）
   * @param componentIds - 组件 ID 列表（可选，默认操作所有组件）
   * 
   * @example
   * ```typescript
   * // 禁用所有组件
   * container.setEnabled(false)
   * 
   * // 禁用特定组件
   * container.setEnabled(false, ['snake_renderer', 'food_renderer'])
   * ```
   */
  public setEnabled(enabled: boolean, componentIds?: string[]): void {
    const ids = componentIds || Array.from(this.components.keys())
    
    ids.forEach((id) => {
      const component = this.components.get(id)
      if (component) {
        component.enabled = enabled
        console.log(`⏻ [ComponentContainer] ${enabled ? '启用' : '禁用'}组件：${component.name}`)
      }
    })
  }
  
  /**
   * 检查是否包含指定组件
   * 
   * @param componentId - 组件 ID
   * @returns true 如果包含该组件
   */
  public has(componentId: string): boolean {
    return this.components.has(componentId)
  }
  
  /**
   * 获取组件数量
   * 
   * @returns 组件总数
   */
  public count(): number {
    return this.components.size
  }
  
  /**
   * 清除所有组件
   * 
   * @remarks
   * - 调用所有组件的 destroy 方法
   * - 清空组件映射表
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
   * 获取组件统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    total: number
    active: number
    disabled: number
  } {
    const all = this.getAll()
    return {
      total: all.length,
      active: all.filter(c => c.enabled).length,
      disabled: all.filter(c => !c.enabled).length
    }
  }
}
