// ============================================================================
// 💥 碰撞管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理所有碰撞检测逻辑，避免在 Scene 中散落多处
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
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    console.log('✅ CollisionManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 初始化所有碰撞
  // ===========================================================================
  
  /**
   * ⭐ 设置所有碰撞关系
   */
  setupAllCollisions(): void {
    console.log('🔧 CollisionManager: 设置所有碰撞关系')
    
    // ═══ 玩家与墙壁（物理碰撞） ═══
    this.setupPlayerVsWall()
    
    // ═══ 敌人与墙壁（物理碰撞） ═══
    this.setupEnemyVsWall()
    
    // ═══ 玩家子弹与墙壁 ═══
    this.setupPlayerBulletVsWall()
    
    // ═══ 敌人子弹与墙壁 ═══
    this.setupEnemyBulletVsWall()
    
    // ═══ 玩家子弹与敌人 ═══
    this.setupPlayerBulletVsEnemy()
    
    // ═══ 敌人子弹与玩家 ═══
    this.setupEnemyBulletVsPlayer()
    
    // ═══ 玩家与敌人（物理碰撞） ═══
    this.setupPlayerVsEnemy()
    
    // ═══ 敌人子弹与基地 ═══
    this.setupEnemyBulletVsBase()
    
    // ═══ 玩家与道具 ═══
    this.setupPlayerVsPowerUp()
    
    console.log('✅ CollisionManager: 所有碰撞关系设置完成')
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
    
    if (!physics || !bullets || !walls) {
      console.warn('⚠️ setupPlayerBulletVsWall: 缺少必要组件')
      return
    }
    
    physics.add.collider(bullets, walls, (bullet: any, wall: any) => {
      if (!bullet.active) return
      
      const bx = bullet.x, by = bullet.y
      const isSteel = wall.texture?.key === 'wall_steel'
      
      bullet.destroy()
      
      if (isSteel) {
        // 钢墙：火花 + 音效
        this.scene.spawnSparks(bx, by, '#94a3b8', 4)
        this.scene.playSound('sfx_hit', 0.2)
      } else {
        // 砖墙：摧毁 + 碎片
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
    
    if (!physics || !enemyBullets || !walls) {
      console.warn('⚠️ setupEnemyBulletVsWall: 缺少必要组件')
      return
    }
    
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
    // ✅ 直接从 EntityManager 获取所有敌人群组
    const entityManager = (this.scene as any).entityManager
    
    if (!physics || !bullets || !entityManager) {
      console.warn('⚠️ setupPlayerBulletVsEnemy: 缺少必要组件', { physics, bullets, entityManager })
      return
    }
    
    console.log('🔫 [碰撞] 设置玩家子弹 vs 敌人')
    
    // ✅ 为每种敌人类型设置碰撞
    const enemyGroups = [
      entityManager.getGroup(EntityType.ENEMY_LIGHT),
      entityManager.getGroup(EntityType.ENEMY_MEDIUM),
      entityManager.getGroup(EntityType.ENEMY_HEAVY)
    ].filter(g => g !== null)
    
    console.log(`📊 [碰撞] 找到 ${enemyGroups.length} 个敌人群组`)
    
    enemyGroups.forEach((enemyGroup, index) => {
      physics.add.overlap(bullets, enemyGroup, (bullet: any, enemy: any) => {
        if (!bullet.active) return
        
        console.log('💥 [碰撞检测] 玩家子弹击中敌人')
        
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
    const combatManager = (this.scene as any).combatManager
    
    if (!physics || !enemyBullets || !player) {
      console.warn('⚠️ setupEnemyBulletVsPlayer: 缺少必要组件')
      return
    }
    
    console.log('🔫 [碰撞] 设置敌人子弹 vs 玩家')
    
    // 🔧 关键修复：在回调中获取最新的 player，避免使用闭包中的旧引用
    // 🔧 重要：不立即销毁子弹，由 onHit 决定如何处理
    physics.add.overlap(enemyBullets, player, (bullet: any, hitPlayer: any) => {
      // 🔍 防御检查：如果子弹已经标记为待销毁，忽略
      if (!bullet || !bullet.active) {
        console.log('⚠️ [碰撞] 子弹已失效，忽略')
        return
      }
      
      console.log('💥 [碰撞检测] 敌人子弹击中玩家', { bulletId: bullet.id })
      
      // ⚔️ 调用战斗管理器处理受击（由 onHit 统一处理所有保护逻辑 + 子弹销毁）
      const combatManager = (this.scene as any).combatManager
      if (combatManager) {
        console.log('⚔️ [碰撞] 调用 combatManager.onHitWithBullet')
        combatManager.onHitWithBullet(bullet)
      } else {
        // 兜底：如果没有 combatManager，直接销毁子弹
        console.warn('⚠️ [碰撞] combatManager 不存在，直接销毁子弹')
        bullet.destroy()
      }
    })
  }
  
  /**
   * 玩家 vs 敌人（物理碰撞触发伤害）
   */
  private setupPlayerVsEnemy(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const enemies = (this.scene as any).enemies
    const combatManager = (this.scene as any).combatManager
    
    if (!physics || !player || !enemies) {
      console.warn('⚠️ setupPlayerVsEnemy: 缺少必要组件')
      return
    }
    
    physics.add.collider(player, enemies, () => {
      if (!player.active) return
      
      // ⚔️ 调用战斗管理器（与敌人坦克相撞，没有子弹参数）
      if (combatManager) {
        combatManager.onHit()  // 使用旧版本兼容方法
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
    
    if (!physics || !enemyBullets || !base) {
      console.warn('⚠️ setupEnemyBulletVsBase: 缺少必要组件')
      return
    }
    
    physics.add.overlap(enemyBullets, base, (bullet: any) => {
      if (bullet.active) {
        bullet.destroy()
      }
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
    
    if (!physics || !player || !powerUps) {
      console.warn('⚠️ setupPlayerVsPowerUp: 缺少必要组件')
      return
    }
    
    physics.add.overlap(player, powerUps, (playerObj: any, powerUp: any) => {
      if (!playerObj.active || !powerUp.active) return
      
      console.log('🎁 [碰撞检测] 玩家获得道具')
      
      // 触发道具效果
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
    
    if (!physics || !player || !walls) {
      console.warn('⚠️ setupPlayerVsWall: 缺少必要组件', { physics: !!physics, player: !!player, walls: !!walls })
      return
    }
    
    console.log('🧱 [碰撞] 设置玩家 vs 墙壁')
    
    // 🔧 关键修复：保存 collider 引用，以便复活后重新绑定
    this.playerWallCollider = physics.add.collider(player, walls)
  }
  
  /**
   * ⭐ 重新绑定玩家与墙壁的碰撞（复活后调用）
   */
  public rebindPlayerWallCollision(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const walls = (this.scene as any).walls
    
    if (!physics || !player || !walls) {
      console.warn('⚠️ rebindPlayerWallCollision: 缺少必要组件')
      return
    }
    
    // 🔧 销毁旧的 collider
    if (this.playerWallCollider) {
      this.playerWallCollider.destroy()
    }
    
    // ✅ 创建新的 collider
    this.playerWallCollider = physics.add.collider(player, walls)
    console.log('🔄 [碰撞] 已重新绑定玩家 vs 墙壁碰撞器')
  }
  
  /**
   * ⭐ 重新绑定所有与玩家相关的碰撞（复活后调用）
   */
  public rebindAllPlayerCollisions(): void {
    console.log('🔄 [碰撞] 开始重新绑定所有玩家碰撞器')
    
    // 1. 玩家 vs 墙壁
    this.rebindPlayerWallCollision()
    
    // 2. 玩家 vs 敌人
    this.rebindPlayerVsEnemy()
    
    // 3. 敌人子弹 vs 玩家
    this.rebindEnemyBulletVsPlayer()
    
    console.log('✅ [碰撞] 所有玩家碰撞器已重新绑定')
  }
  
  /**
   * ⭐ 重新绑定玩家与敌人的碰撞
   */
  private rebindPlayerVsEnemy(): void {
    const physics = (this.scene as any).physics
    const player = (this.scene as any).player
    const enemies = (this.scene as any).enemies
    const combatManager = (this.scene as any).combatManager
    
    if (!physics || !player || !enemies) {
      console.warn('⚠️ rebindPlayerVsEnemy: 缺少必要组件')
      return
    }
    
    // 🔧 销毁旧的 collider
    if (this.playerEnemyCollider) {
      this.playerEnemyCollider.destroy()
    }
    
    // ✅ 创建新的 collider
    this.playerEnemyCollider = physics.add.collider(player, enemies, () => {
      if (!player.active) return
      
      // ⚔️ 调用战斗管理器（与敌人坦克相撞，没有子弹参数）
      if (combatManager) {
        combatManager.onHit()  // 使用旧版本兼容方法
      }
    })
    
    console.log('🛡️ [碰撞] 已重新绑定玩家 vs 敌人碰撞器')
  }
  
  /**
   * ⭐ 重新绑定敌人子弹与玩家的碰撞
   */
  private rebindEnemyBulletVsPlayer(): void {
    const physics = (this.scene as any).physics
    const enemyBullets = (this.scene as any).enemyBullets
    const player = (this.scene as any).player
    const combatManager = (this.scene as any).combatManager
    
    if (!physics || !enemyBullets || !player) {
      console.warn('⚠️ rebindEnemyBulletVsPlayer: 缺少必要组件')
      return
    }
    
    // ✅ 创建新的 overlap（不需要保存引用）
    physics.add.overlap(enemyBullets, player, (bullet: any, hitPlayer: any) => {
      console.log('💥 [碰撞检测] 敌人子弹击中玩家')
      
      // ⚔️ 调用战斗管理器处理受击（由 onHit 统一处理所有保护逻辑 + 子弹销毁）
      const combatManager = (this.scene as any).combatManager
      if (combatManager) {
        combatManager.onHitWithBullet(bullet)
      } else {
        // 兜底：如果没有 combatManager，直接销毁子弹
        bullet.destroy()
      }
    })
    
    console.log('🔫 [碰撞] 已重新绑定敌人子弹 vs 玩家')
  }
  
  /**
   * ⭐ 敌人与墙壁（物理碰撞）
   */
  private setupEnemyVsWall(): void {
    const physics = (this.scene as any).physics
    const entityManager = (this.scene as any).entityManager
    const walls = (this.scene as any).walls
    
    if (!physics || !entityManager || !walls) {
      console.warn('⚠️ setupEnemyVsWall: 缺少必要组件', { physics: !!physics, entityManager: !!entityManager, walls: !!walls })
      return
    }
    
    console.log('🧱 [碰撞] 设置敌人 vs 墙壁')
    
    // 为所有敌人群组设置碰撞
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
