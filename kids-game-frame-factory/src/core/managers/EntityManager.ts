// ============================================================================
// 📦 游戏实体管理器 - 重构版（基于独立实体类）
// ============================================================================
// 
// 📌 说明:
//   统一管理所有游戏实体的创建、销毁、状态更新
//   
// ⭐ 架构升级:
//   - 使用独立实体类（BaseEntity 及其子类）
//   - 业务逻辑与渲染层完全解耦
//   - 返回 BaseEntity 而不是 Phaser.Sprite
// ============================================================================

import { IGameManager } from './IGameManager'
import { BaseEntity, IEntityData as IBaseEntityData } from '../entities/BaseEntity'
import { PlayerEntity } from '../entities/PlayerEntity'
import { EnemyEntity, EnemyType } from '../entities/EnemyEntity'
import { BulletEntity, BulletType } from '../entities/BulletEntity'
import { WallEntity, WallType } from '../entities/WallEntity'
import { PowerUpEntity, PowerUpType } from '../entities/PowerUpEntity'

/**
 * ⭐ 实体类型枚举
 */
export enum EntityType {
  PLAYER = 'player',           // 玩家
  ENEMY = 'enemy',             // 敌人
  BULLET = 'bullet',           // 子弹
  WALL = 'wall',               // 墙壁
  POWERUP = 'powerup',         // 道具
  BASE = 'base'                // 基地
}

/**
 * ⭐ 实体数据接口（扩展自 BaseEntity）
 */
export interface IEntityData extends IBaseEntityData {
  type: EntityType              // 实体类型
  texture?: string              // 纹理 key（可选，有默认值）
}

/**
 * ⭐ 实体管理器
 * 
 * @remarks
 * 核心职责:
 * - 统一管理所有游戏实体
 * - 提供标准化的创建方法
 * - 维护实体组（用于碰撞检测）
 * - 实体生命周期管理
 */
export class EntityManager implements IGameManager {
  protected scene: Phaser.Scene
  
  // 实体索引（用于快速查找）
  private entities: Map<string, BaseEntity> = new Map()
  
  // 实体组（用于碰撞检测和批量操作）
  public players!: Phaser.Physics.Arcade.Group
  public enemies!: Phaser.Physics.Arcade.Group
  public bullets!: Phaser.Physics.Arcade.Group
  public walls!: Phaser.Physics.Arcade.StaticGroup
  public powerUps!: Phaser.Physics.Arcade.Group
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化所有实体组
   */
  init(): void {
    console.log('📦 [EntityManager] 初始化实体组...')
    
    // 创建动态物理组
    this.players = this.scene.physics.add.group()
    this.enemies = this.scene.physics.add.group()
    this.bullets = this.scene.physics.add.group()
    this.powerUps = this.scene.physics.add.group()
    
    // 创建静态物理组（墙壁不移动）
    this.walls = this.scene.physics.add.staticGroup()
    
    console.log('✅ [EntityManager] 实体组初始化完成')
  }
  
  /**
   * ⭐ 每帧更新实体
   */
  update?(_time: number, delta: number): void {
    // 更新所有存活的实体
    this.entities.forEach(entity => {
      if (entity.isAlive) {
        entity.update(delta)
      }
    })
  }
  
  /**
   * ⭐ 销毁所有实体
   */
  destroy(): void {
    console.log('🗑️ [EntityManager] 销毁所有实体...')
    
    // 销毁所有实体对象
    this.entities.forEach(entity => entity.destroy())
    this.entities.clear()
    
    // 清空所有组
    this.players.clear(true, true)
    this.enemies.clear(true, true)
    this.bullets.clear(true, true)
    this.walls.clear(true, true)
    this.powerUps.clear(true, true)
    
    console.log('✅ [EntityManager] 销毁完成')
  }
  
  // ===========================================================================
  // 📌 公共 API - 实体创建
  // ===========================================================================
  
