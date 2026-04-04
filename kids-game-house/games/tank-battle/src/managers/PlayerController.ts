// ============================================================================
// 🎮 玩家控制器 —— 单一入口（Single Mutation Entry Point）
// ============================================================================
//
// 📌 核心原则:
//   所有修改玩家状态/属性的操作，收敛到此控制器中。
//   外部模块禁止：
//     ❌ 直接修改 player.setAlpha() / setVisible() / setActive()
//     ❌ 直接调用 gameStore.loseLife() / addLife() / $patch()
//     ❌ 直接修改任何 Manager 的内部状态字段
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { PlayerState, type IPlayerStateConfig } from './PlayerStateManager'
import { PowerUpType } from '../types/powerup-types'
import { EntityType } from './EntityManager'
import { Logger } from '../utils/Logger'

// ============================================================================
// 📊 只读数据对象
// ============================================================================

/**
 * 玩家完整数据快照（对外只读）
 * 所有想知道"玩家当前状态"的地方都读这个，不直接访问任何 Manager 的内部字段
 */
export interface ReadonlyPlayerData {
  // === 基础属性 ===
  readonly lives: number
  readonly score: number
  readonly level: number

  // === 战斗属性 ===
  readonly armor: number
  readonly maxArmor: number
  readonly bulletDamage: number
  readonly shootCooldown: number
  readonly speedMultiplier: number

  // === 状态标志 ===
  readonly state: PlayerState
  readonly isShieldActive: boolean
  readonly isFrozen: boolean
  readonly isInvincible: boolean
  readonly isDying: boolean
  readonly isGameOver: boolean
  readonly isHoming: boolean

  // === 计算属性 ===
  readonly canAct: boolean
  readonly canShoot: boolean
  readonly isValid: boolean
}

// ============================================================================
// 📝 变更日志
// ============================================================================

/**
 * 变更日志条目（调试和追溯用）
 */
export interface PlayerStateChange {
  timestamp: number
  field: string
  oldValue: any
  newValue: any
  reason: string
}

// ============================================================================
// 🎮 PlayerController
// ============================================================================

/**
 * ⭐ 玩家控制器 —— 所有玩家状态/属性变更的唯一入口
 *
 * 职责：
 *   1. 持有玩家完整数据的只读快照（PlayerData）
 *   2. 提供语义明确的命令方法（takeDamage / applyPowerUp / respawn 等）
 *   3. 每个命令方法内部完成「校验 → 修改 → 视觉同步 → UI 同步 → 日志」
 *   4. 不含复杂计算逻辑，计算委托给各 Manager
 */
export class PlayerController {
  private scene: TankGameScene

  // ─── 内部可变数据（对外只通过 data 暴露为只读） ───────────────────
  // ⭐ 核心设计原则：数据层与显示层完全分离
  private _currentLife: number = 1    // 当前命（0 或 1，默认基础状态）
  private _spareLives: number = 2     // 备用命（可以有很多条）
  
  private _score: number = 0
  private _level: number = 1
  private _armor: number = 0
  private _maxArmor: number = 3
  private _bulletDamage: number = 10
  private _shootCooldown: number = 300
  private _speedMultiplier: number = 1
  private _state: PlayerState = PlayerState.ALIVE
  private _isShieldActive: boolean = false
  private _isFrozen: boolean = false
  private _isInvincible: boolean = false
  private _isDying: boolean = false
  private _isGameOver: boolean = false
  private _isHoming: boolean = false

  // ─── 配置 ─────────────────────────────────────────────────────────
  private readonly stateConfig: IPlayerStateConfig = {
    invincibleDuration: 1500,
    dyingDuration: 500,
    blinkInterval: 100,      // ⭐ 加快闪烁间隔（从150ms改为100ms）
    blinkCount: 6,           // ⭐ 减少闪烁次数（从10次改为6次，总共600ms）
  }

  // ─── 变更日志 ─────────────────────────────────────────────────────
  private changeLog: PlayerStateChange[] = []

  // ─── 内部定时器引用 ──────────────────────────────────────────────
  private blinkTimer: Phaser.Time.TimerEvent | null = null
  private invincibleTimer: Phaser.Time.TimerEvent | null = null
  private frozenTimer: Phaser.Time.TimerEvent | null = null
  
