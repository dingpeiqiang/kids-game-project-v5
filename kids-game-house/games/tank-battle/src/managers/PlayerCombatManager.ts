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
  /**
   * ⭐ 玩家被击中（带子弹参数）
   */
  onHitWithBullet(bullet: any): void {
    console.log('💥 PlayerCombatManager: 玩家被击中（带子弹）')
    
    // 🔍 详细调试信息
    console.log('🔍 [调试] onHit 检查:', {
      isValid: this.stateManager.isValid(),
      isInvincible: this.stateManager.isInvincible(),
      currentArmor: this.currentArmor,
      isShieldActive: this.isShieldActive
    })
    
    // 🔒 检查是否有效
    if (!this.stateManager.isValid()) {
      console.log('⚠️ onHit: 玩家状态无效，跳过')
      bullet.destroy()  // 只销毁子弹
      return
    }
    
    // 🛡️ 检查护盾（优先级最高）
    if (this.isShieldActive) {
      console.log('🛡️ 检测到护盾')
      this.consumeShield(bullet)
      console.log('✅ 护盾抵挡了伤害，玩家安全')
      return
    }
    
    // 🛡️ 检查无敌
    if (this.stateManager.isInvincible()) {
      console.log('🛡️ 检测到无敌状态')
      this.consumeInvincible(bullet)
      console.log('🛡️ 玩家处于无敌状态，免疫伤害')
      return
    }
    
    // 💥 扣减护甲或生命
    if (this.currentArmor > 0) {
      this.currentArmor--
      console.log(`🛡️ 护甲抵挡伤害，剩余护甲：${this.currentArmor}`)
      bullet.destroy()
      this.playHitFeedback()
      return
    }
    
    // 🔴 进入死亡流程
    console.log('🔴 无任何保护，进入死亡流程')
    bullet.destroy()
    this.handleDeath()
  }
  
  /**
   * ⭐ 玩家被击中（兼容旧版本）
   */
  onHit(): void {
    console.warn('⚠️ 调用了旧版本 onHit()，应该使用 onHitWithBullet()')
    this.onHitWithBullet({ destroy: () => {} } as any)  // 兜底调用
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
   * ⭐ 激活护盾（道具效果）
   */
  activateShieldPowerUp(): void {
    this.isShieldActive = true
    console.log('✨ 获得护盾道具，可以抵挡一次伤害')
  }
  
  /**
   * ⭐ 消耗护盾（抵挡伤害时）
   */
  private consumeShield(bullet: any): void {
    this.isShieldActive = false
    console.log('🛡️ 护盾已消耗，抵消一次伤害')
    bullet.destroy()  // 销毁子弹
    this.scene.spawnSparks((this.scene as any).player.x, (this.scene as any).player.y, '#3b82f6', 8)
    this.scene.cameraShake(80)
    this.scene.playSound('sfx_hit', 0.4)
  }
  
  /**
   * ⭐ 消耗无敌（抵挡伤害时）
   */
  private consumeInvincible(bullet: any): void {
    bullet.destroy()  // 销毁子弹
    this.scene.spawnSparks((this.scene as any).player.x, (this.scene as any).player.y, '#ffd700', 8)
    this.scene.playSound('sfx_hit', 0.3)
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
    const tankHalfSize = 20  // 坦克半径
    
    let vx = 0, vy = 0
    let bulletX = player.x
    let bulletY = player.y
    const direction = (this.scene as any).movementManager?.getCurrentDirection()
    
    switch (direction) {
      case 'UP':
        vy = -bulletSpeed
        bulletX = player.x
        bulletY = player.y - tankHalfSize
        break
      case 'DOWN':
        vy = bulletSpeed
        bulletX = player.x
        bulletY = player.y + tankHalfSize
        break
      case 'LEFT':
        vx = -bulletSpeed
        bulletX = player.x - tankHalfSize
        bulletY = player.y
        break
      case 'RIGHT':
        vx = bulletSpeed
        bulletX = player.x + tankHalfSize
        bulletY = player.y
        break
    }
    
    // 如果没有方向，使用默认向上
    if (vx === 0 && vy === 0) {
      vy = -bulletSpeed
      bulletX = player.x
      bulletY = player.y - tankHalfSize
    }
    
    // ✅ 使用 EntityManager 创建子弹（通过 createEntity 方法）
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
      
      // ✅ 手动设置速度（因为 createEntity 不会自动设置）
      if (bullet && bullet.body) {
        bullet.body.setVelocity(vx, vy)
      }
      
      if (bullet) {
        console.log('🔫 玩家射击:', { x: bulletX, y: bulletY, vx, vy })
      }
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
    
    const currentLives = gameStore.lives
    gameStore.loseLife()
    
    console.log(`💥 玩家被击中，生命值：${currentLives} → ${gameStore.lives}`)
    console.log('🔍 [调试] handleDeath 详细状态:', {
      currentLives,
      newLives: gameStore.lives,
      canRespawn: gameStore.lives > 0
    })
    
    // 📢 触发事件（通知 UI）
    const scene = this.scene as any
    if (scene.game?.events) {
      scene.game.events.emit('lifeLost', gameStore.lives)
    }
    
    // 🎭 播放受击反馈
    this.playHitFeedback()
    
    // 🔄 判断是否可以复活（使用扣减后的生命值）
    if (gameStore.lives > 0) {
      // ✅ 还有命，可以复活
      this.stateManager.onHit(() => {
        this.startRespawn(gameStore.lives)
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
      
      try {
        // 🔧 关键修复：重新创建玩家（而不是复用旧对象）
        const scene = this.scene as any
        const entityManager = scene.entityManager
        
        if (!entityManager) {
          console.error('❌ [复活失败] entityManager 不存在')
          return
        }
        
        // 🗑️ 销毁旧玩家（如果存在）
        if (scene.player) {
          console.log('🗑️ 销毁旧玩家对象')
          if (scene.player.destroy) scene.player.destroy()
        }
        
        // ✅ 重新创建玩家
        console.log('✅ 重新创建玩家')
        scene.player = entityManager.createEntity({
          type: EntityType.PLAYER,
          x: startX,
          y: startY,
          texture: 'player_tank_up',
          attributes: { health: 1, speed: 200 }
        })
        
        const player = scene.player
        if (!player || !player.active) {
          console.error('⚠️ [复活失败] 新玩家未正确创建')
          return
        }
        
        console.log('📍 新玩家已创建:', { x: player.x, y: player.y, hasBody: !!player.body })
        
        // 🔍 调试信息：检查玩家渲染状态
        console.log('🔍 [渲染调试] 玩家状态:', {
          active: player.active,
          visible: player.visible,
          alpha: player.alpha,
          texture: player.texture?.key,
          displayList: player.displayList ? '已加入' : '未加入',
          depth: player.depth
        })
        
        // 🔍 调试信息：检查相机位置
        const camera = (this.scene as any).cameras?.main
        if (camera) {
          console.log('📷 [相机调试] 相机信息:', {
            x: camera.x,
            y: camera.y,
            width: camera.width,
            height: camera.height,
            scrollX: camera.scrollX,
            scrollY: camera.scrollY,
            playerInView: player.x >= camera.scrollX && 
                         player.x <= camera.scrollX + camera.width &&
                         player.y >= camera.scrollY && 
                         player.y <= camera.scrollY + camera.height
          })
        }
        
        // 🔧 关键修复：更新 movementManager 的 player 引用
        const movementManager = (this.scene as any).movementManager
        if (movementManager && typeof movementManager.setPlayer === 'function') {
          movementManager.setPlayer(player)
          console.log('✅ [移动管理器] 已更新 player 引用')
        } else {
          console.warn('⚠️ [移动管理器] movementManager 不存在或没有 setPlayer 方法')
        }
        
        // 🧱 关键修复：重新绑定玩家与墙壁的碰撞
        const collisionManager = (this.scene as any).collisionManager
        if (collisionManager && typeof collisionManager.rebindAllPlayerCollisions === 'function') {
          collisionManager.rebindAllPlayerCollisions()
          console.log('✅ [碰撞管理器] 已重新绑定所有玩家碰撞')
        }
        
        // 🔧 确保速度为零
        if (player.body) {
          player.setVelocity(0, 0)
        } else {
          console.warn('⚠️ [复活警告] player.body 不存在')
        }
        
        // 🎨 设置初始状态
        player.setActive(true)
        player.setVisible(true)
        player.setTexture('player_tank_up')
        player.clearTint()
        player.setAlpha(1)
        
        // 🔧 关键修复：重置 movementManager 的方向（与纹理一致）
        if (movementManager && typeof movementManager.resetDirection === 'function') {
          movementManager.resetDirection()
          console.log('✅ [移动管理器] 已重置方向为 UP')
        }
        
        console.log('✅ [复活成功] 玩家已传送到复活点')
        
        // 💥 清除旧定时器
        if (scene.blinkTimer) {
          scene.blinkTimer.destroy()
          scene.blinkTimer = null
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
