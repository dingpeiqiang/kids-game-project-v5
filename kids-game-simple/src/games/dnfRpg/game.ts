import type { GameEngine } from '../../services/gameEngine'
import { gameActions } from '../../platform/gameBridge'
import type { GameLifecycle, GameLifecycleContext } from '../../platform/GameLifecycle'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import * as C from './config'
import type { Player, Enemy, Bullet, DropItem, Equipment, ScreenShake } from './types'
import { DungeonManager } from './logic/dungeon'
import { createPlayer } from './logic/player'
import { createEnemy, createBoss } from './logic/enemies'
import { updateGameLogic, type GameUpdateState } from './logic/game-update'
import { spawnRoomEnemiesFromState } from './logic/game-effects'
import { renderGame, type GameRenderData } from './render/game-render'
import { InputManager, type InputManagerCallbacks } from './logic/input-manager'

import { level1Config } from './levels/level1'
import { level2Config } from './levels/level2'
import { level3Config } from './levels/level3'
import { level4Config } from './levels/level4'

let activeGame: DnfRpgGame | null = null

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
  private levelTransition = false
  private transitionTimer = 0
  private currentLevelName = ''
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
    this.inputManager.setup()
    this.input = this.inputManager.input
  }

  beginPlay(): void {
    this.lastFrameTime = 0
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
    this.levelTransition = false

    this.cameraX = 0
    this.targetCameraX = 0

    if (this.player) {
      this.player.x = 150
      this.player.y = C.GROUND_Y - C.PLAYER_HEIGHT
      this.player.vx = 0
      this.player.vy = 0
    }

    this.currentLevelName = this.dungeon.getCurrentLevel().name
    this.spawnRoomEnemies()
  }

  private spawnRoomEnemies(): void {
    const state: GameUpdateState = {
      player: this.player,
      enemies: this.enemies,
      bullets: this.bullets,
      drops: this.drops,
      particles: this.particles,
      shockwaves: this.shockwaves,
      floatTexts: this.floatTexts,
      inventory: this.inventory,
      score: this.score,
      gold: this.gold,
      combo: this.combo,
      lastHitTime: this.lastHitTime,
      maxCombo: this.maxCombo,
      shownComboMilestones: [],
      roomCleared: this.roomCleared,
      roomClearTimer: this.roomClearTimer,
      doorOpen: this.doorOpen,
      doorReached: this.doorReached,
      gameOver: this.gameOver,
      victory: this.victory,
      cameraX: this.cameraX,
      targetCameraX: this.targetCameraX,
      fadeInTimer: this.fadeInTimer,
      transitionPhase: this.transitionPhase,
      transitionProgress: this.transitionProgress,
      screenShake: this.screenShake,
    }
    spawnRoomEnemiesFromState(state, this.dungeon)
    this.enemies = state.enemies
    this.roomCleared = state.roomCleared
    this.doorOpen = state.doorOpen
  }

  private cleanup(): void {
    this.destroyed = true
    this.inputManager.cleanup()
  }

  private lastFrameTime = 0
  private lastFrameTimeRef = { value: 0 }

  private update(): void {
    if (this.inCharSelect || this.levelTransition) return

    const now = Date.now()
    const dt = this.lastFrameTime === 0 ? 16 : Math.min(now - this.lastFrameTime, 50)
    this.lastFrameTime = now

    const state: GameUpdateState = {
      player: this.player,
      enemies: this.enemies,
      bullets: this.bullets,
      drops: this.drops,
      particles: this.particles,
      shockwaves: this.shockwaves,
      floatTexts: this.floatTexts,
      inventory: this.inventory,
      score: this.score,
      gold: this.gold,
      combo: this.combo,
      lastHitTime: this.lastHitTime,
      maxCombo: this.maxCombo,
      shownComboMilestones: [],
      roomCleared: this.roomCleared,
      roomClearTimer: this.roomClearTimer,
      doorOpen: this.doorOpen,
      doorReached: this.doorReached,
      gameOver: this.gameOver,
      victory: this.victory,
      cameraX: this.cameraX,
      targetCameraX: this.targetCameraX,
      fadeInTimer: this.fadeInTimer,
      transitionPhase: this.transitionPhase,
      transitionProgress: this.transitionProgress,
      screenShake: this.screenShake,
    }

    updateGameLogic(
      state,
      this.input,
      dt,
      this.engine,
      this.dungeon,
      this.getPlatformFinishCallback(),
      this.lastFrameTimeRef,
    )

    this.player = state.player
    this.enemies = state.enemies
    this.bullets = state.bullets
    this.drops = state.drops
    this.particles = state.particles
    this.shockwaves = state.shockwaves
    this.floatTexts = state.floatTexts
    this.inventory = state.inventory
    this.score = state.score
    this.gold = state.gold
    this.combo = state.combo
    this.lastHitTime = state.lastHitTime
    this.maxCombo = state.maxCombo
    this.shownComboMilestones = state.shownComboMilestones
    this.roomCleared = state.roomCleared
    this.roomClearTimer = state.roomClearTimer
    this.doorOpen = state.doorOpen
    this.doorReached = state.doorReached
    this.gameOver = state.gameOver
    this.victory = state.victory
    this.cameraX = state.cameraX
    this.targetCameraX = state.targetCameraX
    this.fadeInTimer = state.fadeInTimer
    this.transitionPhase = state.transitionPhase
    this.transitionProgress = state.transitionProgress
    this.screenShake = state.screenShake
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
    }
    renderGame(this.ctx, data)
  }
}

export function startDnfRpgLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const engine = lifecycleCtx.engine
  const canvas = lifecycleCtx.canvas!
  try {
    const game = new DnfRpgGame(engine, canvas)
    activeGame = game
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
        activeGame = null
      },
    })
  } catch (error) {
    console.error('Failed to initialize DnfRpgGame:', error)
    lifecycleCtx.onEnd()
    throw error
  }
}