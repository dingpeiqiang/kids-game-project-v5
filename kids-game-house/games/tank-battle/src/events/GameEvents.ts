// ============================================================================
// 🎯 游戏事件总线 - 统一事件通信
// ============================================================================
//
// 📌 说明:
//   使用 Phaser 内置事件系统实现游戏内各模块间的解耦通信
//   替代传统的回调嵌套和直接依赖
//
// 📌 使用方式:
//   - 监听: GameEvents.on(scene, 'eventName', handler)
//   - 触发: GameEvents.emit(scene, 'eventName', data)
//   - 移除: GameEvents.off(scene, 'eventName', handler)
//
// 📌 事件命名规范:
//   - collision:{source}:{target} 碰撞事件
//   - player:{action} 玩家事件
//   - enemy:{action} 敌人事件
//   - game:{action} 游戏事件
// ============================================================================

/**
 * ⭐ 玩家事件
 */
export enum PlayerEvents {
  /** 玩家受伤 */
  DAMAGED = 'player:damaged',
  /** 玩家死亡 */
  DIED = 'player:died',
  /** 玩家复活 */
  RESPAWNED = 'player:respawned',
  /** 玩家无敌状态开始 */
  INVINCIBLE_START = 'player:invincible:start',
  /** 玩家无敌状态结束 */
  INVINCIBLE_END = 'player:invincible:end',
  /** 玩家护盾激活 */
  SHIELD_ACTIVATED = 'player:shield:activated',
  /** 玩家护盾消失 */
  SHIELD_DEACTIVATED = 'player:shield:deactivated'
}

/**
 * ⭐ 敌人事件
 */
export enum EnemyEvents {
  /** 敌人出生 */
  SPAWNED = 'enemy:spawned',
  /** 敌人受伤 */
  DAMAGED = 'enemy:damaged',
  /** 敌人死亡 */
  DIED = 'enemy:died',
  /** 敌人移动 */
  MOVED = 'enemy:moved'
}

/**
 * ⭐ 子弹事件
 */
export enum BulletEvents {
  /** 玩家子弹发射 */
  PLAYER_FIRED = 'bullet:player:fired',
  /** 敌人子弹发射 */
  ENEMY_FIRED = 'bullet:enemy:fired',
  /** 子弹销毁 */
  DESTROYED = 'bullet:destroyed'
}

/**
 * ⭐ 碰撞事件（简化版）
 */
export enum CollisionEvents {
  /** 玩家子弹击中墙壁 */
  PLAYER_BULLET_WALL = 'collision:playerBullet:wall',
  /** 敌人子弹击中墙壁 */
  ENEMY_BULLET_WALL = 'collision:enemyBullet:wall',
  /** 玩家子弹击中敌人 */
  PLAYER_BULLET_ENEMY = 'collision:playerBullet:enemy',
  /** 敌人子弹击中玩家 */
  ENEMY_BULLET_PLAYER = 'collision:enemyBullet:player',
  /** 玩家碰撞墙壁 */
  PLAYER_WALL = 'collision:player:wall',
  /** 敌人碰撞墙壁 */
  ENEMY_WALL = 'collision:enemy:wall',
  /** 玩家碰撞敌人 */
  PLAYER_ENEMY = 'collision:player:enemy',
  /** 敌人子弹击中基地 */
  ENEMY_BULLET_BASE = 'collision:enemyBullet:base',
  /** 玩家拾取道具 */
  PLAYER_POWERUP = 'collision:player:powerUp'
}

/**
 * ⭐ 游戏事件
 */
export enum GameEventsEnum {
  /** 游戏开始 */
  GAME_START = 'game:start',
  /** 游戏结束 */
  GAME_OVER = 'game:over',
  /** 关卡完成 */
  LEVEL_COMPLETE = 'game:level:complete',
  /** 关卡失败 */
  LEVEL_FAILED = 'game:level:failed',
  /** 分数变化 */
  SCORE_CHANGED = 'game:score:changed',
  /** 生命变化 */
  LIVES_CHANGED = 'game:lives:changed',
  /** 道具激活 */
  POWERUP_COLLECTED = 'game:powerup:collected'
}

/**
 * ⭐ 事件数据类型
 */
export interface IPlayerDamagedData {
  source: 'bullet' | 'enemy' | 'wall'
  bullet?: any
}

export interface IEnemyDiedData {
  enemy: any
  score: number
  position: { x: number; y: number }
}

export interface IBulletHitData {
  bullet: any
  target?: any
  position: { x: number; y: number }
}

export interface ICollisionData {
  source: any
  target: any
  event: string
}

/**
 * ⭐ GameEvents - 事件总线（静态工具类）
 *
 * @example
 * // 监听事件
 * GameEvents.on(this.scene, PlayerEvents.DAMAGED, this.onPlayerDamaged, this)
 *
 * // 触发事件
 * GameEvents.emit(this.scene, PlayerEvents.DAMAGED, { source: 'bullet' })
 *
 * // 移除监听
 * GameEvents.off(this.scene, PlayerEvents.DAMAGED, this.onPlayerDamaged, this)
 */
export class GameEvents {
  /**
   * ⭐ 监听事件
   */
  static on(
    scene: Phaser.Scene,
    event: string,
    handler: (data?: any) => void,
    context?: any
  ): void {
    scene.events.on(event, handler, context)
  }

  /**
   * ⭐ 一次性监听事件
   */
  static once(
    scene: Phaser.Scene,
    event: string,
    handler: (data?: any) => void,
    context?: any
  ): void {
    scene.events.once(event, handler, context)
  }

  /**
   * ⭐ 触发事件
   */
  static emit(scene: Phaser.Scene, event: string, data?: any): void {
    scene.events.emit(event, data)
  }

  /**
   * ⭐ 移除事件监听
   */
  static off(
    scene: Phaser.Scene,
    event: string,
    handler?: (data?: any) => void,
    context?: any
  ): void {
    scene.events.off(event, handler, context)
  }

  /**
   * ⭐ 移除场景所有监听
   */
  static removeAllListeners(scene: Phaser.Scene, event?: string): void {
    if (event) {
      scene.events.removeListener(event)
    } else {
      scene.events.removeAllListeners()
    }
  }

  /**
   * ⭐ 检查是否有监听器
   */
  static listenerCount(scene: Phaser.Scene, event: string): number {
    return scene.events.totalListenerCount(event)
  }
}
