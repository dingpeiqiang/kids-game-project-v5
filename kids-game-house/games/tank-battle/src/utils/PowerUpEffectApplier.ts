// ============================================================================
// 🎁 坦克大战道具效果实现器（重构版）
// ============================================================================
// 
// 📌 说明:
//   为坦克应用各种道具的视觉效果和属性加成
//   - 激活效果：拾取瞬间的强烈视觉冲击（由 TankGameScene.spawnPowerUpEffect 处理）
//   - 持续效果：道具生效期间坦克上的持续视觉标识
// ============================================================================

import { PowerUpType } from '../types/powerup-types'

/**
 * 持续效果标识（附着在坦克上的可见图形）
 */
interface IActiveEffect {
  graphics?: Phaser.GameObjects.Graphics
  text?: Phaser.GameObjects.Text
  tween?: Phaser.Tweens.Tween
  timer?: Phaser.Time.TimerEvent
}

/**
 * ⭐ 道具效果实现器（重构版）
 */
export class PowerUpEffectApplier {
  private scene: Phaser.Scene
  private combatManager: any = null
  private movementManager: any = null
  
  // 当前激活的持续效果
  private activeEffects: Map<PowerUpType, IActiveEffect> = new Map()
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    const tankScene = scene as any
    if (tankScene.combatManager) this.combatManager = tankScene.combatManager
    if (tankScene.movementManager) this.movementManager = tankScene.movementManager
    
    console.log('✅ [PowerUpEffectApplier] 已创建')
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 应用道具效果（总入口）
   * 注意：激活动画和拾取特效由 TankGameScene 处理
   * 这里只负责：① 属性加成逻辑 ② 持续期间的坦克视觉标识
   */
  applyEffect(type: PowerUpType, sprite: Phaser.Physics.Arcade.Sprite, player: any): void {
    console.log(`🎁 [PowerUpEffectApplier] 应用 ${type} 效果`)
    
    // 1. 应用属性加成（游戏逻辑）
    this.applyAttributeBuff(type, player)
    
    // 2. 持续视觉标识（跟随坦克的图标/光圈）
    this.startPersistentVisual(type, player)
  }
  
  /**
   * ⭐ 移除道具的持续视觉效果
   */
  removeVisualEffects(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite) return
    
    // 清除所有持续效果
    this.activeEffects.forEach((effect, type) => {
      this.clearEffect(effect)
    })
    this.activeEffects.clear()
    
    // 清除 tint
    if (sprite.active) sprite.clearTint()
    
