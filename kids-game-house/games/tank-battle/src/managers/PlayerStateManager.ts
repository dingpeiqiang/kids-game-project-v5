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
  private forceVisibleTimer: Phaser.Time.TimerEvent | null = null
  
  constructor(scene: TankGameScene) {
    this.scene = scene
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
    if (!this.isValid()) return
    
    // 进入死亡状态
    this.enterDyingState()
    
    const player = (this.scene as any).player
    if (player) {
      // 🔧 只设置透明，不触碰 visible
      player.setAlpha(0)
      
      // 播放爆炸效果
      const scene = this.scene as any
      if (scene.spawnExplosion) {
        scene.spawnExplosion(player.x, player.y, '#ff6b6b', 20)
      }
      
      // 相机震动
      if (scene.cameraShake) {
        scene.cameraShake(100)
      }
    }
    
    this.scene.time.delayedCall(this.config.dyingDuration, () => {
      onDeathComplete()
    })
  }
  
  /**
   * ⭐ 开始复活（进入复活无敌状态）
   * 
   * 修复说明：
   *   原实现在 finishRespawning()（闪烁结束后 1.5s）才调用 onRespawnComplete，
   *   导致玩家在闪烁期间仍留在死亡坐标，可能被物理碰撞再次击中。
   *   现改为：立即调用 onRespawnComplete 重置玩家位置，然后再开始闪烁。
   */
  startRespawning(onRespawnComplete: () => void): void {
    this.enterRespawningState()
    
    // ✅ 关键修复：立即重置位置（不等到闪烁结束），防止在旧坐标被碰撞
    try {
      onRespawnComplete()
    } catch (e) {
      console.error('❌ [PlayerStateManager] onRespawnComplete 抛出异常', e)
    }
    
    // 开始闪烁效果
    this.startBlinkEffect()
    
    // 闪烁结束后过渡到 INVINCIBLE 状态（额外 2s 保护期）
    this.scene.time.delayedCall(this.config.invincibleDuration, () => {
      this.finishRespawning()
    })
  }
  
  /**
   * ⭐ 标记为死亡（生命耗尽）
   */
  markAsDead(): void {
    this.enterDeadState()
  }

  /**
   * 🛡️ 激活临时无敌状态（护盾消耗后调用，防止连续受伤）
   * 
   * ✅ 修复：不再因 player.active=false 而提前 return，
   *    护盾消耗时 consumeShield 已经先调用了 player.setActive(true)，
   *    但即使 active 状态有延迟，无敌标志仍必须立即生效。
   */
  startInvincibleTemporary(duration: number = 1000): void {
    // 只有在非死亡状态才能激活临时无敌
    if (this.currentState === PlayerState.DEAD || this.currentState === PlayerState.DYING) return
    
    // 🔧 先清理旧的闪烁 timer，确保可见性正常
    this.cleanupTimers()
    
    // ✅ 无敌标志立即生效（不等待 player 状态检查）
    this.isInvincibleInternal = true
    
    const player = (this.scene as any).player
    if (player) {
      // ✅ 强制激活并恢复完全可见（即使之前 active=false 也要恢复）
      player.setActive(true)
      player.setVisible(true)
      player.setAlpha(1)
    }
    
    // 注意：不改变 currentState，保持 ALIVE，这样玩家仍可移动射击
    
    // 启动临时无敌闪烁效果（使用较高的最小 alpha 值，避免看起来"消失"）
    let blinkOn = true  // 从可见状态开始
    this.blinkTimer = this.scene.time.addEvent({
      delay: this.config.blinkInterval,
      callback: () => {
        const p = (this.scene as any).player
        if (!p) return
        blinkOn = !blinkOn
        // 使用 0.5 而不是 0，确保玩家闪烁时仍可见（不会被误判为死亡）
        p.setAlpha(blinkOn ? 1 : 0.5)
      },
      loop: true,
    })
    
    // 临时无敌结束后恢复
    this.scene.time.delayedCall(duration, () => {
      this.cleanupTimers()
      this.isInvincibleInternal = false
      const p = (this.scene as any).player
      if (p) {
        // 确保最终状态是完全可见
        p.setAlpha(1)
        p.setVisible(true)
      }
      console.log('🔓 [PlayerStateManager] 临时无敌结束')
    })
    
    console.log(`🛡️ [PlayerStateManager] 临时无敌激活，持续 ${duration}ms`)
  }
  
  /**
   * ⭐ 重置状态（新游戏开始时）
   */
  reset(): void {
    this.cleanupTimers()
    this.currentState = PlayerState.ALIVE
    this.isDyingInternal = false
    this.isInvincibleInternal = false
  }
  
  /**
   * ⭐ 销毁（清理资源）
   */
  destroy(): void {
    this.cleanupTimers()
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * ⭐ 停止闪烁效果
   */
  stopBlinkEffect(): void {
    this.cleanupTimers()
    
    const player = (this.scene as any).player
    if (player) {
      player.setVisible(true)
      player.setAlpha(1)
    }
  }
  
  /**
   * 进入死亡状态
   */
  private enterDyingState(): void {
    this.currentState = PlayerState.DYING
    this.isDyingInternal = true
  }
  
  /**
   * 进入复活状态（无敌闪烁）
   */
  private enterRespawningState(): void {
    this.currentState = PlayerState.RESPAWNING
    this.isInvincibleInternal = true
    this.isDyingInternal = false
  }
  
  /**
   * 完成复活（进入短暂无敌）
   * 注意：respawnCallback 已在 startRespawning 中立即调用，这里不再触发
   */
  private finishRespawning(): void {
    this.currentState = PlayerState.INVINCIBLE
    this.isInvincibleInternal = true
    
    this.cleanupTimers()
    
    const player = (this.scene as any).player
    if (player) {
      player.setVisible(true)
      player.setAlpha(1)
    }
    
    // 2 秒后退出无敌状态
    this.scene.time.delayedCall(2000, () => {
      if (this.currentState === PlayerState.INVINCIBLE) {
        this.currentState = PlayerState.ALIVE
        this.isInvincibleInternal = false
      }
    })
  }
  
  /**
   * 进入死亡状态（生命耗尽）
   */
  private enterDeadState(): void {
    this.currentState = PlayerState.DEAD
    this.isDyingInternal = false
    this.isInvincibleInternal = false
  }
  
  /**
   * 启动闪烁效果
   * ⚠️ 必须用 setAlpha 做闪烁，绝对不能用 setVisible(false)
   *    原因：setVisible(false) 会把 Sprite 从 scene.sys.updateList 中移除，
   *          导致物理体停止更新，overlap/collider 检测永久失效！
   */
  private startBlinkEffect(): void {
    this.cleanupTimers()
    
    let blinkOn = false
    const player = (this.scene as any).player
    
    if (!player) return
    
    // 确保玩家激活且可见（setVisible 保持 true，只改 alpha）
    if (!player.active) {
      player.setActive(true)
    }
    player.setVisible(true)
    player.setAlpha(0)
    
    // 用 alpha 闪烁：0 ↔ 1，不触碰 visible
    this.blinkTimer = this.scene.time.addEvent({
      delay: this.config.blinkInterval,
      callback: () => {
        if (!player || !player.active) return
        blinkOn = !blinkOn
        player.setAlpha(blinkOn ? 1 : 0)
      },
      loop: true,
    })
    
    // 闪烁总时长结束后强制恢复完全可见
    this.forceVisibleTimer = this.scene.time.addEvent({
      delay: this.config.blinkInterval * this.config.blinkCount + 50,
      callback: () => {
        if (player && player.active) {
          player.setVisible(true)
          player.setAlpha(1)
        }
        this.forceVisibleTimer = null
      },
      loop: false
    })
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
