// ============================================================================
// 🎮 玩家状态管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理玩家的所有状态（存活、死亡、无敌等），提供清晰的状态转换
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'

/**
 * ⭐ 玩家状态枚举
 */
export enum PlayerState {
  ALIVE = 'ALIVE',              // 存活，可操作
  DYING = 'DYING',              // 正在死亡（受击动画中）
  RESPAWNING = 'RESPAWNING',    // 等待复活（无敌闪烁中）
  INVINCIBLE = 'INVINCIBLE',    // 无敌状态（复活后保护期）
  DEAD = 'DEAD'                 // 死亡（生命耗尽）
}

/**
 * ⭐ 玩家状态配置
 */
export interface IPlayerStateConfig {
  invincibleDuration: number      // 无敌持续时间（毫秒）
  dyingDuration: number           // 死亡动画持续时间（毫秒）
  blinkInterval: number           // 闪烁间隔（毫秒）
  blinkCount: number              // 闪烁次数
}

/**
 * ⭐ 玩家状态管理器
 */
export class PlayerStateManager {
  private scene: TankGameScene
  private currentState: PlayerState = PlayerState.ALIVE
  
  // 状态标志（对外兼容）
  private isDyingInternal: boolean = false
  private isInvincibleInternal: boolean = false
  
  // 配置
  private readonly config: IPlayerStateConfig = {
    invincibleDuration: 1500,    // 1.5 秒无敌
    dyingDuration: 500,          // 0.5 秒死亡动画
    blinkInterval: 150,          // 150ms 闪烁一次
    blinkCount: 10               // 闪烁 10 次
  }
  
