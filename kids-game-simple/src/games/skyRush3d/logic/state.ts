import { BULLET_TIER_CONFIG, GAME_CONFIG, getWavesForMode } from '../config'
import type { GameState, PlayMode, PlayerState } from '../types'

function createPlayer(): PlayerState {
  return {
    pos: { x: 0, z: -GAME_CONFIG.arenaHalfZ + 4 },
    hp: GAME_CONFIG.playerMaxHp,
    maxHp: GAME_CONFIG.playerMaxHp,
    invuln: 0,
    shield: 0,
    bulletTier: 1,
    fireCooldown: 0,
    fireInterval: BULLET_TIER_CONFIG[1].interval,
    slowMo: 0,
  }
}

export function createInitialState(mode: PlayMode): GameState {
  return {
    mode,
    phase: 'modeSelect',
    wave: 1,
    waveTimer: 0,
    waveClearDelay: 0,
    player: createPlayer(),
    bullets: [],
    enemies: [],
    powerUps: [],
    particles: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    clearScreenCd: 0,
    elapsedMs: 0,
    damageTaken: 0,
    bossSpawned: false,
    bossDefeated: false,
    won: false,
    nextId: 1,
  }
}

export function resetForNewRun(state: GameState, mode: PlayMode): void {
  const fresh = createInitialState(mode)
  Object.assign(state, fresh)
  state.phase = 'playing'
}

export function allocId(state: GameState): number {
  return state.nextId++
}

export function currentWaveDuration(state: GameState): number {
  const waves = getWavesForMode(state.mode)
  const spec = waves[Math.min(state.wave - 1, waves.length - 1)]
  return spec?.duration ?? 20
}