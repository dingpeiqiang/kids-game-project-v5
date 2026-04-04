// ============================================================================
// 💥 碰撞管理器
// ============================================================================
//
// 📌 说明:
//   统一管理所有碰撞检测逻辑
//   ⭐ 重构后：所有玩家受伤逻辑收口到 PlayerController.takeDamage()
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityType } from './EntityManager'

/**
 * ⭐ 碰撞管理器
 */
export class CollisionManager {
  private scene: TankGameScene

  // 🔧 保存 collider 引用，以便复活后重新绑定
  private playerWallCollider!: Phaser.Physics.Arcade.Collider
  private playerEnemyCollider!: Phaser.Physics.Arcade.Collider
  private enemyBulletPlayerCollider!: Phaser.Physics.Arcade.Collider

  constructor(scene: TankGameScene) {
    this.scene = scene
  }

  // ===========================================================================
  // 🎯 初始化所有碰撞
  // ===========================================================================

  /**
   * ⭐ 设置所有碰撞关系
   */
  setupAllCollisions(): void {
    this.setupPlayerVsWall()
    this.setupEnemyVsWall()
    this.setupPlayerBulletVsWall()
    this.setupEnemyBulletVsWall()
    this.setupPlayerBulletVsEnemy()
    this.setupEnemyBulletVsPlayer()
    this.setupPlayerVsEnemy()
    this.setupEnemyBulletVsBase()
    this.setupPlayerVsPowerUp()
  }

  // ===========================================================================
  // 🔧 玩家受伤碰撞（全部收口到 PlayerController.takeDamage）
  // ===========================================================================

  /**
   * ⭐ 敌人子弹 vs 玩家
   * 所有伤害判断（护盾/无敌/护甲/死亡）由 PlayerController 内部处理
   */
  private setupEnemyBulletVsPlayer(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const player = (this.scene as any).player

    if (!physics || !enemyBullets || !player) return

    this.enemyBulletPlayerCollider = physics.add.overlap(enemyBullets, player, (bullet: any) => {
      if (!bullet?.active) return

      const currentPlayer = (this.scene as any).player
      if (!currentPlayer || !currentPlayer.active) {
        bullet.destroy()
        return
      }

      // ⭐ 唯一入口：PlayerController.takeDamage()
      const controller = (this.scene as any).playerController
      if (controller) {
        controller.takeDamage('bullet', bullet)
      } else {
        bullet.destroy()
      }
    })
  }

  /**
   * ⭐ 玩家 vs 敌人（物理碰撞）
   */
  private setupPlayerVsEnemy(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const enemies = (this.scene as any).enemies

    if (!physics || !player || !enemies) return

    this.playerEnemyCollider = physics.add.collider(player, enemies, () => {
      if (!player.active) return

      // ⭐ 唯一入口：PlayerController.takeDamage()
      const controller = (this.scene as any).playerController
      if (controller) {
        controller.takeDamage('collision')
      }
    })
  }

  // ===========================================================================
  // 🔧 其他碰撞（不涉及玩家状态变更）
  // ===========================================================================

  private setupPlayerBulletVsWall(): void {
    const physics = (this.scene as any).physics
    const bullets = (this.scene as any).bullets
    const walls = (this.scene as any).walls

    if (!physics || !bullets || !walls) return

    physics.add.collider(bullets, walls, (bullet: any, wall: any) => {
      if (!bullet.active) return

      const bx = bullet.x, by = bullet.y
      const isSteel = wall.texture?.key === 'wall_steel'
      bullet.destroy()

      if (isSteel) {
        this.scene.spawnSparks(bx, by, '#94a3b8', 4)
        this.scene.playSound('sfx_hit', 0.2)
      } else {
        wall.destroy()
        this.scene.spawnDebris(bx, by, '#8B4513')
        this.scene.playSound('sfx_explosion', 0.4)
        this.scene.cameraShake(100)
      }
    })
  }

