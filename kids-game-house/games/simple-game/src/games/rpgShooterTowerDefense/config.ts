// RPG Shooter 塔防融合版 - 游戏配置

import { TurretConfig, WaveInfo } from './types'

// 画布尺寸（基础设计尺寸）
export const BASE_CANVAS_WIDTH = 400
export const BASE_CANVAS_HEIGHT = 600

// 实际Canvas尺寸（会根据屏幕调整）
export let CANVAS_WIDTH = BASE_CANVAS_WIDTH
export let CANVAS_HEIGHT = BASE_CANVAS_HEIGHT

// 缩放比例（用于适配不同屏幕）
export let SCALE_RATIO = 1.0

// 初始化Canvas尺寸（根据屏幕大小）
export function initCanvasSize() {
  // 获取窗口尺寸
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  // 计算合适的Canvas尺寸（保持4:3比例）
  // 手机端使用更小的尺寸
  const isMobile = windowWidth < 768
  const widthPercent = isMobile ? 0.75 : 0.9  // 手机端75%，桌面端90%
  const heightPercent = isMobile ? 0.5 : 0.7   // 手机端50%，桌面端70%
  
  const targetWidth = Math.min(windowWidth * widthPercent, BASE_CANVAS_WIDTH)
  const targetHeight = targetWidth * (BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH)
  
  // 如果高度超出屏幕，按高度计算
  if (targetHeight > windowHeight * heightPercent) {
    CANVAS_HEIGHT = Math.min(windowHeight * heightPercent, BASE_CANVAS_HEIGHT)
    CANVAS_WIDTH = CANVAS_HEIGHT * (BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT)
  } else {
    CANVAS_WIDTH = targetWidth
    CANVAS_HEIGHT = targetHeight
  }
  
  // 计算缩放比例
  SCALE_RATIO = CANVAS_WIDTH / BASE_CANVAS_WIDTH
  
  console.log(`设备类型: ${isMobile ? '手机' : '桌面'}`)
  console.log(`Canvas 尺寸: ${CANVAS_WIDTH.toFixed(0)}x${CANVAS_HEIGHT.toFixed(0)}, 缩放比例: ${SCALE_RATIO.toFixed(2)}`)
}

// 游戏时长配置
export const TOTAL_WAVES = 8
export const WAVE_DURATIONS = [40, 50, 60, 70, 80, 90, 100, 120] // 每波持续时间（略增加）
export const BREAK_TIMES = [15, 20, 20, 25, 25, 30, 30, 30]     // 休息时间（前期增加）

// 炮台配置（优化性价比）
export const TURRET_CONFIGS: Record<string, TurretConfig> = {
  laser: {
    cost: 40,
    damage: 12,
    fireRate: 180,
    range: 130,
    hp: 50,
    targetPriority: 'nearest',
    upgradePath: [
      { level: 2, cost: 60, damage: 20, fireRate: 160 },
      { level: 3, cost: 120, damage: 32, fireRate: 130, special: '穿透' }
    ]
  },
  missile: {
    cost: 80,
    damage: 35,
    fireRate: 1200,
    range: 160,
    hp: 80,
    targetPriority: 'strongest',
    special: '范围爆炸',
    upgradePath: [
      { level: 2, cost: 120, damage: 55, fireRate: 1000 },
      { level: 3, cost: 240, damage: 90, fireRate: 800, special: '追踪导弹' }
    ]
  },
  frost: {
    cost: 50,
    damage: 8,
    fireRate: 400,
    range: 120,
    hp: 60,
    targetPriority: 'first',
    special: '减速50%',
    upgradePath: [
      { level: 2, cost: 80, damage: 12, fireRate: 350 },
      { level: 3, cost: 160, damage: 18, fireRate: 280, special: '短暂冻结' }
    ]
  },
  lightning: {
    cost: 120,
    damage: 25,
    fireRate: 700,
    range: 140,
    hp: 70,
    targetPriority: 'nearest',
    special: '连锁x3',
    upgradePath: [
      { level: 2, cost: 180, damage: 40, fireRate: 580 },
      { level: 3, cost: 320, damage: 65, fireRate: 450, special: '连锁x5' }
    ]
  }
}

