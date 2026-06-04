// ============================================================================
// 🎁 道具系统 - PropSystem.ts
// ============================================================================
//
// 📌 说明:
//   通用道具效果管理系统，支持效果叠加、持续时间、冷却时间。
//   适用于游戏中的增益/减益效果（加速、护盾、磁铁、双倍分数等）。
//
// 🎯 适用场景:
//   - 拾取道具后获得临时效果
//   - 多种效果叠加/互斥
//   - 效果倒计时 + 自动过期
//
// 📖 使用示例见 AI_INSTRUCTIONS.md
// ============================================================================

/**
 * 道具效果定义
 */
export interface PropEffect {
  /** 效果唯一 ID */
  id: string
  /** 效果显示名称 */
  name: string
  /** 效果图标 key（来自 GTRS） */
  icon?: string
  /** 持续时间（毫秒，0 = 永久/手动取消） */
  duration: number
  /** 是否允许叠加（同一效果多次拾取） */
  stackable: boolean
  /** 最大叠加层数（默认 1） */
  maxStacks?: number
  /** 冷却时间（毫秒，0 = 无冷却） */
  cooldown?: number
  /** 是否与其他效果互斥（填写互斥的效果 ID 列表） */
  mutuallyExclusive?: string[]

  /**
   * 效果应用回调
   * @param scene    当前场景
   * @param stacks   当前叠加层数
   * @param context  用户自定义上下文
   */
  onApply?(scene: Phaser.Scene, stacks: number, context?: any): void

  /**
   * 效果移除回调
   * @param scene    当前场景
   * @param stacks   当前叠加层数
   * @param context  用户自定义上下文
   */
  onRemove?(scene: Phaser.Scene, stacks: number, context?: any): void

  /**
   * 效果tick回调（每帧调用，用于持续效果如伤害光环）
   * @param scene    当前场景
   * @param delta    帧间隔毫秒数
   * @param remaining 剩余毫秒数
   * @param context  用户自定义上下文
   */
  onTick?(scene: Phaser.Scene, delta: number, remaining: number, context?: any): void
}

/**
 * 活跃效果实例（运行时状态）
 */
export interface ActiveEffect {
  /** 效果定义 */
  definition: PropEffect
  /** 当前叠加层数 */
  stacks: number
  /** 剩余时间（毫秒） */
  remaining: number
  /** 效果激活时间戳 */
  startTime: number
  /** 上次冷却完成时间 */
  lastUsedTime: number
}

/**
 * 道具系统配置
 */
export interface PropSystemConfig {
  /** Phaser 场景 */
  scene: Phaser.Scene
  /** 用户自定义上下文（传递给效果回调） */
  context?: any
  /** 效果过期时是否播放音效 */
  expireSoundKey?: string
}

/**
 * 道具系统
 *
 * 管理道具效果的注册、激活、叠加、过期、冷却。
 *
 * @example
 * ```typescript
 * // 1. 定义效果
 * const speedBoost: PropEffect = {
 *   id: 'speed-boost',
 *   name: '加速',
 *   duration: 5000,       // 5 秒
 *   stackable: false,     // 不可叠加
 *   cooldown: 10000,      // 10 秒冷却
 *   onApply(scene, stacks) {
 *     this.player.setSpeedMultiplier(1.5)
 *   },
 *   onRemove(scene, stacks) {
 *     this.player.setSpeedMultiplier(1.0)
 *   },
 * }
 *
 * const doubleScore: PropEffect = {
 *   id: 'double-score',
 *   name: '双倍分数',
 *   duration: 8000,
 *   stackable: false,
 *   onApply(scene) { this.scoreMultiplier = 2 },
 *   onRemove(scene) { this.scoreMultiplier = 1 },
 * }
 *
 * // 2. 创建道具系统
 * this.propSystem = new PropSystem({ scene: this })
 *
 * // 3. 注册效果
 * this.propSystem.registerEffect(speedBoost)
 * this.propSystem.registerEffect(doubleScore)
 *
 * // 4. 激活效果（拾取道具时调用）
 * this.propSystem.activate('speed-boost')
 *
 * // 5. 在 gameLoop 中更新
 * protected gameLoop(time: number, delta: number): void {
 *   this.propSystem.update(delta)
 * }
 *
 * // 6. 检查效果是否激活
 * if (this.propSystem.isActive('speed-boost')) {
 *   // 加速状态下的特殊逻辑
 * }
 *
 * // 7. 获取剩余时间
 * const remaining = this.propSystem.getRemaining('speed-boost')
 * ```
 */
export class PropSystem {
  private scene: Phaser.Scene
  private context: any
  private expireSoundKey?: string

