import type { GameEngine } from '@shell/services/gameEngine'
import type { GameLifecycle, GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { gameActions } from '@shell/platform/gameBridge'
import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'
import {
  bindGameCanvasControls,
  drawMobileControlOverlay,
  type MobileControlRuntime,
} from '@shell/platform/mobileControls'
import { GAME_CONFIG, getDefaultPlayerSpawnY } from './config'
import { LevelManager } from './levelManager'
import { snapPlayerToGround, updatePlayer } from './logic/player'
import { updateEnemies } from './logic/enemies'
import {
  checkCollisions,
  updateBullets,
  updateFloatTexts,
  updateParticles,
  updatePowerups,
  updateShockwaves,
} from './logic/combat'
import { checkLevelComplete, updateCamera } from './logic/progression'
import type { Bullet, Enemy, FloatText, Particle, Platform, Player, Powerup, Shockwave } from './types'
import {
  drawBackground,
  drawExit,
  drawPlatforms,
  initBgParticles,
  initClouds,
  initStars,
  updateBgParticles,
  updateClouds,
  updateStars,
  type BgParticle,
  type Cloud,
  type Star,
} from './render/background'
import { drawBossHealthBar, drawEnemies, drawPlayer } from './render/entities'
import { drawBullets, drawFloatTexts, drawParticles, drawPowerups, drawShockwaves } from './render/effects'
import { drawUI } from './render/ui'

type PlayerInput = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jump: boolean
  shoot: boolean
  crouch: boolean
  melee: boolean
  shootUp: boolean
  shootDown: boolean
  stickX: number
  stickY: number
}

function createDefaultPlayer(): Player {
  return {
    x: 80,
    y: getDefaultPlayerSpawnY(),
    width: GAME_CONFIG.PLAYER_WIDTH,
    height: GAME_CONFIG.PLAYER_HEIGHT,
    hp: 5,
    maxHp: 5,
    lives: 3,
    speed: GAME_CONFIG.PLAYER_SPEED,
    jumpForce: GAME_CONFIG.PLAYER_JUMP_FORCE,
    vy: 0,
    vx: 0,
    isGrounded: true,
    canDoubleJump: false,
    facingRight: true,
    invincible: 0,
    attackLevel: 1,
    shootCooldown: GAME_CONFIG.SHOOT_COOLDOWN,
    lastShot: 0,
    isSliding: false,
    slideTimer: 0,
    isCrouching: false,
    consecutiveShots: 0,
    lastShotKeyUp: 0,
    lastMelee: 0,
  }
}

class ContraRpgGame {
  private engine: GameEngine
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private platformControls: MobileControlRuntime | null = null
  private platformEnded = false

  private levelManager = new LevelManager(1)
  private player = createDefaultPlayer()
  private platforms: Platform[] = []
  private enemies: Enemy[] = []
  private bullets: Bullet[] = []
  private powerups: Powerup[] = []
  private particles: Particle[] = []
  private shockwaves: Shockwave[] = []
  private floatTexts: FloatText[] = []

  private stars: Star[] = []
  private bgParticles: BgParticle[] = []
  private clouds: Cloud[] = []

  private cameraX = 0
  private score = 0
  private comboCount = 0
  private lastComboTime = 0
  private shakeAmt = 0
  private damageFlash = 0
  private screenFlash = 0

  private rapidFireTimer = 0
  private spreadShotTimer = 0
  private shieldTimer = 0
  private transformTimer = 0

  private jumpHeld = false
  private shootHeld = false
  private stickX = 0
  private stickY = 0
  private lastShootAngle = 0

