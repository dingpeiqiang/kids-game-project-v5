// ============================================================================
// 🎯 碰撞配置 - 碰撞规则定义
// ============================================================================
//
// 📌 说明:
//   所有碰撞规则在此集中配置，支持：
//   - collisionType: 'overlap' | 'collider' 碰撞类型
//   - source/target: 碰撞双方
//   - event: 触发的事件名
//   - condition: 可选的碰撞条件函数
//   - action: 可选的碰撞处理函数
// ============================================================================

import { EntityType } from '../managers/EntityManager'

/**
 * ⭐ 碰撞类型
 */
export enum CollisionType {
  OVERLAP = 'overlap',   // 穿透检测（不阻止移动）
  COLLIDER = 'collider'  // 物理碰撞（阻止移动）
}

/**
 * ⭐ 碰撞源定义
 */
export type CollisionSource =
  | { type: 'entity'; entityType: EntityType }
  | { type: 'player' }
  | { type: 'enemies' }
  | { type: 'allEnemies' }

/**
 * ⭐ 碰撞目标定义
 */
export type CollisionTarget =
  | { type: 'entity'; entityType: EntityType }
  | { type: 'walls' }
  | { type: 'player' }
  | { type: 'enemies' }
  | { type: 'powerUps' }
  | { type: 'base' }

/**
 * ⭐ 碰撞配置项
 */
export interface ICollisionConfig {
  /** 唯一标识 */
  id: string
  /** 碰撞类型 */
  collisionType: CollisionType
  /** 碰撞源 */
  source: CollisionSource
  /** 碰撞目标 */
  target: CollisionTarget
  /** 触发的事件 */
  event: string
  /** 是否需要重新绑定（玩家复活后） */
  needsRebind?: boolean
  /** 碰撞回调配置 */
  callback?: {
    /** 子弹命中标记键 */
    bulletHitKey?: string
    /** 无敌状态检测 */
    checkInvincible?: boolean
    /** 盾牌检测 */
    checkShield?: boolean
    /** 销毁子弹 */
    destroyBullet?: boolean
    /** 销毁目标 */
    destroyTarget?: boolean
  }
}

/**
 * ⭐ 特效配置
 */
export interface IEffectConfig {
  /** 爆炸特效 */
  explosion?: {
    enabled: boolean
    size?: number
  }
  /** 碎片效果 */
  debris?: {
    enabled: boolean
    color: string
    count?: number
  }
  /** 火花效果 */
  sparks?: {
    enabled: boolean
    color: string
    count?: number
  }
  /** 音效 */
  sound?: {
    key: string
    volume?: number
  }
  /** 相机震动 */
  shake?: {
    duration: number
    intensity?: number
  }
}

/**
 * ⭐ 墙壁破坏配置
 */
export interface IWallBreakConfig {
  /** 是否可破坏 */
  destructible: boolean
  /** 破坏后特效 */
  effect?: IEffectConfig
}

/**
 * ⭐ 默认特效配置
 */
export const DEFAULT_EXPLOSION_EFFECT: IEffectConfig = {
  sound: { key: 'sfx_explosion', volume: 0.4 },
  shake: { duration: 100 }
}

export const DEFAULT_STEEL_HIT_EFFECT: IEffectConfig = {
  sparks: { enabled: true, color: '#94a3b8', count: 4 },
  sound: { key: 'sfx_hit', volume: 0.2 }
}

/**
 * ⭐ ⭐ 碰撞配置表 ⭐⭐
 *
 * 📌 添加新碰撞规则：
 * 1. 在此处添加配置项
 * 2. 在 GameEvents.ts 中定义对应的事件类型
 */
