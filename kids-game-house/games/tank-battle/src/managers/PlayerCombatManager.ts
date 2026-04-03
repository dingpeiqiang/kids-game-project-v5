// ============================================================================
// ⚔️ 玩家战斗管理器
// ============================================================================
// 
// 📌 说明:
//   专门负责玩家战斗相关逻辑：射击、受击、道具效果
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { PlayerState, PlayerStateManager } from './PlayerStateManager'
import { CameraShakeManager } from './CameraShakeManager'
import { EntityType } from './EntityManager'

/**
 * ⭐ 战斗配置
 */
export interface ICombatConfig {
  shootCooldown: number       // 射击冷却时间（毫秒）
  bulletDamage: number        // 子弹伤害
  maxArmor: number            // 最大护甲层数
}

/**
 * ⭐ 玩家战斗管理器
 */
export class PlayerCombatManager {
  private scene: TankGameScene
  private stateManager: PlayerStateManager
  
  // 配置
  private readonly config: ICombatConfig = {
    shootCooldown: 300,        // 300ms 射击间隔
    bulletDamage: 10,
    maxArmor: 3
  }
  
  // 状态
  private lastShootTime: number = 0
  private currentArmor: number = 0
  private isShieldActive: boolean = false
  private isFrozen: boolean = false
  
  constructor(scene: TankGameScene, stateManager: PlayerStateManager) {
    this.scene = scene
    this.stateManager = stateManager
  }
  
  // ===========================================================================
  // 🎯 公开 API - 射击
  // ===========================================================================
  
  /**
   * ⭐ 尝试射击
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
   * ⭐ 设置射击冷却
   */
  setShootCooldown(cooldown: number): void {
    this.config.shootCooldown = cooldown
    console.log(`🔫 射击冷却：${cooldown}ms`)
  }
  
  /**
   * ⭐ 设置子弹伤害
   */
  setBulletDamage(damage: number): void {
    this.config.bulletDamage = damage
    console.log(`💥 子弹伤害：${damage}`)
  }
  
  /**
   * ⭐ 检查是否有护盾
   */
  hasShield(): boolean {
    return this.isShieldActive
  }
  
  // ===========================================================================
  // 💥 受击处理
  // ===========================================================================
  
  /**
   * ⭐ 处理玩家被击中
   */
  onHitWithBullet(bullet: any): void {
    // 🔒 检查是否有效
    if (!this.stateManager.isValid()) {
      bullet.destroy()
      return
    }
    
    // 🛡️ 检查护盾（优先级最高）
    if (this.isShieldActive) {
      console.log('🛡️ [onHitWithBullet] 护盾生效，消耗护盾')
      this.consumeShield(bullet)
      return
    }
    
    console.log('⚠️ [onHitWithBullet] 无护盾保护，即将处理伤害')
    
    // 🛡️ 检查无敌
    if (this.stateManager.isInvincible()) {
      this.consumeInvincible(bullet)
      return
    }
    
    // 💥 扣减护甲或生命
    if (this.currentArmor > 0) {
      this.currentArmor--
      this.scene.time.delayedCall(0, () => {
        bullet.setActive?.(false)
        bullet.setVisible?.(false)
        bullet.removeData?.('hit')
      })
      
      const player = (this.scene as any).player
      if (player) {
        player.setVisible(true)
        player.setAlpha(1)
      }
      
      this.playHitFeedback()
      return
    }
    
    // 🔴 进入死亡流程
    this.scene.time.delayedCall(0, () => {
      bullet.setActive?.(false)
      bullet.setVisible?.(false)
      bullet.setData?.('hit', false)
    })
    
    this.handleDeath()
  }
  