  /** 所有已注册的效果定义 */
  private effectDefinitions: Map<string, PropEffect> = new Map()

  /** 当前活跃的效果 */
  private activeEffects: Map<string, ActiveEffect> = new Map()

  /** 效果过期回调 */
  private onExpireCallbacks: Map<string, Array<(effectId: string) => void>> = new Map()

  /** 效果激活回调 */
  private onActivateCallbacks: Map<string, Array<(effectId: string, stacks: number) => void>> =
    new Map()

  constructor(config: PropSystemConfig) {
    this.scene = config.scene
    this.context = config.context
    this.expireSoundKey = config.expireSoundKey
    console.log('[PropSystem] 创建道具系统')
  }

  /**
   * 注册效果定义
   *
   * @param effect  效果定义
   */
  registerEffect(effect: PropEffect): void {
    this.effectDefinitions.set(effect.id, effect)
    console.log(`[PropSystem] 注册效果: ${effect.name} (${effect.id})`)
  }

  /**
   * 批量注册效果定义
   *
   * @param effects  效果定义数组
   */
  registerEffects(effects: PropEffect[]): void {
    for (const effect of effects) {
      this.registerEffect(effect)
    }
  }

  /**
   * 激活效果
   *
   * 处理叠加、互斥、冷却等逻辑。
   *
   * @param effectId  效果 ID
   * @returns 是否成功激活
   */
  activate(effectId: string): boolean {
    const definition = this.effectDefinitions.get(effectId)
    if (!definition) {
      console.warn(`[PropSystem] 未知效果: ${effectId}`)
      return false
    }

    // 1. 冷却检查
    const cooldown = definition.cooldown ?? 0
    if (cooldown > 0) {
      const existing = this.activeEffects.get(effectId)
      if (existing && Date.now() - existing.lastUsedTime < cooldown) {
        console.log(`[PropSystem] 效果冷却中: ${effectId}`)
        return false
      }
    }

    // 2. 互斥检查（新效果会移除互斥的已有效果）
    if (definition.mutuallyExclusive) {
      for (const exclusiveId of definition.mutuallyExclusive) {
        if (this.activeEffects.has(exclusiveId)) {
          this.deactivate(exclusiveId)
        }
      }
    }

    // 3. 叠加或创建
    const existing = this.activeEffects.get(effectId)
    if (existing) {
      if (definition.stackable) {
        const maxStacks = definition.maxStacks ?? 1
        if (existing.stacks >= maxStacks) {
          console.log(`[PropSystem] 效果已达最大叠加: ${effectId} (${maxStacks})`)
          return false
        }
        existing.stacks++
        existing.remaining = definition.duration // 刷新持续时间
      } else {
        // 不可叠加 → 刷新持续时间
        existing.remaining = definition.duration
        existing.startTime = Date.now()
      }
    } else {
      // 新建活跃效果
      this.activeEffects.set(effectId, {
        definition,
        stacks: 1,
        remaining: definition.duration,
        startTime: Date.now(),
        lastUsedTime: 0,
      })
    }

    // 4. 调用 onApply
    if (definition.onApply) {
      const stacks = this.activeEffects.get(effectId)!.stacks
      definition.onApply(this.scene, stacks, this.context)
    }

    // 5. 触发激活回调
    this.fireActivateCallbacks(effectId, this.activeEffects.get(effectId)!.stacks)

    console.log(
      `[PropSystem] 激活效果: ${definition.name} (stacks=${this.activeEffects.get(effectId)?.stacks})`,
    )
    return true
  }

  /**
   * 手动停用效果
   *
   * @param effectId  效果 ID
   */
  deactivate(effectId: string): void {
    const active = this.activeEffects.get(effectId)
    if (!active) return

    // 调用 onRemove
    if (active.definition.onRemove) {
      active.definition.onRemove(this.scene, active.stacks, this.context)
    }

    // 记录最后使用时间（用于冷却计算）
    active.lastUsedTime = Date.now()

    this.activeEffects.delete(effectId)

    // 触发过期回调
    this.fireExpireCallbacks(effectId)

    console.log(`[PropSystem] 停用效果: ${effectId}`)
  }

