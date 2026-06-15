import { GAME_CONFIG, SKILL_CONFIG, TOWER_LAYOUTS } from './config'
import type { GameState, ButtonState, JoystickInput, Tower } from './types'
import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { updatePlayer, updatePlayerRespawn, updateSkillCooldowns } from './logic/player'
import { updateEnemy, updateEnemyRespawn } from './logic/enemy'
import { spawnMinionWave, updateMinions } from './logic/minion'
import { initNeutralCreeps, updateNeutralCreeps, getCreepReward } from './logic/neutralCreep'
import {
  createSkillEffect, updateSkillEffects, updateParticles, updateFloatTexts,
  checkSkillDamageHero, checkSkillDamageMinions, checkSkillDamageTowers,
  addSkillParticles, addFloatText, grantExp, updateTowers, rectCollision,
} from './logic/combat'
import { renderGame } from './render/index'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'

let activeHost: GameLifecycle | null = null
let activeGame: WangzheRpgGame | null = null

export function destroyWangzheRpg(): void {
  activeGame?.stop()
  activeGame = null
  activeHost?.destroy()
  activeHost = null
}

export function initWangzheRpg(engine: GameEngine, onEnd: () => void): void {
  destroyWangzheRpg()
  const lifecycleCtx = createLifecycleContext('wangzheRpg', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }
  const game = new WangzheRpgGame(engine, lifecycleCtx.canvas)
  activeGame = game
  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      game.beginPlay()
    },
    onUpdate(dt) {
      if (!engine.canTick()) return
      game.runHostUpdate(dt * 1000)
    },
    onRender() {
      game.runHostRender()
    },
    onDestroy() {
      game.stop()
      activeGame = null
    },
  })
}

export function getWangzheRpgGame(): WangzheRpgGame | null {
  return activeGame
}

