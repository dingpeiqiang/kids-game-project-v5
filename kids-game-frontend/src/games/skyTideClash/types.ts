export type PlayMode = 'casual' | 'compete'

export type EnemyKind = 'grunt' | 'skimmer' | 'heavy' | 'boss' | 'meteor'

export type PickupKind = 'firepower' | 'shield' | 'heal' | 'slowMo'

export type BulletTier = 1 | 2 | 3 | 4

export interface Vec2 {
  x: number
  z: number
}

export interface PlayerState {
  x: number
  z: number
  hp: number
  maxHp: number
  shieldUntil: number
  invulnUntil: number
  bulletTier: BulletTier
  firepowerUntil: number
  fireCooldown: number
  damageTaken: number
}

export interface BulletState {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  fromPlayer: boolean
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
  scoreValue: number
  wobblePhase: number
}

export interface PickupState {
  id: number
  kind: PickupKind
  x: number
  z: number
  vy: number
  life: number
}

export interface ExplosionFx {
  id: number
  x: number
  z: number
  scale: number
  life: number
}

export interface BuffTimers {
  slowWorldUntil: number
}

export interface WaveRuntime {
  index: number
  elapsed: number
  spawnQueue: number
  bossSpawned: boolean
  cleared: boolean
}

export interface SessionStats {
  startTime: number
  endTime: number
  maxCombo: number
  bossKills: number
  noDamageWin: boolean
}

export interface GameRuntime {
  mode: PlayMode
  paused: boolean
  over: boolean
  won: boolean
  score: number
  combo: number
  comboTimer: number
  clearScreenReady: boolean
  clearScreenCd: number
  player: PlayerState
  bullets: BulletState[]
  enemies: EnemyState[]
  pickups: PickupState[]
  explosions: ExplosionFx[]
  buffs: BuffTimers
  wave: WaveRuntime
  stats: SessionStats
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
}

export interface InputSnapshot {
  moveX: number
  moveZ: number
  pointerActive: boolean
  clearScreen: boolean
  toggleMode: boolean
  pause: boolean
  restart: boolean
}

export interface PersistedStats {
  version: 1
  bestScore: number
  bestClearMs: number
  maxCombo: number
  noDamageWins: number
  bossKills: number
}