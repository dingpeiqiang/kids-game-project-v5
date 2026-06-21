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
import {
  bindGameCanvasControls,
  drawMobileControlOverlay,
  type MobileControlRuntime,
} from '../../platform/mobileControls'

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

  private platformControls: MobileControlRuntime | null = null
  private keyboardMoveX = 0
  private keyboardMoveY = 0

  constructor(engine: GameEngine, canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')!
    this.engine = engine
    this.canvasWidth = this.canvas.width
    this.canvasHeight = this.canvas.height
    this.state = this.createInitialState()
  }

  private buildControlLayout() {
    const w = this.canvasWidth
    const h = this.canvasHeight
    const min = Math.min(w, h)
    const btnX = w - 85
    const btnR = min * 0.07
    return {
      viewWidth: w,
      viewHeight: h,
      joystick: {
        x: w * 0.15,
        y: h * 0.7,
        radius: min * 0.11,
        knobRadius: min * 0.046,
        deadZone: 0.12,
      },
      buttons: [
        { id: 'attack', label: '攻', cx: btnX, cy: h * 0.55, r: btnR },
        { id: 'skill1', label: '1', cx: btnX, cy: h * 0.35, r: btnR },
        { id: 'skill2', label: '2', cx: btnX - 70, cy: h * 0.45, r: btnR },
        { id: 'skill3', label: '3', cx: btnX - 140, cy: h * 0.55, r: btnR },
      ],
    }
  }

  private syncJoystickFromPlatform(sx: number, sy: number): void {
    const mag = Math.hypot(sx, sy)
    if (mag < 0.08) {
      this.joystick.active = false
      this.joystick.dirX = 0
      this.joystick.dirY = 0
    } else {
      this.joystick.active = true
      this.joystick.dirX = sx
      this.joystick.dirY = sy
    }
  }

  private applyButtonId(id: string, down: boolean): void {
    if (id === 'attack') this.buttons.attack = down
    else if (id === 'skill1') this.buttons.skill1 = down
    else if (id === 'skill2') this.buttons.skill2 = down
    else if (id === 'skill3') this.buttons.skill3 = down
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
    this.setupPlatformControls()
  }

  stop(): void {
    this.platformControls?.dispose()
    this.platformControls = null
  }

  private setupPlatformControls(): void {
    const layout = this.buildControlLayout()
    this.platformControls = bindGameCanvasControls(this.canvas, {
      gameId: 'wangzheRpg',
      preset: 'joystick_action',
      viewWidth: this.canvasWidth,
      viewHeight: this.canvasHeight,
      layout,
      onAction: (action, payload) => {
        if (action === 'move') {
          if (payload.source === 'keyboard') {
            this.keyboardMoveX = payload.stickX ?? 0
            this.keyboardMoveY = payload.stickY ?? 0
            this.syncJoystickFromPlatform(this.keyboardMoveX, this.keyboardMoveY)
          } else {
            this.syncJoystickFromPlatform(payload.stickX ?? 0, payload.stickY ?? 0)
          }
        }
        if (action === 'button_down') this.applyButtonId(payload.id ?? '', true)
        if (action === 'button_up') this.applyButtonId(payload.id ?? '', false)
      },
    })
  }

  runHostUpdate(deltaMs: number): void {
    const now = performance.now()
    this.update(deltaMs, now)
  }

  runHostRender(): void {
    this.render()
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
    if (this.platformControls?.shouldDrawOverlay()) {
      drawMobileControlOverlay(
        this.ctx,
        this.platformControls.getSnapshot(),
        this.platformControls.getJoystick(),
      )
    }
  }
}