  // 引用
  private blinkTimer: Phaser.Time.TimerEvent | null = null
  private respawnCallback: (() => void) | null = null
  private forceVisibleTimer: Phaser.Time.TimerEvent | null = null  // 🔧 新增：强制可见定时器
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    console.log('✅ PlayerStateManager 已创建')
  }
  
  // ===========================================================================
  // 📊 状态查询（公开 API）
  // ===========================================================================
  
  /**
   * ⭐ 获取当前状态
   */
  getState(): PlayerState {
    return this.currentState
  }
  
  /**
   * ⭐ 是否可以行动（移动、射击）
   */
  canAct(): boolean {
    // ✅ 允许 ALIVE / INVINCIBLE / RESPAWNING 状态行动
    return this.currentState === PlayerState.ALIVE || 
           this.currentState === PlayerState.INVINCIBLE ||
           this.currentState === PlayerState.RESPAWNING  // ✅ 无敌期间可以移动
  }
  
  /**
   * ⭐ 是否处于有效状态（可以参与碰撞检测）
   */
  isValid(): boolean {
    return this.currentState !== PlayerState.DEAD &&
           this.currentState !== PlayerState.DYING
  }
  
  /**
   * ⭐ 是否无敌
   */
  isInvincible(): boolean {
    return this.isInvincibleInternal
  }
  
  /**
   * ⭐ 是否正在死亡
   */
  isDying(): boolean {
    return this.isDyingInternal
  }
  
  // ===========================================================================
  // 🔄 状态转换（核心方法）
  // ===========================================================================
  
  /**
   * ⭐ 玩家被击中（进入死亡状态）
   */
  onHit(onDeathComplete: () => void): void {
    if (!this.isValid()) {
      console.log('⚠️ onHit: 玩家状态无效，跳过')
      return
    }
    
    console.log('💥 PlayerStateManager: 玩家被击中')
    
    // 进入死亡状态
    this.enterDyingState()
    
    // 延迟调用死亡完成回调
    this.scene.time.delayedCall(this.config.dyingDuration, () => {
      onDeathComplete()
    })
  }
  
  /**
   * ⭐ 开始复活（进入复活无敌状态）
   */
  startRespawning(onRespawnComplete: () => void): void {
    console.log('🔄 PlayerStateManager: 开始复活流程')
    
    this.respawnCallback = onRespawnComplete
    
    // 进入复活状态
    this.enterRespawningState()
    
    // 启动闪烁效果
    this.startBlinkEffect()
    
    // 设置无敌时间
    this.scene.time.delayedCall(this.config.invincibleDuration, () => {
      this.finishRespawning()
    })
  }
  
  /**
   * ⭐ 标记为死亡（生命耗尽）
   */
  markAsDead(): void {
    console.log('💀 PlayerStateManager: 玩家死亡')
    this.enterDeadState()
  }
  
  /**
   * ⭐ 重置状态（新游戏开始时）
   */
  reset(): void {
    console.log('🔄 PlayerStateManager: 重置状态')
    this.cleanupTimers()
    this.currentState = PlayerState.ALIVE
    this.isDyingInternal = false
    this.isInvincibleInternal = false
    this.respawnCallback = null
  }
  
  /**
   * ⭐ 销毁（清理资源）
   */
  destroy(): void {
    console.log('🗑️ PlayerStateManager: 销毁')
    this.cleanupTimers()
    this.respawnCallback = null
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 进入死亡状态
   */
  private enterDyingState(): void {
    this.currentState = PlayerState.DYING
    this.isDyingInternal = true
    console.log('📊 状态变更：ALIVE → DYING')
  }
  
  /**
   * 进入复活状态（无敌闪烁）
   */
  private enterRespawningState(): void {
    this.currentState = PlayerState.RESPAWNING
    this.isInvincibleInternal = true
    this.isDyingInternal = false
    console.log('📊 状态变更：DYING → RESPAWNING')
  }
  
  /**
   * 完成复活（进入短暂无敌）
   */
  private finishRespawning(): void {
    this.currentState = PlayerState.INVINCIBLE
    this.isInvincibleInternal = true  // 🔧 关键修复：设置无敌标志
    console.log('📊 状态变更：RESPAWNING → INVINCIBLE')
    
    // 🔧 关键修复：清理旧的闪烁定时器和强制可见定时器
    this.cleanupTimers()
    if (this.forceVisibleTimer) {
      this.forceVisibleTimer.destroy()
      this.forceVisibleTimer = null
      console.log('✅ [定时器] 已清理旧的强制可见定时器')
    }
    
    // 🔧 关键修复：确保玩家可见（闪烁可能停在 invisible 状态）
    const player = (this.scene as any).player
    if (player) {
      player.setVisible(true)
      player.setAlpha(1)
      console.log('✅ [状态管理器] 已设置玩家可见')
    }
    
    // 2 秒后退出无敌状态
    this.scene.time.delayedCall(2000, () => {
      try {
        if (this.currentState === PlayerState.INVINCIBLE) {
          this.currentState = PlayerState.ALIVE
          this.isInvincibleInternal = false
          console.log('📊 状态变更：INVINCIBLE → ALIVE')
        }
      } catch (error) {
        console.error('❌ [状态管理器] 退出无敌状态时出错:', error)
      }
    })
    
    // 通知回调
    if (this.respawnCallback) {
      this.respawnCallback()
      this.respawnCallback = null
    }
  }
  
  /**
   * 进入死亡状态（生命耗尽）
   */
  private enterDeadState(): void {
    this.currentState = PlayerState.DEAD
    this.isDyingInternal = false
    this.isInvincibleInternal = false
    console.log('📊 状态变更：→ DEAD')
  }
  
  /**
   * 启动闪烁效果
   */
  private startBlinkEffect(): void {
    this.cleanupTimers()
    
    let visible = true
    const player = (this.scene as any).player
    
    if (!player) {
      console.warn('⚠️ startBlinkEffect: player 不存在')
      return
    }
    
    // 🔧 关键修复：确保玩家是激活状态
    if (!player.active) {
      player.setActive(true)
      console.log('✅ [闪烁] 玩家已激活')
    }
    
    // 立即开始闪烁
    this.blinkTimer = this.scene.time.addEvent({
      delay: this.config.blinkInterval,
      callback: () => {
        try {
          if (!player || !player.active) {
            console.log('⚠️ [闪烁] 玩家已不存在或未激活，停止闪烁')
            return
          }
          visible = !visible
          player.setVisible(visible)
          console.log(`🔍 [调试] 闪烁：visible=${visible}`)
          
          // 🔧 关键修复：最后一次闪烁后强制设置可见
          if (this.blinkTimer && this.blinkTimer.repeatCount === 1) {
            console.log('✅ [闪烁] 最后一次闪烁，结束后将强制设置可见')
          }
        } catch (error) {
          console.error('❌ [闪烁] 闪烁效果执行出错:', error)
        }
      },
      loop: true,
      repeat: this.config.blinkCount - 1,  // 总共闪烁 blinkCount 次
    })
    
    // 🔧 关键修复：在闪烁结束后强制设置玩家可见（延迟执行）
    this.forceVisibleTimer = this.scene.time.addEvent({
      delay: this.config.blinkInterval * this.config.blinkCount + 50,  // 闪烁总时长 + 缓冲
      callback: () => {
        try {
          console.log('✅ [闪烁] 闪烁效果结束，强制设置玩家可见')
          if (player && player.active) {
            player.setVisible(true)
            player.setAlpha(1)
            console.log('✅ [闪烁] 玩家已设置为可见状态')
          } else {
            console.warn('⚠️ [闪烁] 玩家不存在或未激活，跳过设置可见')
          }
          this.forceVisibleTimer = null  // 清空引用
        } catch (error) {
          console.error('❌ [闪烁] 强制设置可见时出错:', error)
        }
      },
      loop: false
    })
    
    console.log(`✨ 启动闪烁效果：${this.config.blinkCount} 次，间隔 ${this.config.blinkInterval}ms`)
  }
  
  /**
   * 清理定时器
   */
  private cleanupTimers(): void {
    if (this.blinkTimer) {
      this.blinkTimer.destroy()
      this.blinkTimer = null
    }
    // 🔧 关键修复：同时清理强制可见定时器，防止内存泄漏和异步错误
    if (this.forceVisibleTimer) {
      this.forceVisibleTimer.destroy()
      this.forceVisibleTimer = null
    }
  }
}
