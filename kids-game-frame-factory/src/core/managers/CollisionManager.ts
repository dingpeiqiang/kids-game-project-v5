// ============================================================================
// 💥 碰撞管理器 - 统一管理所有碰撞关系
// ============================================================================
// 
// 📌 说明:
//   将所有碰撞检测集中到一个类中，提高可维护性
//   提供一键设置所有碰撞的方法
// ============================================================================

import { IGameManager } from './IGameManager'
import type { EntityManager } from './EntityManager'
import type { PowerUpEntity } from '../entities/PowerUpEntity'

/**
 * ⭐ 碰撞管理器
 */
export class CollisionManager implements IGameManager {
  protected scene: Phaser.Scene
  protected entityManager: EntityManager
  
  constructor(scene: Phaser.Scene, entityManager: EntityManager) {
    this.scene = scene
    this.entityManager = entityManager
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化
   */
  init(): void {
    console.log('✅ [CollisionManager] 已创建')
  }
  
  /**
   * ⭐ 每帧更新
   */
  update?(_time: number, _delta: number): void {
    // CollisionManager 不需要每帧更新
  }
  
  /**
   * ⭐ 销毁清理
   */
  destroy(): void {
    console.log('🗑️ [CollisionManager] 销毁')
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 设置所有碰撞关系
   * 
   * @remarks
   * 一键配置所有必需的碰撞检测
   */
  setupAllCollisions(): void {
    console.log('🔧 [CollisionManager] 设置所有碰撞关系')
    
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
    
    console.log('✅ [CollisionManager] 所有碰撞关系已设置')
  }
  
  // ===========================================================================
  // 🔧 内部方法 - 具体碰撞设置
  // ===========================================================================
  
  /**
   * 设置玩家子弹与墙壁的碰撞
   */
  protected setupPlayerBulletVsWall(): void {
    this.scene.physics.add.collider(
      this.entityManager.bullets,
      this.entityManager.walls,
      (bulletObj: any, wallObj: any) => {
        // 子弹击中墙壁，销毁子弹
        if (bulletObj && bulletObj.destroy) {
          bulletObj.destroy()
        }
        console.log('💥 玩家子弹击中墙壁')
      }
    )
  }
  
  /**
   * 设置敌人子弹与墙壁的碰撞
   */
  protected setupEnemyBulletVsWall(): void {
    this.scene.physics.add.collider(
      this.entityManager.bullets,
      this.entityManager.walls,
      (bulletObj: any, wallObj: any) => {
        // 子弹击中墙壁，销毁子弹
        if (bulletObj && bulletObj.destroy) {
          bulletObj.destroy()
        }
        console.log('💥 敌人子弹击中墙壁')
      }
    )
  }
  
  /**
   * 设置玩家子弹与敌人的碰撞
   */
  protected setupPlayerBulletVsEnemy(): void {
    this.scene.physics.add.overlap(
      this.entityManager.bullets,
      this.entityManager.enemies,
      (bulletObj: any, enemyObj: any) => {
        console.log('💥 玩家子弹击中敌人')
        // 销毁子弹
        if (bulletObj && bulletObj.destroy) {
          bulletObj.destroy()
        }
        // TODO: 对敌人造成伤害（需要通过 EntityManager 获取实体）
      }
    )
  }
  
  /**
   * 设置敌人子弹与玩家的碰撞
   */
  protected setupEnemyBulletVsPlayer(): void {
    this.scene.physics.add.overlap(
      this.entityManager.bullets,
      this.entityManager.players,
      (bulletObj: any, playerObj: any) => {
        console.log('💥 敌人子弹击中玩家')
        // 销毁敌人子弹
        if (bulletObj && bulletObj.destroy) {
          bulletObj.destroy()
        }
        // TODO: 对玩家造成伤害（需要调用 PlayerCombatManager.onHit）
      }
    )
  }
  
  /**
   * 设置玩家与敌人的物理碰撞
   */
  protected setupPlayerVsEnemy(): void {
    this.scene.physics.add.collider(
      this.entityManager.players,
      this.entityManager.enemies,
      (playerObj: any, enemyObj: any) => {
        console.log('💥 玩家撞到敌人')
        // TODO: 对双方造成伤害
      }
    )
  }
  
  /**
   * 设置敌人子弹与基地的碰撞
   */
  protected setupEnemyBulletVsBase(): void {
    this.scene.physics.add.collider(
      this.entityManager.bullets,
      this.entityManager.walls,
      (bulletObj: any, wallObj: any) => {
        // 检查是否是基地
        // TODO: 如果是基地，游戏结束
        console.log('💥 子弹击中基地')
      }
    )
  }
  
  /**
   * 设置玩家与道具的碰撞
   */
  protected setupPlayerVsPowerUp(): void {
    this.scene.physics.add.overlap(
      this.entityManager.players,
      this.entityManager.powerUps,
      (playerObj: any, powerUpObj: any) => {
        console.log('🎁 玩家拾取道具')
        
        // 获取道具实体并处理拾取
        const powerUpEntity = powerUpObj.getData('entity') as PowerUpEntity
        if (powerUpEntity && !powerUpEntity.isCollected) {
          // 通过 PowerUpManager 处理拾取
          console.log(`🎁 [CollisionManager] 检测到道具拾取：${powerUpEntity.type}`)
        }
      }
    )
  }
}
