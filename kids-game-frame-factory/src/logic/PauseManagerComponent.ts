// ============================================================================
// ⏸️ 暂停管理组件
// ============================================================================
// 
// 📌 说明:
//   负责管理游戏的暂停和恢复状态
//   支持暂停遮罩层、音效控制、输入锁定
//   提供平滑的暂停/恢复过渡效果
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import type Phaser from 'phaser'

/**
 * ⭐ 暂停状态枚举
 */
export enum PauseState {
  /** 游戏中（未暂停） */
  PLAYING = 'playing',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 暂停中（过渡状态） */
  PAUSING = 'pausing',
  /** 恢复中（过渡状态） */
  RESUMING = 'resuming'
}

/**
 * ⭐ 暂停管理组件参数
 */
interface PauseManagerParams {
  /** 是否显示暂停遮罩层（可选，默认 true） */
  showOverlay?: boolean
  /** 遮罩层颜色（可选，默认 0x000000） */
  overlayColor?: number
  /** 遮罩层透明度（可选，默认 0.5） */
  overlayAlpha?: number
  /** 暂停时是否停止所有音效（可选，默认 true） */
  stopAllSounds?: boolean
  /** 暂停时是否禁用输入（可选，默认 true） */
  disableInput?: boolean
  /** 暂停/恢复过渡动画时长（毫秒，可选，默认 300） */
  transitionDuration?: number
  /** 是否启用键盘快捷键（Esc 暂停，可选，默认 true） */
  enableKeyboardShortcut?: boolean
}

/**
 * ⭐ 暂停管理组件类
 * 
 * @remarks
 * 职责：
 * - 管理游戏暂停/恢复状态
 * - 显示/隐藏暂停遮罩层
 * - 控制音效播放状态
 * - 锁定/解锁输入
 * - 发送暂停相关事件
 * 
 * @example
 * ```typescript
 * const pauseManager = new PauseManagerComponent(scene)
 * pauseManager.init({
 *   showOverlay: true,
 *   overlayColor: '#000000',
 *   overlayAlpha: 0.5,
 *   enableKeyboardShortcut: true
 * })
 * 
 * // 暂停游戏
 * pauseManager.pause()
 * 
 * // 恢复游戏
 * pauseManager.resume()
 * 
 * // 切换暂停状态
 * pauseManager.toggle()
 * ```
 */
export class PauseManagerComponent extends ComponentBase {
  /** 当前暂停状态 */
  private currentState: PauseState = PauseState.PLAYING
  
  /** 当前参数 */
  private params: PauseManagerParams | null = null
  
  /** 暂停遮罩层 Sprite */
  private overlaySprite: Phaser.GameObjects.Sprite | null = null
  
  /** 暂停文本对象 */
  private pauseText: Phaser.GameObjects.Text | null = null
  
  /** 暂停开始时间戳 */
  private pausedAt: number = 0
  
