/**
 * 游戏状态快照：避免 game.ts 中重复构建/同步 GameUpdateState
 */

import type { GameUpdateState } from './game-update'
import type { Player, Enemy, Bullet, DropItem, Equipment, ScreenShake } from '../types'
import type { Particle, Shockwave, FloatText } from '../types'

export interface DnfRpgMutableState {
  player: Player
  enemies: Enemy[]
  bullets: Bullet[]
  drops: DropItem[]
  particles: Particle[]
  shockwaves: Shockwave[]
  floatTexts: FloatText[]
  inventory: Equipment[]
  score: number
  gold: number
  combo: number
  lastHitTime: number
  maxCombo: number
  shownComboMilestones: number[]
  roomCleared: boolean
  roomClearTimer: number
  doorOpen: boolean
  doorReached: boolean
  gameOver: boolean
  victory: boolean
  cameraX: number
  targetCameraX: number
  fadeInTimer: number
  transitionPhase: 'none' | 'slide_out' | 'slide_in'
  transitionProgress: number
  screenShake: ScreenShake | null
}

export function buildGameUpdateState(host: DnfRpgMutableState): GameUpdateState {
  return {
    player: host.player,
    enemies: host.enemies,
    bullets: host.bullets,
    drops: host.drops,
    particles: host.particles,
    shockwaves: host.shockwaves,
    floatTexts: host.floatTexts,
    inventory: host.inventory,
    score: host.score,
    gold: host.gold,
    combo: host.combo,
    lastHitTime: host.lastHitTime,
    maxCombo: host.maxCombo,
    shownComboMilestones: host.shownComboMilestones,
    roomCleared: host.roomCleared,
    roomClearTimer: host.roomClearTimer,
    doorOpen: host.doorOpen,
    doorReached: host.doorReached,
    gameOver: host.gameOver,
    victory: host.victory,
    cameraX: host.cameraX,
    targetCameraX: host.targetCameraX,
    fadeInTimer: host.fadeInTimer,
    transitionPhase: host.transitionPhase,
    transitionProgress: host.transitionProgress,
    screenShake: host.screenShake,
  }
}

export function syncFromGameUpdateState(host: DnfRpgMutableState, state: GameUpdateState): void {
  host.player = state.player
  host.enemies = state.enemies
  host.bullets = state.bullets
  host.drops = state.drops
  host.particles = state.particles
  host.shockwaves = state.shockwaves
  host.floatTexts = state.floatTexts
  host.inventory = state.inventory
  host.score = state.score
  host.gold = state.gold
  host.combo = state.combo
  host.lastHitTime = state.lastHitTime
  host.maxCombo = state.maxCombo
  host.shownComboMilestones = state.shownComboMilestones
  host.roomCleared = state.roomCleared
  host.roomClearTimer = state.roomClearTimer
  host.doorOpen = state.doorOpen
  host.doorReached = state.doorReached
  host.gameOver = state.gameOver
  host.victory = state.victory
  host.cameraX = state.cameraX
  host.targetCameraX = state.targetCameraX
  host.fadeInTimer = state.fadeInTimer
  host.transitionPhase = state.transitionPhase
  host.transitionProgress = state.transitionProgress
  host.screenShake = state.screenShake
}