export type PlayMode = 'casual' | 'compete'

export type EnemyKind = 'grunt' | 'dart' | 'tank' | 'boss' | 'meteor'

export type BulletTier = 1 | 2 | 3 | 4

export type PowerUpKind = 'firepower' | 'shield' | 'heal' | 'slowMo'

export interface Vec2 {
  x: number
  z: number
}

export interface PlayerState {
  pos: Vec2
  hp: number
  maxHp: number
  invuln: number
  shield: number
  bulletTier: BulletTier
  fireCooldown: number
  fireInterval: number
  slowMo: number
}

export interface BulletState {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  friendly: boolean
  damage: number
  pierceLeft: number
  radius: number
}

export interface EnemyState {
  id: number
  kind: EnemyKind
  x: number
  z: number
  vx: number
  vz: number
  hp: number
  maxHp: number
  fireCooldown: number
  wobble: number
}

export interface PowerUpState {
  id: number
  kind: PowerUpKind
  x: number
  z: number
  vz: number
}

export interface ParticleBurst {
  id: number
  x: number
  z: number
  life: number
  color: string
}

export interface RunStats {
  bestScore: number
  bestClearMs: number
  maxCombo: number
  flawlessClears: number
  bossKills: number
}

export interface GameState {
  mode: PlayMode
  phase: 'modeSelect' | 'playing' | 'paused' | 'ended'
  wave: number
  waveTimer: number
  waveClearDelay: number
  player: PlayerState
  bullets: BulletState[]
  enemies: EnemyState[]
  powerUps: PowerUpState[]
  particles: ParticleBurst[]
  score: number
  combo: number
  comboTimer: number
  maxCombo: number
  clearScreenCd: number
  elapsedMs: number
  damageTaken: number
  bossSpawned: boolean
  bossDefeated: boolean
  won: boolean
  nextId: number
}

export interface InputSnapshot {
  moveX: number
  moveZ: number
  pointerActive: boolean
  pointerX: number
  pointerY: number
  clearScreen: boolean
  pause: boolean
  reset: boolean
}