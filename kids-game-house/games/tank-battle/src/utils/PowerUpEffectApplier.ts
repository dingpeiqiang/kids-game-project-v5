// ============================================================================
// 🎁 坦克大战道具效果实现器 - 简化版
// ============================================================================
// 
// 📌 说明:
//   为坦克应用各种道具的视觉效果和属性加成
// ============================================================================

import { PowerUpType } from '../types/powerup-types'

/**
 * ⭐ 道具效果实现器
 */
export class PowerUpEffectApplier {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 应用道具效果（总入口）
   */
  applyEffect(type: PowerUpType, sprite: Phaser.Physics.Arcade.Sprite, player: any): void {
    console.log(`🎁 [PowerUpEffectApplier] 应用 ${type} 效果`)
    
    // 1. 应用视觉效果
    this.applyVisualEffect(type, sprite)
    
    // 2. 应用属性加成
    this.applyAttributeBuff(type, player)
    
    // 3. 播放音效
    this.playSoundEffect()
  }
  
  /**
   * ⭐ 移除持续型道具的视觉效果
   */
  removeVisualEffects(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite) return
    
    // 清除所有附加图形
    const graphics = sprite.getData('attachedGraphics') as Phaser.GameObjects.Graphics[]
    if (graphics) {
      graphics.forEach(g => g.destroy())
      sprite.setData('attachedGraphics', [])
    }
    
    // 清除粒子效果
    const emitters = sprite.getData('particleEmitters') as Phaser.GameObjects.Particles.ParticleEmitter[]
    if (emitters) {
      emitters.forEach(e => e.destroy())
      sprite.setData('particleEmitters', [])
    }
    
    // 清除 tint 和 pipeline
    sprite.clearTint()
    sprite.resetPostPipeline()
    
    console.log('🗑️ [PowerUpEffectApplier] 已清除所有视觉效果')
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 应用视觉效果
   */
  private applyVisualEffect(type: PowerUpType, sprite: Phaser.Physics.Arcade.Sprite): void {
    switch (type) {
      case PowerUpType.STAR:
        this.applyStarVisual(sprite)
        break
        
      case PowerUpType.SHIELD:
        this.applyShieldVisual(sprite)
        break
        
      case PowerUpType.CLOCK:
        this.applyClockVisual(sprite)
        break
        
      case PowerUpType.GUN:
        this.applyGunVisual(sprite)
        break
        
      case PowerUpType.HOMING:
        this.applyHomingVisual(sprite)
        break
        
      case PowerUpType.BOMB:
        this.applyBombVisual(sprite)
        break
        
      case PowerUpType.SPEED:
        this.applySpeedVisual(sprite)
        break
        
      case PowerUpType.HEALTH:
        this.applyHealthVisual(sprite)
        break
        
      case PowerUpType.ARMOR:
        this.applyArmorVisual(sprite)
        break
        
      case PowerUpType.GRENADE:
        this.applyGrenadeVisual(sprite)
        break
        
      case PowerUpType.INVINCIBLE:
        this.applyInvincibleVisual(sprite)
        break
        
      case PowerUpType.LIFE:
        this.applyLifeVisual(sprite)
        break
    }
  }
  
  /**
   * STAR - 火力升级（金色边框 + 闪烁）
   */
  private applyStarVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    // 添加金色光晕
    sprite.setPostPipeline('FXPipeline', {
      glowColor: 0xFFFF00,
      glowStrength: 0.3
    })
    