export class WangzheRpgGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private state: GameState
  private lastTime: number = 0
  private platformEnded = false
  private canvasWidth: number = 0
  private canvasHeight: number = 0
  private cameraX: number = 0
  private cameraY: number = 0

  private joystick: JoystickInput = { active: false, dirX: 0, dirY: 0 }
  private buttons: ButtonState = { attack: false, skill1: false, skill2: false, skill3: false }

  // 触控状态
  private joystickTouchId: number = -1
  private joystickBaseX: number = 0
  private joystickBaseY: number = 0
  private joystickCurrentX: number = 0
  private joystickCurrentY: number = 0
  private readonly joystickRadius: number = 55
  private readonly joystickKnobRadius: number = 22
  private readonly joystickCenterX: number = 0
  private readonly joystickCenterY: number = 0

  private touchButtons: { id: string; x: number; y: number; radius: number; pressed: boolean; touchId: number }[] = []

  // 触摸事件监听器引用（用于清理）
  private boundTouchStart: ((e: TouchEvent) => void) | null = null
  private boundTouchMove: ((e: TouchEvent) => void) | null = null
  private boundTouchEnd: ((e: TouchEvent) => void) | null = null
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null

  constructor(engine: GameEngine, canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')!
    this.engine = engine
    this.canvasWidth = this.canvas.width
    this.canvasHeight = this.canvas.height
    this.state = this.createInitialState()

    // 设置触控按钮位置（屏幕坐标，不受相机影响）
    this.joystickCenterX = this.canvasWidth * 0.15
    this.joystickCenterY = this.canvasHeight * 0.7
    this.joystickBaseX = this.joystickCenterX
    this.joystickBaseY = this.joystickCenterY
    this.joystickCurrentX = this.joystickCenterX
    this.joystickCurrentY = this.joystickCenterY

    const btnX = this.canvasWidth - 85
    const btnR = 28
    this.touchButtons = [
      { id: 'attack', x: btnX, y: this.canvasHeight * 0.55, radius: btnR, pressed: false, touchId: -1 },
      { id: 'skill1', x: btnX, y: this.canvasHeight * 0.35, radius: btnR, pressed: false, touchId: -1 },
      { id: 'skill2', x: btnX - 70, y: this.canvasHeight * 0.45, radius: btnR, pressed: false, touchId: -1 },
      { id: 'skill3', x: btnX - 140, y: this.canvasHeight * 0.55, radius: btnR, pressed: false, touchId: -1 },
    ]
  }

  private createInitialState(): GameState {
    const worldWidth = GAME_CONFIG.WORLD_WIDTH
    const worldHeight = GAME_CONFIG.WORLD_HEIGHT
    const playerSize = GAME_CONFIG.PLAYER_SIZE

    const player = {
      x: 80,
      y: 360,
      width: playerSize,
      height: playerSize,
      hp: GAME_CONFIG.PLAYER_HP,
      maxHp: GAME_CONFIG.PLAYER_HP,
      isDead: false,
      respawnTimer: 0,
      hitFlashTimer: 0,
      facingAngle: 0,
      facingDir: 1,
      level: 1,
      exp: 0,
      expToNext: GAME_CONFIG.EXP_BASE,
      attackAnimTimer: 0,
      skillCooldowns: [0, 0, 0],
      gold: 0,
      animTimer: 0,
      isMoving: false,
      skillCastTimer: 0,
      skillCastId: 0,
      deathAnimTimer: 0,
    }

    const enemySize = GAME_CONFIG.ENEMY_SIZE
    const enemy = {
      x: worldWidth - 120,
      y: 270,
      width: enemySize,
      height: enemySize,
      hp: GAME_CONFIG.ENEMY_HP,
      maxHp: GAME_CONFIG.ENEMY_HP,
      isDead: false,
      respawnTimer: 0,
      hitFlashTimer: 0,
      aiState: 'lane' as const,
      currentLane: 'mid' as const,
      patrolTimer: 0,
      patrolDirX: -1,
      patrolDirY: 0,
      attackCooldown: 0,
      attackAnimTimer: 0,
      level: 1,
      skillCooldowns: [0, 0, 0],
      facingDir: -1,
      animTimer: 0,
      isMoving: false,
      skillCastTimer: 0,
      deathAnimTimer: 0,
    }

    // 从 TOWER_LAYOUTS 创建所有防御塔
    const towers: Tower[] = TOWER_LAYOUTS.map(layout => {
      const hp = layout.tier === 4
        ? GAME_CONFIG.TOWER_BASE_HP
        : layout.tier === 3
          ? GAME_CONFIG.TOWER_T3_HP
          : layout.tier === 2
            ? GAME_CONFIG.TOWER_T2_HP
            : GAME_CONFIG.TOWER_T1_HP

      return {
        x: layout.x - GAME_CONFIG.TOWER_SIZE / 2,
        y: layout.y - GAME_CONFIG.TOWER_SIZE / 2,
        width: GAME_CONFIG.TOWER_SIZE,
        height: GAME_CONFIG.TOWER_SIZE,
        hp,
        maxHp: hp,
        isDestroyed: false,
        team: layout.team,
        attackCooldown: 0,
        attackRange: GAME_CONFIG.TOWER_ATTACK_RANGE,
        attackDamage: GAME_CONFIG.TOWER_ATTACK_DAMAGE,
        tier: layout.tier,
        lane: layout.lane,
      }
    })

    return {
      worldWidth,
      worldHeight,
      player,
      enemy,
      minions: [],
      towers,
      neutralCreeps: initNeutralCreeps(),
      skillEffects: [],
      particles: [],
      floatTexts: [],
      playerKills: 0,
      enemyKills: 0,
      gameStartTime: Date.now(),
      remainingTime: GAME_CONFIG.GAME_DURATION,
      gameOver: false,
      victory: false,
      gameOverReason: '',
      minionWaveTimer: 0,
      waveNumber: 0,
      screenShake: 0,
    }
  }

  beginPlay(): void {
    this.lastTime = performance.now()
    this.setupTouchControls()
    this.setupKeyboardControls()
  }

  stop(): void {
    this.removeTouchControls()
    this.removeKeyboardControls()
  }

  runHostUpdate(deltaMs: number): void {
    const now = performance.now()
    this.update(deltaMs, now)
  }

  runHostRender(): void {
    this.render()
  }

  /**
   * 设置触控监听
   */
  private setupTouchControls(): void {
    applyCanvasMobileStyles(this.canvas)
    this.boundTouchStart = (e: TouchEvent) => this.onTouchStart(e)
    this.boundTouchMove = (e: TouchEvent) => this.onTouchMove(e)
    this.boundTouchEnd = (e: TouchEvent) => this.onTouchEnd(e)

    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false })
    this.canvas.addEventListener('touchcancel', this.boundTouchEnd, { passive: false })
  }

  /**
   * 移除触控监听
   */
  private removeTouchControls(): void {
    if (this.boundTouchStart) {
      this.canvas.removeEventListener('touchstart', this.boundTouchStart)
    }
    if (this.boundTouchMove) {
      this.canvas.removeEventListener('touchmove', this.boundTouchMove)
    }
    if (this.boundTouchEnd) {
      this.canvas.removeEventListener('touchend', this.boundTouchEnd)
      this.canvas.removeEventListener('touchcancel', this.boundTouchEnd)
    }
  }

  /**
   * 将屏幕坐标转换为 Canvas 逻辑坐标（处理横屏旋转偏移）
   * 当 force-landscape 旋转 90deg 时，screenX 对应 canvasY，screenY 对应反转的 canvasX
   */
  private screenToCanvas(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    rotated: boolean,
  ): { tx: number; ty: number } {
    if (!rotated) {
      const scaleX = this.canvasWidth / rect.width
      const scaleY = this.canvasHeight / rect.height
      return {
        tx: (clientX - rect.left) * scaleX,
        ty: (clientY - rect.top) * scaleY,
      }
    }

    // 90deg 顺时针旋转后：
    // canvasX = 屏幕Y / 屏幕高度 * canvasWidth
    // canvasY = canvasHeight - 屏幕X / 屏幕宽度 * canvasHeight
    const nx = (clientY - rect.top) / rect.height
    const ny = 1 - (clientX - rect.left) / rect.width
    return {
      tx: nx * this.canvasWidth,
      ty: ny * this.canvasHeight,
    }
  }

  /**
   * 触摸开始
   */
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    const rotated = rect.width < rect.height

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const { tx, ty } = this.screenToCanvas(touch.clientX, touch.clientY, rect, rotated)

      // 判断是否点击摇杆区域（左侧）
      if (tx < this.canvasWidth * 0.4) {
        this.joystickTouchId = touch.identifier
        this.joystickBaseX = tx
        this.joystickBaseY = ty
        this.joystickCurrentX = tx
        this.joystickCurrentY = ty
        this.updateJoystickOutput()
        continue
      }

      // 判断是否点击按钮
      for (const btn of this.touchButtons) {
        const dx = tx - btn.x
        const dy = ty - btn.y
        if (dx * dx + dy * dy <= btn.radius * btn.radius) {
          btn.pressed = true
          btn.touchId = touch.identifier
          this.syncButtonState()
          break
        }
      }
    }
  }

  /**
   * 触摸移动
   */
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    const rotated = rect.width < rect.height

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const { tx, ty } = this.screenToCanvas(touch.clientX, touch.clientY, rect, rotated)

      // 摇杆移动
      if (touch.identifier === this.joystickTouchId) {
        const dx = tx - this.joystickBaseX
        const dy = ty - this.joystickBaseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > this.joystickRadius) {
          const ratio = this.joystickRadius / dist
          this.joystickCurrentX = this.joystickBaseX + dx * ratio
          this.joystickCurrentY = this.joystickBaseY + dy * ratio
        } else {
          this.joystickCurrentX = tx
          this.joystickCurrentY = ty
        }
        this.updateJoystickOutput()
      }
    }
  }

  /**
   * 触摸结束
   */
  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault()

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]

      // 摇杆释放
      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = -1
        this.joystickBaseX = this.joystickCenterX
        this.joystickBaseY = this.joystickCenterY
        this.joystickCurrentX = this.joystickCenterX
        this.joystickCurrentY = this.joystickCenterY
        this.joystick.active = false
        this.joystick.dirX = 0
        this.joystick.dirY = 0
      }

      // 按钮释放
      for (const btn of this.touchButtons) {
        if (touch.identifier === btn.touchId) {
          btn.pressed = false
          btn.touchId = -1
          this.syncButtonState()
        }
      }
    }
  }

  /**
   * 更新摇杆输出
   */
  private updateJoystickOutput(): void {
    const dx = this.joystickCurrentX - this.joystickBaseX
    const dy = this.joystickCurrentY - this.joystickBaseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const deadZone = this.joystickRadius * 0.15

    if (dist < deadZone) {
      this.joystick.active = false
      this.joystick.dirX = 0
      this.joystick.dirY = 0
    } else {
      this.joystick.active = true
      const normalizedDist = (dist - deadZone) / (this.joystickRadius - deadZone)
      const clampedDist = Math.min(normalizedDist, 1)
      this.joystick.dirX = (dx / dist) * clampedDist
      this.joystick.dirY = (dy / dist) * clampedDist
    }
  }

  /**
   * 同步按钮状态到 buttons 对象
   */
  private syncButtonState(): void {
    this.buttons.attack = false
    this.buttons.skill1 = false
    this.buttons.skill2 = false
    this.buttons.skill3 = false
    for (const btn of this.touchButtons) {
      if (btn.pressed) {
        const key = btn.id as keyof ButtonState
        this.buttons[key] = true
      }
    }
  }

  /**
   * 设置键盘控制
   */
  private setupKeyboardControls(): void {
    this.boundKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          this.joystick.dirX = -1; this.joystick.active = true; break
        case 'ArrowRight': case 'd': case 'D':
          this.joystick.dirX = 1; this.joystick.active = true; break
        case 'ArrowUp': case 'w': case 'W':
          this.joystick.dirY = -1; this.joystick.active = true; break
        case 'ArrowDown': case 's': case 'S':
          this.joystick.dirY = 1; this.joystick.active = true; break
        case 'j': case 'J': this.buttons.attack = true; break
        case '1': this.buttons.skill1 = true; break
        case '2': this.buttons.skill2 = true; break
        case '3': this.buttons.skill3 = true; break
      }
    }

    this.boundKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
        case 'ArrowRight': case 'd': case 'D':
          this.joystick.dirX = 0; break
        case 'ArrowUp': case 'w': case 'W':
        case 'ArrowDown': case 's': case 'S':
          this.joystick.dirY = 0; break
        case 'j': case 'J': this.buttons.attack = false; break
        case '1': this.buttons.skill1 = false; break
        case '2': this.buttons.skill2 = false; break
        case '3': this.buttons.skill3 = false; break
      }
      // 如果所有方向键都释放了
      if (!this.joystick.dirX && !this.joystick.dirY) {
        this.joystick.active = false
      }
    }

    document.addEventListener('keydown', this.boundKeyDown)
    document.addEventListener('keyup', this.boundKeyUp)
  }

  /**
   * 移除键盘控制
   */
  private removeKeyboardControls(): void {
    if (this.boundKeyDown) {
      document.removeEventListener('keydown', this.boundKeyDown)
      this.boundKeyDown = null
    }
    if (this.boundKeyUp) {
      document.removeEventListener('keyup', this.boundKeyUp)
      this.boundKeyUp = null
    }
  }

  setJoystick(dirX: number, dirY: number, active: boolean): void {
    this.joystick.dirX = dirX
    this.joystick.dirY = dirY
    this.joystick.active = active
  }

  setButton(button: keyof ButtonState, pressed: boolean): void {
    this.buttons[button] = pressed
  }

  private update(deltaMs: number, now: number): void {
    const s = this.state

    if (s.gameOver) return

    // 更新倒计时
    s.remainingTime -= deltaMs
    if (s.remainingTime <= 0) {
      s.remainingTime = 0
      this.endGame(
        s.playerKills > s.enemyKills,
        s.playerKills === s.enemyKills ? '时间到，平局！' : '时间到！',
      )
      return
    }

    // 检查基地是否被摧毁
    const playerBase = s.towers.find(t => t.team === 'player' && t.tier === 4)
    const enemyBase = s.towers.find(t => t.team === 'enemy' && t.tier === 4)
    if (playerBase && playerBase.isDestroyed) {
      this.endGame(false, '我方基地被摧毁！')
      return
    }
    if (enemyBase && enemyBase.isDestroyed) {
      this.endGame(true, '敌方基地被摧毁！')
      return
    }

    // 更新屏幕震动
    if (s.screenShake > 0) {
      s.screenShake -= deltaMs
    }

    // 更新技能冷却
    updateSkillCooldowns(s.player, deltaMs)

    // 更新动画计时器
    s.player.animTimer += deltaMs
    s.enemy.animTimer += deltaMs
    if (s.player.attackAnimTimer > 0) s.player.attackAnimTimer -= deltaMs
    if (s.enemy.attackAnimTimer > 0) s.enemy.attackAnimTimer -= deltaMs
    if (s.player.skillCastTimer > 0) s.player.skillCastTimer -= deltaMs
    if (s.enemy.skillCastTimer > 0) s.enemy.skillCastTimer -= deltaMs
    if (s.player.deathAnimTimer > 0) s.player.deathAnimTimer -= deltaMs
    if (s.enemy.deathAnimTimer > 0) s.enemy.deathAnimTimer -= deltaMs

    // 更新玩家移动
    updatePlayer(s.player, this.joystick, s.worldWidth, s.worldHeight)

    // 更新玩家复活
    updatePlayerRespawn(s.player, now, deltaMs)

    // 更新敌方复活
    updateEnemyRespawn(s.enemy, deltaMs, s.worldWidth, s.worldHeight)

    // 更新敌方 AI
    updateEnemy(s.enemy, s.player, s.minions, s.towers, s.particles, s.floatTexts, deltaMs, s.worldWidth, s.worldHeight, now)

    // 更新小兵
    updateMinions(s.minions, s.player, s.enemy, s.towers, s.particles, s.floatTexts, deltaMs)

    // 更新野怪
    updateNeutralCreeps(s.neutralCreeps, s.player, s.enemy, s.particles, s.floatTexts, deltaMs)

    // 更新防御塔攻击
    updateTowers(s.towers, s.player, s.enemy, s.minions, s.particles, s.floatTexts, deltaMs)

    // 更新特效
    updateSkillEffects(s.skillEffects, deltaMs)
    updateParticles(s.particles, deltaMs)
    updateFloatTexts(s.floatTexts, deltaMs)

    // 处理玩家攻击
    this.handlePlayerAttack(deltaMs)

    // 处理技能伤害
    this.handleSkillDamage()

    // 检查击杀
    this.checkKills()

    // 小兵波次
    this.updateMinionWaves(deltaMs)

    // 更新相机
    this.updateCamera()
  }

  private handlePlayerAttack(deltaMs: number): void {
    const s = this.state
    const p = s.player

    if (p.isDead) return

    if (this.buttons.attack && p.attackAnimTimer <= 0) {
      p.attackAnimTimer = GAME_CONFIG.ATTACK_ANIM_DURATION
      this.performBasicAttack()
    }

    if (this.buttons.skill1 && p.skillCooldowns[0] <= 0) {
      this.castSkill(1)
    }

    if (this.buttons.skill2 && p.skillCooldowns[1] <= 0) {
      this.castSkill(2)
    }

    if (this.buttons.skill3 && p.skillCooldowns[2] <= 0) {
      this.castSkill(3)
    }
  }

  private performBasicAttack(): void {
    const s = this.state
    const p = s.player
    const attackRange = GAME_CONFIG.PLAYER_ATTACK_RANGE
    const damage = GAME_CONFIG.PLAYER_ATTACK_DAMAGE + (p.level - 1) * GAME_CONFIG.LEVEL_ATK_BONUS

    const px = p.x + p.width / 2
    const py = p.y + p.height / 2

    const atkX = px + Math.cos(p.facingAngle) * attackRange
    const atkY = py + Math.sin(p.facingAngle) * attackRange

    addSkillParticles(atkX, atkY, '#ffffff', 8, s.particles)

    // 打敌方英雄
    if (!s.enemy.isDead && rectCollision(
      atkX - 15, atkY - 15, 30, 30,
      s.enemy.x, s.enemy.y, s.enemy.width, s.enemy.height,
    )) {
      s.enemy.hp -= damage
      s.enemy.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
      addFloatText(s.enemy.x + s.enemy.width / 2, s.enemy.y - 10, `-${damage}`, '#ff3a3a', s.floatTexts)
      this.triggerScreenShake()
    }

    // 打小兵
    for (const m of s.minions) {
      if (m.isDead || m.team === 'player') continue
      if (rectCollision(atkX - 15, atkY - 15, 30, 30, m.x, m.y, m.width, m.height)) {
        m.hp -= damage
        m.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
        addFloatText(m.x + m.width / 2, m.y - 5, `-${damage}`, '#ff3a3a', s.floatTexts)
      }
    }

    // 打野怪
    for (const c of s.neutralCreeps) {
      if (c.isDead) continue
      if (rectCollision(atkX - 15, atkY - 15, 30, 30, c.x, c.y, c.width, c.height)) {
        c.hp -= damage
        c.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
        addFloatText(c.x + c.width / 2, c.y - 5, `-${damage}`, '#ffcc00', s.floatTexts)
      }
    }

    // 打塔
    for (const t of s.towers) {
      if (t.isDestroyed || t.team === 'player') continue
      if (rectCollision(atkX - 15, atkY - 15, 30, 30, t.x, t.y, t.width, t.height)) {
        t.hp -= damage
        addFloatText(t.x + t.width / 2, t.y, `-${damage}`, '#ff3a3a', s.floatTexts)
      }
    }
  }

  private castSkill(skillId: number): void {
    const s = this.state
    const p = s.player
    const config = SKILL_CONFIG[skillId]
    if (!config) return

    p.skillCooldowns[skillId - 1] = config.cooldown
    p.skillCastTimer = 400
    p.skillCastId = skillId

    const px = p.x + p.width / 2 + Math.cos(p.facingAngle) * 30
    const py = p.y + p.height / 2 + Math.sin(p.facingAngle) * 30

    s.skillEffects.push(createSkillEffect(px, py, skillId))
    addSkillParticles(px, py, config.color, 20, s.particles)
  }

  private handleSkillDamage(): void {
    const s = this.state
    for (const effect of s.skillEffects) {
      checkSkillDamageHero(effect, s.enemy, s.particles, s.floatTexts)
      checkSkillDamageMinions(effect, s.minions, s.particles, s.floatTexts, 'player')
      checkSkillDamageTowers(effect, s.towers, s.particles, s.floatTexts, 'player')
    }
  }

  private checkKills(): void {
    const s = this.state

    // 敌方英雄死亡
    if (s.enemy.hp <= 0 && !s.enemy.isDead) {
      s.enemy.isDead = true
      s.enemy.respawnTimer = GAME_CONFIG.RESPAWN_TIME
      s.enemy.deathAnimTimer = 500
      s.playerKills++
      grantExp(GAME_CONFIG.ENEMY_EXP, s.player)
      s.player.gold += GAME_CONFIG.ENEMY_GOLD
      addFloatText(s.enemy.x + s.enemy.width / 2, s.enemy.y - 20, 'KILL!', '#ffd700', s.floatTexts)
      addFloatText(s.enemy.x + s.enemy.width / 2, s.enemy.y, `+${GAME_CONFIG.ENEMY_GOLD}G`, '#ffd700', s.floatTexts)
      this.triggerScreenShake()
    }

    // 小兵死亡
    for (const m of s.minions) {
      if (m.hp <= 0 && !m.isDead) {
        m.isDead = true
        if (m.team === 'enemy') {
          grantExp(GAME_CONFIG.MINION_EXP, s.player)
          s.player.gold += GAME_CONFIG.MINION_GOLD
        }
      }
    }

    // 野怪死亡
    for (const c of s.neutralCreeps) {
      if (c.hp <= 0 && !c.isDead) {
        c.isDead = true
        const reward = getCreepReward(c.type)
        grantExp(reward.exp, s.player)
        s.player.gold += reward.gold
        c.respawnTimer = c.type === 'roshan' ? GAME_CONFIG.ROSHAN_RESPAWN_TIME : GAME_CONFIG.CREEP_RESPAWN_TIME
        addFloatText(c.x + c.width / 2, c.y - 20, `+${reward.gold}G`, '#ffd700', s.floatTexts)
      }
    }

    // 防御塔被摧毁
    for (const t of s.towers) {
      if (t.hp <= 0 && !t.isDestroyed) {
        t.isDestroyed = true
        if (t.team === 'enemy') {
          s.player.gold += GAME_CONFIG.TOWER_GOLD
          addFloatText(t.x + t.width / 2, t.y - 20, 'TOWER DOWN!', '#ffd700', s.floatTexts)
        }
        this.triggerScreenShake()
      }
    }

    // 玩家死亡
    if (s.player.hp <= 0 && !s.player.isDead) {
      s.player.isDead = true
      s.player.respawnTimer = GAME_CONFIG.RESPAWN_TIME
      s.player.deathAnimTimer = 500
      s.enemyKills++
    }
  }

  private updateMinionWaves(deltaMs: number): void {
    const s = this.state
    s.minionWaveTimer -= deltaMs
    if (s.minionWaveTimer <= 0) {
      s.waveNumber++
      // 三路同时生成小兵
      spawnMinionWave(s.minions, s.waveNumber, 'top')
      spawnMinionWave(s.minions, s.waveNumber, 'mid')
      spawnMinionWave(s.minions, s.waveNumber, 'bot')
      s.minionWaveTimer = GAME_CONFIG.MINION_WAVE_INTERVAL
    }
  }

  private updateCamera(): void {
    const p = this.state.player
    const targetX = p.x + p.width / 2 - this.canvasWidth / 2
    const targetY = p.y + p.height / 2 - this.canvasHeight / 2

    this.cameraX += (targetX - this.cameraX) * 0.1
    this.cameraY += (targetY - this.cameraY) * 0.1

    if (this.state.screenShake > 0) {
      const intensity = GAME_CONFIG.SCREEN_SHAKE_INTENSITY
      this.cameraX += (Math.random() - 0.5) * intensity * 2
      this.cameraY += (Math.random() - 0.5) * intensity * 2
    }

    this.cameraX = Math.max(0, Math.min(this.cameraX, this.state.worldWidth - this.canvasWidth))
    this.cameraY = Math.max(0, Math.min(this.cameraY, this.state.worldHeight - this.canvasHeight))
  }

  private triggerScreenShake(): void {
    this.state.screenShake = GAME_CONFIG.SCREEN_SHAKE_DURATION
  }

  private endGame(victory: boolean, reason: string): void {
    if (this.platformEnded) return
    this.state.gameOver = true
    this.state.victory = victory
    this.state.gameOverReason = reason
    this.platformEnded = true
    gameActions.gameOver({
      victory,
      score: this.engine.getScore(),
      stats: {
        playerKills: this.state.playerKills,
        enemyKills: this.state.enemyKills,
        reason,
      },
    })
  }

  restart(): void {
    this.state = this.createInitialState()
    this.cameraX = 0
    this.cameraY = 0
  }

  private render(): void {
    renderGame(
      this.ctx,
      this.state,
      this.canvasWidth,
      this.canvasHeight,
      this.cameraX,
      this.cameraY,
    )
    this.drawTouchUI()
  }

  /**
   * 绘制触控 UI（摇杆 + 按钮，覆盖在游戏画面上）
   */
  private drawTouchUI(): void {
    const ctx = this.ctx
    const w = this.canvasWidth
    const h = this.canvasHeight

    ctx.save()

    // --- 摇杆区域 ---
    const jx = this.joystickBaseX
    const jy = this.joystickBaseY
    const jkx = this.joystickCurrentX
    const jky = this.joystickCurrentY

    // 底座外圈
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(jx, jy, this.joystickRadius, 0, Math.PI * 2)
    ctx.stroke()

    // 底座填充
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(jx, jy, this.joystickRadius - 2, 0, Math.PI * 2)
    ctx.fill()

    // 摇杆钮
    ctx.fillStyle = this.joystick.active ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(jkx, jky, this.joystickKnobRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    // --- 按钮区域 ---
    for (const btn of this.touchButtons) {
      const bx = btn.x
      const by = btn.y
      const br = btn.radius

      // 按钮背景
      ctx.fillStyle = btn.pressed ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'
      ctx.beginPath()
      ctx.arc(bx, by, br, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = btn.pressed ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 按钮文字
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.round(br * 0.55)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let label = ''
      switch (btn.id) {
        case 'attack': label = '攻'; break
        case 'skill1': label = '1'; break
        case 'skill2': label = '2'; break
        case 'skill3': label = '3'; break
      }
      ctx.fillText(label, bx, by)
    }

    ctx.restore()
  }
}