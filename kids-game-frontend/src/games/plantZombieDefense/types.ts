/** §16 程序枚举 — 与策划 GDD 1:1 */

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

export type PlantKindType = `${PlantKind}`
export type ZombieKindType = `${ZombieKind}`

export type GamePhase = 'prep' | 'wave' | 'victory' | 'defeat'

export interface GridPos {
  gx: number
  gz: number
}

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
  z: number
  gz: number
  damage: number
  slowMul: number
  slowDuration: number
  alive: boolean
}

export interface SunPickup {
  id: number
  x: number
  z: number
  value: number
  life: number
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
  plants: PlantState[]
  zombies: ZombieState[]
  peas: PeaProjectile[]
  suns: SunPickup[]
  floats: FloatText[]
  selectedPlant: PlantKind
  selectedPlantId: number | null
  records: LevelRecords
  runStartTime: number
  difficultyMul: number
  plantCooldownMul: number
}