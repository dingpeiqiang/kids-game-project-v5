// ============================================================================
// ⚔️ 玩家战斗管理器 —— 纯射击逻辑
// ============================================================================
//
// 📌 说明:
//   重构后的战斗管理器只做一件事：射击。
//   ❌ 不再操作 gameStore（loseLife / addLife / $patch）
//   ❌ 不再操作 player Sprite 的 setAlpha/setVisible/setActive
//   ❌ 不再包含受击/死亡/复活/道具效果等高层流程方法
//   ❌ 不再持有 isShieldActive / isFrozen 等状态标志
//
//   所有状态变更已上移到 PlayerController。
//   此类仅作为 PlayerController 的射击执行辅助。
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityManager, EntityType } from './EntityManager'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 战斗配置
 */
export interface ICombatConfig {
  shootCooldown: number       // 射击冷却时间（毫秒）
  bulletDamage: number        // 子弹伤害
  maxArmor: number            // 最大护甲层数
}

/**
 * ⭐ 玩家战斗管理器（纯射击逻辑）
 *
 * 职责：
 *   - 射击冷却管理
 *   - 子弹创建和发射
 *   - 提供配置接口（setBulletDamage / setShootCooldown）
 *
 * ⚠️ 注意：受击、护盾、死亡、复活、道具效果等逻辑已全部迁移到 PlayerController。
 */
export class PlayerCombatManager {
  private scene: TankGameScene

  // 配置
  private readonly config: ICombatConfig = {
    shootCooldown: 300,
    bulletDamage: 10,
    maxArmor: 3,
  }

  // 射击冷却
  private lastShootTime: number = 0

  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ [PlayerCombatManager] 已创建 —— 纯射击逻辑')
  }

  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================

  /**
   * ⭐ 尝试射击
   *
   * @param canAct 是否可以行动（由调用方从 PlayerController.data.canAct 获取）
   * @param canShoot 是否可以射击（由调用方从 PlayerController.data.canShoot 获取）
   */
  tryShoot(canAct: boolean, canShoot: boolean): boolean {
    if (!canAct || !canShoot) return false

    const now = Date.now()
    if (now - this.lastShootTime < this.config.shootCooldown) return false

    this.lastShootTime = now
    this.performShoot()
    return true
  }

  // ===========================================================================
  // ⚙️ 配置接口（由 PlayerController 调用）
  // ===========================================================================

  /**
   * ⭐ 设置射击冷却
   */
  setShootCooldown(cooldown: number): void {
    this.config.shootCooldown = cooldown
  }

  /**
   * ⭐ 设置子弹伤害
   */
  setBulletDamage(damage: number): void {
    this.config.bulletDamage = damage
  }

  /**
   * ⭐ 获取当前配置（调试用）
   */
  getConfig(): Readonly<ICombatConfig> {
    return { ...this.config }
  }

  /**
   * ⭐ 获取上次射击时间（调试用）
   */
  getLastShootTime(): number {
    return this.lastShootTime
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
          speed: bulletSpeed,
        },
        metadata: { velocity: { x: vx, y: vy } },
      })

      if (bullet?.body) {
        bullet.body.setVelocity(vx, vy)
      }
    }
  }

  // ===========================================================================
  // 🔧 重置与销毁
  // ===========================================================================

  /**
   * ⭐ 重置
   */
  reset(): void {
    this.lastShootTime = 0
  }

  /**
   * ⭐ 销毁
   */
  destroy(): void {
    this.reset()
  }
}
