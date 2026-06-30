/** GDD §4 — 与 plantZombieDefense 枚举对齐 */

import type { Pzd2dSfx } from './logic/events'

export enum PlantKind {
  peashooter = 'peashooter',
  sunflower = 'sunflower',
  wallnut = 'wallnut',
  potatoMine = 'potatoMine',
  snowPea = 'snowPea',
}

export enum ZombieKind {
  normalZombie = 'normalZombie',
  flagZombie = 'flagZombie',
  bucketZombie = 'bucketZombie',
  sportZombie = 'sportZombie',
}

export enum GridCellType {
  empty = 0,
  path = 1,
  base = 2,
  forbid = 3,
}

export type GamePhase = 'boot' | 'ui' | 'prep' | 'wave' | 'pause' | 'victory' | 'defeat'

export interface PlantState {
  id: number
  kind: PlantKind
  gx: number
  gz: number
  hp: number
  maxHp: number
  cooldown: number
  sunTimer: number
  mineArmed: boolean
  alive: boolean
}

export interface ZombieState {
  id: number
  kind: ZombieKind
  gz: number
  x: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  slowMul: number
  slowTimer: number
  attackTimer: number
  eatingPlantId: number | null
  alive: boolean
}

export interface PeaProjectile {
  id: number
  x: number
  y: number
  gz: number
  damage: number
  slowMul: number
  slowDuration: number
  alive: boolean
}

export interface SunPickup {
  id: number
  x: number
  y: number
  value: number
  life: number
  alive: boolean
}

export interface FloatText {
  id: number
  x: number
  y: number
  text: string
  life: number
  color: string
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface LevelRecords {
  bestScore: number
  starsByLevel: Record<number, 0 | 1 | 2 | 3>
  unlockedLevel: number
}

export interface GameState {
  phase: GamePhase
  levelIndex: number
  waveIndex: number
  totalWaves: number
  sun: number
  houseHp: number
  maxHouseHp: number
  score: number
  spawnQueue: ZombieKind[]
  spawnTimer: number
  prepTimer: number
  plants: PlantState[]
  zombies: ZombieState[]
  peas: PeaProjectile[]
  suns: SunPickup[]
  floats: FloatText[]
  particles: Particle[]
  pendingSfx: Pzd2dSfx[]
  selectedPlant: PlantKind
  selectedPlantId: number | null
  records: LevelRecords
  runStartTime: number
  difficultyMul: number
  plantCooldownMul: number
  /** 结算后等待点击 */
  resultReady: boolean
}