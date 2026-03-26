// 游戏类型定义

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  name: string
  nameCN: string
  zombieSpawnRate: number
  zombieHealthMultiplier: number
  zombieSpeedMultiplier: number
  sunSpawnRate: number
  color: string
  description: string
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  playCount: number
  difficulty: Difficulty
  sunCount: number
}

export interface Position {
  x: number
  y: number
}

export interface GridPosition {
  row: number
  col: number
}

export type PlantType = 'sunflower' | 'peashooter' | 'wallnut' | 'cherrybomb' | 'snowpea'

export interface Plant {
  id: string
  type: PlantType
  row: number
  col: number
  health: number
  maxHealth: number
  lastActionTime: number
  actionInterval: number
}

export type ZombieType = 'normal' | 'cone' | 'bucket' | 'imp'

export interface Zombie {
  id: string
  type: ZombieType
  row: number
  x: number
  health: number
  maxHealth: number
  speed: number
  damage: number
  isFrozen: boolean
  freezeTimer: number
}

export interface Projectile {
  id: string
  type: 'pea' | 'snowpea'
  row: number
  x: number
  speed: number
  damage: number
}

export interface Sun {
  id: string
  x: number
  y: number
  targetY: number
  value: number
  createdAt: number
  expiresAt: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    nameCN: '简单',
    zombieSpawnRate: 6000,
    zombieHealthMultiplier: 0.8,
    zombieSpeedMultiplier: 0.8,
    sunSpawnRate: 8000,
    color: '#4ade80',
    description: '适合小朋友入门，僵尸慢，阳光多'
  },
  medium: {
    name: 'medium',
    nameCN: '中等',
    zombieSpawnRate: 4000,
    zombieHealthMultiplier: 1,
    zombieSpeedMultiplier: 1,
    sunSpawnRate: 6000,
    color: '#fbbf24',
    description: '标准挑战，平衡体验'
  },
  hard: {
    name: 'hard',
    nameCN: '困难',
    zombieSpawnRate: 2000,
    zombieHealthMultiplier: 1.5,
    zombieSpeedMultiplier: 1.3,
    sunSpawnRate: 4000,
    color: '#f87171',
    description: '高手专属，僵尸多且强'
  }
}

export const PLANT_CONFIGS: Record<PlantType, {
  name: string
  nameCN: string
  sunCost: number
  health: number
  damage?: number
  actionInterval: number
  description: string
  emoji: string
  color: string
}> = {
  sunflower: {
    name: 'sunflower',
    nameCN: '向日葵',
    sunCost: 50,
    health: 100,
    actionInterval: 5000,
    description: '生产阳光，每 5 秒产生一个阳光',
    emoji: '🌻',
    color: '#fbbf24'
  },
  peashooter: {
    name: 'peashooter',
    nameCN: '豌豆射手',
    sunCost: 100,
    health: 100,
    damage: 20,
    actionInterval: 1500,
    description: '向前发射豌豆攻击僵尸',
    emoji: '🌱',
    color: '#22c55e'
  },
  wallnut: {
    name: 'wallnut',
    nameCN: '坚果墙',
    sunCost: 50,
    health: 400,
    actionInterval: 0,
    description: '高血量，阻挡僵尸前进',
    emoji: '🥔',
    color: '#a8763e'
  },
  cherrybomb: {
    name: 'cherrybomb',
    nameCN: '樱桃炸弹',
    sunCost: 150,
    health: 100,
    damage: 200,
    actionInterval: 1000,
    description: '爆炸伤害 3×3 范围内的所有僵尸',
    emoji: '🍒',
    color: '#ef4444'
  },
  snowpea: {
    name: 'snowpea',
    nameCN: '寒冰射手',
    sunCost: 175,
    health: 100,
    damage: 20,
    actionInterval: 1500,
    description: '发射冰豌豆，减速僵尸',
    emoji: '❄️',
    color: '#60a5fa'
  }
}

export const ZOMBIE_CONFIGS: Record<ZombieType, {
  name: string
  nameCN: string
  health: number
  speed: number
  damage: number
  emoji: string
  color: string
}> = {
  normal: {
    name: 'normal',
    nameCN: '普通僵尸',
    health: 100,
    speed: 20,
    damage: 10,
    emoji: '🧟',
    color: '#84cc16'
  },
  cone: {
    name: 'cone',
    nameCN: '路障僵尸',
    health: 180,
    speed: 20,
    damage: 10,
    emoji: '🧟‍♂️',
    color: '#f97316'
  },
  bucket: {
    name: 'bucket',
    nameCN: '铁桶僵尸',
    health: 300,
    speed: 18,
    damage: 10,
    emoji: '🧟‍♀️',
    color: '#64748b'
  },
  imp: {
    name: 'imp',
    nameCN: '小鬼僵尸',
    health: 60,
    speed: 35,
    damage: 8,
    emoji: '👶',
    color: '#a3e635'
  }
}

export const GAME_CONFIG = {
  gridRows: 5,
  gridCols: 9,
  cellSize: 80,
  sunValue: 25,
  sunLifetime: 8000,
  initialSun: 150
}
