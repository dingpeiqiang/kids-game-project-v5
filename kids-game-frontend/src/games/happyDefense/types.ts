export type TowerKind = 'popcorn' | 'bubble' | 'lightning' | 'pierce'

export type EnemyKind = 'grunt' | 'flyer' | 'tank' | 'boss'

export type CellKind = 'build' | 'path' | 'block' | 'base'

export type BuffKind = 'clearScreen' | 'doubleDamage' | 'goldRain' | 'slowAll'

export type WavePhase = 'prep' | 'spawning' | 'fighting' | 'buffPick' | 'victory' | 'defeat'

export interface GridPos {
  gx: number
  gz: number
}

export interface PathNode {
  x: number
  z: number
}

export interface TowerState {
  id: number
  kind: TowerKind
  gx: number
  gz: number
  level: 1 | 2 | 3
  cooldown: number
}

export interface EnemyState {
  id: number
  kind: EnemyKind
  pathT: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  slowTimer: number
  freezeTimer: number
  reward: number
  scoreValue: number
  alive: boolean
}

export interface ProjectileState {
  id: number
  kind: TowerKind
  x: number
  z: number
  targetId: number
  damage: number
  speed: number
  pierceLeft: number
  chainLeft: number
  splashRadius: number
  slowDuration: number
  freezeDuration: number
  alive: boolean
}

export interface FloatText {
  id: number
  x: number
  z: number
  text: string
  life: number
  color: string
}

export interface ActiveBuff {
  kind: BuffKind
  timeLeft: number
}

export interface PendingBuff {
  kind: BuffKind
  label: string
}

export interface RunRecords {
  bestScore: number
  fastestClearSec: number
  perfectClears: number
}

export interface GameState {
  phase: WavePhase
  waveIndex: number
  totalWaves: number
  gold: number
  baseHp: number
  maxBaseHp: number
  score: number
  combo: number
  comboTimer: number
  spawnQueue: EnemyKind[]
  spawnTimer: number
  runStartTime: number
  waveClearTime: number
  towers: TowerState[]
  enemies: EnemyState[]
  projectiles: ProjectileState[]
  floats: FloatText[]
  activeBuffs: ActiveBuff[]
  pendingBuffChoices: PendingBuff[]
  damageBuffMul: number
  selectedTower: TowerKind
  selectedTowerId: number | null
  records: RunRecords
  towersBuilt: number
}