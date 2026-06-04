// ============================================================================
// 🎮 玩家状态管理器 - 管理玩家状态机
// ============================================================================
// 
// 📌 说明:
//   实现明确的状态机，管理玩家的 ALIVE/DYING/RESPAWNING/DEAD 状态
//   提供清晰的状态转换 API
// ============================================================================

import { IGameManager } from './IGameManager'
import type { PlayerEntity } from '../entities/PlayerEntity'

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
 * ⭐ 状态管理器配置
 */
export interface IPlayerStateConfig {
  respawnDelay: number          // 复活延迟（毫秒）
  invincibleTime: number        // 无敌时间（毫秒）
  flashInterval: number         // 闪烁间隔（毫秒）
}

/**
 * ⭐ 玩家状态管理器
 */
export class PlayerStateManager implements IGameManager {
  protected player: PlayerEntity
  
  // 当前状态
  private currentState: PlayerState = PlayerState.ALIVE
  
  // 配置
  private readonly config: IPlayerStateConfig = {
    respawnDelay: 2000,         // 2 秒后复活
    invincibleTime: 3000,       // 3 秒无敌
    flashInterval: 200          // 200ms 闪烁一次
  }
  
  // 计时器
  private respawnTimer: Phaser.Time.TimerEvent | null = null
  private invincibleEndTime: number = 0
  private flashTimer: Phaser.Time.TimerEvent | null = null
  
  constructor(player: PlayerEntity) {
    this.player = player
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化
   */
  init(): void {
    console.log('✅ [PlayerStateManager] 已创建')
    this.currentState = PlayerState.ALIVE
  }
  
  /**
   * ⭐ 每帧更新
   */
  update(_time: number, delta: number): void {
    // 检查无敌状态是否结束
    if (this.currentState === PlayerState.INVINCIBLE) {
      if (Date.now() >= this.invincibleEndTime) {
        this.endInvincibility()
      }
    }
    
    // 检查是否可以复活
    if (this.currentState === PlayerState.RESPAWNING) {
      if (this.player.respawnTimer <= 0) {
        this.startRespawnProcess()
      }
    }
  }
  
  /**
   * ⭐ 销毁清理
   */
  destroy(): void {
    console.log('🗑️ [PlayerStateManager] 销毁')
    
    if (this.respawnTimer) {
      this.respawnTimer.destroy()
      this.respawnTimer = null
    }
    
    if (this.flashTimer) {
      this.flashTimer.destroy()
      this.flashTimer = null
    }
  }
  
  // ===========================================================================
  // 📌 公开 API - 状态查询
  // ===========================================================================
  
  /**
   * ⭐ 获取当前状态
   */
  getCurrentState(): PlayerState {
    return this.currentState
  }
  
  /**
   * ⭐ 是否可以行动
   * 
   * @returns true 表示玩家可以移动和射击
   */
  canAct(): boolean {
    return this.currentState === PlayerState.ALIVE || 
           this.currentState === PlayerState.INVINCIBLE
  }
  
  /**
   * ⭐ 是否有效（未死亡）
   * 
   * @returns true 表示玩家还活着或正在复活
   */
  isValid(): boolean {
    return this.currentState !== PlayerState.DEAD &&
           this.currentState !== PlayerState.DYING
  }
  
  /**
   * ⭐ 是否处于无敌状态
   */
  isInvincible(): boolean {
    return this.currentState === PlayerState.INVINCIBLE ||
           this.currentState === PlayerState.RESPAWNING
  }
  
  // ===========================================================================
  // 📌 公开 API - 状态转换
  // ===========================================================================
  
  /**
   * ⭐ 进入死亡状态
   * 
   * @remarks
   * 当玩家受到致命伤害时调用
   */
  setDying(): void {
    if (!this.isValid()) return
    
    console.log('💀 [PlayerStateManager] 进入死亡状态')
    this.currentState = PlayerState.DYING
    this.player.isDying = true
  }
  
  /**
   * ⭐ 开始复活流程
   * 
   * @remarks
   * 当玩家有剩余生命时调用
   */
  startRespawnFlow(): void {
    if (this.currentState !== PlayerState.DYING) return
    
    console.log('⏰ [PlayerStateManager] 开始复活流程')
    this.currentState = PlayerState.RESPAWNING
    this.player.respawnTimer = this.config.respawnDelay
    
    // 启动闪烁效果
    this.startFlashEffect()
  }
  
  /**
   * ⭐ 执行复活
   * 
   * @remarks
   * 复活延迟结束后调用
   */
  performRespawn(): void {
    if (this.currentState !== PlayerState.RESPAWNING) return
    
    console.log('✨ [PlayerStateManager] 执行复活')
    this.currentState = PlayerState.INVINCIBLE
    this.invincibleEndTime = Date.now() + this.config.invincibleTime
    
    // 恢复玩家状态
    this.player.isAlive = true
    this.player.isDying = false
    this.player.health = this.player.maxHealth
    
    // 停止闪烁
    this.stopFlashEffect()
  }
  
  /**
   * ⭐ 进入无敌状态
   * 
   * @param duration - 持续时间（毫秒）
   */
  setInvincible(duration: number): void {
    console.log(`🛡️ [PlayerStateManager] 进入无敌状态 (${duration}ms)`)
    this.currentState = PlayerState.INVINCIBLE
    this.invincibleEndTime = Date.now() + duration
  }
  
  /**
   * ⭐ 重置为存活状态
   * 
   * @remarks
   * 游戏开始时或测试模式下使用
   */
  resetToAlive(): void {
    console.log('🔄 [PlayerStateManager] 重置为存活状态')
    this.currentState = PlayerState.ALIVE
    this.player.isAlive = true
    this.player.isDying = false
    this.player.health = this.player.maxHealth
    this.invincibleEndTime = 0
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 结束无敌状态
   */
  private endInvincibility(): void {
    console.log('⚡ [PlayerStateManager] 无敌状态结束')
    this.currentState = PlayerState.ALIVE
    this.invincibleEndTime = 0
  }
  
  /**
   * 开始闪烁效果
   */
  private startFlashEffect(): void {
    const sprite = this.player.sprite
    if (!sprite || !sprite.scene) return
    
    let visible = true
    
    // 定期切换可见性
    this.flashTimer = sprite.scene.time.addEvent({
      delay: this.config.flashInterval,
      callback: () => {
        visible = !visible
        sprite.setVisible(visible)
        
        // 检查是否还在复活倒计时
        if (this.player.respawnTimer > 0) {
          this.player.respawnTimer -= this.config.flashInterval
        } else {
          this.performRespawn()
        }
      },
      loop: true
    })
    
    console.log('✨ [PlayerStateManager] 开始闪烁效果')
  }
  
  /**
   * 停止闪烁效果
   */
  private stopFlashEffect(): void {
    const sprite = this.player.sprite
    if (sprite) {
      sprite.setVisible(true)
    }
    
    if (this.flashTimer) {
      this.flashTimer.destroy()
      this.flashTimer = null
    }
    
    console.log('⏹️ [PlayerStateManager] 停止闪烁效果')
  }
  
  /**
   * 开始复活流程（内部调用）
   */
  private startRespawnProcess(): void {
    this.performRespawn()
  }
}