  // ─── 复活位置 ─────────────────────────────────────────────────────
  private _respawnX: number = 0
  private _respawnY: number = 0

  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ [PlayerController] 已创建 —— 单一入口控制器')
  }

  // ===========================================================================
  // 📊 只读快照（唯一的外部查询入口）
  // ===========================================================================

  get data(): ReadonlyPlayerData {
    return {
      // ⭐ 显示层：从数据层计算得出
      lives: this._currentLife + this._spareLives,  // 总命数 = 当前命 + 备用命
      score: this._score,
      level: this._level,
      armor: this._armor,
      maxArmor: this._maxArmor,
      bulletDamage: this._bulletDamage,
      shootCooldown: this._shootCooldown,
      speedMultiplier: this._speedMultiplier,
      state: this._state,
      isShieldActive: this._isShieldActive,
      isFrozen: this._isFrozen,
      isInvincible: this._isInvincible,
      isDying: this._isDying,
      isGameOver: this._isGameOver,
      isHoming: this._isHoming,
      canAct: this.computeCanAct(),
      canShoot: this.computeCanShoot(),
      isValid: this.computeIsValid(),
    }
  }

  // ===========================================================================
  // 💥 伤害与防御
  // ===========================================================================

  /**
   * ⭐ 玩家受伤（唯一伤害入口）
   *
   * 内部流程：
   *   1. 护盾检查 → 有护盾则消耗，直接返回
   *   2. 无敌检查 → 无敌则忽略，直接返回
   *   3. 护甲扣减 → 有护甲则扣护甲，返回
   *   4. 无护甲 → 进入 loseLife 流程：
   *      a. 如果 lives <= 0：直接返回（防止负数）
   *      b. 执行 lives--（统一扣命）
   *      c. 播放死亡动画、音效等（统一处理）
   *      d. 根据剩余 lives 决定后续：
   *         - lives > 0：进入死亡动画 → 复活
   *         - lives = 0：游戏结束
   *
   * @param source 伤害来源类型
   * @param bullet 子弹对象（可选，用于子弹伤害路径的清理）
   */
  takeDamage(source: 'bullet' | 'collision', bullet?: any): void {
    // 🔒 状态锁：DYING / DEAD / GAMEOVER 状态不受理伤害
    if (this._isGameOver || this._state === PlayerState.DEAD || this._state === PlayerState.DYING) {
      this.safeDestroyBullet(bullet)
      return
    }

    // 🛡️ 护盾优先拦截
    if (this._isShieldActive) {
      Logger.debug('🛡️ [PlayerController] 护盾生效，消耗护盾')
      this.consumeShield(bullet)
      return
    }

    // ✨ 无敌拦截
    if (this._isInvincible) {
      Logger.debug('✨ [PlayerController] 无敌状态，忽略伤害')
      this.consumeInvincible(bullet)
      return
    }

    // 🛡️ 护甲扣减
    if (this._armor > 0) {
      const oldArmor = this._armor
      this._armor--
      this.logChange('armor', oldArmor, this._armor, `${source}伤害 - 护甲抵扣`)

      // 视觉反馈：确保玩家完全可见
      this.setPlayerVisible(true)

      // 特效
      this.scene.playSound('sfx_hit', 0.5)
      this.scene.cameraShake(150)

      this.safeDestroyBullet(bullet)
      return
    }

    // 🔴 无护甲 → 扣命
    this.safeDestroyBullet(bullet)
    this.loseLife(source)
  }

  /**
   * ⭐ 消耗护盾（抵挡伤害时）
   * 内部方法，由 takeDamage 调用
   */
  private consumeShield(bullet?: any): void {
    const oldShield = this._isShieldActive
    this._isShieldActive = false
    this.logChange('isShieldActive', oldShield, false, '护盾消耗')

    // 安全销毁子弹
    this.safeDestroyBullet(bullet)

    const player = this.getPlayer()

    // 清除护盾/无敌视觉效果
    const applier = (this.scene as any).powerUpEffectApplier
    if (applier?.removeEffectByType && player) {
      applier.removeEffectByType(PowerUpType.SHIELD, player)
      applier.removeEffectByType(PowerUpType.INVINCIBLE, player)
    }

    // 恢复玩家可见
    this.setPlayerVisible(true)

    // 护盾破碎特效
    if (player) {
      this.scene.spawnSparks(player.x, player.y, '#3b82f6', 8)
      this.scene.playSound('sfx_hit', 0.4)
      this.scene.cameraShake(80)
    }

    // 护盾消耗后短暂无敌（1秒），防止连续受伤
    this.activateTemporaryInvincible(1000)
  }

  /**
   * ⭐ 消耗无敌（抵挡伤害时）
   * ⭐ 修复：如果在闪烁期间，不覆盖 alpha，让闪烁效果继续
   */
  private consumeInvincible(bullet?: any): void {
    this.safeDestroyBullet(bullet)

    const player = this.getPlayer()
    if (player && player.active) {
      // ⭐ 只有不在闪烁期间才强制设置可见性
      if (!this.blinkTimer) {
        this.setPlayerVisible(true)
      }
      // ⭐ 优化：闪烁期间不播放受击特效，防止视觉干扰
      if (this._state !== PlayerState.RESPAWNING) {
        this.scene.spawnSparks(player.x, player.y, '#ffd700', 8)
        this.scene.playSound('sfx_hit', 0.3)
      } else {
        // ⭐ 复活闪烁期间，只播放轻微火花，不影响闪烁效果
        this.scene.spawnSparks(player.x, player.y, '#ffffff', 3)
      }
    }
  }

  // ===========================================================================
  // 💜 生命周期
  // ===========================================================================

  /**
   * ⭐ 增加生命（原子化方法：加备用命）
   */
  addLife(amount: number, reason: string = '道具加生命'): void {
    const oldSpareLives = this._spareLives
    this._spareLives += amount
    this.logChange('spareLives', oldSpareLives, this._spareLives, reason)
    this.syncGameStore()
  }
  
  /**
   * ⭐ 失去生命（核心逻辑：消耗当前命 → 判断是否可复活 → 消耗备用命）
   */
  private loseLife(source: string): void {
    // ────────────────────────────────────────
    // 第 1 步：当前命死亡（从 1 → 0）
    // ────────────────────────────────────────
    if (this._currentLife <= 0) {
      // 已经没有当前命了，直接返回（防止负数）
      return
    }
    
    this._currentLife = 0  // 当前命死亡
    
    // ────────────────────────────────────────
    // 第 2 步：播放死亡动画、同步 UI（统一处理）
    // ────────────────────────────────────────
    this.logChange('currentLife', 1, 0, `${source}伤害 - 当前命死亡`)
    
    // 同步 gameStore（显示层更新）
    const gameStore = (this.scene as any).gameStore
    if (gameStore) {
      gameStore.loseLife()  // UI 会重新计算 totalLives
    }
    
    // 发出事件
    if ((this.scene as any).game?.events) {
      (this.scene as any).game.events.emit('lifeLost', this._currentLife + this._spareLives)
    }
    
    // 清除道具视觉效果
    const applier = (this.scene as any).powerUpEffectApplier
    const player = this.getPlayer()
    if (applier?.removeVisualEffects && player) {
      applier.removeVisualEffects(player)
    }
    
    // 播放死亡动画和音效
    if (player) {
      // ⭐ 经典坦克大战实现：死亡时彻底销毁玩家（不是隐藏）
      console.log('💀 [PlayerController] 销毁玩家坦克...')
      
      // 记录玩家位置用于复活
      const gridCols = (this.scene as any).gridCols
      const gridRows = (this.scene as any).gridRows
      const cellSize = (this.scene as any).cellSize
      this._respawnX = (gridCols * cellSize) / 2
      this._respawnY = (gridRows * cellSize) - 100
      
      // 销毁玩家（从物理世界和显示列表移除）
      player.destroy()  // ← 关键：彻底销毁
      
      // 播放爆炸特效（在玩家原位置）
      this.scene.spawnExplosion(player.x, player.y, 0.6)
      this.scene.cameraShake(200)
      this.scene.playSound('sfx_hit', 0.7)
    }
    
    // ────────────────────────────────────────
    // 第 3 步：判断是否有备用命可以复活
    // ────────────────────────────────────────
    if (this.canRespawn()) {
      // ✅ 有备用命 → 复活
      this.enterDyingState()
    } else {
      // ❌ 没有备用命 → 游戏结束
      this.enterDeadState()
    }
  }
  
  /**
   * ⭐ 判断是否可以复活（原子化方法）
   */
  private canRespawn(): boolean {
    return this._spareLives > 0  // 只要有备用命就可以复活
  }

  /**
   * ⭐ 复活（从死亡/濒死状态恢复）
   * 内部方法，由死亡动画完成后回调触发
   * 
   * ⭐ 经典坦克大战实现：重新创建玩家坦克（不是复用）
   */
  respawn(): void {
    this.cleanupTimers()

    // 重置战斗属性
    this._isShieldActive = false
    this._isFrozen = false
    this._armor = 0
    
    // ⭐ 关键修复：消耗备用命，设置当前命
    if (this._spareLives > 0) {
      this._spareLives--  // 消耗 1 条备用命
    }
    this._currentLife = 1  // ⭐ 设置当前命为 1（复活）
    
    this.logChange('state', this._state, PlayerState.RESPAWNING, '复活')

    // ⭐ 经典坦克大战实现：重新创建玩家坦克（不是复用旧对象）
    console.log('🔄 [PlayerController] 开始复活玩家...')
    
    // 使用 EntityManager 重新创建玩家
    const entityManager = (this.scene as any).entityManager
    if (!entityManager) {
      console.error('❌ [PlayerController] entityManager 不存在！')
      return
    }
    
    // 重新创建玩家坦克
    const player = entityManager.createEntity({
      type: EntityType.PLAYER,
      x: this._respawnX,
      y: this._respawnY,
      texture: 'player_tank_up',
      attributes: { health: 1, speed: 200 }
    }) as Phaser.Physics.Arcade.Sprite
    
    if (!player) {
      console.error('❌ [PlayerController] 重新创建玩家失败！')
      return
    }
    
    console.log('✅ [PlayerController] 玩家坦克已重新创建:', {
      x: player.x,
      y: player.y,
      alpha: player.alpha,
      visible: player.visible,
      active: player.active
    })
    
    // ⭐ 设置其他属性（坐标已经在创建时设置了）
    player.setFrame(0)

    // 重置方向
    const movementManager = (this.scene as any).movementManager
    if (movementManager?.resetDirection) {
      movementManager.resetDirection()
    }
    
    // ⭐ 同步 player 引用到 MovementManager（防止引用丢失）
    if (movementManager?.setPlayer) {
      movementManager.setPlayer(player)
      console.log('✅ [PlayerController] MovementManager player 引用已同步')
    }

    // 清除道具视觉效果
    const applier = (this.scene as any).powerUpEffectApplier
    if (applier?.removeVisualEffects) {
      applier.removeVisualEffects(player)
    }

    // 重新绑定碰撞
    const collisionManager = (this.scene as any).collisionManager
    if (collisionManager?.rebindPlayerCollisions) {
      collisionManager.rebindPlayerCollisions()
      console.log('✅ [PlayerController] 碰撞已重新绑定')
    }

    // ⭐ 关键优化：复活后暂时禁用子弹碰撞，防止闪烁期间被击中
    // 碰撞已经在 rebindPlayerCollisions 中建立，但我们需要在无敌期间忽略碰撞
    // 这通过 takeDamage 中的 _isInvincible 检查来实现
    console.log('🛡️ [PlayerController] 复活后无敌保护已启用，免疫子弹伤害')

    // 进入复活无敌状态（闪烁 + 保护）
    this._state = PlayerState.RESPAWNING
    this._isInvincible = true
    this._isDying = false
    
    // ⭐ 先设置位置和可见性，再开始闪烁
    this.startBlinkEffect()
    console.log('✨ [PlayerController] 闪烁效果已启动')

    // 闪烁结束后 → INVINCIBLE（额外 2s 保护期）
    this.scene.time.delayedCall(this.stateConfig.invincibleDuration, () => {
      this.finishRespawning()
    })
  }

  // ===========================================================================
  // 🎁 道具效果
  // ===========================================================================

  /**
   * ⭐ 应用道具效果（统一入口）
   *
   * 内部流程：属性修改 → 视觉效果委托 → UI 同步 → 日志记录
   */
  applyPowerUp(type: PowerUpType, player: any): void {
    Logger.debug(`🎁 [PlayerController] 应用道具：${type}`)

    switch (type) {
      case PowerUpType.STAR:
        this.applyUpgrade()
        break

      case PowerUpType.SHIELD:
        this.activateShield()
        break

      case PowerUpType.INVINCIBLE:
        this.activateShield()  // 无敌和护盾共享激活逻辑
        break

      case PowerUpType.CLOCK:
        this.scene.events.emit('freezeAllEnemies', { duration: 8000 })
        break

      case PowerUpType.GUN:
        this.applyShotgun()
        break

      case PowerUpType.HOMING:
        this.activateHoming()
        break

      case PowerUpType.BOMB:
        this.scene.events.emit('explodeAllEnemies')
        break

      case PowerUpType.GRENADE:
        this.scene.events.emit('explodeAllEnemies')
        break

      case PowerUpType.SPEED:
        this.applySpeedBoost()
        break

      case PowerUpType.HEALTH:
        this.addArmor(50, '生命恢复道具')
        break

      case PowerUpType.ARMOR:
        this.addArmor(100, '装甲强化道具')
        break

      case PowerUpType.LIFE:
        this.addLife(1, '额外生命道具')
        break

      default:
        Logger.warn(`⚠️ [PlayerController] 未知的道具类型：${type}`)
    }
  }

  /**
   * ⭐ 激活护盾
   */
  private activateShield(): void {
    const old = this._isShieldActive
    this._isShieldActive = true
    this.logChange('isShieldActive', old, true, '护盾道具')

    const player = this.getPlayer()
    if (player) {
      this.scene.spawnSparks(player.x, player.y, '#3b82f6', 8)
      this.scene.playSound('sfx_powerup', 0.5)
    }
  }

  /**
   * ⭐ 火力升级
   */
  private applyUpgrade(): void {
    const old = this._bulletDamage
    this._bulletDamage += 5
    this.logChange('bulletDamage', old, this._bulletDamage, '火力升级道具')

    // 同步到 combatManager 的配置（射击逻辑仍在 combatManager 中执行）
    const combatManager = (this.scene as any).combatManager
    if (combatManager?.setBulletDamage) {
      combatManager.setBulletDamage(this._bulletDamage)
    }
  }

  /**
   * ⭐ 散弹枪效果
   */
  private applyShotgun(): void {
    const oldDmg = this._bulletDamage
    const oldCd = this._shootCooldown
    this._bulletDamage = Math.round(this._bulletDamage * 1.5)
    this._shootCooldown = 150
    this.logChange('bulletDamage', oldDmg, this._bulletDamage, '散弹枪道具')
    this.logChange('shootCooldown', oldCd, this._shootCooldown, '散弹枪道具')

    // 同步到 combatManager
    const combatManager = (this.scene as any).combatManager
    if (combatManager?.setBulletDamage) {
      combatManager.setBulletDamage(this._bulletDamage)
    }
    if (combatManager?.setShootCooldown) {
      combatManager.setShootCooldown(this._shootCooldown)
    }

    // 5秒后恢复
    this.scene.time.delayedCall(5000, () => {
      this._bulletDamage = oldDmg
      this._shootCooldown = 300
      if (combatManager?.setBulletDamage) combatManager.setBulletDamage(this._bulletDamage)
      if (combatManager?.setShootCooldown) combatManager.setShootCooldown(this._shootCooldown)
    })
  }

  /**
   * ⭐ 追踪导弹
   */
  private activateHoming(): void {
    this._isHoming = true
    this.logChange('isHoming', false, true, '追踪导弹道具')

    const player = this.getPlayer()
    if (player) {
      player.setData('homing', true)
    }

    // 10秒后恢复
    this.scene.time.delayedCall(10000, () => {
      this._isHoming = false
      this.logChange('isHoming', true, false, '追踪导弹到期')
      const p = this.getPlayer()
      if (p) p.setData('homing', false)
    })
  }

  /**
   * ⭐ 速度提升
   */
  private applySpeedBoost(): void {
    const old = this._speedMultiplier
    this._speedMultiplier = 1.5
    this.logChange('speedMultiplier', old, 1.5, '速度道具')

    const movementManager = (this.scene as any).movementManager
    if (movementManager?.setSpeedMultiplier) {
      movementManager.setSpeedMultiplier(1.5)
    }

    // 5秒后恢复
    this.scene.time.delayedCall(5000, () => {
      this._speedMultiplier = 1
      this.logChange('speedMultiplier', 1.5, 1, '速度道具到期')
      if (movementManager?.setSpeedMultiplier) {
        movementManager.setSpeedMultiplier(1)
      }
    })
  }

  /**
   * ⭐ 添加护甲
   */
  addArmor(amount: number, reason: string = '护甲增加'): void {
    const old = this._armor
    this._armor = Math.min(this._armor + amount, this._maxArmor)
    this.logChange('armor', old, this._armor, reason)
  }

  // ===========================================================================
  // 📊 分数与关卡
  // ===========================================================================

  /**
   * ⭐ 加分
   */
  addScore(points: number, reason: string = '加分'): void {
    const old = this._score
    this._score += points
    this.logChange('score', old, this._score, reason)
    this.syncGameStore()
  }

  // ===========================================================================
  // 🎮 游戏流程
  // ===========================================================================

  /**
   * ⭐ 游戏结束
   */
  setGameOver(): void {
    if (this._isGameOver) return

    this._isGameOver = true
    this.logChange('isGameOver', false, true, '游戏结束')

    const gameStore = (this.scene as any).gameStore
    if (gameStore) {
      gameStore.$patch({
        isGameOver: true,
        score: this._score,
      })
    }
  }

  /**
   * ⭐ 新游戏重置
   */
  reset(initialSpareLives: number = 2): void {
    this.cleanupTimers()

    // ⭐ 重置为默认状态：1 条当前命 + N 条备用命
    this._currentLife = 1
    this._spareLives = initialSpareLives
    
    this._score = 0
    this._level = 1
    this._armor = 0
    this._bulletDamage = 10
    this._shootCooldown = 300
    this._speedMultiplier = 1
    this._state = PlayerState.ALIVE
    this._isShieldActive = false
    this._isFrozen = false
    this._isInvincible = false
    this._isDying = false
    this._isGameOver = false
    this._isHoming = false

    this.changeLog = []

    const gameStore = (this.scene as any).gameStore
    if (gameStore?.reset) gameStore.reset()

    Logger.debug('🔄 [PlayerController] 状态已重置')
  }

  // ===========================================================================
  // 🔧 销毁
  // ===========================================================================

  destroy(): void {
    this.cleanupTimers()
    this.changeLog = []
  }

  // ===========================================================================
  // 🔒 内部方法 —— 状态转换与视觉效果
  // ===========================================================================

  /**
   * 进入死亡状态（播放死亡动画 → 自动复活或结束游戏）
   */
  private enterDyingState(): void {
    const oldState = this._state
    this._state = PlayerState.DYING
    this._isDying = true
    this.logChange('state', oldState, PlayerState.DYING, '玩家死亡动画')

    // 玩家隐身（死亡动画）
    this.setPlayerVisible(false)

    const player = this.getPlayer()
    if (player) {
      this.scene.spawnExplosion(player.x, player.y, 0.6)
      this.scene.cameraShake(100)
    }

    // 死亡动画持续后 → 判断是否可复活
    this.scene.time.delayedCall(this.stateConfig.dyingDuration, () => {
      if (this.canRespawn()) {
        this.respawn()
      } else {
        this.enterDeadState()
      }
    })
  }

  /**
   * 进入死亡状态（生命耗尽 → 游戏结束）
   */
  private enterDeadState(): void {
    const oldState = this._state
    this._state = PlayerState.DEAD
    this._isDying = false
    this._isInvincible = false
    this.logChange('state', oldState, PlayerState.DEAD, '生命耗尽')

    this.cleanupTimers()

    // 游戏结束
    this.scene.handleGameOver()
  }

  /**
   * 完成复活（闪烁结束 → 短暂无敌）
   * ⭐ 修复：确保停止闪烁并正确设置可见性
   */
  private finishRespawning(): void {
    console.log('🎉 [PlayerController] 完成复活...')
    
    // ⭐ 立即停止闪烁定时器，防止继续干扰 alpha
    if (this.blinkTimer) {
      console.log(`⏹️ [PlayerController] 准备停止闪烁定时器，当前 blinkTimer=${this.blinkTimer}`)
      this.blinkTimer.remove(false)
      this.blinkTimer = null
      console.log('✅ [PlayerController] 闪烁定时器已停止')
    }

    this._state = PlayerState.INVINCIBLE
    this._isInvincible = true
    this.logChange('state', PlayerState.RESPAWNING, PlayerState.INVINCIBLE, '复活完成 - 进入无敌')

    // ⭐ 确保玩家完全可见
    const player = this.getPlayer()
    if (player && player.active) {
      console.log(`👁️ [PlayerController] 设置可见性前：alpha=${player.alpha}, visible=${player.visible}`)
      player.setVisible(true)
      player.setAlpha(1)
      player.clearTint()
      console.log(`✅ [PlayerController] 玩家已设为完全可见，alpha=${player.alpha}`)
    } else {
      console.warn('⚠️ [PlayerController] 玩家未激活，无法设置可见性')
    }

    // 2 秒后退出无敌
    this.invincibleTimer = this.scene.time.delayedCall(2000, () => {
      if (this._state === PlayerState.INVINCIBLE) {
        this._state = PlayerState.ALIVE
        this._isInvincible = false
        this.logChange('state', PlayerState.INVINCIBLE, PlayerState.ALIVE, '无敌期结束')
        
        console.log('✨ [PlayerController] 无敌期结束，恢复到 ALIVE 状态')
        
        // ⭐ 无敌期结束后再次确保可见
        const p = this.getPlayer()
        if (p && p.active) {
          p.setVisible(true)
          p.setAlpha(1)
          console.log('✅ [PlayerController] 玩家最终确认可见')
        }
      }
    })
  }

  /**
   * 激活临时无敌（护盾消耗后等场景）
   * ⭐ 修复：如果在闪烁期间，不启动新的闪烁定时器
   */
  private activateTemporaryInvincible(duration: number): void {
    if (this._state === PlayerState.DEAD || this._state === PlayerState.DYING) return

    this.cleanupTimers()
    this._isInvincible = true
    this.logChange('isInvincible', false, true, `临时无敌 ${duration}ms`)

    // ⭐ 只有不在闪烁期间才设置可见性
    if (!this.blinkTimer) {
      this.setPlayerVisible(true)
    }

    // ⭐ 闪烁效果（alpha 在 1 和 0.5 之间，不完全消失）
    // 但如果在 RESPAWNING 闪烁期间，不启动新的闪烁定时器
    if (this.blinkTimer) {
      // 闪烁期间不启动新闪烁，保持 RESPAWNING 闪烁效果
    } else {
      let blinkOn = true
      this.blinkTimer = this.scene.time.addEvent({
        delay: this.stateConfig.blinkInterval,
        callback: () => {
          const p = this.getPlayer()
          if (!p || !p.active) return
          blinkOn = !blinkOn
          p.setAlpha(blinkOn ? 1 : 0.5)
        },
        loop: true,
      })
    }

    // 到期恢复
    this.scene.time.delayedCall(duration, () => {
      // ✅ 先停止闪烁定时器，防止最后一轮回调覆盖 alpha 值
      if (this.blinkTimer) {
        this.blinkTimer.remove(false)
        this.blinkTimer = null
      }
      
      this._isInvincible = false
      this.logChange('isInvincible', true, false, '临时无敌结束')
      
      // ⭐ 确保玩家完全可见
      const p = this.getPlayer()
      if (p && p.active) {
        p.setVisible(true)
        p.setAlpha(1)
        p.clearTint()
      }
    })
  }

  /**
   * 启动复活闪烁效果（闪烁期间大部分时间可见）
   * ⭐ 修复：使用标志位确保停止后不再设置 alpha
   */
  private startBlinkEffect(): void {
    this.cleanupTimers()
  
    const player = this.getPlayer()
    if (!player) return
  
    if (!player.active) player.setActive(true)
    player.setVisible(true)
    player.setAlpha(1)  // ⭐ 初始设为完全可见
  
    let blinkOn = true  // ⭐ 初始为 true（可见）
    let blinkCount = 0
    const maxBlinks = this.stateConfig.blinkCount * 2  // 总闪烁次数
    let isStopping = false  // ⭐ 标志位：是否正在停止
  
    this.blinkTimer = this.scene.time.addEvent({
      delay: this.stateConfig.blinkInterval,
      callback: () => {
        if (!player || !player.active) return
          
        // ⭐ 如果已经在停止过程中，直接返回
        if (isStopping) return
          
        blinkCount++
          
        // ⭐ 先判断是否达到最大次数
        if (blinkCount >= maxBlinks) {
          isStopping = true  // ⭐ 设置标志位
            
          // ⭐ 强制设为完全可见（不受 blinkOn 影响）
          player.setAlpha(1)
            
          this.blinkTimer?.remove(false)
          this.blinkTimer = null
          return
        }
          
        // ⭐ 只有未达到最大次数时才切换 alpha
        blinkOn = !blinkOn
        player.setAlpha(blinkOn ? 1 : 0.3)  // ⭐ 不可见时设为 0.3（半透明），不是 0
      },
      loop: true,
    })
  }

  /**
   * 设置玩家可见性
   * ⭐ 修复：只使用 setVisible，不用 alpha 控制可见性（防止覆盖闪烁效果）
   */
  private setPlayerVisible(visible: boolean): void {
    const player = this.getPlayer()
    if (!player) return
    
    // ⭐ 只设置 visible，不修改 alpha
    // alpha 由闪烁效果单独控制
    player.setVisible(visible)
    player.setActive(visible || true)  // active 始终保持 true（除非死亡）
  }

  // ===========================================================================
  // 🛠️ 辅助方法
  // ===========================================================================

  private getPlayer(): Phaser.Physics.Arcade.Sprite | undefined {
    return (this.scene as any).player
  }

  private safeDestroyBullet(bullet: any): void {
    try {
      if (bullet && typeof bullet.destroy === 'function') {
        bullet.destroy()
      }
    } catch (e) {
      // 子弹可能已被销毁
    }
  }

  private clearSpawnArea(centerX: number, centerY: number, radius: number): void {
    const enemies = (this.scene as any).enemies?.getChildren() || []
    enemies.forEach((enemy: any) => {
      if (!enemy.active) return
      const dx = enemy.x - centerX
      const dy = enemy.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < radius) {
        enemy.destroy()
        this.scene.spawnExplosion(enemy.x, enemy.y, 0.8)
        this.scene.addScore(50)
      }
    })
  }

  private syncGameStore(): void {
    const gameStore = (this.scene as any).gameStore
    if (gameStore) {
      gameStore.$patch({
        score: this._score,
        // ⭐ 显示层：从数据层计算总命数
        lives: this._currentLife + this._spareLives,
      })
    }
  }

  private cleanupTimers(): void {
    if (this.blinkTimer) {
      this.blinkTimer.destroy()
      this.blinkTimer = null
    }
    if (this.invincibleTimer) {
      this.invincibleTimer.remove()
      this.invincibleTimer = null
    }
    if (this.frozenTimer) {
      this.frozenTimer.remove()
      this.frozenTimer = null
    }
  }

  // ===========================================================================
  // 📝 计算属性
  // ===========================================================================

  private computeCanAct(): boolean {
    return this._state === PlayerState.ALIVE ||
           this._state === PlayerState.INVINCIBLE ||
           this._state === PlayerState.RESPAWNING
  }

  private computeCanShoot(): boolean {
    return this.computeCanAct() && !this._isFrozen && this._state !== PlayerState.RESPAWNING
  }

  private computeIsValid(): boolean {
    return this._state !== PlayerState.DEAD && this._state !== PlayerState.DYING
  }

  // ===========================================================================
  // 📝 变更日志
  // ===========================================================================

  private logChange(field: string, oldValue: any, newValue: any, reason: string): void {
    const entry: PlayerStateChange = {
      timestamp: Date.now(),
      field,
      oldValue,
      newValue,
      reason,
    }
    this.changeLog.push(entry)

    // 开发环境打印日志
    Logger.debug(`📝 [PlayerController] ${field}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)} (${reason})`)

    // 限制日志大小（保留最近 200 条）
    if (this.changeLog.length > 200) {
      this.changeLog = this.changeLog.slice(-100)
    }
  }

  /**
   * 获取变更日志（调试用）
   */
  getChangeLog(): PlayerStateChange[] {
    return [...this.changeLog]
  }
}