  private input: PlayerInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    crouch: false,
    melee: false,
    shootUp: false,
    shootDown: false,
    stickX: 0,
    stickY: 0,
  }

  constructor(engine: GameEngine, canvas: HTMLCanvasElement) {
    this.engine = engine
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('contraRpg: 2d context missing')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.loadLevelFromManager()
    this.stars = initStars()
    this.bgParticles = initBgParticles()
    this.clouds = initClouds()
    snapPlayerToGround(this.player, this.platforms)
  }

  private loadLevelFromManager(): void {
    const level = this.levelManager.getCurrentLevel()
    this.platforms = level.platforms.map(p => ({ ...p }))
    this.enemies = []
    this.bullets = []
    this.powerups = []
    this.particles = []
    this.shockwaves = []
    this.floatTexts = []
    this.player = createDefaultPlayer()
    snapPlayerToGround(this.player, this.platforms)
    this.cameraX = 0
  }

  private buildControlLayout() {
    const w = this.canvas.width
    const h = this.canvas.height
    const min = Math.min(w, h)
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
        { id: 'jump', label: '跳', cx: w - 72, cy: h * 0.55, r: min * 0.07 },
        { id: 'attack', label: '射', cx: w - 72, cy: h * 0.72, r: min * 0.07 },
      ],
    }
  }

  private syncInputFromPlatform(): void {
    this.input.stickX = this.stickX
    this.input.stickY = this.stickY
    this.input.left = this.stickX < -0.35
    this.input.right = this.stickX > 0.35
    this.input.up = this.stickY < -0.35
    this.input.down = this.stickY > 0.35
    this.input.jump = this.jumpHeld
    this.input.shoot = this.shootHeld
    this.input.crouch = this.input.down && this.player.isGrounded
    this.input.melee = false
    this.input.shootUp = false
    this.input.shootDown = false
  }

  beginPlay(): void {
    const layout = this.buildControlLayout()
    this.platformControls = bindGameCanvasControls(this.canvas, {
      gameId: 'contraRpg',
      preset: 'joystick_action',
      viewWidth: layout.viewWidth,
      viewHeight: layout.viewHeight,
      layout,
      onAction: (action, payload) => {
        if (this.platformEnded) return
        if (action === 'move') {
          this.stickX = payload.stickX ?? 0
          this.stickY = payload.stickY ?? 0
        }
        if (action === 'button_down') {
          if (payload.id === 'jump') this.jumpHeld = true
          if (payload.id === 'attack') this.shootHeld = true
        }
        if (action === 'button_up') {
          if (payload.id === 'jump') this.jumpHeld = false
          if (payload.id === 'attack') this.shootHeld = false
        }
      },
    })
    gameActions.setScore(0)
  }

  runHostUpdate(): void {
    if (this.platformEnded) return
    const now = Date.now()
    const dt = 16

    this.syncInputFromPlatform()

    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt
    if (this.spreadShotTimer > 0) this.spreadShotTimer -= dt
    if (this.shieldTimer > 0) this.shieldTimer -= dt
    if (this.transformTimer > 0) this.transformTimer -= dt
    if (this.player.invincible > 0) this.player.invincible -= dt
    if (this.damageFlash > 0) this.damageFlash -= 0.05
    if (this.screenFlash > 0) this.screenFlash -= 0.03
    if (this.shakeAmt > 0) this.shakeAmt *= 0.85

    const level = this.levelManager.getCurrentLevel()
    const canDoubleJump = level.id >= GAME_CONFIG.DOUBLE_JUMP_UNLOCK_LEVEL

    const playerResult = updatePlayer(
      this.player,
      this.input,
      this.platforms,
      now,
      canDoubleJump,
      this.particles,
      this.bullets,
      this.rapidFireTimer,
      this.spreadShotTimer,
      this.transformTimer,
      this.input.stickX,
    )

    this.cameraX = updateCamera(this.player.x, this.cameraX)

    if (this.levelManager.shouldSpawnBoss(this.player.x)) {
      this.levelManager.spawnBoss(this.enemies)
    }
    this.levelManager.spawnEnemies(this.enemies, this.player.x, this.cameraX)

    const shakeRef = { value: this.shakeAmt }
    updateEnemies(
      this.enemies,
      this.bullets,
      this.player.x,
      this.player.y,
      shakeRef,
      this.cameraX,
      this.levelManager,
    )
    this.shakeAmt = shakeRef.value

    updateBullets(this.bullets, this.cameraX)
    updatePowerups(this.powerups)
    updateParticles(this.particles)
    updateShockwaves(this.shockwaves)
    updateFloatTexts(this.floatTexts)

    const timers = {
      rapidFireTimer: this.rapidFireTimer,
      spreadShotTimer: this.spreadShotTimer,
      shieldTimer: this.shieldTimer,
      transformTimer: this.transformTimer,
    }

    const noop = () => {}
    const collision = checkCollisions(
      this.bullets,
      this.enemies,
      this.player,
      this.powerups,
      this.particles,
      this.shockwaves,
      this.floatTexts,
      timers,
      this.comboCount,
      this.lastComboTime,
      this.shakeAmt,
      this.damageFlash,
      this.screenFlash,
      playerResult.meleeTriggered,
      (pts, x, y) => {
        this.score += pts
        gameActions.addScore(pts, x, y)
      },
      noop,
      noop,
      noop,
      this.levelManager,
    )

    this.rapidFireTimer = timers.rapidFireTimer
    this.spreadShotTimer = timers.spreadShotTimer
    this.shieldTimer = timers.shieldTimer
    this.transformTimer = timers.transformTimer
    this.comboCount = collision.comboCount
    this.lastComboTime = collision.lastComboTime
    this.shakeAmt = collision.shakeAmt
    this.damageFlash = collision.damageFlash
    this.screenFlash = collision.screenFlash
    this.score += collision.score
    if (collision.score > 0) gameActions.setScore(this.score)

    if (collision.bossDefeated) {
      this.levelManager.markBossDefeated()
    }

    if (collision.gameOver) {
      if (this.player.lives > 1) {
        this.player.lives--
        this.player.hp = this.player.maxHp
        this.player.invincible = GAME_CONFIG.INVINCIBLE_DURATION * 2
        this.player.x = Math.max(0, this.cameraX + 40)
        snapPlayerToGround(this.player, this.platforms)
      } else {
        this.finishPlatform(false)
        return
      }
    }

    const levelDone = checkLevelComplete(
      level.id,
      this.levelManager.getSpawnedCount(),
      this.enemies.length,
      this.player.x,
      this.platforms,
      this.levelManager.hasBoss(),
      this.levelManager.isBossDefeated(),
      this.levelManager.getTotalSpawnCount(),
    )

    if (levelDone) {
      if (this.levelManager.nextLevel()) {
        this.loadLevelFromManager()
      } else {
        this.finishPlatform(true)
        return
      }
    }

    const isScrolling = Math.abs(this.player.vx) > 0.5
    updateStars(this.stars, isScrolling, level.id)
    updateBgParticles(this.bgParticles, now)
    updateClouds(this.clouds, isScrolling)

    this.lastShootAngle = playerResult.shootAngle
  }

  runHostRender(): void {
    if (this.platformEnded) return
    this.renderFrame(this.levelManager.getCurrentLevel().id, this.lastShootAngle)
  }

  private renderFrame(levelId: number, shootAngle: number): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const level = this.levelManager.getCurrentLevel()

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const shakeX = (Math.random() - 0.5) * this.shakeAmt
    const shakeY = (Math.random() - 0.5) * this.shakeAmt

    drawBackground(ctx, level, this.stars, this.bgParticles, this.clouds, this.cameraX)

    ctx.save()
    ctx.translate(-this.cameraX + shakeX, shakeY)

    drawPlatforms(ctx, this.platforms, this.cameraX)
    if (level.exit) {
      drawExit(ctx, level.exit, this.cameraX)
    }

    drawPowerups(ctx, this.powerups)
    drawEnemies(ctx, this.enemies)
    drawPlayer(
      ctx,
      this.player,
      this.input,
      this.shieldTimer,
      this.rapidFireTimer,
      this.spreadShotTimer,
      this.transformTimer,
      shootAngle,
    )
    drawBullets(ctx, this.bullets)
    drawParticles(ctx, this.particles)
    drawShockwaves(ctx, this.shockwaves)
    drawFloatTexts(ctx, this.floatTexts)

    ctx.restore()

    const boss = this.enemies.find(e => e.type === 'boss')
    if (boss) {
      drawBossHealthBar(ctx, boss)
    }

    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.screenFlash * 0.35})`
      ctx.fillRect(0, 0, w, h)
    }
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${this.damageFlash * 0.25})`
      ctx.fillRect(0, 0, w, h)
    }

    drawUI(ctx, this.player, this.score, levelId, {
      rapidFireTimer: this.rapidFireTimer,
      spreadShotTimer: this.spreadShotTimer,
      shieldTimer: this.shieldTimer,
    }, this.comboCount)

    if (this.platformControls?.shouldDrawOverlay()) {
      drawMobileControlOverlay(
        ctx,
        this.platformControls.getSnapshot(),
        this.platformControls.getJoystick(),
      )
    }

    ctx.restore()
  }

  private finishPlatform(victory: boolean): void {
    if (this.platformEnded) return
    this.platformEnded = true
    gameActions.gameOver({
      victory,
      score: this.score,
      stats: { combo: this.comboCount, level: this.levelManager.getCurrentLevel().id },
    })
  }

  destroy(): void {
    this.platformControls?.dispose()
    this.platformControls = null
  }
}

export function startContraRpgLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const engine = lifecycleCtx.engine
  const canvas = lifecycleCtx.canvas!
  const game = new ContraRpgGame(engine, canvas)

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      applyCanvasMobileStyles(canvas)
      if (canvas.width < 100) {
        canvas.width = GAME_CONFIG.CANVAS_WIDTH
        canvas.height = GAME_CONFIG.CANVAS_HEIGHT
      }
      game.beginPlay()
    },
    onUpdate(_dt: number) {
      if (!engine.canTick()) return
      game.runHostUpdate()
    },
    onRender() {
      game.runHostRender()
    },
    onDestroy() {
      game.destroy()
    },
  })
}