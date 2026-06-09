import type { TowerType, EnemyType, WaveConfig, PathPoint } from './types'

export const GAME_CONFIG = {
  GRID_SIZE: 12,
  CELL_SIZE: 1,
  TOWER_HEIGHT: 0.5,
  BASE_HEIGHT: 0.8,
  ENEMY_HEIGHT: 0.3,
  BULLET_HEIGHT: 0.4,
  
  INITIAL_GOLD: 200,
  INITIAL_LIVES: 20,
  
  MAX_WAVES: 5,
  
  SELL_REFUND_RATIO: 0.6,
  
  UPGRADE_COST_MULTIPLIER: 1.5,
  DAMAGE_UPGRADE_MULTIPLIER: 1.3,
  RANGE_UPGRADE_MULTIPLIER: 1.1,
  FIRERATE_UPGRADE_MULTIPLIER: 0.9,
  
  MAX_TOWER_LEVEL: 3,
  
  CAMERA_DISTANCE: 18,
  CAMERA_HEIGHT: 12,
  CAMERA_ANGLE: 60,
}

export const TOWER_TYPES: TowerType[] = [
  {
    id: 'fire',
    name: '火力炮塔',
    cost: 50,
    damage: 15,
    range: 3,
    fireRate: 800,
    color: 0xff4444,
    bulletColor: 0xff6600,
    icon: '🔥',
    description: '基础高频伤害，射速快，适合清理小怪群'
  },
  {
    id: 'ice',
    name: '冰霜炮塔',
    cost: 70,
    damage: 8,
    range: 2.8,
    fireRate: 1200,
    color: 0x44aaff,
    bulletColor: 0x88ddff,
    icon: '❄️',
    description: '命中附带减速效果，大幅降低敌人移速',
    slowFactor: 0.4,
    slowDuration: 2000
  },
  {
    id: 'piercing',
    name: '穿刺炮塔',
    cost: 90,
    damage: 35,
    range: 3.5,
    fireRate: 1500,
    color: 0xaa44ff,
    bulletColor: 0xdd88ff,
    icon: '💎',
    description: '高伤害穿透攻击，克制重甲精英怪',
    armorPenetration: 0.5
  }
]

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'normal',
    name: '普通小怪',
    baseHp: 50,
    baseSpeed: 1.2,
    reward: 10,
    color: 0x66aa66,
    size: 0.35,
    isElite: false
  },
  {
    id: 'fast',
    name: '速攻轻甲怪',
    baseHp: 30,
    baseSpeed: 2.2,
    reward: 15,
    color: 0xffaa44,
    size: 0.3,
    isElite: false
  },
  {
    id: 'heavy',
    name: '重甲精英怪',
    baseHp: 150,
    baseSpeed: 0.8,
    reward: 30,
    color: 0xaa4444,
    size: 0.5,
    isElite: true
  }
]

export const WAVE_CONFIGS: WaveConfig[] = [
  {
    waveNumber: 1,
    enemyCount: 6,
    enemyTypes: ['normal'],
    spawnInterval: 1500,
    hpMultiplier: 1.0,
    speedMultiplier: 1.0,
    rewardMultiplier: 1.0
  },
  {
    waveNumber: 2,
    enemyCount: 10,
    enemyTypes: ['normal', 'fast'],
    spawnInterval: 1200,
    hpMultiplier: 1.2,
    speedMultiplier: 1.1,
    rewardMultiplier: 1.1
  },
  {
    waveNumber: 3,
    enemyCount: 12,
    enemyTypes: ['normal', 'fast', 'heavy'],
    spawnInterval: 1100,
    hpMultiplier: 1.5,
    speedMultiplier: 1.2,
    rewardMultiplier: 1.2
  },
  {
    waveNumber: 4,
    enemyCount: 16,
    enemyTypes: ['normal', 'fast', 'heavy'],
    spawnInterval: 900,
    hpMultiplier: 2.0,
    speedMultiplier: 1.3,
    rewardMultiplier: 1.4
  },
  {
    waveNumber: 5,
    enemyCount: 20,
    enemyTypes: ['normal', 'fast', 'heavy'],
    spawnInterval: 700,
    hpMultiplier: 2.5,
    speedMultiplier: 1.4,
    rewardMultiplier: 1.6
  }
]

export const PATH_POINTS: PathPoint[] = [
  { x: -5.5, y: -1 },
  { x: -5.5, y: 2 },
  { x: -2, y: 2 },
  { x: -2, y: -2 },
  { x: 1.5, y: -2 },
  { x: 1.5, y: 3 },
  { x: 5, y: 3 },
  { x: 5, y: 0 }
]

export const COLORS = {
  ground: 0x336633,
  buildable: 0x44aa44,
  road: 0x666666,
  blocked: 0x444444,
  base: 0xffdd44,
  gold: 0xffd700,
  health: 0x44aa44,
  healthLow: 0xff4444,
  text: 0xffffff,
  wave: 0xffd700
}

export const STORAGE_KEYS = {
  highestWave: 'sky_defense_highest_wave',
  highestScore: 'sky_defense_highest_score',
  highestKills: 'sky_defense_highest_kills'
}