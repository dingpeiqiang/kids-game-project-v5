export type PlayMode = 'casual' | 'compete'

export type GamePhase = 'playing' | 'paused' | 'victory' | 'defeat'

export type EnemyKind = 'grunt' | 'dart' | 'tank' | 'boss'

export type PickupKind = 'fireUp' | 'shield' | 'heal' | 'slowMo'

export type BulletTier = 1 | 2 | 3 | 4

export interface PlayerState {
  x: number
  z: number
  hp: number
  maxHp: number
  shield: number
  fireCooldown: number
  bulletTier: BulletTier
  fireTierTimer: number
  invuln: number
  damageTaken: number
}

export interface PlayerBullet {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  damage: number
  pierce: number
  alive: boolean
}

export interface EnemyBullet {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  alive: boolean
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
  shootCd: number
  wobble: number
  alive: boolean
}

export interface PickupState {
  id: number
  kind: PickupKind
  x: number
  z: number
  life: number
  alive: boolean
}

export interface RunRecords {
  bestScore: number
  fastestClearSec: number
  bestCombo: number
  flawlessClears: number
  bossKills: number
}

export interface GameState {
  mode: PlayMode
  phase: GamePhase
  waveIndex: number
  totalWaves: number
  waveTimer: number
  spawnQueue: EnemyKind[]
  spawnTimer: number
  bossSpawned: boolean
  player: PlayerState
  playerBullets: PlayerBullet[]
  enemyBullets: EnemyBullet[]
  enemies: EnemyState[]
  pickups: PickupState[]
  score: number
  combo: number
  comboTimer: number
  clearScreenCd: number
  slowMoTimer: number
  runStartTime: number
  elapsedSec: number
  flawless: boolean
  records: RunRecords
  clearScreenFlash: number
  bossKilledThisRun: boolean
}