    // 持续闪烁
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    console.log('⭐ 火力升级视觉效果已应用')
  }
  
  /**
   * SHIELD - 护盾（蓝色透明圆罩）
   */
  private applyShieldVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    // 创建护盾图形
    const shield = this.scene.add.graphics()
    shield.lineStyle(2, 0x00FF00, 0.8)
    shield.strokeCircle(sprite.x, sprite.y, 40)
    
    // 存储到列表
    let attached = sprite.getData('attachedObjects') as Phaser.GameObjects.GameObject[] || []
    attached.push(shield)
    sprite.setData('attachedObjects', attached)
    
    // 旋转护盾
    this.scene.tweens.add({
      targets: shield,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })
    
    console.log('🛡️ 护盾视觉效果已应用')
  }
  
  /**
   * CLOCK - 时间冻结（紫色光环）
   */
  private applyClockVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setPostPipeline('FXPipeline', {
      glowColor: 0x0000FF,
      glowStrength: 0.5
    })
    
    console.log('🕐 时间冻结视觉效果已应用')
  }
  
  /**
   * GUN - 散弹枪（橙色火焰效果）
   */
  private applyGunVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const barrelGlow = this.scene.add.circle(sprite.x, sprite.y - 30, 5, 0xFFA500, 0.8)
    
    let attached = sprite.getData('attachedObjects') as Phaser.GameObjects.GameObject[] || []
    attached.push(barrelGlow)
    sprite.setData('attachedObjects', attached)
    
    console.log('🔫 散弹枪视觉效果已应用')
  }
  
  /**
   * HOMING - 追踪导弹（青色尾焰）
   */
  private applyHomingVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const particles = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      tint: 0x00FFFF,
      quantity: 2,
      lifespan: 300,
      followOffset: { x: 0, y: -30 }
    })
    
    let emitters = sprite.getData('particleEmitters') as Phaser.GameObjects.Particles.ParticleEmitter[] || []
    emitters.push(particles)
    sprite.setData('particleEmitters', emitters)
    
    console.log('🚀 追踪导弹视觉效果已应用')
  }
  
  /**
   * BOMB - 全屏炸弹（红色闪光）
   */
  private applyBombVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xFF0000,
      0.5
    )
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy()
    })
    
    console.log('💣 全屏炸弹视觉效果已应用')
  }
  
  /**
   * SPEED - 速度提升（白色拖尾）
   */
  private applySpeedVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const trail = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      tint: 0xFFFFFF,
      quantity: 5,
      lifespan: 400,
      followOffset: { x: 0, y: 20 }
    })
    
    let emitters = sprite.getData('particleEmitters') as Phaser.GameObjects.Particles.ParticleEmitter[] || []
    emitters.push(trail)
    sprite.setData('particleEmitters', emitters)
    
    console.log('💨 速度提升视觉效果已应用')
  }
  
  /**
   * HEALTH - 生命恢复（粉色爱心）
   */
  private applyHealthVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const heartText = this.scene.add.text(
      sprite.x,
      sprite.y - 40,
      '+50 HP',
      {
        fontSize: '24px',
        color: '#FF69B4',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5)
    
    this.scene.tweens.add({
      targets: heartText,
      y: sprite.y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => heartText.destroy()
    })
    
    console.log('❤️ 生命恢复视觉效果已应用')
  }
  
  /**
   * ARMOR - 装甲强化（银色金属光泽）
   */
  private applyArmorVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setTint(0xC0C0C0)
    
    console.log('🛡️ 装甲强化视觉效果已应用')
  }
  
  /**
   * GRENADE - 手榴弹（棕色烟雾）
   */
  private applyGrenadeVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const smoke = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 30, max: 60 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'NORMAL',
      tint: 0x8B4513,
      quantity: 10,
      lifespan: 800,
      followOffset: { x: 0, y: 0 }
    })
    
    let emitters = sprite.getData('particleEmitters') as Phaser.GameObjects.Particles.ParticleEmitter[] || []
    emitters.push(smoke)
    sprite.setData('particleEmitters', emitters)
    
    console.log('💣 手榴弹视觉效果已应用')
  }
  
  /**
   * INVINCIBLE - 无敌状态（金色旋转光环）
   */
  private applyInvincibleVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    sprite.setPostPipeline('FXPipeline', {
      glowColor: 0xFFD700,
      glowStrength: 0.8
    })
    
    // 创建旋转光环
    const halo = this.scene.add.graphics()
    halo.lineStyle(3, 0xFFD700, 1.0)
    halo.strokeCircle(sprite.x, sprite.y, 45)
    
    let attached = sprite.getData('attachedObjects') as Phaser.GameObjects.GameObject[] || []
    attached.push(halo)
    sprite.setData('attachedObjects', attached)
    
    this.scene.tweens.add({
      targets: halo,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    })
    
    console.log('✨ 无敌状态视觉效果已应用')
  }
  
  /**
   * LIFE - 额外生命（红色大爱心）
   */
  private applyLifeVisual(sprite: Phaser.Physics.Arcade.Sprite): void {
    const heart = this.scene.add.text(
      sprite.x,
      sprite.y - 40,
      '❤️',
      {
        fontSize: '48px'
      }
    ).setOrigin(0.5)
    
    this.scene.tweens.add({
      targets: heart,
      y: sprite.y - 80,
      scale: 1.5,
      alpha: 0,
      duration: 2000,
      onComplete: () => heart.destroy()
    })
    
    console.log('🎈 额外生命视觉效果已应用')
  }
  
  /**
   * 应用属性加成
   */
  private applyAttributeBuff(type: PowerUpType, player: any): void {
    switch (type) {
      case PowerUpType.STAR:
        player.upgradeWeapon?.()
        break
        
      case PowerUpType.SHIELD:
        player.activateShield?.()
        break
        
      case PowerUpType.CLOCK:
        this.scene.events.emit('freezeAllEnemies', { duration: 8000 })
        break
        
      case PowerUpType.GUN:
        player.activateShotgun?.()
        break
        
      case PowerUpType.HOMING:
        player.activateHomingMissile?.()
        break
        
      case PowerUpType.BOMB:
        this.scene.events.emit('explodeAllEnemies')
        break
        
      case PowerUpType.SPEED:
        player.setSpeedMultiplier?.(1.5)
        break
        
      case PowerUpType.HEALTH:
        player.heal?.(50)
        break
        
      case PowerUpType.ARMOR:
        player.addArmor?.(50)
        break
        
      case PowerUpType.GRENADE:
        player.throwGrenade?.()
        break
        
      case PowerUpType.INVINCIBLE:
        player.setInvincible?.()
        break
        
      case PowerUpType.LIFE:
        player.addLife?.(1)
        break
    }
  }
  
  /**
   * 播放音效
   */
  private playSoundEffect(): void {
    try {
      this.scene.sound.play('powerup_pickup', { volume: 0.5 })
    } catch (e) {
      // 音效不存在时忽略
    }
  }
}
