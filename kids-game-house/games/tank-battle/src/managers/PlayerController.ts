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
  private _lives: number = 3
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
    blinkInterval: 150,
    blinkCount: 10,
  }

  // ─── 变更日志 ─────────────────────────────────────────────────────
  private changeLog: PlayerStateChange[] = []

  // ─── 内部定时器引用 ──────────────────────────────────────────────
  private blinkTimer: Phaser.Time.TimerEvent | null = null
  private invincibleTimer: Phaser.Time.TimerEvent | null = null
  private frozenTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ [PlayerController] 已创建 —— 单一入口控制器')
  }

  // ===========================================================================
  // 📊 只读快照（唯一的外部查询入口）
  // ===========================================================================

  get data(): ReadonlyPlayerData {
    return {
      lives: this._lives,
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
   * 内部流程：护盾检查 → 无敌检查 → 护甲扣减 → 扣命 → 死亡/复活
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
   */
  private consumeInvincible(bullet?: any): void {
    this.safeDestroyBullet(bullet)

    const player = this.getPlayer()
    if (player) {
      this.setPlayerVisible(true)
      this.scene.spawnSparks(player.x, player.y, '#ffd700', 8)
      this.scene.playSound('sfx_hit', 0.3)
    }
  }

  // ===========================================================================
  // 💜 生命周期
  // ===========================================================================

  /**
   * ⭐ 增加生命
   */
  addLife(amount: number, reason: string = '道具加生命'): void {
    const oldLives = this._lives
    this._lives += amount
    this.logChange('lives', oldLives, this._lives, reason)
    this.syncGameStore()
  }

  /**
   * ⭐ 失去生命（内部方法，由 takeDamage 调用）
   */
  private loseLife(source: string): void {
    if (this._lives <= 0) return

    const oldLives = this._lives
    this._lives--
    this.logChange('lives', oldLives, this._lives, `${source}伤害 - 扣命`)

    // 同步 gameStore
    const gameStore = (this.scene as any).gameStore
    if (gameStore) {
      gameStore.loseLife()
    }

    // 发出事件
    if ((this.scene as any).game?.events) {
      (this.scene as any).game.events.emit('lifeLost', this._lives)
    }

    // 清除道具视觉效果
    const applier = (this.scene as any).powerUpEffectApplier
    const player = this.getPlayer()
    if (applier?.removeVisualEffects && player) {
      applier.removeVisualEffects(player)
    }

    // 受击反馈
    this.scene.playHitFeedback?.()
    if (player) {
      this.scene.spawnExplosion(player.x, player.y, 0.6)
      this.scene.cameraShake(200)
      this.scene.playSound('sfx_hit', 0.7)
    }

    if (this._lives > 0) {
      // 进入死亡动画 → 复活
      this.enterDyingState()
    } else {
      // 生命耗尽 → 游戏结束
      this.enterDeadState()
    }
  }

  /**
   * ⭐ 复活（从死亡/濒死状态恢复）
   * 内部方法，由死亡动画完成后回调触发
   */
  respawn(): void {
    this.cleanupTimers()

    // 重置战斗属性
    this._isShieldActive = false
    this._isFrozen = false
    this._armor = 0
    this.logChange('state', this._state, PlayerState.RESPAWNING, '复活')

    const player = this.getPlayer()
    if (!player) return

    // 复活点
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows
    const cellSize = (this.scene as any).cellSize
    const startX = (gridCols * cellSize) / 2
    const startY = (gridRows * cellSize) - 100

    // 清除复活点周围的敌人
    this.clearSpawnArea(startX, startY, 150)

    // 重置玩家物理状态
    player.x = startX
    player.y = startY
    player.setActive(true)
    if (player.body) {
      player.body.reset(startX, startY)
      player.body.setVelocity(0, 0)
      player.body.enable = true
      player.body.checkCollision.none = false
      player.body.setSize(40, 40)
      player.body.setOffset(12, 12)
    }
    player.direction = 'UP'
    player.setFrame(0)
    player.setDepth(100)

    // 重置方向
    const movementManager = (this.scene as any).movementManager
    if (movementManager?.resetDirection) {
      movementManager.resetDirection()
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
    }

    // 进入复活无敌状态（闪烁 + 保护）
    this._state = PlayerState.RESPAWNING
    this._isInvincible = true
    this._isDying = false
    this.startBlinkEffect()

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
  reset(initialLives: number = 3): void {
    this.cleanupTimers()

    this._lives = initialLives
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

    // 死亡动画持续后 → 复活
    this.scene.time.delayedCall(this.stateConfig.dyingDuration, () => {
      if (this._lives > 0) {
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
   */
  private finishRespawning(): void {
    this.cleanupTimers()

    this._state = PlayerState.INVINCIBLE
    this._isInvincible = true
    this.logChange('state', PlayerState.RESPAWNING, PlayerState.INVINCIBLE, '复活完成 - 进入无敌')

    this.setPlayerVisible(true)

    // 2 秒后退出无敌
    this.invincibleTimer = this.scene.time.delayedCall(2000, () => {
      if (this._state === PlayerState.INVINCIBLE) {
        this._state = PlayerState.ALIVE
        this._isInvincible = false
        this.logChange('state', PlayerState.INVINCIBLE, PlayerState.ALIVE, '无敌期结束')
      }
    })
  }

  /**
   * 激活临时无敌（护盾消耗后等场景）
   */
  private activateTemporaryInvincible(duration: number): void {
    if (this._state === PlayerState.DEAD || this._state === PlayerState.DYING) return

    this.cleanupTimers()
    this._isInvincible = true
    this.logChange('isInvincible', false, true, `临时无敌 ${duration}ms`)

    this.setPlayerVisible(true)

    // 闪烁效果（alpha 在 1 和 0.5 之间，不完全消失）
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

    // 到期恢复
    this.scene.time.delayedCall(duration, () => {
      this.cleanupTimers()
      this._isInvincible = false
      this.logChange('isInvincible', true, false, '临时无敌结束')
      this.setPlayerVisible(true)
    })
  }

  /**
   * 启动复活闪烁效果（alpha 在 0 和 1 之间）
   * ⚠️ 只用 setAlpha 做闪烁，不用 setVisible(false)（会移出 updateList）
   */
  private startBlinkEffect(): void {
    this.cleanupTimers()

    const player = this.getPlayer()
    if (!player) return

    if (!player.active) player.setActive(true)
    player.setVisible(true)
    player.setAlpha(0)

    let blinkOn = false
    this.blinkTimer = this.scene.time.addEvent({
      delay: this.stateConfig.blinkInterval,
      callback: () => {
        if (!player || !player.active) return
        blinkOn = !blinkOn
        player.setAlpha(blinkOn ? 1 : 0)
      },
      loop: true,
    })
  }

  /**
   * 设置玩家可见性
   */
  private setPlayerVisible(visible: boolean): void {
    const player = this.getPlayer()
    if (!player) return
    player.setActive(visible || true)  // active 始终保持 true（除非死亡）
    player.setVisible(true)
    player.setAlpha(visible ? 1 : 0)
    player.clearTint()
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
        lives: this._lives,
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