    console.log('🗑️ [PowerUpEffectApplier] 已清除所有视觉效果')
  }
  
  // ===========================================================================
  // 🔧 持续视觉标识（附着在坦克上）
  // ===========================================================================

  /**
   * 开始持续视觉标识
   */
  private startPersistentVisual(type: PowerUpType, tank: Phaser.Physics.Arcade.Sprite): void {
    // 清除同类旧效果
    if (this.activeEffects.has(type)) {
      this.clearEffect(this.activeEffects.get(type)!)
    }
    
    switch (type) {
      case PowerUpType.SHIELD:
        this.showShieldOrbit(tank, 0x00BFFF, type)
        break
        
      case PowerUpType.INVINCIBLE:
        this.showShieldOrbit(tank, 0xFFD700, type)
        this.pulseEffect(tank, 0xFFD700, type)
        break
        
      case PowerUpType.STAR:
      case PowerUpType.GUN:
        this.pulseEffect(tank, 0xFFFF00, type)
        break
        
      case PowerUpType.SPEED:
        this.pulseEffect(tank, 0x88FF88, type)
        break
        
      case PowerUpType.CLOCK:
        this.showStatusText(tank, '⏰', 0xBF00FF, type, 8000)
        break
        
      case PowerUpType.BOMB:
      case PowerUpType.GRENADE:
        // 爆炸类：只有激活时的瞬时特效，无持续效果
        break
        
      case PowerUpType.HEALTH:
      case PowerUpType.LIFE:
        // 一次性回复，无持续效果
        break
        
      case PowerUpType.ARMOR:
        this.pulseEffect(tank, 0xC0C0C0, type)
        break
        
      case PowerUpType.HOMING:
        this.pulseEffect(tank, 0x00FFFF, type)
        break
    }
  }

  /**
   * 护盾旋转光圈（真正跟随坦克）
   */
  private showShieldOrbit(tank: Phaser.Physics.Arcade.Sprite, color: number, type: PowerUpType): void {
    const effect: IActiveEffect = {}
    
    // 创建护盾图形（在坦克周围的圆圈）
    const g = this.scene.add.graphics()
    g.lineStyle(3, color, 0.9)
    g.strokeCircle(0, 0, 42)
    // 加一个小一点的内圈
    g.lineStyle(1, color, 0.4)
    g.strokeCircle(0, 0, 38)
    g.setDepth(100)
    effect.graphics = g

    // 旋转 tween
    const tween = this.scene.tweens.add({
      targets: g,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    })
    effect.tween = tween

    // 每帧跟随坦克（用 timer 轮询，避免 update hook 复杂性）
    const followTimer = this.scene.time.addEvent({
      delay: 16,
      repeat: -1,
      callback: () => {
        if (!tank.active || !g.active) {
          followTimer.remove()
          return
        }
        g.x = tank.x
        g.y = tank.y
      }
    })
    effect.timer = followTimer
    
    this.activeEffects.set(type, effect)
  }

  /**
   * 坦克闪烁颜色脉冲（持续型）
   * 注意：duration 由管理器或道具逻辑控制，这里只做视觉
   */
  private pulseEffect(tank: Phaser.Physics.Arcade.Sprite, color: number, type: PowerUpType): void {
    const effect: IActiveEffect = {}
    
    const tween = this.scene.tweens.add({
      targets: tank,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => {
        if (tank.active) tank.setTint(color)
      },
      onRepeat: () => {
        if (tank.active) tank.clearTint()
      }
    })
    effect.tween = tween
    
    this.activeEffects.set(type, effect)
  }

  /**
   * 显示状态图标文字（跟随坦克）
   */
  private showStatusText(
    tank: Phaser.Physics.Arcade.Sprite,
    icon: string,
    color: number,
    type: PowerUpType,
    duration: number
  ): void {
    const effect: IActiveEffect = {}
    
    const colorHex = '#' + color.toString(16).padStart(6, '0')
    const text = this.scene.add.text(tank.x, tank.y - 50, icon, {
      fontSize: '28px',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(200)
    effect.text = text
    
    // 跟随坦克
    const followTimer = this.scene.time.addEvent({
      delay: 16,
      repeat: -1,
      callback: () => {
        if (!tank.active || !text.active) {
          followTimer.remove()
          return
        }
        text.x = tank.x
        text.y = tank.y - 50
      }
    })
    effect.timer = followTimer
    
    // duration 后自动消失
    this.scene.time.delayedCall(duration, () => {
      this.clearEffect(effect)
      this.activeEffects.delete(type)
    })
    
    this.activeEffects.set(type, effect)
  }

  /**
   * 清除单个效果
   */
  private clearEffect(effect: IActiveEffect): void {
    effect.tween?.stop()
    effect.timer?.remove()
    if (effect.graphics?.active) effect.graphics.destroy()
    if (effect.text?.active) effect.text.destroy()
  }
  
  // ===========================================================================
  // 🔧 属性加成逻辑
  // ===========================================================================
  
  /**
   * 应用属性加成
   */
  private applyAttributeBuff(type: PowerUpType, player: any): void {
    console.log(`💪 [PowerUpEffectApplier] 应用 ${type} 属性加成`)
    
    switch (type) {
      case PowerUpType.STAR:
        if (this.combatManager?.activateUpgrade) {
          this.combatManager.activateUpgrade()
          console.log('⭐ 火力升级效果已触发')
        }
        break
        
      case PowerUpType.SHIELD:
        if (this.combatManager?.activateShieldPowerUp) {
          this.combatManager.activateShieldPowerUp()
          console.log('🛡️ 护盾效果已触发')
        }
        break
        
      case PowerUpType.CLOCK:
        this.scene.events.emit('freezeAllEnemies', { duration: 8000 })
        console.log('🕐 时间冻结效果已触发')
        break
        
      case PowerUpType.GUN:
        if (this.combatManager?.activateShotgun) {
          this.combatManager.activateShotgun()
          console.log('🔫 散弹枪效果已触发')
        } else if (this.combatManager?.activateUpgrade) {
          this.combatManager.activateUpgrade()
        }
        break
        
      case PowerUpType.HOMING:
        if (this.combatManager?.activateHomingMissile) {
          this.combatManager.activateHomingMissile()
          console.log('🚀 追踪导弹效果已触发')
        }
        break
        
      case PowerUpType.BOMB:
        this.scene.events.emit('explodeAllEnemies')
        console.log('💣 全屏炸弹效果已触发')
        break
        
      case PowerUpType.SPEED:
        if (this.movementManager?.setSpeedMultiplier) {
          this.movementManager.setSpeedMultiplier(1.5)
          console.log('💨 速度提升效果已触发')
        }
        break
        
      case PowerUpType.HEALTH:
        if (this.combatManager?.addArmor) {
          this.combatManager.addArmor(50)
          console.log('❤️ 生命恢复效果已触发（护甲 +50）')
        }
        break
        
      case PowerUpType.ARMOR:
        if (this.combatManager?.addArmor) {
          this.combatManager.addArmor(100)
          console.log('🛡️ 装甲强化效果已触发（护甲 +100）')
        }
        break
        
      case PowerUpType.GRENADE:
        this.scene.events.emit('explodeAllEnemies')
        console.log('💣 手榴弹效果已触发')
        break
        
      case PowerUpType.INVINCIBLE:
        if (this.combatManager?.activateShieldPowerUp) {
          this.combatManager.activateShieldPowerUp()
          console.log('✨ 无敌状态效果已触发')
        }
        break
        
      case PowerUpType.LIFE:
        const gameStore = (this.scene as any).gameStore
        if (gameStore?.addLife) {
          gameStore.addLife(1)
          console.log('❤️ 额外生命效果已触发（生命 +1）')
        }
        break
        
      default:
        console.warn(`⚠️ 未知的道具类型：${type}`)
    }
  }
}
