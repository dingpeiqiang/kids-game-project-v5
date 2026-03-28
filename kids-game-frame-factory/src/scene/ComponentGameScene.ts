// ============================================================================
// 🎮 游戏场景基类组件
// ============================================================================
// 
// 📌 说明:
//   提供通用的游戏场景基类
//   整合所有框架组件，提供完整的游戏循环
//   支持组件化架构的可拔插设计
// ============================================================================

import Phaser from 'phaser'
import { GameEventType } from '../core/GameEvent'
import { EventBus } from '../core/EventBus'
import type { IComponent } from '../core/IComponent'
import type { BackgroundRenderer } from '../render/BackgroundRenderer'
import type { GridRenderer } from '../render/GridRenderer'
import type { GameObjectRenderer } from '../render/GameObjectRenderer'
import type { ParticleRenderer } from '../render/ParticleRenderer'
import type { GameStateComponent } from '../logic/GameStateComponent'
import type { ScoreManagerComponent } from '../logic/ScoreManagerComponent'
import type { InputHandlerComponent } from '../control/InputHandlerComponent'
import type { PauseManagerComponent } from '../logic/PauseManagerComponent'
import type { GameConfigManager } from '../logic/GameConfigManager'

/**
 * ⭐ 游戏场景配置接口
 */
export interface ComponentGameSceneConfig {
  /** 场景键名（可选） */
  key?: string
  /** 是否主动渲染背景（可选，默认 true） */
  autoRenderBackground?: boolean
  /** 是否主动更新所有组件（可选，默认 true） */
  autoUpdateComponents?: boolean
  /** 是否启用调试模式（可选，默认 false） */
  debugMode?: boolean
  /** 自定义配置（可选） */
  [key: string]: any
}

/**
 * ⭐ 组件集合接口
 */
export interface SceneComponents {
  /** 背景渲染器 */
  background?: BackgroundRenderer
  /** 网格渲染器 */
  grid?: GridRenderer
  /** 游戏对象渲染器 */
  gameObject?: GameObjectRenderer
  /** 粒子渲染器 */
  particle?: ParticleRenderer
  /** 游戏状态管理器 */
  gameState?: GameStateComponent
  /** 分数管理器 */
  score?: ScoreManagerComponent
  /** 输入处理器 */
  input?: InputHandlerComponent
  /** 暂停管理器 */
  pause?: PauseManagerComponent
  /** 配置管理器 */
  config?: GameConfigManager
  /** 其他自定义组件 */
  [key: string]: IComponent | undefined
}

/**
 * ⭐ 游戏场景基类
 * 
 * @remarks
 * 职责：
 * - 整合所有框架组件
 * - 提供完整的游戏循环
 * - 管理组件生命周期
 * - 处理场景事件
 * 
 * @example
 * ```typescript
 * class MyGameScene extends ComponentGameScene {
 *   create() {
 *     super.create()
 *     
 *     // 添加自定义组件
 *     this.components.background = new BackgroundRenderer(this)
 *     this.components.background.init({
 *       background: {
 *         type: BackgroundType.GRADIENT,
 *         gradientStart: 0x1a237e,
 *         gradientEnd: 0x0d47a1
 *       }
 *     })
 *     
 *     // 启动游戏
 *     this.startGame()
 *   }
 *   
 *   update(time: number, delta: number) {
 *     super.update(time, delta)
 *     // 添加自定义更新逻辑
 *   }
 * }
 * ```
 */
export abstract class ComponentGameScene extends Phaser.Scene {
  /** 组件容器 */
  protected components: SceneComponents = {}
  
  /** 场景配置 */
  protected sceneConfig: ComponentGameSceneConfig
  
  /** 是否已初始化 */
  protected isInitialized: boolean = false
  
  /** 事件总线实例 */
  protected eventBus: EventBus
  
  /**
   * 构造函数
   * 
   * @param config - 场景配置
   */
  constructor(config: ComponentGameSceneConfig = {}) {
    super({
      key: config.key ?? 'ComponentGameScene',
      active: false
    })
    
    this.sceneConfig = {
      autoRenderBackground: true,
      autoUpdateComponents: true,
      debugMode: false,
      ...config
    }
    
    this.eventBus = EventBus.getInstance()
  }
  
  /**
   * ⭐ 场景预加载（Phaser 生命周期方法）
   */
  preload(): void {
    if (this.sceneConfig.debugMode) {
      console.log(`🎮 [ComponentGameScene] 预加载资源`)
    }
    
    // 可以在这里加载游戏特定资源
    this.loadCustomResources()
  }
  
  /**
   * ⭐ 场景创建（Phaser 生命周期方法）
   */
  create(): void {
    if (this.sceneConfig.debugMode) {
      console.log(`🎮 [ComponentGameScene] 创建场景`)
    }
    
    // 初始化事件监听
    this.setupEventListeners()
    
    // 初始化完成标记
    this.isInitialized = true
    
    // 发送场景创建事件
    this.eventBus.emit({
      type: GameEventType.UI_REFRESH,
      payload: {
        eventType: 'scene_created',
        sceneKey: this.scene.key
      },
      timestamp: Date.now()
    })
  }
  
  /**
   * ⭐ 场景更新（Phaser 生命周期方法）
   * 
   * @param time - 当前时间（毫秒）
   * @param delta - 距离上一帧的时间间隔（毫秒）
   */
  update(_time: number, delta: number): void {
    if (!this.isInitialized) return
    
    // 自动更新所有组件
    if (this.sceneConfig.autoUpdateComponents) {
      this.updateAllComponents(delta)
    }
    
    // 可以在子类中重写
  }
  
