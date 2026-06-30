import type { PowerupType, LevelConfig, SceneType } from './types';

export const W = 400;
export const H = 800;

export const LANES = [80, 200, 320];

export const OBSTACLE_CONFIG: Record<string, { emoji: string; color: string; w: number; h: number; slowAmount: number; isDynamic?: boolean; speed?: number }> = {
  car: { emoji: '🚗', color: '#FF4757', w: 40, h: 55, slowAmount: 0.3 },
  cone: { emoji: '🚧', color: '#FF8C00', w: 35, h: 35, slowAmount: 0.15 },
  truck: { emoji: '🚛', color: '#C0392B', w: 50, h: 70, slowAmount: 0.35 },
  oil: { emoji: '🟤', color: '#3D2914', w: 50, h: 20, slowAmount: 0.4 },
  water: { emoji: '💧', color: '#1E90FF', w: 60, h: 25, slowAmount: 0.25 },
  rock: { emoji: '🪨', color: '#696969', w: 30, h: 30, slowAmount: 0.3 },
  barrier: { emoji: '🚧', color: '#FF0000', w: 60, h: 40, slowAmount: 0.35 },
  slowCar: { emoji: '🚙', color: '#7F8C8D', w: 45, h: 50, slowAmount: 0.25, isDynamic: true, speed: 0.3 },
  pit: { emoji: '🕳️', color: '#2C3E50', w: 60, h: 15, slowAmount: 0.4 },
  van: { emoji: '🚐', color: '#8B4513', w: 48, h: 55, slowAmount: 0.3, isDynamic: true, speed: 0.2 },
};

export const POWERUP_CONFIG: Record<PowerupType, { emoji: string; color: string; name: string; duration: number; speedBoost?: number; effectColor?: string }> = {
  boost: { emoji: '🚀', color: '#FF6B00', name: '氮气加速!', duration: 15000, speedBoost: 1.8, effectColor: '#FF6B00' },
  shield: { emoji: '🛡️', color: '#3498DB', name: '护盾!', duration: 6000 },
  magnet: { emoji: '🧲', color: '#9B59B6', name: '磁铁!', duration: 8000 },
  double: { emoji: '✨', color: '#F1C40F', name: '双倍分数!', duration: 10000 },
  invincible: { emoji: '⭐', color: '#F39C12', name: '无敌模式!', duration: 15000, speedBoost: 1.5 },
  clearObs: { emoji: '💥', color: '#E74C3C', name: '清除障碍!', duration: 0 },
  addTime: { emoji: '🕐', color: '#2ECC71', name: '+15秒!', duration: 0 },
  spaceship: { emoji: '🛸', color: '#00CED1', name: '变身飞船!', duration: 15000, speedBoost: 1.8 },
  tank: { emoji: '🎯', color: '#27AE60', name: '变身体坦克!', duration: 15000, speedBoost: 1.3 },
  mecha: { emoji: '🤖', color: '#E67E22', name: '变身机甲!', duration: 8000, speedBoost: 2.0 },
  scoreBonus: { emoji: '💎', color: '#9B59B6', name: '+300-800分!', duration: 0 },
};

export const SCENES: Record<SceneType, { name: string; roadColor: string; sideColor: string; bgGradient: string[]; objects: string[] }> = {
  city: {
    name: '城市公路',
    roadColor: '#5D6D7E',
    sideColor: '#27AE60',
    bgGradient: ['#87CEEB', '#E8F4F8'],
    objects: ['🏢', '🏠', '🌲', '🚦'],
  },
  space: {
    name: '太空赛道',
    roadColor: '#1A1A2E',
    sideColor: '#16213E',
    bgGradient: ['#0F0F23', '#16213E', '#0F3460'],
    objects: ['🌑', '⭐', '🛸', '👽'],
  },
  desert: {
    name: '沙漠荒野',
    roadColor: '#C4A35A',
    sideColor: '#F4D03F',
    bgGradient: ['#F39C12', '#F5B041', '#F9CA24'],
    objects: ['🌵', '🏜️', '🐪', '🪨'],
  },
  snow: {
    name: '冰雪赛道',
    roadColor: '#BDC3C7',
    sideColor: '#FFFFFF',
    bgGradient: ['#E8F4F8', '#D0ECE7', '#A2D9CE'],
    objects: ['❄️', '🧊', '🏔️', '🌲'],
  },
  futuristic: {
    name: '未来都市',
    roadColor: '#2C3E50',
    sideColor: '#1ABC9C',
    bgGradient: ['#1A1A2E', '#16213E', '#0F3460'],
    objects: ['🏙️', '🚀', '💫', '🔮'],
  },
  mechabase: {
    name: '机甲基地',
    roadColor: '#34495E',
    sideColor: '#7F8C8D',
    bgGradient: ['#2C3E50', '#34495E', '#7F8C8D'],
    objects: ['🤖', '⚙️', '🔧', '🏭'],
  },
};

