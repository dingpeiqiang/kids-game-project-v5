export interface GridPos {
  row: number
  col: number
}

export interface Position {
  x: number
  y: number
}

export type PlantType =
  | 'sunflower'
  | 'peashooter'
  | 'sunflower_double'
  | 'snowpea'
  | 'repeater'
  | 'wallnut'
  | 'cherry_bomb'
  | 'potato_mine'
  | 'chomper'
  | 'sunshroom'
  | 'fume_shroom'

export interface PlantConfig {
  type: PlantType
  name: string
  sunCost: number
  health: number
  attack?: number
  attackSpeed?: number
  range?: number
  sunProduction?: number
  sunInterval?: number
  aoeRadius?: number
  slowDuration?: number
  description: string
}

export interface Plant {
  id: string
  type: PlantType
  name: string
  sunCost: number
  health: number
  maxHealth: number
  attack?: number
  attackSpeed?: number
  range?: number
  sunProduction?: number
  sunInterval?: number
  aoeRadius?: number
  slowDuration?: number
  gridPos: GridPos
  lastAttackTime: number
  lastSunTime: number
  isReady: boolean
  animationFrame: number
  plantTime: number
}

export type ZombieType =
  | 'normal'
  | 'conehead'
  | 'buckethead'
  | 'pole_vault'
  | 'football'

export interface ZombieConfig {
  type: ZombieType
  name: string
  health: number
  speed: number
  damage: number
  reward: number
  description: string
}

export interface Zombie {
  id: string
  type: ZombieType
  health: number
  maxHealth: number
  speed: number
  baseSpeed: number
  damage: number
  reward: number
  position: Position
  row: number
  isSlowed: boolean
  slowTimer: number
  isEating: boolean
  lastEatTime: number
  animationFrame: number
  isJumping: boolean
  jumpProgress: number
}

export type ProjectileType =
  | 'pea'
  | 'snow_pea'

export interface Projectile {
  id: string
  x: number
  y: number
  speed: number
  damage: number
  type: ProjectileType
  row: number
  slowDuration?: number
}

export interface Sun {
  id: string
  x: number
  y: number
  vy: number
  targetY: number
  isCollected: boolean
}

export interface LevelConfig {
  level: number
  name: string
  waves: number
  zombieTypes: ZombieType[]
  sunLimit: number
  initialSun: number
}

export interface GameState {
  sun: number
  maxSun: number
  lives: number
  wave: number
  isGameOver: boolean
  isVictory: boolean
  plants: Plant[]
  zombies: Zombie[]
  projectiles: Projectile[]
  suns: Sun[]
  selectedPlant: PlantType | null
  currentLevel: number
  zombiesRemaining: number
  waveCooldown: number
  score: number
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

export interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  dy: number
}

export interface GameConfig {
  GRID_COLS: number
  GRID_ROWS: number
  CELL_WIDTH: number
  CELL_HEIGHT: number
  CANVAS_WIDTH: number
  CANVAS_HEIGHT: number
  HUD_HEIGHT: number
  CARD_WIDTH: number
  CARD_HEIGHT: number
  BASE_SUN_INTERVAL: number
  ZOMBIE_SPAWN_INTERVAL: number
  WAVE_COOLDOWN: number
}