  /**
   * ⭐ 创建实体（统一入口）
   * 
   * @param data - 实体数据
   * @returns 创建的实体对象（BaseEntity 子类）
   * 
   * @example
   * ```typescript
   * // 创建玩家
   * const player = entityManager.createEntity({
   *   type: EntityType.PLAYER,
   *   x: 400,
   *   y: 300,
   *   texture: 'player_tank_up',
   *   attributes: { health: 100, speed: 200 }
   * }) as PlayerEntity
   * 
   * // 访问业务属性（类型安全）
   * console.log(player.health)  // ✅ 100
   * player.takeDamage(10)       // ✅ 调用方法
   * ```
   */
  createEntity(data: IEntityData): BaseEntity {
    let entity: BaseEntity
    
    switch (data.type) {
      case EntityType.PLAYER:
        entity = this.createPlayer(data)
        break
      case EntityType.ENEMY:
        entity = this.createEnemy(data)
        break
      case EntityType.BULLET:
        entity = this.createBullet(data)
        break
      case EntityType.WALL:
        entity = this.createWall(data)
        break
      case EntityType.POWERUP:
        entity = this.createPowerUp(data)
        break
      case EntityType.BASE:
        entity = this.createBase(data)
        break
      default:
        throw new Error(`[EntityManager] 未知实体类型：${data.type}`)
    }
    
    // 存储引用（使用唯一 ID）
    const id = `${data.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.entities.set(id, entity)
    
    console.log(`📦 [EntityManager] 创建实体：${id} (${data.type})`)
    
    return entity
  }
  
  /**
   * ⭐ 根据 ID 获取实体
   */
  getEntity(id: string): BaseEntity | undefined {
    return this.entities.get(id)
  }
  
  /**
   * ⭐ 移除实体
   */
  removeEntity(id: string): void {
    const entity = this.entities.get(id)
    if (entity) {
      entity.destroy()
      this.entities.delete(id)
      console.log(`🗑️ [EntityManager] 移除实体：${id}`)
    }
  }
  
  /**
   * ⭐ 清空所有实体
   */
  clearAll(): void {
    this.entities.forEach(entity => entity.destroy())
    this.entities.clear()
  }
  
  // ===========================================================================
  // 📌 内部方法 - 具体创建逻辑
  // ===========================================================================
  
  /**
   * 创建玩家
   */
  protected createPlayer(data: IEntityData): PlayerEntity {
    // 1. 创建 Phaser Sprite（渲染层）
    const sprite = this.scene.physics.add.sprite(
      data.x, 
      data.y, 
      data.texture ?? 'player_tank_up'
    )
    sprite.setCollideWorldBounds(true)
    sprite.setDepth(10)
    
    // 2. 创建玩家实体（业务层）
    const player = new PlayerEntity(sprite)
    
    // 3. 应用自定义属性
    if (data.attributes) {
      if (data.attributes.health !== undefined) player.health = data.attributes.health
      if (data.attributes.speed !== undefined) player.speed = data.attributes.speed
      if (data.attributes.damage !== undefined) player.damage = data.attributes.damage
    }
    
    // 4. 添加到玩家组
    this.players.add(sprite)
    
    return player
  }
  
  /**
   * 创建敌人
   */
  protected createEnemy(data: IEntityData): EnemyEntity {
    // 1. 创建 Phaser Sprite
    const sprite = this.scene.physics.add.sprite(
      data.x, 
      data.y, 
      data.texture ?? 'enemy_tank_1'
    )
    sprite.setDepth(10)
    
    // 2. 确定敌人类型
    const enemyType = (data.attributes?.type as EnemyType) || EnemyType.LIGHT
    
    // 3. 创建敌人实体
    const enemy = new EnemyEntity(sprite, enemyType)
    
    // 4. 应用自定义属性
    if (data.attributes) {
      if (data.attributes.health !== undefined) enemy.health = data.attributes.health
      if (data.attributes.speed !== undefined) enemy.speed = data.attributes.speed
      if (data.attributes.damage !== undefined) enemy.damage = data.attributes.damage
    }
    
    // 5. 添加到敌人群组
    this.enemies.add(sprite)
    
    return enemy
  }
  
  /**
   * 创建子弹
   */
  protected createBullet(data: IEntityData): BulletEntity {
    // 1. 创建 Phaser Sprite
    const sprite = this.scene.physics.add.sprite(
      data.x, 
      data.y, 
      data.texture ?? 'bullet_player'
    )
    sprite.setScale(0.5)
    sprite.setDepth(5)
    
    // 2. 确定子弹类型
    const bulletType = (data.attributes?.type as BulletType) || BulletType.PLAYER
    
    // 3. 创建子弹实体
    const bullet = new BulletEntity(sprite, bulletType)
    
    // 4. 设置速度
    if (data.attributes?.velocity) {
      const vel = data.attributes.velocity
      bullet.setVelocity(vel.x, vel.y)
    }
    
    // 5. 添加到子弹组
    this.bullets.add(sprite)
    
    return bullet
  }
  
  /**
   * 创建墙壁
   */
  protected createWall(data: IEntityData): WallEntity {
    // 1. 创建 Phaser Sprite（静态）
    const sprite = this.scene.physics.add.staticSprite(
      data.x, 
      data.y, 
      data.texture ?? 'brick_wall'
    )
    sprite.setImmovable(true)
    sprite.setDepth(1)
    
    // 2. 确定墙壁类型
    const wallType = (data.attributes?.type as WallType) || WallType.BRICK
    
    // 3. 创建墙壁实体
    const wall = new WallEntity(sprite, wallType)
    
    // 4. 添加到墙壁组
    this.walls.add(sprite)
    
    return wall
  }
  
  /**
   * 创建道具
   */
  protected createPowerUp(data: IEntityData): PowerUpEntity {
    // 1. 创建 Phaser Sprite
    const sprite = this.scene.physics.add.sprite(
      data.x, 
      data.y, 
      data.texture ?? 'prop_gun'
    )
    sprite.setImmovable(true)
    sprite.setDepth(5)
    
    // 2. 确定道具类型
    const powerUpType = (data.attributes?.type as PowerUpType) || PowerUpType.GUN
    
    // 3. 创建道具实体
    const powerUp = new PowerUpEntity(sprite, powerUpType)
    
    // 4. 添加到道具组
    this.powerUps.add(sprite)
    
    return powerUp
  }
  
  /**
   * 创建基地
   */
  protected createBase(data: IEntityData): WallEntity {
    // 1. 创建 Phaser Sprite（视为特殊墙壁）
    const sprite = this.scene.physics.add.staticSprite(
      data.x, 
      data.y, 
      data.texture ?? 'base'
    )
    sprite.setImmovable(true)
    sprite.setDepth(1)
    
    // 2. 创建墙壁实体（钢墙）
    const base = new WallEntity(sprite, WallType.STEEL)
    
    // 3. 添加到墙壁组
    this.walls.add(sprite)
    
    return base
  }
}
