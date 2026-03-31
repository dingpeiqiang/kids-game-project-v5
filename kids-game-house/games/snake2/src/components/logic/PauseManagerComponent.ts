// ============================================================================
// ⏸️ 游戏暂停管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的暂停/恢复功能
//   支持快捷键暂停、自动暂停等特性
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 游戏暂停管理组件参数
 */
interface PauseManagerParams {
  /** 是否启用 ESC 键暂停（默认 true） */
  enableEscKey?: boolean
  /** 是否启用空格键暂停（默认 true） */
  enableSpaceKey?: boolean
  /** 失去焦点自动暂停（默认 true） */
  autoPauseOnBlur?: boolean
}

/**
 * 游戏暂停管理组件类
 * 
 * @remarks
 * 职责：
 * - 管理游戏暂停状态
 * - 处理暂停快捷键
 * - 自动暂停（失去焦点时）
 * - 暂停 UI 显示
 * 
 * @example
 * ```typescript
 * const pauseManager = new PauseManagerComponent(scene)
 * container.add(pauseManager)
 * 
 * pauseManager.init({
 *   enableEscKey: true,
 *   enableSpaceKey: true,
 *   autoPauseOnBlur: true
 * })
 * 
 * // 手动暂停
 * pauseManager.pauseGame()
 * 
 * // 恢复游戏
 * pauseManager.resumeGame()
 * 
 * // 切换暂停状态
 * pauseManager.togglePause()
 * ```
 */
export class PauseManagerComponent extends ComponentBase {
  /** 当前参数 */
  private params: PauseManagerParams | null = null
  
  /** 是否已暂停 */
  private isPaused: boolean = false
  
  /** 暂停前游戏是否正在运行 */
  private wasPlaying: boolean = false
  
  /** 暂停时间戳 */
  private pauseTimestamp: number = 0
  
  /** 累计暂停时间（毫秒） */
  private totalPauseTime: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'pause_manager', '暂停管理器')
  }
  
  /**
   * 初始化暂停管理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as PauseManagerParams
    
    // 设置默认值
    if (this.params.enableEscKey === undefined) {
      this.params.enableEscKey = true
    }
    if (this.params.enableSpaceKey === undefined) {
      this.params.enableSpaceKey = true
    }
    if (this.params.autoPauseOnBlur === undefined) {
      this.params.autoPauseOnBlur = true
    }
    
    // 注册快捷键监听
    this.setupHotkeys()
    
    // 注册失焦监听
    if (this.params.autoPauseOnBlur) {
      this.setupBlurListener()
    }
    
    console.log(`✅ [PauseManager] 暂停管理组件初始化完成`)
  }
  
  /**
   * 销毁暂停管理组件
   */
  public destroy(): void {
    super.destroy()
    
    // 移除键盘监听
    if (this.scene?.input?.keyboard) {
      this.scene.input.keyboard.removeAllListeners()
    }
    
    console.log(`🗑️ [PauseManager] 暂停管理组件已销毁`)
  }
  
  /**
   * 暂停游戏
   * 
   * @returns 是否成功暂停
   * 
   * @public
   */
  public pauseGame(): boolean {
    if (this.isPaused) {
      return false // 已经在暂停状态
    }
    
    const gameStateComp = this.getGameStateComponent()
    if (!gameStateComp || !gameStateComp.isPlaying()) {
      return false // 游戏不在运行状态
    }
    
    this.isPaused = true
    this.wasPlaying = true
    this.pauseTimestamp = Date.now()
    
    // 发射暂停事件
    this.emit({
      type: GameEventType.PAUSE,
      payload: {
        reason: 'user_request',
        timestamp: this.pauseTimestamp
      },
      timestamp: this.pauseTimestamp
    })
    
    console.log(`⏸️ [PauseManager] 游戏已暂停`)
    return true
  }
  
  /**
   * 恢复游戏
   * 
   * @returns 是否成功恢复
   * 
   * @public
   */
  public resumeGame(): boolean {
    if (!this.isPaused) {
      return false // 不在暂停状态
    }
    
    const pauseDuration = Date.now() - this.pauseTimestamp
    this.totalPauseTime += pauseDuration
    
    this.isPaused = false
    
    // 发射恢复事件
    this.emit({
      type: GameEventType.RESUME,
      payload: {
        pauseDuration,
        totalPauseTime: this.totalPauseTime
      },
      timestamp: Date.now()
    })
    
    console.log(`▶️ [PauseManager] 游戏已恢复（暂停时长：${pauseDuration}ms）`)
    return true
  }
  
  /**
   * 切换暂停状态
   * 
   * @returns 切换后的状态（true=暂停，false=运行）
   * 
   * @public
   */
  public togglePause(): boolean {
    if (this.isPaused) {
      this.resumeGame()
      return false
    } else {
      this.pauseGame()
      return true
    }
  }
  
  /**
   * 获取当前暂停状态
   * 
   * @returns 是否暂停
   * 
   * @public
   */
  public getIsPaused(): boolean {
    return this.isPaused
  }
  
  /**
   * 获取暂停统计信息
   * 
   * @returns 统计信息对象
   * 
   * @public
   */
  public getStats(): {
    isPaused: boolean
    totalPauseTime: number
    lastPauseTimestamp: number
  } {
    return {
      isPaused: this.isPaused,
      totalPauseTime: this.totalPauseTime,
      lastPauseTimestamp: this.pauseTimestamp
    }
  }
  
  /**
   * 强制设置暂停状态
   * 
   * @param paused - 是否暂停
   * 
   * @public
   */
  public setPaused(paused: boolean): void {
    if (paused && !this.isPaused) {
      this.pauseGame()
    } else if (!paused && this.isPaused) {
      this.resumeGame()
    }
  }
  
  /**
   * 设置快捷键监听
   * 
   * @private
   */
  private setupHotkeys(): void {
    if (!this.scene?.input?.keyboard) return
    
    // ESC 键暂停
    if (this.params?.enableEscKey) {
      this.scene.input.keyboard.on('keydown-ESC', () => {
        this.togglePause()
      })
    }
    
    // 空格键暂停
    if (this.params?.enableSpaceKey) {
      this.scene.input.keyboard.on('keydown-SPACE', () => {
        this.togglePause()
      })
    }
    
    console.log(`🎹 [PauseManager] 快捷键已设置`)
  }
  
  /**
   * 设置失焦监听
   * 
   * @private
   */
  private setupBlurListener(): void {
    // 浏览器窗口失焦时自动暂停
    window.addEventListener('blur', () => {
      if (!this.isPaused && this.enabled) {
        console.log(`👁️ [PauseManager] 窗口失焦，自动暂停`)
        this.pauseGame()
      }
    })
    
    // 浏览器窗口聚焦时自动恢复
    window.addEventListener('focus', () => {
      if (this.isPaused && this.enabled) {
        console.log(`👁️ [PauseManager] 窗口聚焦，自动恢复`)
        this.resumeGame()
      }
    })
    
    console.log(`👀 [PauseManager] 失焦监听已设置`)
  }
  
  /**
   * 获取游戏状态组件
   * 
   * @returns 游戏状态组件
   * 
   * @private
   */
  private getGameStateComponent(): any {
    // 通过事件总线查找 GameStateComponent
    // 这里简化处理，实际应该通过容器获取
    return null
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.GAME_START:
        // 游戏开始，重置暂停状态
        this.isPaused = false
        this.totalPauseTime = 0
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束，取消暂停
        if (this.isPaused) {
          this.isPaused = false
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
