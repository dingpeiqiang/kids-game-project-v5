// ============================================================================
// 🎁 坦克大战道具视觉效果实现器（纯视觉）
// ============================================================================
//
// 📌 说明:
//   重构后的效果实现器只做一件事：持续视觉标识。
//   ❌ 不再包含属性加成逻辑（已迁移到 PlayerController.applyPowerUp）
//   ❌ 不再操作 gameStore / combatManager / movementManager
//
//   属性加成由 TankGameScene.collectPowerUp → PlayerController.applyPowerUp 处理。
//   此类仅负责道具生效期间的持续视觉效果（光圈、脉冲、图标文字）。
// ============================================================================

import { PowerUpType } from '../types/powerup-types'
import { Logger } from './Logger'

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
 * ⭐ 道具视觉效果实现器（纯视觉）
 */
export class PowerUpEffectApplier {
  private scene: Phaser.Scene

  // 当前激活的持续效果
  private activeEffects: Map<PowerUpType, IActiveEffect> = new Map()

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    Logger.info('✅ [PowerUpEffectApplier] 已创建 —— 纯视觉')
  }

  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================

  /**
   * ⭐ 开始持续视觉标识
   *
   * 注意：属性加成由 PlayerController.applyPowerUp() 处理，
   *       这里只负责道具生效期间的坦克视觉标识。
   */
  startVisual(type: PowerUpType, tank: Phaser.Physics.Arcade.Sprite): void {
    Logger.debug(`🎨 [PowerUpEffectApplier] 启动 ${type} 持续视觉`)

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

      case PowerUpType.ARMOR:
        this.pulseEffect(tank, 0xC0C0C0, type)
        break

      case PowerUpType.HOMING:
        this.pulseEffect(tank, 0x00FFFF, type)
        break

      case PowerUpType.BOMB:
      case PowerUpType.GRENADE:
      case PowerUpType.HEALTH:
      case PowerUpType.LIFE:
        // 瞬时效果，无持续视觉
        break

      default:
        Logger.warn(`⚠️ 未知的道具类型：${type}`)
    }
  }

  /**
   * ⭐ 移除道具的持续视觉效果（全部）
   */
  removeVisualEffects(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite) return

    this.activeEffects.forEach((effect) => {
      this.clearEffect(effect)
    })
    this.activeEffects.clear()

    if (sprite.active) sprite.clearTint()

    Logger.debug('🗑️ [PowerUpEffectApplier] 已清除所有视觉效果')
  }

  /**
   * ⭐ 移除指定类型的持续视觉效果（护盾消耗时调用）
   */
  removeEffectByType(type: PowerUpType, sprite?: Phaser.Physics.Arcade.Sprite): void {
    const effect = this.activeEffects.get(type)
    if (effect) {
      this.clearEffect(effect)
      this.activeEffects.delete(type)
    }
    if (sprite?.active) sprite.clearTint()
    Logger.debug(`🗑️ [PowerUpEffectApplier] 清除 ${type} 视觉效果`)
  }

  // ===========================================================================
  // 🔧 持续视觉标识（附着在坦克上）
  // ===========================================================================

  /**
   * 护盾旋转光圈（真正跟随坦克）
   */
  private showShieldOrbit(tank: Phaser.Physics.Arcade.Sprite, color: number, type: PowerUpType): void {
    const effect: IActiveEffect = {}

    const g = this.scene.add.graphics()
    g.lineStyle(3, color, 0.9)
    g.strokeCircle(0, 0, 42)
    g.lineStyle(1, color, 0.4)
    g.strokeCircle(0, 0, 38)
    g.setDepth(100)
    effect.graphics = g

    const tween = this.scene.tweens.add({
      targets: g,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    })
    effect.tween = tween

    const followTimer = this.scene.time.addEvent({
      delay: 16,
      repeat: -1,
      callback: () => {
        if (!tank.active || !g.active) {
          followTimer.remove()
          if (g.active) {
            tween.stop()
            g.destroy()
          }
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
   * 坦克颜色脉冲（持续型）
   * ⚠️ 绝对不能修改 tank.alpha！alpha 由 PlayerController 状态管理专属
   *    改用 tint 颜色循环做脉冲感
   */
  private pulseEffect(tank: Phaser.Physics.Arcade.Sprite, color: number, type: PowerUpType): void {
    const effect: IActiveEffect = {}

    let tintOn = false
    const timer = this.scene.time.addEvent({
      delay: 300,
      repeat: -1,
      callback: () => {
        if (!tank.active) { timer.remove(); return }
        tintOn = !tintOn
        if (tintOn) {
          tank.setTint(color)
        } else {
          tank.clearTint()
        }
      }
    })
    effect.timer = timer

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
}
