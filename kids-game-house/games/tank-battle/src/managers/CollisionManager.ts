// ============================================================================
// 💥 碰撞管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理所有碰撞检测逻辑，避免在 Scene 中散落多处
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityType } from './EntityManager'
import { PlayerState } from './PlayerStateManager'

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
    // 玩家 vs 墙壁
    this.setupPlayerVsWall()
    // 敌人 vs 墙壁
    this.setupEnemyVsWall()
    // 玩家子弹 vs 墙壁
    this.setupPlayerBulletVsWall()
    // 敌人子弹 vs 墙壁
    this.setupEnemyBulletVsWall()
    // 玩家子弹 vs 敌人
    this.setupPlayerBulletVsEnemy()
    // 敌人子弹 vs 玩家
    this.setupEnemyBulletVsPlayer()
    // 玩家 vs 敌人
    this.setupPlayerVsEnemy()
    // 敌人子弹 vs 基地
    this.setupEnemyBulletVsBase()
    // 玩家 vs 道具
    this.setupPlayerVsPowerUp()
  }
  
  // ===========================================================================
  // 🔧 具体碰撞设置方法
  // ===========================================================================
  
  /**
   * 玩家子弹 vs 墙壁
   */
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
  
  /**
   * 敌人子弹 vs 墙壁
   */
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
  
  /**
   * 玩家子弹 vs 敌人
   */
  private setupPlayerBulletVsEnemy(): void {
    const physics = (this.scene as any).physics
    const bullets = (this.scene as any).bullets
    const entityManager = (this.scene as any).entityManager
    
    if (!physics || !bullets || !entityManager) return
    
    // 为每种敌人类型设置碰撞
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
  
  /**
   * 敌人子弹 vs 玩家
   */
  private setupEnemyBulletVsPlayer(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const player = (this.scene as any).player
    
    if (!physics || !enemyBullets || !player) return
    
    this.enemyBulletPlayerCollider = physics.add.overlap(enemyBullets, player, (bullet: any) => {
      // 🔒 防御检查：子弹状态
      if (!bullet?.active) return
      
      // 🔒 防御检查：玩家引用失效
      const currentPlayer = (this.scene as any).player
      if (!currentPlayer || !currentPlayer.active) return
      
      // 🛡️ 无敌状态检测（优先检查）
      const stateManager = (this.scene as any).stateManager
      if (stateManager?.isInvincible() || stateManager?.getState() === PlayerState.RESPAWNING) {
        return
      }
      
      // 🛡️ 护盾检测（消耗护盾，子弹被销毁但不扣血）
      const combatManager = (this.scene as any).combatManager
      if (combatManager?.hasShield?.()) {
        combatManager.onHitWithBullet(bullet)
        return
      }
      
      // 🔒 防止重复命中
      if (bullet.getData('hit')) return
      bullet.setData('hit', true)
      
      // 💥 处理命中（无护盾无无敌）
      if (combatManager) combatManager.onHitWithBullet(bullet)
      else bullet.destroy()
    })
  }

  /**
   * 玩家 vs 敌人（物理碰撞触发伤害）
   */
  private setupPlayerVsEnemy(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const enemies = (this.scene as any).enemies
    
    if (!physics || !player || !enemies) return
    
    physics.add.collider(player, enemies, () => {
      if (!player.active) return
      
      const combatManager = (this.scene as any).combatManager
      if (combatManager) {
        // ✅ 护盾：消耗护盾并阻挡伤害，而不是只 return
        if (combatManager.hasShield?.()) {
          combatManager.onHitWithBullet({ destroy: () => {} } as any)
          return
        }
        if ((this.scene as any).stateManager?.isInvincible()) return
        combatManager.onHit()
      }
    })
  }
  
  /**
   * 敌人子弹 vs 基地
   */
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
  
  /**
   * 玩家 vs 道具
   */
  private setupPlayerVsPowerUp(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const powerUps = (this.scene as any).powerUps
    
    if (!physics || !player || !powerUps) return
    
    physics.add.overlap(player, powerUps, (playerObj: any, powerUp: any) => {
      if (!playerObj.active || !powerUp.active) return
      this.scene.collectPowerUp(powerUp)
      powerUp.destroy()
    })
  }
  
  /**
   * ⭐ 玩家与墙壁（物理碰撞）
   */
  private setupPlayerVsWall(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const walls = (this.scene as any).walls
    
    if (!physics || !player || !walls) return
    
    this.playerWallCollider = physics.add.collider(player, walls)
  }
  
  /**
   * ⭐ 重新绑定玩家与墙壁的碰撞（复活后调用）
   */
  public rebindPlayerWallCollision(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const walls = (this.scene as any).walls
    
    if (!physics || !player || !walls) return
    
    if (this.playerWallCollider) {
      this.playerWallCollider.destroy()
    }
    
    this.playerWallCollider = physics.add.collider(player, walls)
  }
  
  /**
   * ⭐ 重新绑定所有与玩家相关的碰撞（复活后调用）
   */
  public rebindAllPlayerCollisions(): void {
    this.rebindPlayerWallCollision()
    this.rebindPlayerVsEnemy()
    this.rebindEnemyBulletVsPlayer()
  }
  
  /**
   * ⭐ 重新绑定敌人子弹与玩家的碰撞
   */
  private rebindEnemyBulletVsPlayer(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const player = (this.scene as any).player
    
    // 🔧 销毁旧的 collider
    if (this.enemyBulletPlayerCollider) {
      this.enemyBulletPlayerCollider.destroy()
    }
    
    // ✅ 创建新的 overlap
    this.enemyBulletPlayerCollider = physics.add.overlap(enemyBullets, player, (bullet: any) => {
      // 🔒 防御检查：子弹状态
      if (!bullet?.active) return
      
      // 🔒 防御检查：玩家引用失效
      const currentPlayer = (this.scene as any).player
      if (!currentPlayer || !currentPlayer.active) return
      
      // 🛡️ 无敌状态检测（优先检查）
      const stateManager = (this.scene as any).stateManager
      if (stateManager?.isInvincible() || stateManager?.getState() === PlayerState.RESPAWNING) {
        return
      }
      
      // 🛡️ 护盾检测（消耗护盾，子弹被销毁但不扣血）
      const combatManager = (this.scene as any).combatManager
      if (combatManager?.hasShield?.()) {
        combatManager.onHitWithBullet(bullet)
        return
      }
      
      // 🔒 防止重复命中
      if (bullet.getData('hit')) return
      bullet.setData('hit', true)
      
      // 💥 处理命中（无护盾无无敌）
      if (combatManager) combatManager.onHitWithBullet(bullet)
      else bullet.destroy()
    })
  }

  /**
   * ⭐ 重新绑定玩家与敌人的碰撞
   */
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
      
      const combatManager = (this.scene as any).combatManager
      if (combatManager) {
        // ✅ 护盾：消耗护盾并阻挡伤害
        if (combatManager.hasShield?.()) {
          combatManager.onHitWithBullet({ destroy: () => {} } as any)
          return
        }
        if ((this.scene as any).stateManager?.isInvincible()) return
        combatManager.onHit()
      }
    })
  }
  
  /**
   * ⭐ 敌人与墙壁（物理碰撞）
   */
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
}
