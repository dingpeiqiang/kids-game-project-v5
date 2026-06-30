export interface Point {
  x: number
  y: number
}

export interface GridPoint {
  gx: number
  gy: number
}

export interface TowerType {
  id: string
  name: string
  cost: number
  damage: number
  range: number
  fireRate: number
  color: string
  bulletColor: string
  bulletSpeed: number
  icon: string
  aoe?: number
  slow?: number
  slowDur?: number
  piercing?: boolean
}

export interface Tower {
  gx: number
  gy: number
  x: number
  y: number
  type: TowerType
  fireTimer: number
  angle: number
  level: number
  totalInvestment: number
}

export interface Enemy {
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  pathIdx: number
  pathProgress: number
  slowTimer: number
  reward: number
  color: string
  size: number
  isBoss: boolean
}

export interface Bullet {
  x: number
  y: number
  target: Enemy
  damage: number
  color: string
  speed: number
  aoe?: number
  slow?: number
  slowDur?: number
  piercing?: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
  type?: 'normal' | 'explosion' | 'spark'
}

export interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
}

export interface WaveConfig {
  count: number
  hpMul: number
  spdMul: number
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'elite'

export interface GameState {
  gold: number
  lives: number
  wave: number
  waveTimer: number
  enemiesToSpawn: number
  spawnCounter: number
  score: number
  combo: number
  maxCombo: number
  lastKillTime: number
  selectedTowerType: number
  isGameOver: boolean
  screenShake: number
  flashEffect: number
  slowMotion: number
  specialSkillCharge: number
  showSpecialSkillButton: boolean
  totalWavesCompleted: number
  highestWave: number
}

export interface GameEngine {
  addScore: (score: number, x: number, y: number) => void
  triggerRandomBuff: () => void
}