  /**
   * 每帧更新（在 gameLoop 中调用）
   *
   * 更新所有活跃效果的剩余时间，自动过期效果。
   *
   * @param delta  帧间隔毫秒数
   */
  update(delta: number): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [effectId, active] of this.activeEffects) {
      if (active.definition.duration === 0) continue // 永久效果不计时

      active.remaining -= delta

      // 每帧 tick
      if (active.definition.onTick) {
        active.definition.onTick(this.scene, delta, active.remaining, this.context)
      }

      // 过期检查
      if (active.remaining <= 0) {
        toRemove.push(effectId)
      }
    }

    // 移除过期效果
    for (const effectId of toRemove) {
      const active = this.activeEffects.get(effectId)
      if (active?.definition.onRemove) {
        active.definition.onRemove(this.scene, active.stacks, this.context)
      }
      active!.lastUsedTime = now
      this.activeEffects.delete(effectId)
      this.fireExpireCallbacks(effectId)

      // 播放过期音效
      if (this.expireSoundKey) {
        this.scene.sound.play(this.expireSoundKey)
      }

      console.log(`[PropSystem] 效果过期: ${effectId}`)
    }
  }

  // ─── 查询 API ─────────────────────────────────────────────

  /**
   * 检查效果是否激活
   */
  isActive(effectId: string): boolean {
    return this.activeEffects.has(effectId)
  }

  /**
   * 获取效果剩余时间（毫秒）
   */
  getRemaining(effectId: string): number {
    return this.activeEffects.get(effectId)?.remaining ?? 0
  }

  /**
   * 获取效果叠加层数
   */
  getStacks(effectId: string): number {
    return this.activeEffects.get(effectId)?.stacks ?? 0
  }

  /**
   * 获取所有当前激活效果 ID
   */
  getActiveEffectIds(): string[] {
    return Array.from(this.activeEffects.keys())
  }

  /**
   * 获取所有已注册的效果定义
   */
  getRegisteredEffects(): PropEffect[] {
    return Array.from(this.effectDefinitions.values())
  }

  // ─── 回调注册 ─────────────────────────────────────────────

  /**
   * 注册效果过期回调
   *
   * @param effectId  效果 ID（'*' 表示所有效果）
   * @param callback  回调函数
   * @returns 取消注册函数
   */
  onExpire(
    effectId: string,
    callback: (effectId: string) => void,
  ): () => void {
    if (!this.onExpireCallbacks.has(effectId)) {
      this.onExpireCallbacks.set(effectId, [])
    }
    this.onExpireCallbacks.get(effectId)!.push(callback)

    return () => {
      const callbacks = this.onExpireCallbacks.get(effectId)
      if (callbacks) {
        this.onExpireCallbacks.set(
          effectId,
          callbacks.filter((cb) => cb !== callback),
        )
      }
    }
  }

  /**
   * 注册效果激活回调
   *
   * @param effectId  效果 ID（'*' 表示所有效果）
   * @param callback  回调函数
   * @returns 取消注册函数
   */
  onActivate(
    effectId: string,
    callback: (effectId: string, stacks: number) => void,
  ): () => void {
    if (!this.onActivateCallbacks.has(effectId)) {
      this.onActivateCallbacks.set(effectId, [])
    }
    this.onActivateCallbacks.get(effectId)!.push(callback)

    return () => {
      const callbacks = this.onActivateCallbacks.get(effectId)
      if (callbacks) {
        this.onActivateCallbacks.set(
          effectId,
          callbacks.filter((cb) => cb !== callback),
        )
      }
    }
  }

  // ─── 生命周期 ─────────────────────────────────────────────

  /**
   * 重置道具系统（游戏重新开始时调用）
   */
  reset(): void {
    // 移除所有活跃效果，触发 onRemove
    for (const [, active] of this.activeEffects) {
      if (active.definition.onRemove) {
        active.definition.onRemove(this.scene, active.stacks, this.context)
      }
    }
    this.activeEffects.clear()
    console.log('[PropSystem] 已重置')
  }

  /**
   * 销毁道具系统
   */
  destroy(): void {
    this.reset()
    this.effectDefinitions.clear()
    this.onExpireCallbacks.clear()
    this.onActivateCallbacks.clear()
    console.log('[PropSystem] 已销毁')
  }

  // ─── 私有方法 ─────────────────────────────────────────────

  private fireExpireCallbacks(effectId: string): void {
    // 特定效果回调
    const specific = this.onExpireCallbacks.get(effectId)
    if (specific) {
      for (const cb of specific) cb(effectId)
    }
    // 通配符回调
    const wildcard = this.onExpireCallbacks.get('*')
    if (wildcard) {
      for (const cb of wildcard) cb(effectId)
    }
  }

  private fireActivateCallbacks(effectId: string, stacks: number): void {
    const specific = this.onActivateCallbacks.get(effectId)
    if (specific) {
      for (const cb of specific) cb(effectId, stacks)
    }
    const wildcard = this.onActivateCallbacks.get('*')
    if (wildcard) {
      for (const cb of wildcard) cb(effectId, stacks)
    }
  }
}