export const LEVELS: LevelConfig[] = [
  { 
    level: 1, 
    name: '🏙️ 城市初体验', 
    description: '在繁忙的城市公路上开始你的赛车生涯！学习躲避路障，收集金币！',
    timeLimit: 85, 
    distanceGoal: 1200, 
    minObsInterval: 2000, 
    maxObsInterval: 3000, 
    minCoinInterval: 350, 
    maxCoinInterval: 650, 
    minPowerupInterval: 3000, 
    maxPowerupInterval: 4500, 
    maxSpeed: 2.8, 
    speedIncrement: 0.001, 
    allowedObstacles: ['cone'], 
    allowedPowerups: ['boost', 'shield', 'scoreBonus'], 
    availableScenes: ['city'],
    coinMultiplier: 1,
    scoreMultiplier: 1,
  },
  { 
    level: 2, 
    name: '🏜️ 沙漠狂飙', 
    description: '穿越炎热的沙漠！沙丘和仙人掌会阻碍你的前进，小心驾驶！',
    timeLimit: 95, 
    distanceGoal: 1600, 
    minObsInterval: 1600, 
    maxObsInterval: 2400, 
    minCoinInterval: 300, 
    maxCoinInterval: 550, 
    minPowerupInterval: 2800, 
    maxPowerupInterval: 4200, 
    maxSpeed: 3.1, 
    speedIncrement: 0.0011, 
    allowedObstacles: ['rock', 'cone'], 
    allowedPowerups: ['boost', 'magnet', 'shield', 'addTime', 'spaceship'], 
    availableScenes: ['desert'],
    coinMultiplier: 1.2,
    scoreMultiplier: 1.1,
    hasHiddenPits: true,
  },
  { 
    level: 3, 
    name: '❄️ 冰雪挑战', 
    description: '在结冰的赛道上小心行驶！路面很滑，碰撞后减速更严重！',
    timeLimit: 105, 
    distanceGoal: 2000, 
    minObsInterval: 1300, 
    maxObsInterval: 2000, 
    minCoinInterval: 250, 
    maxCoinInterval: 450, 
    minPowerupInterval: 2500, 
    maxPowerupInterval: 3800, 
    maxSpeed: 3.4, 
    speedIncrement: 0.0012, 
    allowedObstacles: ['cone', 'water', 'rock'], 
    allowedPowerups: ['boost', 'shield', 'invincible', 'double', 'magnet', 'spaceship', 'tank'], 
    availableScenes: ['snow'],
    coinMultiplier: 1.5,
    scoreMultiplier: 1.3,
    slipperyRoad: true,
    collisionSlowMultiplier: 1.5,
  },
  { 
    level: 4, 
    name: '🌌 太空冒险', 
    description: '在外太空赛道上飞驰！躲避陨石和能量屏障，飞船道具效果最佳！',
    timeLimit: 115, 
    distanceGoal: 2600, 
    minObsInterval: 1100, 
    maxObsInterval: 1700, 
    minCoinInterval: 220, 
    maxCoinInterval: 400, 
    minPowerupInterval: 2200, 
    maxPowerupInterval: 3400, 
    maxSpeed: 3.8, 
    speedIncrement: 0.0013, 
    allowedObstacles: ['rock', 'barrier', 'pit'], 
    allowedPowerups: ['boost', 'spaceship', 'magnet', 'clearObs', 'shield', 'tank', 'mecha'], 
    availableScenes: ['space'],
    coinMultiplier: 2,
    scoreMultiplier: 1.6,
    hasDynamicObstacles: true,
    nightMode: true,
  },
  { 
    level: 5, 
    name: '🚀 未来都市', 
    description: '终极挑战！在霓虹灯闪烁的未来城市中穿梭，躲避车辆和巨型障碍！',
    timeLimit: 130, 
    distanceGoal: 3200, 
    minObsInterval: 900, 
    maxObsInterval: 1400, 
    minCoinInterval: 180, 
    maxCoinInterval: 350, 
    minPowerupInterval: 2000, 
    maxPowerupInterval: 3000, 
    maxSpeed: 4.2, 
    speedIncrement: 0.0015, 
    allowedObstacles: ['car', 'truck', 'slowCar', 'barrier', 'oil'], 
    allowedPowerups: ['boost', 'tank', 'shield', 'invincible', 'scoreBonus', 'mecha', 'spaceship', 'double'], 
    availableScenes: ['futuristic', 'mechabase'],
    coinMultiplier: 2.5,
    scoreMultiplier: 2,
    hasDynamicObstacles: true,
    nightMode: true,
    slipperyRoad: true,
  },
];

export const SPEED_RECOVERY_RATE = 0.03;
export const COLLISION_SLOW_DURATION = 40;
export const SCENE_SWITCH_DISTANCE = 400;

// 性能优化配置
export const MAX_PARTICLES = 400; // 最大粒子数，防止内存溢出
export const MAX_OBSTACLES = 20; // 最大障碍物数
export const MAX_COINS = 30; // 最大金币数
export const MAX_FLOAT_TEXTS = 8; // 最大浮动文字数，避免视觉混乱
