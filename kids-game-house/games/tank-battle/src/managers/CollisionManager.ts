// ============================================================================
// 💥 碰撞管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理所有碰撞检测逻辑，避免在 Scene 中散落多处
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'

/**
 * ⭐ 碰撞管理器
 */
export class CollisionManager {
  private scene: TankGameScene
  
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
    const enemies = (this.scene as any).enemies
    
    if (!physics || !bullets || !enemies) {
      console.warn('⚠️ setupPlayerBulletVsEnemy: 缺少必要组件')
      return
    }
    
    physics.add.overlap(bullets, enemies, (bullet: any, enemy: any) => {
      if (!bullet.active) return
      
      bullet.destroy()
      this.scene.destroyEnemy(enemy)
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
    
    physics.add.overlap(enemyBullets, player, (bullet: any) => {
      // 🛡️ 关键检查：如果玩家状态无效，直接销毁子弹
      const stateManager = (this.scene as any).stateManager
      if (stateManager && !stateManager.isValid()) {
        bullet.destroy()
        return
      }
      
      // ✅ 立即销毁子弹
      bullet.destroy()
      
      // ⚔️ 调用战斗管理器处理受击
      if (combatManager) {
        combatManager.onHit()
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
      
      // ⚔️ 调用战斗管理器
      if (combatManager) {
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
    
    physics.add.overlap(player, powerUps, (_player: any, powerUp: any) => {
      this.scene.collectPowerUp(powerUp)
    })
  }
}