// 炮台显示信息
export const TURRET_DISPLAY = {
  laser: { name: '激光炮台', icon: '🔫', description: '高射速，精准打击' },
  missile: { name: '导弹炮台', icon: '💣', description: '范围爆炸伤害' },
  frost: { name: '冰冻炮台', icon: '❄️', description: '减速敌人' },
  lightning: { name: '闪电链', icon: '⚡', description: '连锁攻击多个敌人' }
}

// 玩家初始属性
export const PLAYER_INITIAL = {
  hp: 100,
  atk: 10,
  speed: 4.5,
  shootCooldown: 250  // 毫秒
}

// 等级经验需求
export function getExpToLevel(level: number): number {
  return Math.floor(20 * Math.pow(1.35, level - 1))
}

// 等级属性成长
export function getPlayerStatsAtLevel(level: number) {
  const base = PLAYER_INITIAL
  return {
    hp: Math.floor(base.hp * (1 + (level - 1) * 0.15)),
    atk: Math.floor(base.atk * (1 + (level - 1) * 0.12)),
    speed: base.speed + (level - 1) * 0.3
  }
}

// 波次配置（降低前期难度，增加资源奖励）
export function getWaveConfig(waveNumber: number): WaveInfo {
  const configs: WaveInfo[] = [
    // 第1波: 轻松入门
    {
      waveNumber: 1,
      duration: WAVE_DURATIONS[0],
      breakTime: BREAK_TIMES[0],
      enemies: [
        { type: 'basic', count: 10, spawnInterval: 2500 }
      ]
    },
    // 第2波: 稍加挑战
    {
      waveNumber: 2,
      duration: WAVE_DURATIONS[1],
      breakTime: BREAK_TIMES[1],
      enemies: [
        { type: 'basic', count: 15, spawnInterval: 2200 },
        { type: 'fast', count: 6, spawnInterval: 3000 }
      ]
    },
    // 第3波: 引入坦克+Boss
    {
      waveNumber: 3,
      duration: WAVE_DURATIONS[2],
      breakTime: BREAK_TIMES[2],
      enemies: [
        { type: 'basic', count: 18, spawnInterval: 2000 },
        { type: 'fast', count: 8, spawnInterval: 2500 },
        { type: 'tank', count: 3, spawnInterval: 5000 }
      ],
      boss: true
    },
    // 第4波: 自爆虫出现
    {
      waveNumber: 4,
      duration: WAVE_DURATIONS[3],
      breakTime: BREAK_TIMES[3],
      enemies: [
        { type: 'basic', count: 15, spawnInterval: 2000 },
        { type: 'fast', count: 10, spawnInterval: 2500 },
        { type: 'exploder', count: 5, spawnInterval: 4000 }
      ]
    },
    // 第5波: 分裂怪
    {
      waveNumber: 5,
      duration: WAVE_DURATIONS[4],
      breakTime: BREAK_TIMES[4],
      enemies: [
        { type: 'splitter', count: 6, spawnInterval: 4000 },
        { type: 'basic', count: 20, spawnInterval: 1800 },
        { type: 'tank', count: 5, spawnInterval: 4000 }
      ]
    },
    // 第6波: 飞行怪
    {
      waveNumber: 6,
      duration: WAVE_DURATIONS[5],
      breakTime: BREAK_TIMES[5],
      enemies: [
        { type: 'flyer', count: 10, spawnInterval: 3000 },
        { type: 'fast', count: 15, spawnInterval: 2000 },
        { type: 'exploder', count: 6, spawnInterval: 3500 }
      ]
    },
    // 第7波: 高强度混合
    {
      waveNumber: 7,
      duration: WAVE_DURATIONS[6],
      breakTime: BREAK_TIMES[6],
      enemies: [
        { type: 'tank', count: 8, spawnInterval: 3500 },
        { type: 'splitter', count: 10, spawnInterval: 3500 },
        { type: 'flyer', count: 15, spawnInterval: 2500 },
        { type: 'exploder', count: 8, spawnInterval: 3000 }
      ]
    },
    // 第8波: 最终Boss
    {
      waveNumber: 8,
      duration: WAVE_DURATIONS[7],
      breakTime: 0,
      enemies: [
        { type: 'basic', count: 25, spawnInterval: 1500 },
        { type: 'fast', count: 15, spawnInterval: 2000 },
        { type: 'tank', count: 10, spawnInterval: 3000 }
      ],
      boss: true
    }
  ]

  return configs[waveNumber - 1] || configs[configs.length - 1]
}

