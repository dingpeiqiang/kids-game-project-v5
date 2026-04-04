// ============================================================================
// 🔄 游戏对象池 - GameObjectPool.ts
// ============================================================================
//
// 📌 说明:
//   基于 Phaser.Arcade.Sprite 的对象池，用于高性能复用游戏对象。
//   避免频繁创建/销毁对象导致的 GC 压力。
//
// 🎯 适用场景:
//   - 子弹、粒子、敌人等高频创建销毁的对象
//   - 运行时对象数量有上限的场景
//
// ⚠️ 使用前提:
//   PhaserGame.vue 中必须启用 physics: { default: 'arcade' }
//
// 📖 使用示例见 AI_INSTRUCTIONS.md
// ============================================================================

/**
 * 对象池配置
 */
export interface GameObjectPoolConfig {
  /** Phaser 场景 */
  scene: Phaser.Scene
  /** 资源 key（纹理名称） */
  textureKey: string
  /** 池子最大容量（默认 20） */
  maxSize?: number
  /** 初始预创建数量（默认 0，懒创建） */
  initialSize?: number
  /** 是否默认不可移动（适合障碍物/墙壁，默认 false） */
  immovable?: boolean
  /** 是否与世界边界碰撞（默认 false） */
  collideWorldBounds?: boolean
  /** 对象初始显示大小（可选） */
  displaySize?: { width: number; height: number }
}

/**
 * 对象池配置扩展（创建时覆盖）
 */
export interface PoolSpawnOptions {
  /** 初始 x 坐标（默认 0） */
  x?: number
  /** 初始 y 坐标（默认 0） */
  y?: number
  /** 初始是否可见（默认 true） */
  visible?: boolean
  /** 初始是否激活（默认 true） */
  active?: boolean
  /** 自定义属性（设置到 sprite 的 data manager） */
  data?: Record<string, any>
}

/**
 * 游戏对象池
 *
 * 基于 Phaser 物理组的对象池，自动管理对象的回收和复用。
 *
 * @example
 * ```typescript
 * // 1. 创建对象池
 * this.bulletPool = new GameObjectPool({
 *   scene: this,
 *   textureKey: 'bullet',
 *   maxSize: 50,
 *   initialSize: 10,
 * })
 *
 * // 2. 获取一个子弹（如果没有可用的，自动创建）
 * const bullet = this.bulletPool.spawn(x, y, { active: true })
 *
 * // 3. 回收子弹（返回池中待复用）
 * this.bulletPool.despawn(bullet)
 *
 * // 4. 回收所有活动对象（场景切换时调用）
 * this.bulletPool.despawnAll()
 * ```
 */
export class GameObjectPool {
  private scene: Phaser.Scene
  private textureKey: string
  private maxSize: number
  private config: Omit<GameObjectPoolConfig, 'scene' | 'textureKey' | 'maxSize' | 'initialSize'>

  /** Phaser 物理组（包含所有池中对象） */
  readonly group: Phaser.Physics.Arcade.Group

  /** 当前活动对象数（调试用） */
  get activeCount(): number {
    return this.group.countActive()
  }

  /** 池中总对象数（含休眠） */
  get totalCount(): number {
    return this.group.getLength()
  }

  constructor(config: GameObjectPoolConfig) {
    this.scene = config.scene
    this.textureKey = config.textureKey
    this.maxSize = config.maxSize ?? 20

    // 保存配置用于后续创建
    this.config = {
      immovable: config.immovable,
      collideWorldBounds: config.collideWorldBounds,
      displaySize: config.displaySize,
    }

    // 创建 Phaser 物理组（启用对象池特性）
    this.group = this.scene.physics.add.group({
      maxSize: this.maxSize,
      runChildUpdate: false, // 手动控制更新
    })

    // 预创建初始对象
    const initialSize = config.initialSize ?? 0
    if (initialSize > 0) {
      for (let i = 0; i < Math.min(initialSize, this.maxSize); i++) {
        const obj = this.createInactive()
        if (obj) {
          obj.setActive(false).setVisible(false)
        }
      }
    }

    console.log(
      `[GameObjectPool] 创建对象池: key=${this.textureKey}, max=${this.maxSize}, initial=${initialSize}`,
    )
  }

