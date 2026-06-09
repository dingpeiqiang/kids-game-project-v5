export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface GridPoint {
  gx: number
  gy: number
}

export type TowerTypeId = 'fire' | 'ice' | 'piercing'

export interface TowerType {
  id: TowerTypeId
  name: string
  cost: number
  damage: number
  range: number
  fireRate: number
  color: number
  bulletColor: number
  icon: string
  description: string
  slowFactor?: number
  slowDuration?: number
  armorPenetration?: number
}

export interface Tower {
  id: string
  gx: number
  gy: number
  x: number
  y: number
  z: number
  type: TowerType
  level: number
  fireTimer: number
  targetId: string | null
  totalInvestment: number
}

export type EnemyTypeId = 'normal' | 'fast' | 'heavy'

export interface EnemyType {
  id: EnemyTypeId
  name: string
  baseHp: number
  baseSpeed: number
  reward: number
  color: number
  size: number
  isElite: boolean
}

export interface Enemy {
  id: string
  x: number
  y: number
  z: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  pathIndex: number
  pathProgress: number
  slowTimer: number
  reward: number
  type: EnemyType
  color: number
  size: number
}

export interface Bullet {
  id: string
  x: number
  y: number
  z: number
  targetId: string
  damage: number
  color: number
  speed: number
  slowFactor?: number
  slowDuration?: number
  armorPenetration?: number
}

export interface Particle {
  id: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  color: number
  life: number
  maxLife: number
  size: number
  type: 'normal' | 'explosion' | 'spark' | 'slow'
}

export interface WaveConfig {
  waveNumber: number
  enemyCount: number
  enemyTypes: EnemyTypeId[]
  spawnInterval: number
  hpMultiplier: number
  speedMultiplier: number
  rewardMultiplier: number
}

export interface GameState {
  gold: number
  lives: number
  wave: number
  score: number
  totalKills: number
  isPlaying: boolean
  isGameOver: boolean
  isVictory: boolean
  selectedTowerType: TowerTypeId | null
  selectedTowerId: string | null
  waveInProgress: boolean
  enemiesRemaining: number
  highestWave: number
  highestScore: number
  highestKills: number
}

export interface GridCell {
  gx: number
  gy: number
  x: number
  y: number
  type: 'buildable' | 'road' | 'blocked' | 'base'
  towerId: string | null
}

export interface PathPoint {
  x: number
  y: number
}