  private setupEnemyBulletVsWall(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const walls = (this.scene as any).walls

    if (!physics || !enemyBullets || !walls) return

    physics.add.collider(enemyBullets, walls, (bullet: any, wall: any) => {
      if (!bullet.active) return

      const bx = bullet.x, by = bullet.y
      const isSteel = wall.texture?.key === 'wall_steel'
      bullet.destroy()

      if (isSteel) {
        this.scene.spawnSparks(bx, by, '#94a3b8', 4)
        this.scene.playSound('sfx_hit', 0.2)
      } else {
        wall.destroy()
        this.scene.spawnDebris(bx, by, '#8B4513')
        this.scene.playSound('sfx_explosion', 0.3)
      }
    })
  }

  private setupPlayerBulletVsEnemy(): void {
    const physics = (this.scene as any).physics
    const bullets = (this.scene as any).bullets
    const entityManager = (this.scene as any).entityManager

    if (!physics || !bullets || !entityManager) return

    const enemyGroups = [
      entityManager.getGroup(EntityType.ENEMY_LIGHT),
      entityManager.getGroup(EntityType.ENEMY_MEDIUM),
      entityManager.getGroup(EntityType.ENEMY_HEAVY)
    ].filter(g => g !== null)

    enemyGroups.forEach((enemyGroup) => {
      physics.add.overlap(bullets, enemyGroup, (bullet: any, enemy: any) => {
        if (!bullet.active) return
        bullet.destroy()
        this.scene.destroyEnemy(enemy)
      })
    })
  }

  private setupEnemyBulletVsBase(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const base = (this.scene as any).base

    if (!physics || !enemyBullets || !base) return

    physics.add.overlap(enemyBullets, base, (bullet: any) => {
      if (bullet.active) bullet.destroy()
      this.scene.baseDestroyed()
    })
  }

  private setupPlayerVsPowerUp(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const powerUps = (this.scene as any).powerUps

    if (!physics || !player || !powerUps) return

    physics.add.overlap(player, powerUps, (_playerObj: any, powerUp: any) => {
      if (!powerUp.active) return
      this.scene.collectPowerUp(powerUp)
      powerUp.destroy()
    })
  }

  private setupPlayerVsWall(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const walls = (this.scene as any).walls

    if (!physics || !player || !walls) return

    this.playerWallCollider = physics.add.collider(player, walls)
  }

  private setupEnemyVsWall(): void {
    const physics = (this.scene as any).physics
    const entityManager = (this.scene as any).entityManager
    const walls = (this.scene as any).walls

    if (!physics || !entityManager || !walls) return

    const enemyGroups = [
      entityManager.getGroup(EntityType.ENEMY_LIGHT),
      entityManager.getGroup(EntityType.ENEMY_MEDIUM),
      entityManager.getGroup(EntityType.ENEMY_HEAVY)
    ].filter(g => g !== null)

    enemyGroups.forEach(enemyGroup => {
      physics.add.collider(enemyGroup, walls)
    })
  }

  // ===========================================================================
  // 🔄 碰撞重新绑定（复活后调用）
  // ===========================================================================

  public rebindPlayerCollisions(): void {
    this.rebindPlayerWallCollision()
    this.rebindPlayerVsEnemy()
    this.rebindEnemyBulletVsPlayer()
  }

  private rebindPlayerWallCollision(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const walls = (this.scene as any).walls

    if (!physics || !player || !walls) return

    if (this.playerWallCollider) {
      this.playerWallCollider.destroy()
    }

    this.playerWallCollider = physics.add.collider(player, walls)
  }

  private rebindEnemyBulletVsPlayer(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const player = (this.scene as any).player

    if (this.enemyBulletPlayerCollider) {
      this.enemyBulletPlayerCollider.destroy()
    }

    this.enemyBulletPlayerCollider = physics.add.overlap(enemyBullets, player, (bullet: any) => {
      if (!bullet?.active) return

      const currentPlayer = (this.scene as any).player
      if (!currentPlayer || !currentPlayer.active) {
        bullet.destroy()
        return
      }

      const controller = (this.scene as any).playerController
      if (controller) {
        controller.takeDamage('bullet', bullet)
      } else {
        bullet.destroy()
      }
    })
  }

  private rebindPlayerVsEnemy(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const enemies = (this.scene as any).enemies

    if (!physics || !player || !enemies) return

    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.destroy()
    }

    this.playerEnemyCollider = physics.add.collider(player, enemies, () => {
      if (!player.active) return

      const controller = (this.scene as any).playerController
      if (controller) {
        controller.takeDamage('collision')
      }
    })
  }
}