  /**
   * ⭐ 玩家被击中（物理碰撞专用，不接受 bullet 参数）
   * 
   * 注意：此方法仅用于「玩家 vs 敌人」物理碰撞路径。
   * 护盾 / 无敌判断在 TankGameScene.handlePlayerEnemyCollision 已做过，
   * 这里直接走扣甲 / 死亡流程，不再重复检查，避免双重调用。
   */
  onHit(): void {
    if (!this.stateManager.isValid()) return
    // 🔒 双重保险：护盾 / 无敌仍然阻止伤害（防止调用方漏检）
    if (this.isShieldActive) {
      console.log('🛡️ [onHit] 护盾兜底生效，消耗护盾')
      this.consumeShield({ destroy: () => {} } as any)
      return
    }
    if (this.stateManager.isInvincible()) {
      console.log('✨ [onHit] 无敌状态，忽略伤害')
      return
    }

    // 💥 扣减护甲或生命（直接处理，不再调用 onHitWithBullet 避免死亡路径重复）
    if (this.currentArmor > 0) {
      this.currentArmor--
      const player = (this.scene as any).player
      if (player) {
        player.setVisible(true)
        player.setAlpha(1)
      }
      this.playHitFeedback()
      return
    }

    // 🔴 进入死亡流程
    this.handleDeath()
  }
  
  /**
   * ⭐ 激活护盾（道具效果）
   */
  activateShieldPowerUp(): void {
    this.isShieldActive = true
    const player = (this.scene as any).player
    if (player) {
      this.scene.spawnSparks(player.x, player.y, '#3b82f6', 8)
      this.scene.playSound('sfx_powerup', 0.5)
    }
  }
  
  /**
   * ⭐ 添加护甲
   */
  addArmor(amount: number = 1): void {
    this.currentArmor = Math.min(this.currentArmor + amount, this.config.maxArmor)
  }
  
  /**
   * ⭐ 消耗护盾（抵挡伤害时）
   */
  private consumeShield(bullet: any): void {
    // 🛡️ 二次确认护盾状态（防止重复调用）
    if (!this.isShieldActive) {
      console.warn('⚠️ [consumeShield] 护盾已不存在，忽略')
      return
    }
    
    // ✅ 先关闭护盾标志，防止后续逻辑重入
    this.isShieldActive = false

    // ✅ 销毁子弹（安全销毁，避免影响 player.active 判断）
    try {
      if (bullet && typeof bullet.destroy === 'function') {
        bullet.destroy()
      }
    } catch (e) {
      // 子弹可能已被销毁，忽略
    }
    
    const player = (this.scene as any).player
    const stateManager = (this.scene as any).stateManager as import('./PlayerStateManager').PlayerStateManager | undefined
    const powerUpEffectApplier = (this.scene as any).powerUpEffectApplier

    // ✅ 无论 player 是否 active，必须先清除护盾视觉光圈（防止光圈残留）
    if (powerUpEffectApplier?.removeEffectByType) {
      powerUpEffectApplier.removeEffectByType('shield', player ?? undefined)
      powerUpEffectApplier.removeEffectByType('invincible', player ?? undefined)
    }

    // ✅ 停止旧的闪烁效果
    if (stateManager?.stopBlinkEffect) {
      stateManager.stopBlinkEffect()
    }

    // ✅ 恢复玩家可见性（不管 active 状态，强制设置）
    if (player) {
      player.setActive(true)      // 确保激活，防止后续 isValid() 判断失败
      player.setVisible(true)
      player.setAlpha(1)
      player.clearTint()
    }
      
    // 🎆 播放护盾破碎特效
    if (player) {
      this.scene.spawnSparks(player.x, player.y, '#3b82f6', 8)
    }
    this.scene.cameraShake(80)
    this.scene.playSound('sfx_hit', 0.4)
      
    // 🛡️🔥 护盾消耗后：立即激活短暂无敌（1 秒），防止护盾消失后立即被击中死亡
    if (stateManager) {
      stateManager.startInvincibleTemporary(1000)
    }
      
    console.log('✅ [consumeShield] 护盾已消耗，玩家进入 1 秒临时无敌')
  }
  
  /**
   * ⭐ 消耗无敌（抵挡伤害时）
   */
  private consumeInvincible(bullet: any): void {
    bullet.destroy()
    
    const player = (this.scene as any).player
    if (player) {
      player.setVisible(true)
      player.setAlpha(1)
    }
    
    this.scene.spawnSparks((this.scene as any).player.x, (this.scene as any).player.y, '#ffd700', 8)
    this.scene.playSound('sfx_hit', 0.3)
  }
  
  /**
   * ⭐ 激活冻结道具
   */
  activateFreezeEffect(): void {
    this.isFrozen = true
    this.scene.time.delayedCall(5000, () => {
      this.isFrozen = false
    })
  }
  