  /**
   * 从池中获取一个可用对象
   *
   * 优先复用休眠对象，若无可用则创建新对象（不超过 maxSize）。
   *
   * @param x       像素 x 坐标
   * @param y       像素 y 坐标
   * @param options 可选配置
   * @returns 可用对象，若池已满返回 null
   */
  spawn(x: number, y: number, options?: PoolSpawnOptions): Phaser.Physics.Arcade.Sprite | null {
    // 1. 尝试从组中获取第一个非活动对象
    let obj = this.group.getFirstDead(false) as Phaser.Physics.Arcade.Sprite | undefined

    // 2. 如果没有可复用的，创建新对象
    if (!obj) {
      if (this.group.getLength() >= this.maxSize) {
        console.warn(
          `[GameObjectPool] 池已满 (max=${this.maxSize})，无法分配新对象: ${this.textureKey}`,
        )
        return null
      }
      obj = this.createInactive()
    }

    if (!obj) return null

    // 3. 激活并放置到指定位置
    obj.setPosition(x, y)
    obj.setActive(options?.active !== false).setVisible(options?.visible !== false)

    // 4. 设置自定义数据
    if (options?.data) {
      for (const [key, value] of Object.entries(options.data)) {
        obj.setData(key, value)
      }
    }

    // 5. 重置物理体状态
    const body = obj.body as Phaser.Physics.Arcade.Body | null
    if (body) {
      body.enable = true
      if (this.config.immovable) {
        body.setImmovable(true)
      }
      body.reset(x, y)
      // 重置速度
      body.setVelocity(0, 0)
    }

    return obj
  }

  /**
   * 将对象回收到池中（休眠状态）
   *
   * 对象不会被销毁，而是设为不可见/不活动，等待下次 spawn 复用。
   *
   * @param obj 要回收的对象
   */
  despawn(obj: Phaser.GameObjects.GameObject): void {
    obj.setActive(false).setVisible(false)

    const body = (obj as Phaser.Physics.Arcade.Sprite).body as
      | Phaser.Physics.Arcade.Body
      | null
    if (body) {
      body.enable = false
      body.setVelocity(0, 0)
    }
  }

  /**
   * 回收所有活动对象
   *
   * 适用于场景切换或游戏重置时批量清理。
   */
  despawnAll(): void {
    const active = this.group.getChildren().filter((c) => c.active)
    for (const obj of active) {
      this.despawn(obj)
    }
  }

  /**
   * 获取所有当前活动对象
   */
  getActive(): Phaser.Physics.Arcade.Sprite[] {
    return this.group.getChildren().filter((c) => c.active) as Phaser.Physics.Arcade.Sprite[]
  }

  /**
   * 销毁对象池（释放所有资源）
   */
  destroy(): void {
    this.group.clear(true, true)
    console.log(`[GameObjectPool] 销毁对象池: ${this.textureKey}`)
  }

  // ─── 私有方法 ──────────────────────────────────────────────

  /**
   * 创建一个不活动的对象并加入组
   */
  private createInactive(): Phaser.Physics.Arcade.Sprite | null {
    if (this.group.getLength() >= this.maxSize) return null

    const obj = this.scene.physics.add.sprite(0, 0, this.textureKey)
    this.group.add(obj)

    // 应用配置
    if (this.config.immovable) {
      obj.setImmovable(true)
    }
    if (this.config.collideWorldBounds) {
      obj.setCollideWorldBounds(true)
    }
    if (this.config.displaySize) {
      obj.setDisplaySize(this.config.displaySize.width, this.config.displaySize.height)
    }

    return obj
  }
}
