import type { GameEngine } from '../../services/gameEngine'
import { audioService } from '../../services/audio'
import { GAME_CONFIG } from './config'
import { LevelManager } from './levelManager'
import type { Player, Enemy, Bullet, Powerup, Particle, Platform, GameState, Shockwave, FloatText, Trap } from './types'
import type { LevelConfig } from './types/level'
import { initStars, initBgParticles, initClouds, updateStars, updateBgParticles, updateClouds, drawBackground, drawPlatforms, drawExit, type Star, type BgParticle, type Cloud } from './render/background'
import { drawPlayer, drawEnemies, drawBossHealthBar } from './render/entities'
import { drawBullets, drawPowerups, drawParticles, drawShockwaves, drawFloatTexts } from './render/effects'
import { drawUI, drawGameOverScreen, drawVictoryScreen } from './render/ui'
import { drawTraps } from './render/traps'
import { updatePlayer } from './logic/player'
import { updateEnemies } from './logic/enemies'
import { updateBullets, updatePowerups, updateParticles, updateShockwaves, updateFloatTexts, checkCollisions } from './logic/combat'
import { updateCamera } from './logic/progression'
import { createTraps, updateTraps, resetTrapIdCounter } from './logic/traps'

export class ContraRpgGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private onEnd: () => void
  private levelManager: LevelManager
  private state: GameState
  private input: { left: boolean; right: boolean; jump: boolean; shoot: boolean; crouch: boolean; shootUp: boolean; shootDown: boolean }
  private rapidFireTimer = 0
  private spreadShotTimer = 0
  private shieldTimer = 0
  private transformTimer = 0
  private frameCount = 0
  private stars: Star[] = []
  private bgParticles: BgParticle[] = []
  private clouds: Cloud[] = []
  private shakeAmt = 0
  private damageFlash = 0
  private screenFlash = 0
  private comboCount = 0
  private lastComboTime = 0
  private levelCompleteTriggered = false
  private transitionTimer = 0
  private transitionDuration = 1000 // 过渡动画持续时间（ms）
  private fadeInTimer = 0 // 关卡开始淡入计时器
  private fadeInDuration = 800 // 淡入持续时间（ms）
  private spawnIndex = 0

  constructor(engine: GameEngine, onEnd: () => void) {
    this.engine = engine
    this.onEnd = () => {
      this.cleanup()
      onEnd()
    }
    this.canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false

    this.input = { left: false, right: false, jump: false, shoot: false, crouch: false, shootUp: false, shootDown: false }
    this.levelManager = new LevelManager()
    this.state = this.createInitialState()
    this.stars = initStars()
    this.bgParticles = initBgParticles()
    this.clouds = initClouds()

    this.cachedCanvasRect = this.canvas.getBoundingClientRect()
    this.resizeHandler = () => {
      this.cachedCanvasRect = this.canvas.getBoundingClientRect()
    }
    window.addEventListener('resize', this.resizeHandler)

    this.setupInput()
    this.startGame()
  }

  private createInitialState(): GameState {
    const levelConfig = this.levelManager.getCurrentLevel()
    resetTrapIdCounter()
    return {
      currentLevel: 1,
      score: 0,
      player: {
        x: 80,
        y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT - 20,
        width: GAME_CONFIG.PLAYER_WIDTH,
        height: GAME_CONFIG.PLAYER_HEIGHT,
        hp: 30,
        maxHp: 30,
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
      },
      enemies: [],
      bullets: [],
      powerups: [],
      particles: [],
      shockwaves: [],
      floatTexts: [],
      platforms: [...levelConfig.platforms],
      traps: createTraps(levelConfig.traps || []),
      cameraX: 0,
      isScrolling: false,
      scrollSpeed: 0,
      gameStarted: true,
      gamePaused: false,
      gameOver: false,
      victory: false,
    }
  }

  private setupInput() {
    this.keydownHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = true
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.input.jump = true
      if (e.key === 'j' || e.key === 'k') this.input.shoot = true
      if (e.key === 's' || e.key === 'ArrowDown') this.input.crouch = true
    }
    document.addEventListener('keydown', this.keydownHandler)

    this.keyupHandler = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.input.jump = false
      if (e.key === 'j' || e.key === 'k') {
        this.input.shoot = false
        this.state.player.consecutiveShots = 0
        this.state.player.lastShotKeyUp = Date.now()
      }
      if (e.key === 's' || e.key === 'ArrowDown') this.input.crouch = false
    }
    document.addEventListener('keyup', this.keyupHandler)

    this.setupMobileControls()
  }

  private readonly isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  private touchActions = new Map<number, string>()
  private touchButtons: { id: string; label: string; color: string; pressed: boolean }[] = [
    { id: 'up', label: '↑', color: '#FF5722', pressed: false },
    { id: 'down', label: '↓', color: '#FF5722', pressed: false },
    { id: 'left', label: '←', color: '#FF9800', pressed: false },
    { id: 'right', label: '→', color: '#FF9800', pressed: false },
    { id: 'shoot', label: '🔫', color: '#F44336', pressed: false },
    { id: 'bounce', label: '↗', color: '#4CAF50', pressed: false },
  ]
  private btnInputMap: Record<string, keyof typeof this.input> = {
    up: 'shootUp',
    down: 'shootDown',
    left: 'left',
    right: 'right',
    shoot: 'shoot',
    bounce: 'jump',
  }

  private cachedRects: { id: string; x: number; y: number; r: number }[] | null = null
  private cachedRectsKey = ''
  private cachedCanvasRect: DOMRect | null = null
  private touchFadeTimer = 0
  private touchAlpha = 1
  private btnGradients: Map<string, { pressed: CanvasGradient; normal: CanvasGradient }> = new Map()
  
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null
  private resizeHandler: (() => void) | null = null
  private boundHandlers: { el: EventTarget; type: string; handler: EventListenerOrEventListenerObject; options?: any }[] = []

  private setupMobileControls() {
    this.addListener(this.canvas, 'touchstart', (e) => this.onTouchStart(e as TouchEvent), { passive: false })
    this.addListener(this.canvas, 'touchmove', (e) => this.onTouchMove(e as TouchEvent), { passive: false })
    this.addListener(this.canvas, 'touchend', (e) => this.onTouchEnd(e as TouchEvent), { passive: false })
    this.addListener(this.canvas, 'touchcancel', (e) => this.onTouchEnd(e as TouchEvent), { passive: false })
    
    this.addListener(this.canvas, 'mousedown', (e) => this.onMouseDown(e as MouseEvent))
    this.addListener(this.canvas, 'mousemove', (e) => this.onMouseMove(e as MouseEvent))
    this.addListener(this.canvas, 'mouseup', (e) => this.onMouseUp(e as MouseEvent))
    this.addListener(this.canvas, 'mouseleave', (e) => this.onMouseUp(e as MouseEvent))
  }

  private addListener(el: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: any) {
    el.addEventListener(type, handler, options)
    this.boundHandlers.push({ el, type, handler, options })
  }

  private removeAllListeners() {
    for (const { el, type, handler, options } of this.boundHandlers) {
      el.removeEventListener(type, handler, options)
    }
    this.boundHandlers = []
  }

  private removeMobileControls() {
    this.releaseAllTouch()
  }

  private cleanup() {
    this.destroyed = true
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
    if (this.keyupHandler) {
      document.removeEventListener('keyup', this.keyupHandler)
      this.keyupHandler = null
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    this.removeAllListeners()
    this.releaseAllTouch()
  }

  private touchToGame(touchX: number, touchY: number): { gameX: number; gameY: number } {
    const rect = this.cachedCanvasRect!
    const totalWidth = GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.LEFT_PANEL_WIDTH + GAME_CONFIG.RIGHT_PANEL_WIDTH
    const gameHeight = GAME_CONFIG.CANVAS_HEIGHT
    const isRotated = rect.width < rect.height

    if (isRotated) {
      return {
        gameX: touchY * (totalWidth / rect.height),
        gameY: (rect.width - touchX) * (gameHeight / rect.width),
      }
    }

    return {
      gameX: touchX * (totalWidth / rect.width),
      gameY: touchY * (gameHeight / rect.height),
    }
  }

  private onMouseDown(e: MouseEvent) {
    e.preventDefault()
    this.touchFadeTimer = 3000
    this.touchAlpha = 1

    const totalWidth = GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.LEFT_PANEL_WIDTH + GAME_CONFIG.RIGHT_PANEL_WIDTH
    const gameHeight = GAME_CONFIG.CANVAS_HEIGHT
    const rect = this.cachedCanvasRect!
    const touchX = e.clientX - rect.left
    const touchY = e.clientY - rect.top
    const { gameX, gameY } = this.touchToGame(touchX, touchY)

    const btn = this.findBtn(totalWidth, gameHeight, gameX, gameY)
    if (btn && this.btnInputMap[btn]) {
      this.touchActions.set(0, btn)
      const b = this.touchButtons.find(b => b.id === btn)
      if (b) b.pressed = true
      this.input[this.btnInputMap[btn]] = true
    }
  }

  private onMouseMove(e: MouseEvent) {
    e.preventDefault()
  }
  
  // 鼠标释放事件处理
  private onMouseUp(e: MouseEvent) {
    e.preventDefault()
    const action = this.touchActions.get(0)
    if (action) {
      this.touchActions.delete(0)
      const b = this.touchButtons.find(b => b.id === action)
      if (b) b.pressed = false
      if (this.btnInputMap[action]) {
        this.input[this.btnInputMap[action]] = false
      }
    }
  }

  private getBtnRects(cw: number, ch: number): { id: string; x: number; y: number; r: number }[] {
    const key = `${cw}x${ch}`
    if (this.cachedRects && this.cachedRectsKey === key) return this.cachedRects

    const lpw = GAME_CONFIG.LEFT_PANEL_WIDTH
    const rpw = GAME_CONFIG.RIGHT_PANEL_WIDTH
    const centerY = ch * 0.65

    // D-pad buttons (left panel)
    const dpadCenterX = lpw / 2 + 15
    
    // 增加左右按钮的点击区域范围，增大半径并调整间距避免叠加
    const leftBtnX = dpadCenterX - 55
    const rightBtnX = dpadCenterX + 55
    const horizontalR = 32 // 增大左右按钮半径
    const verticalR = 24 // 上下按钮半径（用于射击方向）
    const verticalSpread = 50 // 上下按钮间距

    // Attack buttons (right panel) - 只有射击和弹跳，纵向排列
    const atkCenterX = cw - rpw / 2 - 5
    const atkR = 32
    const atkSpread = 40 // 纵向间距

    this.cachedRects = [
      { id: 'up', x: dpadCenterX, y: centerY - verticalSpread, r: verticalR },
      { id: 'down', x: dpadCenterX, y: centerY + verticalSpread, r: verticalR },
      { id: 'left', x: leftBtnX, y: centerY, r: horizontalR },
      { id: 'right', x: rightBtnX, y: centerY, r: horizontalR },
      { id: 'shoot', x: atkCenterX, y: centerY - atkSpread, r: atkR },
      { id: 'bounce', x: atkCenterX, y: centerY + atkSpread, r: atkR },
    ]
    this.cachedRectsKey = key
    return this.cachedRects
  }
  
  private findBtn(cw: number, ch: number, px: number, py: number): string | null {
    const rects = this.getBtnRects(cw, ch)
    for (const b of rects) {
      const dx = px - b.x
      const dy = py - b.y
      if (dx * dx + dy * dy <= b.r * b.r) return b.id
    }
    return null
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault()
    this.touchFadeTimer = 3000
    this.touchAlpha = 1
    const totalWidth = GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.LEFT_PANEL_WIDTH + GAME_CONFIG.RIGHT_PANEL_WIDTH
    const gameHeight = GAME_CONFIG.CANVAS_HEIGHT

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const rect = this.cachedCanvasRect!
      const touchX = t.clientX - rect.left
      const touchY = t.clientY - rect.top
      const { gameX, gameY } = this.touchToGame(touchX, touchY)

      const btn = this.findBtn(totalWidth, gameHeight, gameX, gameY)
      if (btn && this.btnInputMap[btn]) {
        this.touchActions.set(t.identifier, btn)
        const b = this.touchButtons.find(b => b.id === btn)
        if (b) b.pressed = true
        this.input[this.btnInputMap[btn]] = true
      }
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault()
  }
  
  private onTouchEnd(e: TouchEvent) {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const action = this.touchActions.get(t.identifier)
      if (action) {
        this.touchActions.delete(t.identifier)
        const b = this.touchButtons.find(b => b.id === action)
        if (b) b.pressed = false
        if (this.btnInputMap[action]) {
          this.input[this.btnInputMap[action]] = false
        }
      }
    }
  }

  private releaseAllTouch() {
    for (const b of this.touchButtons) {
      b.pressed = false
    }
    this.input.left = false
    this.input.right = false
    this.input.jump = false
    this.input.crouch = false
    this.input.shoot = false
    this.input.shootUp = false
    this.input.shootDown = false
    this.touchActions.clear()
  }

  private drawTouchUI() {
    const ctx = this.ctx
    const totalWidth = GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.LEFT_PANEL_WIDTH + GAME_CONFIG.RIGHT_PANEL_WIDTH
    const cw = GAME_CONFIG.CANVAS_WIDTH
    const ch = GAME_CONFIG.CANVAS_HEIGHT
    const lpw = GAME_CONFIG.LEFT_PANEL_WIDTH
    const rpw = GAME_CONFIG.RIGHT_PANEL_WIDTH

    ctx.save()
    ctx.globalAlpha = 1

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, lpw, ch)
    ctx.fillRect(totalWidth - rpw, 0, rpw, ch)

    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(lpw, 0)
    ctx.lineTo(lpw, ch)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(totalWidth - rpw, 0)
    ctx.lineTo(totalWidth - rpw, ch)
    ctx.stroke()

    ctx.globalAlpha = this.touchAlpha
    
    const drawBtn = (x: number, y: number, r: number, cfg: { id: string; label: string; color: string; pressed: boolean }) => {
      const isPressed = cfg.pressed
      const s = isPressed ? 0.92 : 1

      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)

      if (isPressed) {
        ctx.shadowColor = cfg.color
        ctx.shadowBlur = 18
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 6
      }

      let cached = this.btnGradients.get(cfg.id)
      if (!cached) {
        const pressedGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r)
        pressedGrad.addColorStop(0, cfg.color + 'dd')
        pressedGrad.addColorStop(1, cfg.color + '99')

        const normalGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r)
        normalGrad.addColorStop(0, cfg.color + '66')
        normalGrad.addColorStop(1, cfg.color + '33')

        cached = { pressed: pressedGrad, normal: normalGrad }
        this.btnGradients.set(cfg.id, cached)
      }

      ctx.fillStyle = isPressed ? cached.pressed : cached.normal
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.strokeStyle = isPressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'
      ctx.lineWidth = isPressed ? Math.max(2.5, r * 0.1) : 1.5
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255,255,255,0.6)'
      ctx.font = `bold ${Math.round(r * 0.8)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(cfg.label, 0, 1)

      ctx.restore()
    }
    
    const rects = this.getBtnRects(totalWidth, ch)
    for (const btn of rects) {
      const cfg = this.touchButtons.find(b => b.id === btn.id)!
      drawBtn(btn.x, btn.y, btn.r, cfg)
    }

    ctx.restore()
  }

  private destroyed = false

  private startGame() {
    this.fadeInTimer = this.fadeInDuration
    this.gameLoop()
  }

  private gameLoop = () => {
    if (this.destroyed) return
    if (this.state.gameOver || this.state.victory) {
      this.render()
    } else {
      this.update()
      this.render()
    }
    requestAnimationFrame(this.gameLoop)
  }

  private update() {
    if (this.state.gamePaused) return

    const now = Date.now()

    if (this.state.player.invincible > 0) {
      this.state.player.invincible -= 16
    }
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= 16
    if (this.spreadShotTimer > 0) this.spreadShotTimer -= 16
    if (this.shieldTimer > 0) this.shieldTimer -= 16
    if (this.transformTimer > 0) this.transformTimer -= 16

    if (this.isTouchDevice) {
      if (this.touchFadeTimer > 0) {
        this.touchFadeTimer -= 16
      } else {
        this.touchAlpha = Math.max(0.12, this.touchAlpha - 0.003)
      }
    }

    if (this.shakeAmt > 0) this.shakeAmt *= 0.9
    if (this.damageFlash > 0) this.damageFlash -= 0.05
    if (this.screenFlash > 0) this.screenFlash -= 0.02
    if (this.fadeInTimer > 0) this.fadeInTimer -= 16

    updateStars(this.stars, this.state.isScrolling, this.state.currentLevel)
    updateBgParticles(this.bgParticles, now)
    updateClouds(this.clouds, this.state.isScrolling)

    const canDoubleJump = this.state.currentLevel >= GAME_CONFIG.DOUBLE_JUMP_UNLOCK_LEVEL
    const effectiveAnalogX = this.input.left ? -1 : (this.input.right ? 1 : 0)
    const result = updatePlayer(
      this.state.player,
      this.input,
      this.state.platforms,
      now,
      canDoubleJump,
      this.state.particles,
      this.state.bullets,
      this.rapidFireTimer,
      this.spreadShotTimer,
      this.transformTimer,
      effectiveAnalogX,
    )

    // 调试日志：玩家状态更新后
    if (this.state.player.y > GAME_CONFIG.CANVAS_HEIGHT - 100 || !this.state.player.isGrounded) {
      console.log('[ContraRpg] 📊 玩家状态检查:', {
        playerX: this.state.player.x,
        playerY: this.state.player.y,
        playerVy: this.state.player.vy,
        playerGrounded: this.state.player.isGrounded,
        playerWidth: this.state.player.width,
        playerHeight: this.state.player.height,
        isCrouching: this.state.player.isCrouching,
        platformCount: this.state.platforms.length,
        groundY: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT - 40,
        frameCount: this.frameCount,
        currentLevel: this.state.currentLevel,
        levelCompleteTriggered: this.levelCompleteTriggered,
        fadeInTimer: this.fadeInTimer
      })
    }

    // 检查玩家是否掉出地图外
    if (this.state.player.y > GAME_CONFIG.CANVAS_HEIGHT + 50) {
      console.log('[ContraRpg] ❌ 玩家掉出地图外！', {
        playerY: this.state.player.y,
        canvasHeight: GAME_CONFIG.CANVAS_HEIGHT,
        playerVy: this.state.player.vy,
        playerGrounded: this.state.player.isGrounded,
        playerInvincible: this.state.player.invincible,
        levelCompleteTriggered: this.levelCompleteTriggered,
        currentLevel: this.state.currentLevel,
        cameraX: this.state.cameraX,
        frameCount: this.frameCount
      })
      this.playerHit()
    }

    this.state.cameraX = updateCamera(this.state.player.x, this.state.cameraX)

    // 使用新的关卡管理器生成敌人
    this.levelManager.spawnEnemies(
      this.state.enemies,
      this.state.player.x,
      this.state.cameraX,
    )
    this.spawnIndex = this.levelManager.getSpawnedCount()

    // 检查是否触发生成 Boss
    if (this.levelManager.shouldSpawnBoss(this.state.player.x)) {
      this.levelManager.spawnBoss(this.state.enemies)
    }

    updateEnemies(
      this.state.enemies,
      this.state.bullets,
      this.state.player.x,
      this.state.player.y,
      { value: this.shakeAmt },
      this.state.cameraX,
      this.levelManager,
    )

    updateBullets(this.state.bullets, this.state.cameraX)
    updatePowerups(this.state.powerups)
    updateParticles(this.state.particles)
    updateShockwaves(this.state.shockwaves)
    updateFloatTexts(this.state.floatTexts)

    this.frameCount++
    const trapResult = updateTraps(this.state.traps, this.state.player, this.state.cameraX, this.frameCount)
    
    if (trapResult.playerHit) {
      console.log('[ContraRpg] 陷阱击中检测:', {
        playerHit: true,
        damage: trapResult.damage,
        playerInvincible: this.state.player.invincible,
        shieldTimer: this.shieldTimer,
        transformTimer: this.transformTimer,
        willTakeDamage: this.state.player.invincible <= 0 && this.shieldTimer <= 0 && this.transformTimer <= 0
      })
      
      if (this.state.player.invincible <= 0 && this.shieldTimer <= 0 && this.transformTimer <= 0) {
        console.log('[ContraRpg] ⚠️ 玩家受到陷阱伤害！', {
          beforeHp: this.state.player.hp,
          damage: trapResult.damage,
          afterHp: this.state.player.hp - trapResult.damage,
          lives: this.state.player.lives
        })
        
        this.state.player.hp -= trapResult.damage
        this.state.player.invincible = GAME_CONFIG.INVINCIBLE_DURATION
        this.damageFlash = 1
        this.shakeAmt = 5
        audioService.pop()
        
        if (this.state.player.hp <= 0) {
          console.log('[ContraRpg] ❌ 玩家HP归零！', {
            currentHp: this.state.player.hp,
            lives: this.state.player.lives,
            gameOver: this.state.player.lives <= 0
          })
          
          if (this.state.player.lives > 0) {
            this.respawnPlayer()
          } else {
            this.state.gameOver = true
            this.engine.endGame()
            setTimeout(() => this.onEnd(), 1000)
          }
        }
      } else {
        console.log('[ContraRpg] 玩家有护盾/无敌保护，免受陷阱伤害')
      }
    }

    const collisionResult = checkCollisions(
      this.state.bullets,
      this.state.enemies,
      this.state.player,
      this.state.powerups,
      this.state.particles,
      this.state.shockwaves,
      this.state.floatTexts,
      { rapidFireTimer: this.rapidFireTimer, spreadShotTimer: this.spreadShotTimer, shieldTimer: this.shieldTimer, transformTimer: this.transformTimer },
      this.comboCount,
      this.lastComboTime,
      this.shakeAmt,
      this.damageFlash,
      this.screenFlash,
      result.meleeTriggered,
      (score, x, y) => {
        this.state.score += score
        this.engine.addScore(score, x, y)
      },
      () => audioService.click(),
      () => audioService.win(),
      () => audioService.pop(),
      this.levelManager,
    )

    if (collisionResult.gameOver) {
      console.log('[ContraRpg] ❌ collisionResult.gameOver 触发！', {
        playerHp: this.state.player.hp,
        playerLives: this.state.player.lives,
        level: this.state.currentLevel,
        playerX: this.state.player.x,
        playerY: this.state.player.y,
        collisionResult: {
          playerHitTriggered: collisionResult.playerHitTriggered,
          score: collisionResult.score
        }
      })
      
      if (this.state.player.lives > 0) {
        console.log('[ContraRpg] 玩家还有生命，执行复活')
        this.respawnPlayer()
      } else {
        console.log('[ContraRpg] ❌ 玩家生命耗尽，游戏结束')
        this.state.gameOver = true
        this.engine.endGame()
        setTimeout(() => this.onEnd(), 1000)
      }
    }
    if (collisionResult.bossDefeated) {
      this.levelManager.markBossDefeated()
      const isLastLevel = this.state.currentLevel >= this.levelManager.getTotalLevelCount()
      if (isLastLevel) {
        // 最后一关的 Boss 击败 = 游戏胜利
        this.state.victory = true
        this.engine.setVictory(true)
        this.engine.endGame()
        setTimeout(() => this.onEnd(), 2000)
      }
      // 非最后一关，Boss击败后玩家需要走到终点门进入下一关
    }
    if (collisionResult.victory) {
      this.state.victory = true
      this.engine.setVictory(true)
      this.engine.endGame()
      setTimeout(() => this.onEnd(), 2000)
    }
    this.state.score += collisionResult.score
    this.comboCount = collisionResult.comboCount
    this.lastComboTime = collisionResult.lastComboTime
    this.shakeAmt = collisionResult.shakeAmt
    this.damageFlash = collisionResult.damageFlash
    this.screenFlash = collisionResult.screenFlash
    this.rapidFireTimer = collisionResult.timers.rapidFireTimer
    this.spreadShotTimer = collisionResult.timers.spreadShotTimer
    this.shieldTimer = collisionResult.timers.shieldTimer
    this.transformTimer = collisionResult.timers.transformTimer

    if (collisionResult.playerHitTriggered) {
      this.damageFlash = Math.max(this.damageFlash, 1)
    }

    const currentLevelConfig = this.levelManager.getCurrentLevel()
    
    // 检查玩家是否进入终点门
    if (currentLevelConfig.exit && !this.levelCompleteTriggered) {
      const exit = currentLevelConfig.exit
      const player = this.state.player
      const playerRight = player.x + player.width
      const playerBottom = player.y + player.height
      const exitRight = exit.x + exit.width
      const exitBottom = exit.y + exit.height
      
      // 扩大传送门检测范围：只要玩家到达传送门区域附近就触发
      // 水平方向：传送门左侧 50px 到右侧 300px
      const isNearExit = playerRight > exit.x - 50 && player.x < exitRight + 300
      
      // 垂直方向：非常宽松的检测，允许玩家从高处掉落或在传送门下方
      const isInVerticalRange = player.y < exit.y + 500 && player.y > exit.y - 500
      
      // 传送门触发条件：水平接近 + 垂直范围内
      const canEnterPortal = isNearExit && isInVerticalRange
      
      console.log('[ContraRpg] 传送门检测', {
        level: this.state.currentLevel,
        playerX: player.x,
        playerY: player.y,
        playerRight: playerRight,
        playerBottom: playerBottom,
        exitX: exit.x,
        exitY: exit.y,
        exitRight: exitRight,
        exitBottom: exitBottom,
        isNearExit: isNearExit,
        isInVerticalRange: isInVerticalRange,
        canEnterPortal: canEnterPortal
      })
      
      if (canEnterPortal) {
        console.log('[ContraRpg] 玩家进入终点门！')
        // 移除 Boss 限制，直接进入下一关
        this.levelCompleteTriggered = true
        this.transitionTimer = this.transitionDuration // 过渡时间
      }
    }

    // 处理关卡过渡计时
    if (this.levelCompleteTriggered) {
      // 在过渡期间限制玩家移动，防止玩家走出地图
      this.state.player.vx = 0
      this.state.player.vy = 0
      
      this.transitionTimer -= 16
      if (this.transitionTimer <= 0) {
        this.goNextLevel()
      }
    }
  }

  private playerHit() {
    this.state.player.hp--
    this.state.player.invincible = GAME_CONFIG.INVINCIBLE_DURATION
    this.damageFlash = 1
    this.shakeAmt = 8
    audioService.pop()
    if (this.state.player.hp <= 0) {
      if (this.state.player.lives > 0) {
        this.respawnPlayer()
      } else {
        this.state.gameOver = true
        this.engine.endGame()
        setTimeout(() => this.onEnd(), 1000)
      }
    }
  }

  private respawnPlayer() {
    this.state.player.lives--
    this.state.player.hp = this.state.player.maxHp
    // 原地复活 - 保留玩家当前位置和camera位置
    // this.state.player.x = 80
    // this.state.player.y = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT - 20
    this.state.player.vy = 0
    this.state.player.invincible = 15000 // 15秒无敌
    this.state.player.attackLevel = 1
    // 保留cameraX位置，实现真正的原地复活
    // this.state.cameraX = 0
    this.state.enemies = []
    this.state.bullets = []
    this.state.powerups = []
    this.state.particles = []
    this.spawnIndex = 0
    this.levelCompleteTriggered = false
    this.transformTimer = 0
    this.levelManager.reset()
  }

  private goNextLevel() {
    console.log('[ContraRpg] ========== 关卡切换开始 ==========')
    console.log('[ContraRpg] 当前关卡:', this.state.currentLevel)
    console.log('[ContraRpg] 玩家状态切换前:', {
      x: this.state.player.x,
      y: this.state.player.y,
      hp: this.state.player.hp,
      maxHp: this.state.player.maxHp,
      lives: this.state.player.lives,
      invincible: this.state.player.invincible,
      vy: this.state.player.vy
    })

    if (this.state.currentLevel >= this.levelManager.getTotalLevelCount()) {
      console.log('[ContraRpg] 已到达最后一关，触发胜利')
      this.state.victory = true
      this.levelCompleteTriggered = false
      this.engine.setVictory(true)
      this.engine.endGame()
      setTimeout(() => this.onEnd(), 2000)
      return
    }

    const levelChanged = this.levelManager.nextLevel()
    if (levelChanged) {
      this.state.currentLevel++
      const newLevel = this.levelManager.getCurrentLevel()
      console.log('[ContraRpg] 切换到关卡:', this.state.currentLevel, '关卡名称:', newLevel.name)

      // 保存旧状态用于调试
      const oldPlayerX = this.state.player.x
      const oldPlayerY = this.state.player.y

      // 更新关卡数据
      this.state.platforms = [...newLevel.platforms]
      console.log('[ContraRpg] 加载平台数量:', this.state.platforms.length)

      this.state.traps = createTraps(newLevel.traps || [])
      console.log('[ContraRpg] 加载陷阱数量:', this.state.traps.length)
      if (this.state.traps.length > 0) {
        console.log('[ContraRpg] 陷阱详情:', this.state.traps.slice(0, 5).map(t => ({ type: t.type, x: t.x, y: t.y, active: t.active })))
      }

      // 设置玩家初始位置
      this.state.player.x = 80
      const groundY = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT - 40
      this.state.player.y = groundY
      this.state.player.vy = 0
      this.state.player.isGrounded = true
      this.state.player.isCrouching = false
      this.state.player.height = GAME_CONFIG.PLAYER_HEIGHT

      // 设置无敌时间
      this.state.player.invincible = 15000
      console.log('[ContraRpg] 玩家位置重置:', { x: this.state.player.x, y: this.state.player.y, groundY })
      console.log('[ContraRpg] 设置无敌时间:', this.state.player.invincible, 'ms')

      // 重置其他状态
      this.state.cameraX = 0
      this.state.enemies = []
      this.state.bullets = []
      this.state.powerups = []
      this.state.particles = []
      this.state.shockwaves = []
      this.state.floatTexts = []

      // 检查玩家位置是否安全（是否与陷阱重叠）
      const trapsNearPlayer = this.state.traps.filter(trap => {
        const dx = Math.abs(trap.x - this.state.player.x)
        const dy = Math.abs(trap.y - this.state.player.y)
        return dx < 150 && dy < 100
      })
      console.log('[ContraRpg] 玩家附近陷阱数量:', trapsNearPlayer.length)
      if (trapsNearPlayer.length > 0) {
        console.warn('[ContraRpg] ⚠️ 玩家出生位置附近有陷阱:', trapsNearPlayer.map(t => ({ type: t.type, x: t.x, y: t.y })))
      }

      console.log('[ContraRpg] 玩家状态切换后:', {
        x: this.state.player.x,
        y: this.state.player.y,
        hp: this.state.player.hp,
        maxHp: this.state.player.maxHp,
        lives: this.state.player.lives,
        invincible: this.state.player.invincible,
        vy: this.state.player.vy,
        isGrounded: this.state.player.isGrounded
      })
    } else {
      // 没有更多关卡，显示胜利画面
      console.log('[ContraRpg] 没有更多关卡，显示胜利画面')
      this.state.victory = true
    }

    this.levelCompleteTriggered = false
    this.transitionTimer = 0
    this.fadeInTimer = this.fadeInDuration
    console.log('[ContraRpg] 淡入时间:', this.fadeInTimer, 'ms')
    console.log('[ContraRpg] ========== 关卡切换完成 ==========')
  }

  private render() {
    const ctx = this.ctx
    const levelConfig = this.levelManager.getCurrentLevel()
    const totalWidth = GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.LEFT_PANEL_WIDTH + GAME_CONFIG.RIGHT_PANEL_WIDTH
    const offsetX = GAME_CONFIG.LEFT_PANEL_WIDTH

    ctx.save()
    if (this.shakeAmt > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmt * 2,
        (Math.random() - 0.5) * this.shakeAmt * 2,
      )
    }

    ctx.save()
    ctx.translate(offsetX, 0)
    drawBackground(ctx, levelConfig, this.stars, this.bgParticles, this.clouds, this.state.cameraX)
    drawPlatforms(ctx, this.state.platforms, this.state.cameraX)
    
    if (levelConfig.exit) {
      drawExit(ctx, levelConfig.exit, this.state.cameraX)
    }
    
    drawTraps(ctx, this.state.traps, this.state.cameraX)

    ctx.save()
    ctx.translate(-this.state.cameraX, 0)
    drawPowerups(ctx, this.state.powerups)
    drawEnemies(ctx, this.state.enemies)
    drawPlayer(ctx, this.state.player, this.input, this.shieldTimer, this.rapidFireTimer, this.spreadShotTimer, this.transformTimer)
    drawBullets(ctx, this.state.bullets)
    drawParticles(ctx, this.state.particles)
    drawShockwaves(ctx, this.state.shockwaves)
    drawFloatTexts(ctx, this.state.floatTexts)
    ctx.restore()

    // 绘制 Boss 血条（固定在屏幕顶部）
    const boss = this.state.enemies.find(e => e.type === 'boss')
    if (boss && boss.hp > 0) {
      drawBossHealthBar(ctx, boss)
    }

    drawUI(ctx, this.state.player, this.state.score, this.state.currentLevel, {
      rapidFireTimer: this.rapidFireTimer,
      spreadShotTimer: this.spreadShotTimer,
      shieldTimer: this.shieldTimer,
    }, this.comboCount)
    ctx.restore()

    this.drawTouchUI()

    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, this.screenFlash * 0.3)})`
      ctx.fillRect(0, 0, totalWidth, GAME_CONFIG.CANVAS_HEIGHT)
    }

    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${Math.min(0.5, this.damageFlash * 1.5)})`
      ctx.fillRect(0, 0, totalWidth, GAME_CONFIG.CANVAS_HEIGHT)
    }

    if (this.state.gameOver) {
      ctx.save()
      ctx.translate(offsetX, 0)
      drawGameOverScreen(ctx, this.state.score)
      ctx.restore()
    }

    if (this.state.victory) {
      ctx.save()
      ctx.translate(offsetX, 0)
      drawVictoryScreen(ctx, this.state.score)
      ctx.restore()
    }

    // 关卡开始淡入效果
    if (this.fadeInTimer > 0) {
      const alpha = this.fadeInTimer / this.fadeInDuration
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
      ctx.fillRect(0, 0, totalWidth, GAME_CONFIG.CANVAS_HEIGHT)
    }

    // 关卡完成淡出效果（进入下一关前渐黑）
    if (this.levelCompleteTriggered && this.transitionTimer <= this.transitionDuration) {
      const fadeOutAlpha = 1 - this.transitionTimer / this.transitionDuration
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, fadeOutAlpha)})`
      ctx.fillRect(0, 0, totalWidth, GAME_CONFIG.CANVAS_HEIGHT)
    }

    ctx.restore()
  }
}

export function initContraRpg(engine: GameEngine, onEnd: () => void) {
  try {
    new ContraRpgGame(engine, onEnd)
  } catch (error) {
    console.error('Failed to initialize ContraRpgGame:', error)
    onEnd()
  }
}