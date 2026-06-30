import type { PlantConfig, ZombieConfig, LevelConfig, GameConfig, PlantType, ZombieType } from './types'

export const GAME_CONFIG: GameConfig = {
  GRID_COLS: 9,
  GRID_ROWS: 5,
  CELL_WIDTH: 80,
  CELL_HEIGHT: 100,
  CANVAS_WIDTH: 720,
  CANVAS_HEIGHT: 600,
  HUD_HEIGHT: 100,
  CARD_WIDTH: 60,
  CARD_HEIGHT: 70,
  BASE_SUN_INTERVAL: 7500,
  ZOMBIE_SPAWN_INTERVAL: 2500,
  WAVE_COOLDOWN: 5000,
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  sunflower: {
    type: 'sunflower',
    name: '向日葵',
    sunCost: 50,
    health: 100,
    sunProduction: 25,
    sunInterval: 24000,
    description: '生产阳光',
  },
  peashooter: {
    type: 'peashooter',
    name: '豌豆射手',
    sunCost: 100,
    health: 100,
    attack: 20,
    attackSpeed: 1000,
    range: 9,
    description: '发射豌豆攻击',
  },
  sunflower_double: {
    type: 'sunflower_double',
    name: '双子向日葵',
    sunCost: 150,
    health: 100,
    sunProduction: 50,
    sunInterval: 24000,
    description: '双倍阳光产出',
  },
  snowpea: {
    type: 'snowpea',
    name: '寒冰射手',
    sunCost: 175,
    health: 100,
    attack: 20,
    attackSpeed: 1000,
    range: 9,
    slowDuration: 3000,
    description: '发射冰豌豆减速敌人',
  },
  repeater: {
    type: 'repeater',
    name: '双重射手',
    sunCost: 200,
    health: 100,
    attack: 20,
    attackSpeed: 1000,
    range: 9,
    description: '发射双发豌豆',
  },
  wallnut: {
    type: 'wallnut',
    name: '坚果墙',
    sunCost: 50,
    health: 4000,
    description: '高血量阻挡敌人',
  },
  cherry_bomb: {
    type: 'cherry_bomb',
    name: '樱桃炸弹',
    sunCost: 150,
    health: 100,
    attack: 1800,
    aoeRadius: 150,
    description: '范围爆炸伤害',
  },
  potato_mine: {
    type: 'potato_mine',
    name: '土豆地雷',
    sunCost: 25,
    health: 100,
    attack: 1800,
    description: '触发式爆炸',
  },
  chomper: {
    type: 'chomper',
    name: '大嘴花',
    sunCost: 150,
    health: 100,
    attack: 9999,
    attackSpeed: 4500,
    range: 1,
    description: '秒杀单个僵尸',
  },
  sunshroom: {
    type: 'sunshroom',
    name: '阳光蘑菇',
    sunCost: 25,
    health: 100,
    sunProduction: 15,
    sunInterval: 32000,
    description: '低消耗阳光生产',
  },
  fume_shroom: {
    type: 'fume_shroom',
    name: '烟雾蘑菇',
    sunCost: 75,
    health: 100,
    attack: 20,
    attackSpeed: 1500,
    range: 9,
    description: '穿透攻击整行',
  },
}

export const ZOMBIE_CONFIGS: Record<ZombieType, ZombieConfig> = {
  normal: {
    type: 'normal',
    name: '普通僵尸',
    health: 200,
    speed: 0.5,
    damage: 100,
    reward: 10,
    description: '基础僵尸',
  },
  conehead: {
    type: 'conehead',
    name: '路障僵尸',
    health: 450,
    speed: 0.5,
    damage: 100,
    reward: 15,
    description: '带有路障保护',
  },
  buckethead: {
    type: 'buckethead',
    name: '铁桶僵尸',
    health: 1100,
    speed: 0.5,
    damage: 100,
    reward: 25,
    description: '高防御铁桶保护',
  },
  pole_vault: {
    type: 'pole_vault',
    name: '撑杆跳僵尸',
    health: 350,
    speed: 1.2,
    damage: 100,
    reward: 20,
    description: '跳过第一个植物',
  },
  football: {
    type: 'football',
    name: '橄榄球僵尸',
    health: 1400,
    speed: 0.8,
    damage: 150,
    reward: 35,
    description: '高防御高速',
  },
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '庭院入门',
    waves: 5,
    zombieTypes: ['normal'],
    sunLimit: 800,
    initialSun: 200,
  },
  {
    level: 2,
    name: '路障挑战',
    waves: 6,
    zombieTypes: ['normal', 'conehead'],
    sunLimit: 800,
    initialSun: 200,
  },
  {
    level: 3,
    name: '撑杆来袭',
    waves: 7,
    zombieTypes: ['normal', 'conehead', 'pole_vault'],
    sunLimit: 900,
    initialSun: 250,
  },
  {
    level: 4,
    name: '铁桶防御',
    waves: 8,
    zombieTypes: ['normal', 'conehead', 'buckethead'],
    sunLimit: 1000,
    initialSun: 250,
  },
  {
    level: 5,
    name: '终极挑战',
    waves: 10,
    zombieTypes: ['normal', 'conehead', 'buckethead', 'football'],
    sunLimit: 1200,
    initialSun: 300,
  },
]

export const AVAILABLE_PLANTS: PlantType[] = [
  'sunflower',
  'peashooter',
  'wallnut',
  'snowpea',
  'repeater',
  'cherry_bomb',
  'potato_mine',
  'chomper',
]

export const COLORS = {
  grass: '#7CB342',
  grassDark: '#689F38',
  road: '#8B7355',
  roadLine: '#FFFFFF',
  sky: '#87CEEB',
  sun: '#FFD700',
  sunOutline: '#FFA500',
  plantCardBg: '#2D5A27',
  plantCardSelected: '#4CAF50',
  life: '#E53935',
  wave: '#FFD700',
  score: '#FFFFFF',
  gridLine: 'rgba(0,0,0,0.1)',
  projectile: {
    pea: '#4CAF50',
    snow_pea: '#00BCD4',
  },
  zombie: {
    normal: '#8D6E63',
    conehead: '#8D6E63',
    buckethead: '#8D6E63',
    pole_vault: '#8D6E63',
    football: '#E53935',
  },
}

export function gridToPixel(gridPos: { row: number; col: number }) {
  return {
    x: gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2,
    y: gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2,
  }
}

export function pixelToGrid(x: number, y: number) {
  const col = Math.floor(x / GAME_CONFIG.CELL_WIDTH)
  const row = Math.floor((y - GAME_CONFIG.HUD_HEIGHT) / GAME_CONFIG.CELL_HEIGHT)
  return { row, col }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}