  /**
   * ⭐ 激活升级道具
   */
  activateUpgrade(): void {
    this.setBulletDamage(this.config.bulletDamage + 5)
  }
  
  /**
   * ⭐ 激活散弹枪道具
   */
  activateShotgun(): void {
    this.setShootCooldown(150)
    this.setBulletDamage(this.config.bulletDamage * 1.5)
    this.scene.time.delayedCall(5000, () => {})
  }
  
  /**
   * ⭐ 激活追踪导弹道具
   */
  activateHomingMissile(): void {
    const player = (this.scene as any).player
    if (player) {
      player.setData('homing', true)
      this.scene.time.delayedCall(10000, () => {
        player.setData('homing', false)
      })
    }
  }
  
  /**
   * ⭐ 激活全屏炸弹
   */
  activateFullScreenBomb(): void {
    const enemies = (this.scene as any).enemies?.getChildren() || []
    let destroyedCount = 0
    
    enemies.forEach((enemy: any) => {
      if (enemy.active) {
        this.scene.spawnExplosion(enemy.x, enemy.y, 1.5)
        this.scene.addScore(100)
        enemy.destroy()
        destroyedCount++
      }
    })
    
    // 特效：白色闪光覆盖全屏
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + this.scene.cameras.main.width / 2,
      this.scene.cameras.main.scrollY + this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xffffff
    ).setScrollFactor(0).setAlpha(1).setDepth(9999)
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      onComplete: () => flash.destroy()
    })
    
    const cameraShake = (this.scene as any).cameraShakeManager as CameraShakeManager
    if (cameraShake) {
      cameraShake.shake(3)
    }
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 执行射击动作
   */
  private performShoot(): void {
    const player = (this.scene as any).player
    if (!player || !player.active) return
    
    this.scene.playSound('sfx_shoot', 0.3)
    
    const bulletSpeed = 400
    const tankHalfSize = 20
    
    let vx = 0, vy = 0
    let bulletX = player.x
    let bulletY = player.y
    const direction = (this.scene as any).movementManager?.getCurrentDirection()
    
    switch (direction) {
      case 'UP':
        vy = -bulletSpeed
        bulletY = player.y - tankHalfSize
        break
      case 'DOWN':
        vy = bulletSpeed
        bulletY = player.y + tankHalfSize
        break
      case 'LEFT':
        vx = -bulletSpeed
        bulletX = player.x - tankHalfSize
        break
      case 'RIGHT':
        vx = bulletSpeed
        bulletX = player.x + tankHalfSize
        break
    }
    
    if (vx === 0 && vy === 0) {
      vy = -bulletSpeed
      bulletY = player.y - tankHalfSize
    }
    
    const entityManager = (this.scene as any).entityManager
    if (entityManager) {
      const bullet = entityManager.createEntity({
        type: EntityType.BULLET_PLAYER,
        x: bulletX,
        y: bulletY,
        texture: 'bullet_player',
        attributes: { 
          damage: this.config.bulletDamage,
          speed: bulletSpeed
        },
        metadata: { velocity: { x: vx, y: vy } }
      })
      
      if (bullet?.body) {
        bullet.body.setVelocity(vx, vy)
      }
    }
  }
  
  /**
   * 处理死亡
   */
  private handleDeath(): void {
    // 🔒 护盾还在却进了死亡流程 → 异常！拒绝执行
    if (this.isShieldActive) {
      console.error('❌ [handleDeath] BUG! 护盾激活状态却进入了死亡流程，阻止死亡！')
      return
    }
    
    console.warn('💀 [handleDeath] 玩家死亡被触发！剩余生命:', (this.scene as TankGameScene).gameStore?.lives)
    const player = (this.scene as any).player
    
    const gameStore = (this.scene as TankGameScene).gameStore
    if (!gameStore) return
    
    gameStore.loseLife()
    
    const scene = this.scene as any
    if (scene.game?.events) {
      scene.game.events.emit('lifeLost', gameStore.lives)
    }
    
    // ✅ 死亡前先清除所有道具视觉效果（防止持续 tween/timer 干扰复活闪烁的 alpha 管理）
    const powerUpEffectApplier = (this.scene as any).powerUpEffectApplier
    if (powerUpEffectApplier?.removeVisualEffects && player) {
      powerUpEffectApplier.removeVisualEffects(player)
    }
    
    this.playHitFeedback()
    
    if (gameStore.lives > 0) {
      this.stateManager.onHit(() => {
        this.startRespawn(gameStore.lives)
      })
    } else {
      this.stateManager.markAsDead()
      this.scene.handleGameOver()
    }
  }
  
  /**
   * 开始复活流程
   */
  private startRespawn(currentLives: number): void {
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows
    const cellSize = (this.scene as any).cellSize
    
    const startX = (gridCols * cellSize) / 2
    const startY = (gridRows * cellSize) - 100
    
    // 🧹 清除周围敌人
    this.clearSpawnArea(startX, startY, 150)
    
    // ✅ 清除所有道具视觉效果（确保无残留 tween/timer 干扰复活）
    const powerUpEffectApplier = (this.scene as any).powerUpEffectApplier
    const playerRef = (this.scene as any).player
    if (powerUpEffectApplier?.removeVisualEffects && playerRef) {
      powerUpEffectApplier.removeVisualEffects(playerRef)
    }
    
    // 🛡️ 重置战斗状态（护盾、护甲等）
    this.reset()
    
    // 🚀 启动复活流程
    this.stateManager.startRespawning(() => {
      try {
        const scene = this.scene as any
        const player = scene.player
        
        if (!player) return
        
        // 1. 重置位置到复活点
        player.x = startX
        player.y = startY
        
        // 2. 激活玩家
        player.setActive(true)
        
        // 3. 重置物理体状态
        if (player.body) {
          player.body.reset(startX, startY)
          player.body.setVelocity(0, 0)
          player.body.enable = true
          player.body.checkCollision.none = false
          player.body.setSize(40, 40)
          player.body.setOffset(12, 12)
        }
        
        // 4. 重置方向（朝上）
        player.direction = 'UP'
        player.setFrame(0)
        
        // 5. 恢复渲染状态
        player.setAlpha(1)
        player.setVisible(true)
        
        // 6. 恢复纹理（防止纹理丢失）
        if (!player.texture?.key) {
          player.setTexture('player_tank_up')
        }
        
        // 7. 恢复碰撞检测
        if (player.body) {
          player.body.checkCollision.none = false
        }
        
        // 8. 设置深度
        player.setDepth(100)
        
        // 9. 清除周围敌人
        this.clearSpawnArea(startX, startY, 150)
        
        // 10. 重新绑定所有与玩家相关的碰撞（事件驱动）
        const collisionManager = (this.scene as any).collisionManager
        if (collisionManager?.rebindPlayerCollisions) {
          collisionManager.rebindPlayerCollisions()
        }
      } catch (error) {
        console.error('❌ [复活失败]', error)
      }
    })
  }
  
  /**
   * 清除复活点周围的敌人
   */
  private clearSpawnArea(centerX: number, centerY: number, radius: number): void {
    const enemies = (this.scene as any).enemies?.getChildren() || []
    
    enemies.forEach((enemy: any) => {
      if (!enemy.active) return
      
      const dx = enemy.x - centerX
      const dy = enemy.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < radius) {
        enemy.destroy()
        this.scene.spawnExplosion(enemy.x, enemy.y, 0.8)
        this.scene.addScore(50)
      }
    })
  }
  
  /**
   * 播放受击反馈
   */
  private playHitFeedback(): void {
    const player = (this.scene as any).player
    if (!player) return
    
    // 💥 爆炸特效
    this.scene.spawnExplosion(player.x, player.y, 0.6)
    
    // 📳 相机震动
    this.scene.cameraShake(200)
    
    // 🔊 音效
    this.scene.playSound('sfx_hit', 0.7)
  }

  // ===========================================================================
  // 🔧 重置与销毁
  // ===========================================================================

  /**
   * ⭐ 重置状态（新游戏开始时）
   */
  reset(): void {
    this.lastShootTime = 0
    this.currentArmor = 0
    this.isShieldActive = false  // ✅ 关键：重置护盾状态
    this.isFrozen = false
    console.log('🔄 [PlayerCombatManager] 状态已重置')
  }

  /**
   * ⭐ 销毁（清理资源）
   */
  destroy(): void {
    this.reset()
  }
}
