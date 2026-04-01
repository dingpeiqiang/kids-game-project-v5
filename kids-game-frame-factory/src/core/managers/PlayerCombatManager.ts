// ============================================================================
// ⚔️ 玩家战斗管理器 - 处理射击、受击、道具效果
// ============================================================================
// 
// 📌 说明:
//   统一管理所有战斗相关逻辑，包括射击冷却、受击处理、道具激活
// ============================================================================

import { IGameManager } from './IGameManager'
import type { PlayerEntity } from '../entities/PlayerEntity'
import type { PlayerStateManager } from './PlayerStateManager'

/**
 * ⭐ 战斗配置
 */
export interface ICombatConfig {
  shootCooldown: number         // 射击冷却时间（毫秒）
  baseDamage: number            // 基础伤害
  bulletSpeed: number           // 子弹速度
}

/**
 * ⭐ 战斗管理器
 */
export class PlayerCombatManager implements IGameManager {
  protected player: PlayerEntity
  protected stateManager: PlayerStateManager
  
  // 状态
  private lastShootTime: number = 0
  private isShieldActive: boolean = false
  private shieldEndTime: number = 0
  
  // 配置
  private readonly config: ICombatConfig = {
    shootCooldown: 500,
    baseDamage: 25,
    bulletSpeed: 400
  }
  
  constructor(player: PlayerEntity, stateManager: PlayerStateManager) {
    this.player = player
    this.stateManager = stateManager
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化
   */
  init(): void {
    console.log('✅ [PlayerCombatManager] 已创建')
  }
  
  /**
   * ⭐ 每帧更新
   */
  update(_time: number, _delta: number): void {
    // 检查护盾是否结束
    if (this.isShieldActive && Date.now() >= this.shieldEndTime) {
      this.isShieldActive = false
      console.log('🛡️ [PlayerCombatManager] 护盾效果结束')
    }
  }
  
  /**
   * ⭐ 销毁清理
   */
  destroy(): void {
    console.log('🗑️ [PlayerCombatManager] 销毁')
  }
  
  // ===========================================================================
  // 📌 公开 API - 射击控制
  // ===========================================================================
  
  /**
   * ⭐ 尝试射击
   * 
   * @returns 是否成功射击
   */
  tryShoot(): boolean {
    const now = Date.now()
    
    // 🔒 检查是否可以行动
    if (!this.stateManager.canAct()) {
      return false
    }
    
    // 🔒 检查冷却时间
    if (now - this.lastShootTime < this.config.shootCooldown) {
      return false
    }
    
    // ✅ 执行射击
    this.lastShootTime = now
    this.performShoot()
    return true
  }
  
  /**
   * ⭐ 设置射击冷却时间
   * 
   * @param cooldown - 冷却时间（毫秒）
   */
  setShootCooldown(cooldown: number): void {
    this.config.shootCooldown = Math.max(100, cooldown)
    console.log(`🔫 [PlayerCombatManager] 射击冷却：${cooldown}ms`)
  }
  
  /**
   * ⭐ 重置射击冷却
   */
  resetShootCooldown(): void {
    this.lastShootTime = 0
    console.log('🔄 [PlayerCombatManager] 重置射击冷却')
  }
  
  // ===========================================================================
  // 📌 公开 API - 受击处理
  // ===========================================================================
  
  /**
   * ⭐ 玩家被击中
   * 
   * @remarks
   * 当敌人子弹或敌人碰到玩家时调用
   */
  onHit(): void {
    console.log('💥 [PlayerCombatManager] 玩家被击中')
    
    // 🔒 检查是否有效
    if (!this.stateManager.isValid()) {
      console.log('⚠️ [PlayerCombatManager] 玩家已死亡或正在死亡，跳过受击逻辑')
      return
    }
    
    // 🛡️ 检查护盾
    if (this.isShieldActive) {
      this.activateShield()
      console.log('✨ [PlayerCombatManager] 护盾抵挡伤害')
      return
    }
    
    // 💥 扣减生命
    this.player.takeDamage(10)
    
    // ☠️ 检查是否死亡
    if (!this.player.isAlive) {
      this.handleDeath()
    }
  }
  
  /**
   * ⭐ 激活护盾
   * 
   * @param duration - 持续时间（毫秒，默认 10 秒）
   */
  activateShield(duration: number = 10000): void {
    this.isShieldActive = true
    this.shieldEndTime = Date.now() + duration
    console.log(`🛡️ [PlayerCombatManager] 激活护盾 (${duration}ms)`)
  }
  
  // ===========================================================================
  // 📌 公开 API - 道具效果
  // ===========================================================================
  
  /**
   * ⭐ 激活升级道具
   */
  activateUpgrade(): void {
    console.log('⬆️ [PlayerCombatManager] 火力升级')
    // 提升伤害和射速
    this.config.baseDamage *= 1.5
    this.setShootCooldown(this.config.shootCooldown * 0.8)
    
    // 10 秒后恢复
    setTimeout(() => {
      this.config.baseDamage /= 1.5
      this.setShootCooldown(500)
      console.log('⬇️ [PlayerCombatManager] 火力升级效果结束')
    }, 10000)
  }
  
  /**
   * ⭐ 激活散弹枪道具
   */
  activateShotgun(): void {
    console.log('🔫 [PlayerCombatManager] 激活散弹枪 - 一次发射 5 颗子弹')
    // 临时提升射速和子弹大小
    this.setShootCooldown(150)
    
    // 5 秒后恢复
    setTimeout(() => {
      console.log('🔫 [PlayerCombatManager] 散弹枪效果结束')
    }, 5000)
  }
  
  /**
   * ⭐ 激活追踪导弹道具
   */
  activateHomingMissile(): void {
    console.log('🚀 [PlayerCombatManager] 激活追踪导弹 - 自动追踪敌人')
    // TODO: 实现追踪导弹逻辑
    
    // 10 秒后失效
    setTimeout(() => {
      console.log('🚀 [PlayerCombatManager] 追踪导弹效果结束')
    }, 10000)
  }
  
  /**
   * ⭐ 激活全屏炸弹
   */
  activateFullScreenBomb(): void {
    console.log('💣 [PlayerCombatManager] 全屏炸弹 - 清除所有敌人')
    // TODO: 需要 EntityManager 配合清除所有敌人
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 执行射击
   */
  private performShoot(): void {
    console.log('🔫 [PlayerCombatManager] 射击')
    
    // TODO: 创建子弹实体
    // 需要 EntityManager 配合
    // entityManager.createEntity({
    //   type: EntityType.BULLET,
    //   x: this.player.x,
    //   y: this.player.y,
    //   texture: 'bullet_player',
    //   attributes: {
    //     type: BulletType.PLAYER,
    //     velocity: { x: 0, y: -this.config.bulletSpeed },
    //     damage: this.player.damage
    //   }
    // })
  }
  
  /**
   * 处理死亡
   */
  private handleDeath(): void {
    console.log('☠️ [PlayerCombatManager] 处理死亡')
    
    // 通知状态管理器进入死亡状态
    this.stateManager.setDying()
    
    // 检查是否有剩余生命
    if (this.player.lives > 0) {
      // 开始复活流程
      setTimeout(() => {
        this.stateManager.startRespawnFlow()
      }, 1000)
    } else {
      // 游戏结束
      this.onGameOver()
    }
  }
  
  /**
   * 游戏结束回调
   */
  private onGameOver(): void {
    console.log('🎮 [PlayerCombatManager] 游戏结束')
    // TODO: 触发游戏结束事件
  }
}