// 敌人基础属性
export const ENEMY_BASE_STATS = {
  basic:   { hp: 30,  speed: 1.0, damage: 10, score: 10,  crystals: 3,  color: '#FF6B6B' },
  fast:    { hp: 20,  speed: 2.0, damage: 8,  score: 15,  crystals: 4,  color: '#00E5FF' },
  tank:    { hp: 150, speed: 0.5, damage: 20, score: 30,  crystals: 8,  color: '#FFD93D' },
  exploder:{ hp: 25,  speed: 2.5, damage: 50, score: 20,  crystals: 5,  color: '#FF4757' },
  splitter:{ hp: 60,  speed: 0.8, damage: 12, score: 25,  crystals: 6,  color: '#9B59B6' },
  flyer:   { hp: 35,  speed: 1.5, damage: 10, score: 20,  crystals: 5,  color: '#87CEEB' },
  boss:    { hp: 1000, speed: 0.3, damage: 50, score: 500, crystals: 100, color: '#FF0000' }
}

// 敌人射击配置（波次解锁）
export const ENEMY_SHOOT_CONFIGS = {
  // 第5波开始：射手型敌人（tank）可以射击
  tank: {
    minWave: 5,
    shootCooldown: 3000,  // 3秒冷却
    shootRange: 200,
    bulletDamage: 15,
    bulletSpeed: 3,
    bulletColor: '#FFD93D',
    bulletSize: 4
  },
  // 第8波开始：Boss可以射击
  boss: {
    minWave: 8,
    shootCooldown: 2000,  // 2秒冷却
    shootRange: 250,
    bulletDamage: 25,
    bulletSpeed: 4,
    bulletColor: '#FF0000',
    bulletSize: 6
  },
  // 第12波开始：飞行者可以射击
  flyer: {
    minWave: 12,
    shootCooldown: 2500,  // 2.5秒冷却
    shootRange: 180,
    bulletDamage: 12,
    bulletSpeed: 3.5,
    bulletColor: '#87CEEB',
    bulletSize: 3
  }
}

// 最大炮台数量
export const MAX_TURRETS = 10

// 最大陷阱数量
export const MAX_TRAPS = 8

// 建造网格大小（用于对齐）
export const GRID_SIZE = 20

// 资源获取配置
export const RESOURCE_CONFIG = {
  comboBonusThreshold: 5,     // 连击奖励阈值
  comboBonusMultiplier: 1.5,  // 连击奖励倍率
  timeRewardInterval: 10,     // 时间奖励间隔（秒）
  timeRewardAmount: 20        // 时间奖励数量
}

// 陷阱配置
export const TRAP_CONFIGS = {
  mine: {
    cost: 30,
    damage: 80,
    radius: 40,
    hp: 10,
    name: '地雷',
    icon: '💣'
  },
  slowField: {
    cost: 40,
    effectValue: 0.5,  // 减速50%
    radius: 60,
    duration: 5,       // 持续5秒
    hp: 15,
    name: '减速力场',
    icon: '❄️'
  },
  spike: {
    cost: 25,
    damage: 40,
    radius: 30,
    hp: 20,
    name: '地刺',
    icon: '🔺'
  }
}