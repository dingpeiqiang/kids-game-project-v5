// ============================================================================
// 🎮 坦克大战实体管理器 - 标准化实体管理
// ============================================================================
// 
// 📌 说明:
//   统一管理所有游戏实体（玩家、敌人、子弹、墙壁、道具）
//   实现实体的创建、更新、销毁全生命周期
//   符合 frame-factory 标准模式
// ============================================================================

import Phaser from 'phaser'

/**
 * ⭐ 实体类型定义
 */
export enum EntityType {
  PLAYER = 'player',
  ENEMY_LIGHT = 'enemy_light',
  ENEMY_MEDIUM = 'enemy_medium',
  ENEMY_HEAVY = 'enemy_heavy',
  BULLET_PLAYER = 'bullet_player',
  BULLET_ENEMY = 'bullet_enemy',
  WALL_BRICK = 'wall_brick',
  WALL_STEEL = 'wall_steel',
  BASE = 'base',
  POWERUP = 'powerup'
}

/**
 * ⭐ 实体属性接口
 */
export interface IEntityAttributes {
  health: number        // 生命值
  armor?: number        // 护甲值
  speed?: number        // 速度
  damage?: number       // 伤害
  score?: number        // 击杀得分
  type?: string         // 子类型
}

/**
 * ⭐ 实体数据接口
 */
export interface IEntityData {
  type: EntityType
  x: number
  y: number
  texture: string
  attributes: IEntityAttributes
  metadata?: any
}

/**
 * ⭐ 实体管理器
 * 
 * @remarks
 * 核心职责：
 * - 统一管理所有游戏实体
 * - 提供标准化的创建/获取/销毁接口
 * - 维护实体组（Group）以便批量操作
 * - 支持实体属性查询和修改
 */
export class EntityManager {
  protected scene: Phaser.Scene
  protected entities: Map<string, any> = new Map()
  protected groups: Map<EntityType, Phaser.Physics.Arcade.Group> = new Map()
  
