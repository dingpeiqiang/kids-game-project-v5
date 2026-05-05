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
  
  // ✅ 计算合适的Canvas尺寸（保持基础比例 400:600 = 2:3）
  const isMobile = windowWidth < 768
  
  if (isMobile) {
    // 手机端：使用屏幕宽度的 95%，最大不超过 BASE_CANVAS_WIDTH
    CANVAS_WIDTH = Math.min(windowWidth * 0.95, BASE_CANVAS_WIDTH)
    CANVAS_HEIGHT = CANVAS_WIDTH * (BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH)
    
    // 如果高度超出屏幕，按高度计算
    const maxHeight = windowHeight * 0.6  // 手机端最多占用60%高度
    if (CANVAS_HEIGHT > maxHeight) {
      CANVAS_HEIGHT = maxHeight
      CANVAS_WIDTH = CANVAS_HEIGHT * (BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT)
    }
  } else {
    // 桌面端：使用更大的尺寸
    CANVAS_WIDTH = Math.min(windowWidth * 0.9, BASE_CANVAS_WIDTH)
    CANVAS_HEIGHT = CANVAS_WIDTH * (BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH)
    
    const maxHeight = windowHeight * 0.8
    if (CANVAS_HEIGHT > maxHeight) {
      CANVAS_HEIGHT = maxHeight
      CANVAS_WIDTH = CANVAS_HEIGHT * (BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT)
    }
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

// 炮台配置（降低伤害，增加策略性）
export const TURRET_CONFIGS: Record<string, TurretConfig> = {
  laser: {
    cost: 40,
    damage: 8,      // 降低 12→8
    fireRate: 200,  // 降低射速 180→200
    range: 130,
    hp: 50,
    targetPriority: 'nearest',
    upgradePath: [
      { level: 2, cost: 60, damage: 14, fireRate: 170 },   // 降低 20→14
      { level: 3, cost: 120, damage: 24, fireRate: 140, special: '穿透' }  // 降低 32→24
    ]
  },
  missile: {
    cost: 80,
    damage: 25,     // 降低 35→25
    fireRate: 1400, // 降低射速 1200→1400
    range: 160,
    hp: 80,
    targetPriority: 'strongest',
    special: '范围爆炸',
    upgradePath: [
      { level: 2, cost: 120, damage: 42, fireRate: 1100 },  // 降低 55→42
      { level: 3, cost: 240, damage: 70, fireRate: 900, special: '追踪导弹' }  // 降低 90→70
    ]
  },
  frost: {
    cost: 50,
    damage: 5,      // 降低 8→5
    fireRate: 450,  // 降低射速 400→450
    range: 120,
    hp: 60,
    targetPriority: 'first',
    special: '减速50%',
    upgradePath: [
      { level: 2, cost: 80, damage: 9, fireRate: 380 },   // 降低 12→9
      { level: 3, cost: 160, damage: 14, fireRate: 300, special: '短暂冻结' }  // 降低 18→14
    ]
  },
  lightning: {
    cost: 120,
    damage: 18,     // 降低 25→18
    fireRate: 800,  // 降低射速 700→800
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
  atk: 8,      // 降低攻击力（原10）
  speed: 4.5,
  shootCooldown: 400  // 毫秒
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

// 波次配置（逐级提升难度）
export function getWaveConfig(waveNumber: number): WaveInfo {
  const configs: WaveInfo[] = [
    // 第1波: 轻松入门
    {
      waveNumber: 1,
      duration: WAVE_DURATIONS[0],
      breakTime: BREAK_TIMES[0],
      enemies: [
        { type: 'basic', count: 15, spawnInterval: 2200 }  // 12→15，加快节奏
      ]
    },
    // 第2波: 稍加挑战
    {
      waveNumber: 2,
      duration: WAVE_DURATIONS[1],
      breakTime: BREAK_TIMES[1],
      enemies: [
        { type: 'basic', count: 22, spawnInterval: 2000 },  // 18→22
        { type: 'fast', count: 10, spawnInterval: 2800 }     // 8→10
      ]
    },
    // 第3波: 引入坦克+Boss
    {
      waveNumber: 3,
      duration: WAVE_DURATIONS[2],
      breakTime: BREAK_TIMES[2],
      enemies: [
        { type: 'basic', count: 25, spawnInterval: 1800 },  // 22→25，加快
        { type: 'fast', count: 12, spawnInterval: 2200 },   // 10→12
        { type: 'tank', count: 6, spawnInterval: 4500 }     // 5→6
      ],
      boss: true
    },
    // 第4波: 自爆虫出现
    {
      waveNumber: 4,
      duration: WAVE_DURATIONS[3],
      breakTime: BREAK_TIMES[3],
      enemies: [
        { type: 'basic', count: 25, spawnInterval: 1600 },   // 20→25，更快
        { type: 'fast', count: 15, spawnInterval: 2000 },    // 12→15
        { type: 'exploder', count: 8, spawnInterval: 3200 }  // 7→8
      ]
    },
    // 第5波: 分裂怪
    {
      waveNumber: 5,
      duration: WAVE_DURATIONS[4],
      breakTime: BREAK_TIMES[4],
      enemies: [
        { type: 'splitter', count: 10, spawnInterval: 3200 },  // 8→10
        { type: 'basic', count: 30, spawnInterval: 1400 },    // 25→30，更快
        { type: 'tank', count: 8, spawnInterval: 3200 }       // 7→8
      ]
    },
    // 第6波: 飞行怪
    {
      waveNumber: 6,
      duration: WAVE_DURATIONS[5],
      breakTime: BREAK_TIMES[5],
      enemies: [
        { type: 'flyer', count: 16, spawnInterval: 2200 },    // 14→16
        { type: 'fast', count: 20, spawnInterval: 1600 },     // 18→20，更快
        { type: 'exploder', count: 10, spawnInterval: 2800 }   // 9→10
      ]
    },
    // 第7波: 高强度混合
    {
      waveNumber: 7,
      duration: WAVE_DURATIONS[6],
      breakTime: BREAK_TIMES[6],
      enemies: [
        { type: 'tank', count: 14, spawnInterval: 2800 },     // 12→14
        { type: 'splitter', count: 16, spawnInterval: 2800 }, // 14→16
        { type: 'flyer', count: 22, spawnInterval: 2000 },    // 20→22，更快
        { type: 'exploder', count: 14, spawnInterval: 2200 }  // 12→14
      ]
    },
    // 第8波: 最终Boss
    {
      waveNumber: 8,
      duration: WAVE_DURATIONS[7],
      breakTime: 0,
      enemies: [
        { type: 'basic', count: 40, spawnInterval: 1000 },    // 35→40，极快
        { type: 'fast', count: 25, spawnInterval: 1400 },     // 22→25
        { type: 'tank', count: 18, spawnInterval: 2200 }      // 15→18
      ],
      boss: true
    }
  ]

  return configs[waveNumber - 1] || configs[configs.length - 1]
}

// 敌人基础属性（增加HP，提高挑战性）
export const ENEMY_BASE_STATS = {
  basic:   { hp: 100, speed: 1.0, damage: 12, score: 10,  crystals: 3,  color: '#FF6B6B' },  // 80→100
  fast:    { hp: 70,  speed: 2.0, damage: 10, score: 15,  crystals: 4,  color: '#00E5FF' },  // 55→70
  tank:    { hp: 450, speed: 0.5, damage: 25, score: 30,  crystals: 8,  color: '#FFD93D' },  // 350→450
  exploder:{ hp: 50,  speed: 2.5, damage: 60, score: 20,  crystals: 5,  color: '#FF4757' },  // 40→50
  splitter:{ hp: 130, speed: 0.8, damage: 15, score: 25,  crystals: 6,  color: '#9B59B6' },  // 100→130
  flyer:   { hp: 80,  speed: 1.5, damage: 12, score: 20,  crystals: 5,  color: '#87CEEB' },  // 60→80
  boss:    { hp: 3000, speed: 0.3, damage: 60, score: 500, crystals: 100, color: '#FF0000' }  // 2000→3000
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