  /** 累计暂停时长（毫秒） */
  private totalPausedTime: number = 0
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'pause_manager', '暂停管理器')
  }
  
  /**
   * ⭐ 初始化暂停管理组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as PauseManagerParams
    
    // 设置默认值
    if (this.params.showOverlay === undefined) {
      this.params.showOverlay = true
    }
    if (this.params.overlayColor === undefined) {
      this.params.overlayColor = 0x000000
    }
    if (this.params.overlayAlpha === undefined) {
      this.params.overlayAlpha = 0.5
    }
    if (this.params.stopAllSounds === undefined) {
      this.params.stopAllSounds = true
    }
    if (this.params.disableInput === undefined) {
      this.params.disableInput = true
    }
    if (this.params.transitionDuration === undefined) {
      this.params.transitionDuration = 300
    }
    if (this.params.enableKeyboardShortcut === undefined) {
      this.params.enableKeyboardShortcut = true
    }
    
    // 创建暂停 UI
    if (this.params.showOverlay) {
      this.createOverlay()
    }
    
    // 设置键盘快捷键
    if (this.params.enableKeyboardShortcut) {
      this.setupKeyboardShortcut()
    }
    
    console.log(`✅ [PauseManager] 暂停管理器初始化完成`)
    console.log(`   遮罩层：${this.params.showOverlay ? '✓' : '✗'}`)
    console.log(`   键盘快捷键：${this.params.enableKeyboardShortcut ? '✓' : '✗'}`)
  }
  
  /**
   * ⭐ 每帧更新（处理过渡状态）
   * 
   * @param _deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    // 可以在这里处理暂停/恢复的过渡动画
    if (this.currentState === PauseState.PAUSING || 
        this.currentState === PauseState.RESUMING) {
      // 过渡动画逻辑
    }
  }
  
  /**
   * ⭐ 暂停游戏
   * 
   * @param reason - 暂停原因（可选）
   * @returns 是否成功暂停
   */
  public pause(reason: string = 'user_requested'): boolean {
    if (this.currentState !== PauseState.PLAYING) {
      console.warn(`⚠️ [PauseManager] 游戏已在暂停状态：${this.currentState}`)
      return false
    }
    
    // 切换到暂停中状态
    this.currentState = PauseState.PAUSING
    
    // 记录暂停时间
    this.pausedAt = Date.now()
    
    // 显示遮罩层
    if (this.overlaySprite) {
      this.overlaySprite.setVisible(true)
      this.overlaySprite.setAlpha(0)
      
      // 淡入动画
      this.scene.tweens.add({
        targets: this.overlaySprite,
        alpha: this.params?.overlayAlpha ?? 0.5,
        duration: this.params?.transitionDuration ?? 300,
        ease: 'Power2',
        onComplete: () => {
          this.currentState = PauseState.PAUSED
        }
      })
    } else {
      this.currentState = PauseState.PAUSED
    }
    
    // 显示暂停文本
    if (this.pauseText) {
      this.pauseText.setVisible(true)
    }
    
    // 停止所有音效
    if (this.params?.stopAllSounds) {
      this.scene.sound.pauseAll()
    }
    
    // 禁用输入
    if (this.params?.disableInput) {
      this.scene.input.enabled = false
    }
    
    // 发送暂停事件
    this.emit({
      type: GameEventType.PAUSE,
      payload: {
        reason,
        pausedAt: this.pausedAt,
        previousState: PauseState.PLAYING
      },
      timestamp: Date.now()
    })
    
    console.log(`⏸️ [PauseManager] 游戏已暂停：${reason}`)
    
    return true
  }
  
  /**
   * ⭐ 恢复游戏
   * 
   * @returns 是否成功恢复
   */
  public resume(): boolean {
    if (this.currentState !== PauseState.PAUSED && 
        this.currentState !== PauseState.PAUSING) {
      console.warn(`⚠️ [PauseManager] 游戏未在暂停状态：${this.currentState}`)
      return false
    }
    
    // 切换到恢复中状态
    this.currentState = PauseState.RESUMING
    
    // 计算暂停时长
    const pauseDuration = Date.now() - this.pausedAt
    this.totalPausedTime += pauseDuration
    
    // 隐藏遮罩层
    if (this.overlaySprite) {
      this.scene.tweens.add({
        targets: this.overlaySprite,
        alpha: 0,
        duration: this.params?.transitionDuration ?? 300,
        ease: 'Power2',
        onComplete: () => {
          this.overlaySprite?.setVisible(false)
          this.currentState = PauseState.PLAYING
        }
      })
    } else {
      this.currentState = PauseState.PLAYING
    }
    
    // 隐藏暂停文本
    if (this.pauseText) {
      this.pauseText.setVisible(false)
    }
    
    // 恢复音效
    if (this.params?.stopAllSounds) {
      this.scene.sound.resumeAll()
    }
    
    // 启用输入
    if (this.params?.disableInput) {
      this.scene.input.enabled = true
    }
    
    // 发送恢复事件
    this.emit({
      type: GameEventType.RESUME,
      payload: {
        resumedAt: Date.now(),
        pauseDuration,
        totalPausedTime: this.totalPausedTime,
        previousState: this.currentState
      },
      timestamp: Date.now()
    })
    
    console.log(`▶️ [PauseManager] 游戏已恢复，暂停时长：${pauseDuration}ms`)
    
    return true
  }
  
  /**
   * ⭐ 切换暂停/恢复状态
   * 
   * @returns 当前是否处于暂停状态
   */
  public toggle(): boolean {
    if (this.currentState === PauseState.PLAYING) {
      this.pause('toggle')
      return true
    } else {
      this.resume()
      return false
    }
  }
  
  /**
   * ⭐ 获取当前暂停状态
   * 
   * @returns 暂停状态
   */
  public getState(): PauseState {
    return this.currentState
  }
  
  /**
   * ⭐ 检查是否处于暂停状态
   * 
   * @returns true 如果已暂停
   */
  public isPaused(): boolean {
    return this.currentState === PauseState.PAUSED
  }
  
  /**
   * ⭐ 获取暂停统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    currentState: PauseState
    pausedAt: number
    totalPausedTime: number
    pauseCount: number
  } {
    return {
      currentState: this.currentState,
      pausedAt: this.pausedAt,
      totalPausedTime: this.totalPausedTime,
      pauseCount: Math.floor(this.totalPausedTime / 1000)  // 粗略估计暂停次数
    }
  }
  
  /**
   * ⭐ 设置暂停遮罩层可见性
   * 
   * @param visible - 是否可见
   */
  public setOverlayVisible(visible: boolean): void {
    if (this.overlaySprite) {
      this.overlaySprite.setVisible(visible)
    }
  }
  
  /**
   * ⭐ 更新暂停文本内容
   * 
   * @param text - 新的文本内容
   */
  public setPauseText(text: string): void {
    if (this.pauseText) {
      this.pauseText.setText(text)
    }
  }
  
  /**
   * ⭐ 重置暂停管理器
   */
  public reset(): void {
    this.currentState = PauseState.PLAYING
    this.pausedAt = 0
    this.totalPausedTime = 0
    
    if (this.overlaySprite) {
      this.overlaySprite.setVisible(false)
    }
    if (this.pauseText) {
      this.pauseText.setVisible(false)
    }
    
    console.log(`🔄 [PauseManager] 已重置暂停管理器`)
  }
  
  /**
   * ⭐ 销毁组件
   */
  public destroy(): void {
    if (this.overlaySprite) {
      this.overlaySprite.destroy()
      this.overlaySprite = null
    }
    
    if (this.pauseText) {
      this.pauseText.destroy()
      this.pauseText = null
    }
    
    super.destroy()
  }
  
  /**
   * ⭐ 创建暂停遮罩层
   * 
   * @protected
   */
  protected createOverlay(): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    // 创建遮罩层（使用全屏矩形）
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(this.params?.overlayColor ?? 0x000000, this.params?.overlayAlpha ?? 0.5)
    graphics.fillRect(0, 0, width, height)
    
    // 将图形转换为纹理并创建 Sprite
    graphics.generateTexture('pause_overlay', width, height)
    graphics.destroy()
    
    this.overlaySprite = this.scene.add.sprite(width / 2, height / 2, 'pause_overlay')
    this.overlaySprite.setOrigin(0.5)
    this.overlaySprite.setDepth(1000)  // 确保在最上层
    this.overlaySprite.setVisible(false)
    this.overlaySprite.setInteractive({ useHandCursor: true })
    
    // 点击遮罩层也可以切换暂停状态
    this.overlaySprite.on('pointerdown', () => {
      this.toggle()
    })
    
    // 创建暂停文本
    this.pauseText = this.scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.pauseText.setOrigin(0.5)
    this.pauseText.setDepth(1001)  // 在遮罩层之上
    this.pauseText.setVisible(false)
    
    // 添加阴影效果
    this.pauseText.setStroke('#000000', 4)
    this.pauseText.setShadow(2, 2, '#000000', 4, true, true)
  }
  
  /**
   * ⭐ 设置键盘快捷键（Esc 暂停）
   * 
   * @protected
   */
  protected setupKeyboardShortcut(): void {
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.enabled) {
        this.toggle()
      }
    })
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 可以响应游戏事件来管理暂停
    switch (event.type) {
      case GameEventType.GAME_OVER:
        // 游戏结束时自动暂停
        if (this.currentState === PauseState.PLAYING) {
          this.pause('game_over')
        }
        break
        
      case GameEventType.GAME_START:
        // 游戏开始时重置暂停状态
        this.reset()
        break
        
      case GameEventType.SHOW_MESSAGE:
        // 显示重要消息时暂时暂停
        if (event.payload?.priority === 'high') {
          this.pause('show_message')
        }
        break
    }
  }
}