export const COLLISION_CONFIG: ICollisionConfig[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔫 子弹碰撞
  // ═══════════════════════════════════════════════════════════════════════════

  // 玩家子弹 vs 墙壁
  {
    id: 'player_bullet_vs_wall',
    collisionType: CollisionType.COLLIDER,
    source: { type: 'entity', entityType: EntityType.BULLET_PLAYER },
    target: { type: 'walls' },
    event: 'collision:playerBullet:wall',
    callback: {
      bulletHitKey: 'hit',
      destroyBullet: true,
      destroyTarget: false
    }
  },

  // 敌人子弹 vs 墙壁
  {
    id: 'enemy_bullet_vs_wall',
    collisionType: CollisionType.COLLIDER,
    source: { type: 'entity', entityType: EntityType.BULLET_ENEMY },
    target: { type: 'walls' },
    event: 'collision:enemyBullet:wall',
    callback: {
      bulletHitKey: 'hit',
      destroyBullet: true,
      destroyTarget: false
    }
  },

  // 玩家子弹 vs 敌人
  {
    id: 'player_bullet_vs_enemy',
    collisionType: CollisionType.OVERLAP,
    source: { type: 'entity', entityType: EntityType.BULLET_PLAYER },
    target: { type: 'enemies' },
    event: 'collision:playerBullet:enemy',
    needsRebind: false,
    callback: {
      destroyBullet: true,
      destroyTarget: true
    }
  },

  // 敌人子弹 vs 玩家
  {
    id: 'enemy_bullet_vs_player',
    collisionType: CollisionType.OVERLAP,
    source: { type: 'entity', entityType: EntityType.BULLET_ENEMY },
    target: { type: 'player' },
    event: 'collision:enemyBullet:player',
    needsRebind: true,
    callback: {
      bulletHitKey: 'hit',
      checkInvincible: true,
      destroyBullet: true
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚗 坦克碰撞
  // ═══════════════════════════════════════════════════════════════════════════

  // 玩家 vs 墙壁
  {
    id: 'player_vs_wall',
    collisionType: CollisionType.COLLIDER,
    source: { type: 'player' },
    target: { type: 'walls' },
    event: 'collision:player:wall',
    needsRebind: true
  },

  // 敌人 vs 墙壁
  {
    id: 'enemy_vs_wall',
    collisionType: CollisionType.COLLIDER,
    source: { type: 'allEnemies' },
    target: { type: 'walls' },
    event: 'collision:enemy:wall',
    needsRebind: false
  },

  // 玩家 vs 敌人
  {
    id: 'player_vs_enemy',
    collisionType: CollisionType.COLLIDER,
    source: { type: 'player' },
    target: { type: 'enemies' },
    event: 'collision:player:enemy',
    needsRebind: true,
    callback: {
      checkInvincible: true,
      checkShield: true
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏠 基地碰撞
  // ═══════════════════════════════════════════════════════════════════════════

  // 敌人子弹 vs 基地
  {
    id: 'enemy_bullet_vs_base',
    collisionType: CollisionType.OVERLAP,
    source: { type: 'entity', entityType: EntityType.BULLET_ENEMY },
    target: { type: 'base' },
    event: 'collision:enemyBullet:base',
    needsRebind: false,
    callback: {
      destroyBullet: true
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎁 道具碰撞
  // ═══════════════════════════════════════════════════════════════════════════

  // 玩家 vs 道具
  {
    id: 'player_vs_powerup',
    collisionType: CollisionType.OVERLAP,
    source: { type: 'player' },
    target: { type: 'powerUps' },
    event: 'collision:player:powerUp',
    needsRebind: true,
    callback: {
      destroyTarget: true
    }
  }
]

/**
 * ⭐ 根据 ID 获取碰撞配置
 */
export function getCollisionConfig(id: string): ICollisionConfig | undefined {
  return COLLISION_CONFIG.find(c => c.id === id)
}

/**
 * ⭐ 获取所有需要重新绑定的碰撞配置
 */
export function getRebindableCollisions(): ICollisionConfig[] {
  return COLLISION_CONFIG.filter(c => c.needsRebind)
}

/**
 * ⭐ 获取特定源的所有碰撞配置
 */
export function getCollisionsBySource(source: CollisionSource): ICollisionConfig[] {
  return COLLISION_CONFIG.filter(c => {
    if (source.type === 'player') return c.source.type === 'player'
    if (source.type === 'enemies') return c.source.type === 'allEnemies' || c.source.type === 'enemies'
    return c.source.type === source.type && c.source.entityType === source.entityType
  })
}
