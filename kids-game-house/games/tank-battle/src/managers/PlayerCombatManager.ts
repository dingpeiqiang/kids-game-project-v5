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
    
    console.log('✅ PlayerCombatManager 已创建')
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
  
  // ===========================================================================
  // 💥 受击处理
  // ===========================================================================
  
  /**
   * ⭐ 处理玩家被击中
   */
  onHit(): void {
    console.log('💥 PlayerCombatManager: 玩家被击中')
    
    // 🔒 检查是否有效
    if (!this.stateManager.isValid()) {
      console.log('⚠️ onHit: 玩家状态无效，跳过')
      return
    }
    
    // 🛡️ 检查护盾
    if (this.isShieldActive) {
      this.activateShield()
      return
    }
    
    // 🛡️ 检查无敌
    if (this.stateManager.isInvincible()) {
      console.log('🛡️ 玩家处于无敌状态，免疫伤害')
      return
    }
    
    // 💥 扣减护甲或生命
    if (this.currentArmor > 0) {
      this.currentArmor--
      console.log(`🛡️ 护甲抵挡伤害，剩余护甲：${this.currentArmor}`)
      this.playHitFeedback()
      return
    }
    
    // 🔴 进入死亡流程
    this.handleDeath()
  }
  
  /**
   * ⭐ 激活护盾
   */
  activateShield(): void {
    this.isShieldActive = false
    console.log('🛡️ 护盾生效，抵消一次伤害')
    this.scene.spawnSparks((this.scene as any).player.x, (this.scene as any).player.y, '#3b82f6', 8)
    this.scene.cameraShake(80)
    this.scene.playSound('sfx_hit', 0.4)
  }
  
  /**
   * ⭐ 添加护甲
   */
  addArmor(amount: number = 1): void {
    this.currentArmor = Math.min(this.currentArmor + amount, this.config.maxArmor)
    console.log(`🛡️ 获得 ${amount} 层护甲，当前护甲：${this.currentArmor}`)
  }
  
  // ===========================================================================
  // 🎁 道具效果
  // ===========================================================================
  
  /**
   * ⭐ 激活护盾道具
   */
  activateShieldPowerUp(): void {
    this.isShieldActive = true
    console.log('✨ 激活护盾道具')
  }
  
  /**
   * ⭐ 激活冻结道具
   */
  activateFreezeEffect(): void {
    this.isFrozen = true
    console.log('❄️ 激活冻结效果')
    
    // 5 秒后自动解除
    this.scene.time.delayedCall(5000, () => {
      this.isFrozen = false
      console.log('🔓 冻结效果结束')
    })
  }
  
  /**
   * ⭐ 激活升级道具
   */
  activateUpgrade(): void {
    this.setBulletDamage(this.config.bulletDamage + 5)
    console.log('⬆️ 火力升级')
  }
  
  /**
   * ⭐ 激活散弹枪道具
   */
  activateShotgun(): void {
    console.log('🔫 激活散弹枪 - 一次发射 5 颗子弹')
    // 临时提升射速和子弹大小
    this.setShootCooldown(150)  // 快速射击
    this.setBulletDamage(this.config.bulletDamage * 1.5)  // 伤害提升
    
    // 5 秒后恢复
    this.scene.time.delayedCall(5000, () => {
      console.log('🔫 散弹枪效果结束')
    })
  }
  
  /**
   * ⭐ 激活追踪导弹道具
   */
  activateHomingMissile(): void {
    console.log('🚀 激活追踪导弹 - 自动追踪敌人')
    // 标记下次射击使用追踪导弹
    const player = (this.scene as any).player
    if (player) {
      player.setData('homing', true)
      
      // 10 秒后失效
      this.scene.time.delayedCall(10000, () => {
        player.setData('homing', false)
        console.log('🚀 追踪导弹效果结束')
      })
    }
  }
  
  /**
   * ⭐ 激活全屏炸弹
   */
  activateFullScreenBomb(): void {
    console.log('💣 全屏炸弹 - 清除所有敌人')
    
    // 摧毁所有敌人
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
    
    console.log(`💣 清除了 ${destroyedCount} 个敌人`)
    
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
    
    // 强烈震动
    const cameraShake = (this.scene as any).cameraShakeManager as CameraShakeManager
    if (cameraShake) {
      cameraShake.shake(3) // EXTREME 级别
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
    
    // 🎵 播放音效
    this.scene.playSound('sfx_shoot', 0.3)
    
    // 💨 生成子弹
    const bulletSpeed = 400
    const bulletOffset = 20
    
    let vx = 0, vy = 0
    const direction = (this.scene as any).movementManager?.getCurrentDirection()
    
    switch (direction) {
      case 'UP':
        vy = -bulletSpeed
        break
      case 'DOWN':
        vy = bulletSpeed
        break
      case 'LEFT':
        vx = -bulletSpeed
        break
      case 'RIGHT':
        vx = bulletSpeed
        break
    }
    
    // 如果没有方向，使用默认向上
    if (vx === 0 && vy === 0) {
      vy = -bulletSpeed
    }
    
    const bullet = (this.scene as any).entityManager.createBullet(
      player.x,
      player.y - bulletOffset,
      vx,
      vy,
      'bullet_player',
      { damage: this.config.bulletDamage }
    )
    
    if (bullet) {
      console.log('🔫 玩家射击')
    }
  }
  
  /**
   * 处理死亡
   */
  private handleDeath(): void {
    console.log('💀 PlayerCombatManager: 处理死亡')
    
    // 📊 获取游戏商店（通过 scene）
    const gameStore = (this.scene as TankGameScene).gameStore
    if (!gameStore) {
      console.error('❌ gameStore 不存在')
      return
    }
    
    const previousLives = gameStore.lives
    gameStore.loseLife()
    
    console.log(`💥 玩家被击中，生命值：${previousLives} → ${gameStore.lives}`)
    
    // 🎭 播放受击反馈
    this.playHitFeedback()
    
    // 🔄 判断是否可以复活
    if (previousLives > 1) {
      // ✅ 还有命，可以复活
      this.stateManager.onHit(() => {
        this.startRespawn(previousLives)
      })
    } else {
      // ❌ 生命耗尽，游戏结束
      this.stateManager.markAsDead()
      this.scene.handleGameOver()
    }
  }
  
  /**
   * 开始复活流程
   */
  private startRespawn(currentLives: number): void {
    console.log(`🔄 PlayerCombatManager: 开始复活，剩余生命：${currentLives}`)
    
    // 📍 计算复活位置（使用地图坐标，不需要 offset）
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows  // 🔧 修复：添加 gridRows 定义
    const cellSize = (this.scene as any).cellSize
    
    const startX = (gridCols * cellSize) / 2  // 地图水平中心
    const startY = (gridRows * cellSize) - 100  // 距离底部 100 像素
    
    console.log('📍 复活位置计算:', { gridCols, gridRows, cellSize, startX, startY })
    
    // 🧹 清除周围敌人
    this.clearSpawnArea(startX, startY, 150)
    
    // 🚀 启动复活流程
    this.stateManager.startRespawning(() => {
      console.log('✨ 复活完成回调')
      
      const player = (this.scene as any).player
      if (!player || !player.active) {
        console.warn('⚠️ [复活失败] player 不存在或未激活')
        return
      }
      
      console.log('📍 传送玩家到复活点:', { x: startX, y: startY })
      
      try {
        // 📍 传送玩家到复活点
        player.setPosition(startX, startY)
        
        // 🔧 修复：检查 body 是否存在
        if (player.body) {
          player.setVelocity(0, 0)
        } else {
          console.warn('⚠️ [复活警告] player.body 不存在，跳过速度清零')
        }
        
        player.setActive(true)
        player.setVisible(true)
        player.setTexture('player_tank_up')
        player.clearTint()
        player.setAlpha(1)
        
        console.log('✅ [复活成功] 玩家已传送到复活点')
        
        // 💥 清除旧定时器
        if ((this.scene as any).blinkTimer) {
          ;(this.scene as any).blinkTimer.destroy()
          ;(this.scene as any).blinkTimer = null
        }
      } catch (error) {
        console.error('❌ [复活错误] 设置玩家状态失败:', error)
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
    
    console.log(`🧹 清除半径 ${radius} 内的敌人`)
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
}
