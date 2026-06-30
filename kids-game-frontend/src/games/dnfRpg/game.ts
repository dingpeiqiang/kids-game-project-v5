import type { GameEngine } from '@shell/services/gameEngine'
import { gameActions } from '@shell/platform/gameBridge'
import type { GameLifecycle, GameLifecycleContext } from '@shell/platform/GameLifecycle'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import * as C from './config'
import type { Player, Enemy, Bullet, DropItem, Equipment, ScreenShake } from './types'
import { DungeonManager } from './logic/dungeon'
import { createPlayer } from './logic/player'
import { updateGameLogic } from './logic/game-update'
import { buildGameUpdateState, syncFromGameUpdateState } from './logic/game-state-snapshot'
import { spawnRoomEnemiesFromState } from './logic/game-effects'
import { renderGame, type GameRenderData } from './render/game-render'
import { InputManager, type InputManagerCallbacks } from './logic/input-manager'
import {
  bindGameCanvasControls,
  drawMobileControlOverlay,
  type MobileControlRuntime,
} from '@shell/platform/mobileControls'

import { level1Config } from './levels/level1'
import { level2Config } from './levels/level2'
import { level3Config } from './levels/level3'
import { level4Config } from './levels/level4'

export class DnfRpgGame {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private destroyed = false
  private platformEnded = false

  private dungeon: DungeonManager
  private player!: Player
  private enemies: Enemy[] = []
  private bullets: Bullet[] = []
  private drops: DropItem[] = []
  private particles: import('./types').Particle[] = []
  private shockwaves: import('./types').Shockwave[] = []
  private floatTexts: import('./types').FloatText[] = []
  private inventory: Equipment[] = []
  private score = 0
  private gold = 0
  private combo = 0
  private lastHitTime = 0
  private maxCombo = 0
  private shownComboMilestones: number[] = []

  private inputManager: InputManager
  private platformControls: MobileControlRuntime | null = null
  private input = { left: false, right: false, up: false, down: false, jump: false, attack: false, skill1: false, skill2: false, skill3: false, skill4: false, dash: false, interact: false, stickX: 0, stickY: 0 }
  private inCharSelect = true
  private selectedClass: 'swordsman' | 'fighter' | 'archer' | 'mage' | 'gunner' | null = null
  private hoveredClassIndex = -1
  private gameOver = false
  private victory = false
  private roomCleared = false
  private roomClearTimer = 0
  private doorOpen = false
  private doorReached = false
  private fadeInTimer = 0

  private transitionPhase: 'none' | 'slide_out' | 'slide_in' = 'none'
  private transitionProgress = 0
  private screenShake: ScreenShake | null = null

  private cameraX = 0
  private targetCameraX = 0

  constructor(engine: GameEngine, canvas: HTMLCanvasElement) {
    this.engine = engine
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false

    const allLevels = [level1Config, level2Config, level3Config, level4Config]
    this.dungeon = new DungeonManager(allLevels)

    const callbacks: InputManagerCallbacks = {
      onSelectClass: (classType) => this.selectClass(classType),
      onSelectClassByIndex: (index) => this.selectClassByIndex(index),
      onEnd: () => this.finishFromOverlay(),
      getInCharSelect: () => this.inCharSelect,
      getGameOver: () => this.gameOver,
      getVictory: () => this.victory,
      setHoveredClassIndex: (index) => { this.hoveredClassIndex = index },
    }
    this.inputManager = new InputManager(this.canvas, callbacks)
    this.inputManager.enablePlatformCombat()
    this.inputManager.setup()
    this.input = this.inputManager.input
  }

  private buildCombatControlLayout() {
    const w = this.canvas.width
    const h = this.canvas.height
    const min = Math.min(w, h)
    const btnX = w - 85
    const btnR = min * 0.065
    return {
      viewWidth: w,
      viewHeight: h,
      joystick: {
        x: w * 0.14,
        y: h * 0.72,
        radius: min * 0.11,
        knobRadius: min * 0.045,
        deadZone: 0.12,
      },
      buttons: [
        { id: 'attack', label: 'A', cx: btnX, cy: h * 0.58, r: btnR * 1.15 },
        { id: 'jump', label: 'J', cx: btnX - 62, cy: h * 0.72, r: btnR },
        { id: 'skill1', label: 'S1', cx: btnX - 62, cy: h * 0.42, r: btnR },
        { id: 'skill2', label: 'S2', cx: btnX - 8, cy: h * 0.38, r: btnR },
      ],
    }
  }

  private setupPlatformControls(): void {
    const layout = this.buildCombatControlLayout()
    this.platformControls = bindGameCanvasControls(this.canvas, {
      gameId: 'dnfRpg',
      preset: 'joystick_action',
      viewWidth: layout.viewWidth,
      viewHeight: layout.viewHeight,
      layout,
      onAction: (action, payload) => {
        if (this.inCharSelect) {
          if (action === 'tap') {
            this.inputManager.onCharSelectPointer(payload.x ?? 0, payload.y ?? 0)
          }
          return
        }
        if (this.gameOver || this.victory) {
          if (action === 'tap') this.inputManager.onOverlayPointer()
          return
        }
        if (action === 'move') {
          this.inputManager.applyPlatformMove(payload.stickX ?? 0, payload.stickY ?? 0)
        }
        if (action === 'button_down') this.inputManager.applyPlatformButton(payload.id ?? '', true)
        if (action === 'button_up') this.inputManager.applyPlatformButton(payload.id ?? '', false)
      },
    })
  }

