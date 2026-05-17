// ============================================================================
// 💥 碰撞注册器 - CollisionRegistry.ts
// ============================================================================
//
// 📌 说明:
//   标准化碰撞/重叠检测的注册和管理，提供命名碰撞对 + 统一启停。
//   解决各游戏分散调用 physics.add.collider/overlap 难以维护的问题。
//
// 🎯 适用场景:
//   - 多种碰撞对（玩家↔墙壁、子弹↔敌人、玩家↔道具等）
//   - 需要运行时动态启停特定碰撞检测
//   - 碰撞对集中管理，便于调试
//
// ⚠️ 使用前提:
//   PhaserGame.vue 中必须启用 physics: { default: 'arcade' }
//
// 📖 使用示例见 AI_INSTRUCTIONS.md
// ============================================================================

/**
 * 碰撞对注册配置
 */
export interface CollisionPairConfig {
  /** 碰撞对名称（唯一标识，用于后续管理） */
  name: string
  /** 物体 A（Sprite / Group / TilemapLayer） */
  objectA: Phaser.Types.Physics.Arcade.ArcadeColliderType
  /** 物体 B（Sprite / Group / TilemapLayer） */
  objectB: Phaser.Types.Physics.Arcade.ArcadeColliderType
  /** 碰撞/重叠回调 */
  callback?: Phaser.Types.Physics.Arcade.OverlapCallback
  /** 回调上下文（默认 this） */
  context?: any
  /** 碰撞类型 */
  type: 'collider' | 'overlap'
  /** 处理回调（仅在特定条件下触发碰撞） */
  processCallback?: Phaser.Types.Physics.Arcade.OverlapCallback
}

/**
 * 碰撞对注册结果
 */
interface RegisteredPair {
  config: CollisionPairConfig
  collider: Phaser.Physics.Arcade.Collider
  /** 是否启用（默认 true） */
  enabled: boolean
}

/**
 * 碰撞注册器
 *
 * 集中管理所有碰撞/重叠对，支持命名注册、运行时启停、批量管理。
 *
 * @example
 * ```typescript
 * // 1. 创建注册器
 * this.collisionRegistry = new CollisionRegistry(this)
 *
 * // 2. 注册碰撞对
 * this.collisionRegistry.register({
 *   name: 'player-walls',
 *   objectA: this.player,
 *   objectB: this.walls,
 *   type: 'collider',
 * })
 *
 * this.collisionRegistry.register({
 *   name: 'player-foods',
 *   objectA: this.player,
 *   objectB: this.foodGroup,
 *   type: 'overlap',
 *   callback: (player, food) => {
 *     food.destroy()
 *     this.addScore(10)
 *   },
 * })
 *
 * this.collisionRegistry.register({
 *   name: 'bullets-enemies',
 *   objectA: this.bulletPool.group,
 *   objectB: this.enemyGroup,
 *   type: 'overlap',
 *   callback: (bullet, enemy) => {
 *     bullet.destroy()
 *     enemy.destroy()
 *   },
 * })
 *
 * // 3. 运行时暂停/恢复某个碰撞
 * this.collisionRegistry.setEnabled('player-walls', false)  // 暂停
 * this.collisionRegistry.setEnabled('player-walls', true)   // 恢复
 *
 * // 4. 批量暂停所有碰撞（如过关切换动画时）
 * this.collisionRegistry.setAllEnabled(false)
 *
 * // 5. 销毁（场景切换时）
 * this.collisionRegistry.destroy()
 * ```
 */
export class CollisionRegistry {
  private scene: Phaser.Scene

  /** 已注册的碰撞对 */
  private pairs: Map<string, RegisteredPair> = new Map()

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    console.log('[CollisionRegistry] 创建碰撞注册器')
  }

  /**
   * 注册一个碰撞/重叠对
   *
   * @param config  碰撞对配置
   * @throws 如果同名碰撞对已存在
   */
  register(config: CollisionPairConfig): void {
    if (this.pairs.has(config.name)) {
      console.warn(
        `[CollisionRegistry] 碰撞对 "${config.name}" 已存在，将被覆盖`,
      )
    }

    const context = config.context ?? this.scene
    let collider: Phaser.Physics.Arcade.Collider

    if (config.type === 'collider') {
      collider = this.scene.physics.add.collider(
        config.objectA,
        config.objectB,
        config.callback as any,
        config.processCallback as any,
        context,
      )
    } else {
      collider = this.scene.physics.add.overlap(
        config.objectA,
        config.objectB,
        config.callback,
        config.processCallback,
        context,
      )
    }

    this.pairs.set(config.name, {
      config,
      collider,
      enabled: true,
    })

    console.log(
      `[CollisionRegistry] 注册: "${config.name}" (${config.type})`,
    )
  }

  /**
   * 启用/禁用指定碰撞对
   *
   * @param name     碰撞对名称
   * @param enabled  是否启用
   */
  setEnabled(name: string, enabled: boolean): void {
    const pair = this.pairs.get(name)
    if (!pair) {
      console.warn(`[CollisionRegistry] 碰撞对 "${name}" 不存在`)
      return
    }

    pair.enabled = enabled
    pair.collider.active = enabled
  }

  /**
   * 批量启用/禁用所有碰撞对
   *
   * @param enabled  是否启用
   *
   * @example
   *   // 过关动画期间暂停所有碰撞
   *   this.collisionRegistry.setAllEnabled(false)
   *   this.time.delayedCall(2000, () => {
   *     this.collisionRegistry.setAllEnabled(true)
   *   })
   */
  setAllEnabled(enabled: boolean): void {
    for (const [, pair] of this.pairs) {
      pair.enabled = enabled
      pair.collider.active = enabled
    }
  }

  /**
   * 移除指定碰撞对
   *
   * @param name  碰撞对名称
   */
  remove(name: string): void {
    const pair = this.pairs.get(name)
    if (!pair) return

    pair.collider.destroy()
    this.pairs.delete(name)
  }

  /**
   * 获取指定碰撞对
   */
  get(name: string): RegisteredPair | undefined {
    return this.pairs.get(name)
  }

  /**
   * 获取所有已注册的碰撞对名称
   */
  getNames(): string[] {
    return Array.from(this.pairs.keys())
  }

  /**
   * 检查指定碰撞对是否启用
   */
  isEnabled(name: string): boolean {
    return this.pairs.get(name)?.enabled ?? false
  }

  /**
   * 获取已注册碰撞对数量
   */
  get size(): number {
    return this.pairs.size
  }

  /**
   * 销毁所有碰撞对
   */
  destroy(): void {
    for (const [, pair] of this.pairs) {
      pair.collider.destroy()
    }
    this.pairs.clear()
    console.log('[CollisionRegistry] 已销毁所有碰撞对')
  }
}