  // 特殊组
  protected playerGroup!: Phaser.Physics.Arcade.Group
  protected enemyGroup!: Phaser.Physics.Arcade.Group
  protected bulletGroup!: Phaser.Physics.Arcade.Group        // 玩家子弹组
  protected enemyBulletGroup!: Phaser.Physics.Arcade.Group   // 敌人子弹组（独立）
  protected wallGroup!: Phaser.Physics.Arcade.StaticGroup
  protected powerUpGroup!: Phaser.Physics.Arcade.Group
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeGroups()
  }
  
  // ===========================================================================
  // 📌 初始化方法
  // ===========================================================================
  
  /**
   * ⭐ 初始化所有实体组
   */
  protected initializeGroups(): void {
    // 玩家组
    this.playerGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    })
    this.groups.set(EntityType.PLAYER, this.playerGroup)

    // 敌人群
    this.enemyGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    })
    this.groups.set(EntityType.ENEMY_LIGHT, this.enemyGroup)
    this.groups.set(EntityType.ENEMY_MEDIUM, this.enemyGroup)
    this.groups.set(EntityType.ENEMY_HEAVY, this.enemyGroup)

    // 玩家子弹组（独立）
    this.bulletGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    })
    this.groups.set(EntityType.BULLET_PLAYER, this.bulletGroup)

    // 敌人子弹组（独立）
    this.enemyBulletGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: true,
    })
    this.groups.set(EntityType.BULLET_ENEMY, this.enemyBulletGroup)

    // 墙壁组（静态）
    this.wallGroup = this.scene.physics.add.staticGroup()
    this.groups.set(EntityType.WALL_BRICK, this.wallGroup)
    this.groups.set(EntityType.WALL_STEEL, this.wallGroup)

    // 道具组
    this.powerUpGroup = this.scene.physics.add.group()
    this.groups.set(EntityType.POWERUP, this.powerUpGroup)

    console.log('✅ [EntityManager] 实体组初始化完成')
  }
  
  // ===========================================================================
  // 📌 公共 API - 实体操作
  // ===========================================================================
  
  /**
   * ⭐ 创建实体
   */
  createEntity(data: IEntityData): any {
    const { type, x, y, texture, attributes } = data
    
    let entity: any
    
    switch (type) {
      case EntityType.PLAYER:
        entity = this.createPlayer(x, y, texture, attributes)
        break
        
      case EntityType.ENEMY_LIGHT:
      case EntityType.ENEMY_MEDIUM:
      case EntityType.ENEMY_HEAVY:
        entity = this.createEnemy(x, y, type, texture, attributes)
        break
        
      case EntityType.BULLET_PLAYER:
      case EntityType.BULLET_ENEMY:
        entity = this.createBullet(x, y, type, texture, attributes)
        break
        
      case EntityType.WALL_BRICK:
      case EntityType.WALL_STEEL:
        entity = this.createWall(x, y, type, texture, attributes)
        break
        
      case EntityType.BASE:
        entity = this.createBase(x, y, texture, attributes)
        break
        
      case EntityType.POWERUP:
        entity = this.createPowerUp(x, y, texture, attributes)
        break
        
      default:
        console.error('❌ 未知实体类型:', type)
        return null
    }
    
    if (entity) {
      const entityId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.entities.set(entityId, entity)
      entity.entityId = entityId
      entity.entityType = type
      entity.attributes = { ...attributes }
      
      console.log(`📦 [EntityManager] 创建实体：${entityId} (${type})`)
    }
    
    return entity
  }
  
  /**
   * ⭐ 获取实体
   */
  getEntity(entityId: string): any | null {
    return this.entities.get(entityId) || null
  }
  
  /**
   * ⭐ 获取实体组
   */
  getGroup(type: EntityType): Phaser.Physics.Arcade.Group | null {
    return this.groups.get(type) || null
  }
  
  /**
   * ⭐ 销毁实体
   */
  destroyEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId)
    if (!entity) {
      console.warn('⚠️ [EntityManager] 实体不存在:', entityId)
      return false
    }
    
    // 从对应的组中移除并销毁
    const type = entity.entityType as EntityType
    const group = this.getGroup(type)
    
    if (group && group.contains(entity)) {
      group.remove(entity, true) // true = 销毁
    } else {
      entity.destroy()
    }
    
    this.entities.delete(entityId)
    console.log(`🗑️ [EntityManager] 销毁实体：${entityId}`)
    
    return true
  }
  
  /**
   * ⭐ 清空所有实体（但不包括玩家，除非显式指定）
   * @param includePlayer - 是否也清空玩家（默认 false，保护玩家不被意外清空）
   */
  clearAllEntities(includePlayer: boolean = false): void {
    this.entities.forEach((entity, id) => {
      entity.destroy()
    })
    this.entities.clear()
    
    // 清空组（可选是否包含玩家）
    if (includePlayer) {
      this.playerGroup.clear(true, true)
    }
    this.enemyGroup.clear(true, true)
    this.bulletGroup.clear(true, true)
    this.enemyBulletGroup.clear(true, true)
    this.wallGroup.clear(true, true)
    this.powerUpGroup.clear(true, true)
    
    console.log('🗑️ [EntityManager] 清空所有实体' + (includePlayer ? '（包含玩家）' : '（保留玩家）'))
  }
  
  // ===========================================================================
  // 📌 实体创建方法（可被子类重写）
  // ===========================================================================
  
  /**
   * ⭐ 创建玩家
   */
  protected createPlayer(x: number, y: number, texture: string, attributes: IEntityAttributes): Phaser.Physics.Arcade.Sprite {
    const player = this.playerGroup.create(x, y, texture)
    player.setCollideWorldBounds(true)
    
    // 设置属性
    if (attributes.health) player.health = attributes.health
    if (attributes.armor) player.armor = attributes.armor
    if (attributes.speed) player.speed = attributes.speed
    
    return player
  }
  
  /**
   * ⭐ 创建敌人
   */
  protected createEnemy(
    x: number, 
    y: number, 
    type: EntityType, 
    texture: string, 
    attributes: IEntityAttributes
  ): Phaser.Physics.Arcade.Sprite {
    // 🔍 调试：检查纹理是否存在
    const textureExists = this.scene.textures.exists(texture)
    console.log(`🔍 敌人纹理 "${texture}" ${textureExists ? '✅ 存在' : '❌ 不存在'}`)
    
    if (!textureExists) {
      console.warn(`⚠️ 纹理 ${texture} 不存在，使用占位符`)
      // 可以尝试使用备用纹理
    }
    
    const enemy = this.enemyGroup.create(x, y, texture)
    enemy.setCollideWorldBounds(true)
    
    // 根据类型设置不同属性
    if (type === EntityType.ENEMY_LIGHT) {
      enemy.health = attributes.health || 1
      enemy.speed = attributes.speed || 150
      enemy.damage = attributes.damage || 10
      enemy.score = 100
    } else if (type === EntityType.ENEMY_MEDIUM) {
      enemy.health = attributes.health || 2
      enemy.speed = attributes.speed || 100
      enemy.damage = attributes.damage || 20
      enemy.score = 200
    } else if (type === EntityType.ENEMY_HEAVY) {
      enemy.health = attributes.health || 3
      enemy.speed = attributes.speed || 50
      enemy.damage = attributes.damage || 30
      enemy.score = 300
    }
    
    enemy.enemyType = type
    return enemy
  }
  
  /**
   * ⭐ 创建子弹
   */
  protected createBullet(
    x: number, 
    y: number, 
    type: EntityType, 
    texture: string, 
    attributes: IEntityAttributes
  ): Phaser.Physics.Arcade.Image {
    const bullet = this.bulletGroup.create(x, y, texture)
    
    if (attributes.damage) bullet.damage = attributes.damage
    if (attributes.speed) bullet.bulletSpeed = attributes.speed
    
    return bullet
  }
  
  /**
   * ⭐ 创建墙壁
   */
  protected createWall(
    x: number,
    y: number,
    type: EntityType,
    texture: string,
    attributes?: IEntityAttributes  // 改为可选参数
  ): Phaser.Physics.Arcade.Sprite {
    const wall = this.wallGroup.create(x, y, texture)
    wall.setImmovable(true)
      
    if (type === EntityType.WALL_BRICK) {
      wall.health = attributes?.health ?? 2  // 使用可选链和空值合并
      wall.maxHealth = 2
    } else if (type === EntityType.WALL_STEEL) {
      wall.health = Infinity // 无限生命
      wall.maxHealth = Infinity
    }
      
    return wall
  }
  
  /**
   * ⭐ 创建基地
   */
  protected createBase(x: number, y: number, texture: string, attributes: IEntityAttributes): Phaser.Physics.Arcade.Sprite {
    const base = this.scene.physics.add.sprite(x, y, texture)
    base.setImmovable(true)
    ;(base as any).health = attributes.health || 1
    ;(base as any).maxHealth = 1
    return base
  }
  
  /**
   * ⭐ 创建道具
   */
  protected createPowerUp(x: number, y: number, texture: string, attributes: IEntityAttributes): Phaser.Physics.Arcade.Sprite {
    const powerUp = this.powerUpGroup.create(x, y, texture)
    if (attributes.type) (powerUp as any).type = attributes.type
    if ((attributes as any).duration) (powerUp as any).duration = (attributes as any).duration
    return powerUp
  }
  
  // ===========================================================================
  // 📌 统计和查询
  // ===========================================================================
  
  /**
   * ⭐ 获取实体数量
   */
  getEntityCount(type?: EntityType): number {
    if (!type) {
      return this.entities.size
    }
    
    let count = 0
    this.entities.forEach((entity) => {
      if (entity.entityType === type) {
        count++
      }
    })
    return count
  }
  
  /**
   * ⭐ 获取所有存活实体
   */
  getAliveEntities(type?: EntityType): any[] {
    const result: any[] = []
    
    this.entities.forEach((entity) => {
      if (entity.active && (!type || entity.entityType === type)) {
        result.push(entity)
      }
    })
    
    return result
  }
  
  /**
   * ⭐ 查找最近的敌人
   */
  findNearestEnemy(x: number, y: number): any | null {
    const enemies = this.getAliveEntities(EntityType.ENEMY_LIGHT)
      .concat(this.getAliveEntities(EntityType.ENEMY_MEDIUM))
      .concat(this.getAliveEntities(EntityType.ENEMY_HEAVY))
    
    if (enemies.length === 0) return null
    
    let nearest = null
    let minDistance = Infinity
    
    enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (distance < minDistance) {
        minDistance = distance
        nearest = enemy
      }
    })
    
    return nearest
  }
}