  /**
   * ⭐ 场景销毁（Phaser 生命周期方法）
   */
  destroy(fromScene?: boolean): void {
    if (this.sceneConfig.debugMode) {
      console.log(`🎮 [ComponentGameScene] 销毁场景`)
    }
    
    // 销毁所有组件
    this.destroyAllComponents()
    
    // 发送场景销毁事件
    this.eventBus.emit({
      type: GameEventType.UI_REFRESH,
      payload: {
        eventType: 'scene_destroyed',
        sceneKey: this.scene.key
      },
      timestamp: Date.now()
    })
    
    // @ts-ignore - Phaser.Scene 的 destroy 方法签名可能不同
    super.destroy(fromScene)
  }
  
  /**
   * ⭐ 启动游戏
   */
  public startGame(): void {
    const gameState = this.components.gameState as GameStateComponent
    
    if (gameState) {
      gameState.startGame()
      
      console.log(`▶️ [ComponentGameScene] 游戏已启动`)
    } else {
      console.warn('⚠️ [ComponentGameScene] 未找到 GameStateComponent')
    }
  }
  
  /**
   * ⭐ 暂停游戏
   */
  public pauseGame(): void {
    const pauseManager = this.components.pause as PauseManagerComponent
    
    if (pauseManager) {
      pauseManager.pause('user_requested')
    } else {
      console.warn('⚠️ [ComponentGameScene] 未找到 PauseManagerComponent')
    }
  }
  
  /**
   * ⭐ 恢复游戏
   */
  public resumeGame(): void {
    const pauseManager = this.components.pause as PauseManagerComponent
    
    if (pauseManager) {
      pauseManager.resume()
    } else {
      console.warn('⚠️ [ComponentGameScene] 未找到 PauseManagerComponent')
    }
  }
  
  /**
   * ⭐ 结束游戏
   * 
   * @param reason - 结束原因
   */
  public endGame(reason: string = 'completed'): void {
    const gameState = this.components.gameState as GameStateComponent
    
    if (gameState && 'gameOver' in gameState) {
      // @ts-ignore - 调用 gameOver 方法
      gameState.gameOver(reason)
      
      console.log(`🏁 [ComponentGameScene] 游戏已结束：${reason}`)
    }
  }
  
  /**
   * ⭐ 获取组件
   * 
   * @param key - 组件键名
   * @returns 组件实例或 undefined
   */
  public getComponent<T extends IComponent>(key: string): T | undefined {
    return this.components[key] as T | undefined
  }
  
  /**
   * ⭐ 添加组件
   * 
   * @param key - 组件键名
   * @param component - 组件实例
   */
  public addComponent(key: string, component: IComponent): void {
    this.components[key] = component
    
    // 初始化组件
    if ('init' in component && typeof component.init === 'function') {
      // @ts-ignore - 调用 init 方法
      component.init({})
    }
    
    if (this.sceneConfig.debugMode) {
      console.log(`✅ [ComponentGameScene] 添加组件：${key}`)
    }
  }
  
  /**
   * ⭐ 移除组件
   * 
   * @param key - 组件键名
   */
  public removeComponent(key: string): void {
    const component = this.components[key]
    
    if (component) {
      // 销毁组件
      if ('destroy' in component && typeof component.destroy === 'function') {
        component.destroy()
      }
      
      delete this.components[key]
      
      if (this.sceneConfig.debugMode) {
        console.log(`🗑️ [ComponentGameScene] 移除组件：${key}`)
      }
    }
  }
  
  /**
   * ⭐ 获取所有活跃组件
   * 
   * @returns 组件数组
   */
  public getActiveComponents(): IComponent[] {
    return Object.values(this.components).filter(
      (comp): comp is IComponent => comp !== undefined
    )
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    componentNameCount: number
    activeComponentCount: number
    isInitialized: boolean
    sceneKey: string
  } {
    return {
      componentNameCount: Object.keys(this.components).length,
      activeComponentCount: this.getActiveComponents().length,
      isInitialized: this.isInitialized,
      sceneKey: this.scene.key
    }
  }
  
  /**
   * ⭐ 加载自定义资源（由子类实现）
   * 
   * @protected
   */
  protected loadCustomResources(): void {
    // 由子类实现具体的资源加载逻辑
  }
  
  /**
   * ⭐ 设置事件监听（由子类实现）
   * 
   * @protected
   */
  protected setupEventListeners(): void {
    // 由子类实现具体的事件监听逻辑
    
    // 默认监听暂停/恢复事件
    this.eventBus.on(GameEventType.PAUSE, () => {
      if (this.sceneConfig.debugMode) {
        console.log('⏸️ [ComponentGameScene] 游戏暂停')
      }
    })
    
    this.eventBus.on(GameEventType.RESUME, () => {
      if (this.sceneConfig.debugMode) {
        console.log('▶️ [ComponentGameScene] 游戏恢复')
      }
    })
  }
  
  /**
   * ⭐ 更新所有组件
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   * @protected
   */
  protected updateAllComponents(deltaTime: number): void {
    Object.values(this.components).forEach(component => {
      if (component && 'update' in component && typeof component.update === 'function') {
        component.update(deltaTime)
      }
    })
  }
  
  /**
   * ⭐ 销毁所有组件
   * 
   * @protected
   */
  protected destroyAllComponents(): void {
    Object.values(this.components).forEach(component => {
      if (component && 'destroy' in component && typeof component.destroy === 'function') {
        component.destroy()
      }
    })
    
    this.components = {}
  }
}