  beginPlay(): void {
    this.lastFrameTime = 0
    this.setupPlatformControls()
  }

  destroy(): void {
    this.cleanup()
  }

  runHostUpdate(): void {
    if (this.destroyed || this.platformEnded) return
    if (this.inCharSelect) return
    this.update()
  }

  runHostRender(): void {
    if (this.destroyed) return
    this.render()
  }

  private finishFromOverlay(): void {
    if (this.platformEnded) return
    this.finishPlatform(this.victory, 0)
  }

  private finishPlatform(victory: boolean, delayMs: number): void {
    const run = () => {
      if (this.platformEnded) return
      this.platformEnded = true
      this.victory = victory
      this.gameOver = !victory
      gameActions.gameOver({
        victory,
        score: this.score,
        stats: { gold: this.gold, maxCombo: this.maxCombo, combo: this.combo },
      })
    }
    if (delayMs > 0) setTimeout(run, delayMs)
    else run()
  }

  private getPlatformFinishCallback(): (victory: boolean, delayMs: number) => void {
    return (victory, delayMs) => this.finishPlatform(victory, delayMs)
  }

  private selectClassByIndex(idx: number): void {
    const classTypes: ('swordsman' | 'fighter' | 'archer' | 'mage' | 'gunner')[] = [
      'swordsman', 'fighter', 'archer', 'mage', 'gunner',
    ]
    if (idx >= 0 && idx < classTypes.length) {
      this.selectClass(classTypes[idx])
    }
  }

  private selectClass(classType: 'swordsman' | 'fighter' | 'archer' | 'mage' | 'gunner'): void {
    this.selectedClass = classType
    this.inCharSelect = false
    this.player = createPlayer(classType)
    this.fadeInTimer = C.FADE_DURATION
    this.startLevel(1)
  }

  private startLevel(_levelNum: number): void {
    this.enemies = []
    this.bullets = []
    this.drops = []
    this.roomCleared = false
    this.doorOpen = false
    this.doorReached = false

    this.cameraX = 0
    this.targetCameraX = 0

    if (this.player) {
      this.player.x = 150
      this.player.y = C.GROUND_Y - C.PLAYER_HEIGHT
      this.player.vx = 0
      this.player.vy = 0
    }

    this.spawnRoomEnemies()
  }

  private spawnRoomEnemies(): void {
    const state = buildGameUpdateState(this)
    spawnRoomEnemiesFromState(state, this.dungeon)
    syncFromGameUpdateState(this, state)
  }

  private cleanup(): void {
    this.destroyed = true
    this.platformControls?.dispose()
    this.platformControls = null
    this.inputManager.cleanup()
  }

  private lastFrameTime = 0
  private lastFrameTimeRef = { value: 0 }

  private update(): void {
    if (this.inCharSelect) return

    const now = Date.now()
    const dt = this.lastFrameTime === 0 ? 16 : Math.min(now - this.lastFrameTime, 50)
    this.lastFrameTime = now

    const state = buildGameUpdateState(this)

    updateGameLogic(
      state,
      this.input,
      dt,
      this.engine,
      this.dungeon,
      this.getPlatformFinishCallback(),
      this.lastFrameTimeRef,
    )

    syncFromGameUpdateState(this, state)
  }

  private render(): void {
    const data: GameRenderData = {
      player: this.player,
      enemies: this.enemies,
      bullets: this.bullets,
      drops: this.drops,
      particles: this.particles,
      shockwaves: this.shockwaves,
      floatTexts: this.floatTexts,
      gold: this.gold,
      score: this.score,
      combo: this.combo,
      cameraX: this.cameraX,
      fadeInTimer: this.fadeInTimer,
      doorOpen: this.doorOpen,
      roomCleared: this.roomCleared,
      gameOver: this.gameOver,
      victory: this.victory,
      inCharSelect: this.inCharSelect,
      hoveredClassIndex: this.hoveredClassIndex,
      dungeon: this.dungeon,
      touchButtons: this.inputManager.touchButtons,
      joystick: this.inputManager.joystick,
      skills: this.player?.skills || [],
      transitionPhase: this.transitionPhase,
      transitionProgress: this.transitionProgress,
      screenShake: this.screenShake,
      skipLegacyTouchUi: Boolean(this.platformControls?.shouldDrawOverlay()),
    }
    renderGame(this.ctx, data)
    if (this.platformControls?.shouldDrawOverlay()) {
      drawMobileControlOverlay(
        this.ctx,
        this.platformControls.getSnapshot(),
        this.platformControls.getJoystick(),
      )
    }
  }
}

export function startDnfRpgLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const engine = lifecycleCtx.engine
  const canvas = lifecycleCtx.canvas!
  try {
    const game = new DnfRpgGame(engine, canvas)
    return hostCanvas2D(lifecycleCtx, {
      onInit() {
        game.beginPlay()
      },
      onUpdate(_dt) {
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
  } catch (error) {
    console.error('Failed to initialize DnfRpgGame:', error)
    lifecycleCtx.onEnd()
    throw error
  }
}