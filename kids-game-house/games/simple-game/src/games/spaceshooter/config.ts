// === 太空射击常量配置 ===
import type { EnemyType, LevelCfg } from './types'

/** 关卡 Boss 独立配置（Lv1~9） */
export interface LevelBossConfig {
  bossId: number
  name: string          // Boss 名称（显示用）
  color: string         // 主色
  accentColor: string   // 点缀色
  shape: string         // 专属 shape 标识
  w: number; h: number
  hp: number            // 基础 HP（场景内会乘以关卡倍率）
  score: number
  speed: number
  /** 攻击模式标识: 'spread' | 'aimed' | 'spiral' | 'barrage' | 'laser_sweep' | 'mine' | 'homing' | 'shockwave' | 'charge' */
  attackMode: string
  shootInterval: number // ms
  /** 移动模式: 'zigzag' | 'sine' | 'charge' | 'hover' | 'strafe' */
  moveMode: string
  warningText: string   // 进场提示语
  
  // 增强技能配置
  hasShield?: boolean   // 是否有护盾技能
  hasDodge?: boolean    // 是否有躲避技能
  hasBurst?: boolean    // 是否有爆发技能
  shieldCooldown?: number // 护盾冷却时间(ms)
  shieldDuration?: number // 护盾持续时间(ms)
  dodgeChance?: number  // 躲避概率
}

/** Lv1~9 各关专属 Boss 配置（HP 大幅增强）
 *
 * HP 设计基准：玩家每秒约能打出 8~12 点伤害（基础子弹 2 伤害 × ~5发/s）
 * Lv1 Boss 约需 30~40 秒击杀，后续每关递增约 15~20 秒击杀时间
 * HP 大幅增加：Lv1=720, Lv2=1120, Lv3=1680, Lv4=2400, Lv5=3280, Lv6=4400, Lv7=5800, Lv8=7400, Lv9=9600
 */
export const LEVEL_BOSS_CONFIGS: LevelBossConfig[] = [
  // Lv1：红眼巡逻者 — 简单正面弹，但血厚
  {
    bossId: 1, name: '红眼巡逻者', color: '#FF4444', accentColor: '#FF9999',
    shape: 'boss_lv1', w: 52, h: 46, hp: 720, score: 500, speed: 0.7,
    attackMode: 'aimed', shootInterval: 1800, moveMode: 'zigzag', warningText: '👁️ 红眼巡逻者出现!'
  },
  // Lv2：菱晶战士 — 三叉弹幕
  {
    bossId: 2, name: '菱晶战士', color: '#FFA502', accentColor: '#FFD580',
    shape: 'boss_lv2', w: 56, h: 48, hp: 1120, score: 800, speed: 0.8,
    attackMode: 'spread', shootInterval: 1600, moveMode: 'sine', warningText: '💎 菱晶战士降临!'
  },
  // Lv3：六翼天蛾 — 双侧追踪弹
  {
    bossId: 3, name: '六翼天蛾', color: '#00BCD4', accentColor: '#80DEEA',
    shape: 'boss_lv3', w: 62, h: 52, hp: 1680, score: 1100, speed: 0.75,
    attackMode: 'aimed', shootInterval: 1400, moveMode: 'hover', warningText: '🦋 六翼天蛾现身!'
  },
  // Lv4：幽影重炮 — 宽扇形弹幕（首次出现护盾技能）
  {
    bossId: 4, name: '幽影重炮', color: '#9C27B0', accentColor: '#CE93D8',
    shape: 'boss_lv4', w: 68, h: 56, hp: 2400, score: 1500, speed: 0.6,
    attackMode: 'barrage', shootInterval: 1200, moveMode: 'strafe', warningText: '💜 幽影重炮压境!',
    hasShield: true, shieldCooldown: 6000, shieldDuration: 4000
  },
  // Lv5：炎核毁灭者 — 螺旋弹+火环（躲避技能）
  {
    bossId: 5, name: '炎核毁灭者', color: '#FF5722', accentColor: '#FFAB91',
    shape: 'boss_lv5', w: 72, h: 60, hp: 3280, score: 2000, speed: 0.7,
    attackMode: 'spiral', shootInterval: 850, moveMode: 'sine', warningText: '🔥 炎核毁灭者苏醒!',
    hasDodge: true, dodgeChance: 0.25
  },
  // Lv6：幻影双生 — 双体激光扫射（护盾+爆发）
  {
    bossId: 6, name: '幻影双生', color: '#E040FB', accentColor: '#F8BBD0',
    shape: 'boss_lv6', w: 76, h: 62, hp: 4400, score: 2600, speed: 0.9,
    attackMode: 'laser_sweep', shootInterval: 750, moveMode: 'zigzag', warningText: '👥 幻影双生显形!',
    hasShield: true, shieldCooldown: 5000, shieldDuration: 4000, hasBurst: true
  },
  // Lv7：星核宙斯 — 全向冲击波+持续召唤（护盾+躲避）
  {
    bossId: 7, name: '星核宙斯', color: '#FFD700', accentColor: '#FFF9C4',
    shape: 'boss_lv7', w: 80, h: 66, hp: 5800, score: 3200, speed: 0.6,
    attackMode: 'shockwave', shootInterval: 650, moveMode: 'hover', warningText: '⚡ 星核宙斯降临!',
    hasShield: true, shieldCooldown: 4000, shieldDuration: 5000, hasDodge: true, dodgeChance: 0.3
  },
  // Lv8：深渊吞噬者 — 追踪弹+横向扫射（躲避+爆发）
  {
    bossId: 8, name: '深渊吞噬者', color: '#1A1A2E', accentColor: '#7C4DFF',
    shape: 'boss_lv8', w: 84, h: 70, hp: 7400, score: 4000, speed: 0.5,
    attackMode: 'homing', shootInterval: 580, moveMode: 'charge', warningText: '🌑 深渊吞噬者来袭!',
    hasDodge: true, dodgeChance: 0.35, hasBurst: true
  },
  // Lv9：混沌之主 — 多阶段混合全模式（全技能）
  {
    bossId: 9, name: '混沌之主', color: '#FF0066', accentColor: '#FF80AB',
    shape: 'boss_lv9', w: 90, h: 76, hp: 9600, score: 5000, speed: 0.65,
    attackMode: 'barrage', shootInterval: 480, moveMode: 'sine', warningText: '💀 混沌之主降世!',
    hasShield: true, shieldCooldown: 3000, shieldDuration: 5000, hasDodge: true, dodgeChance: 0.4, hasBurst: true
  },
]

/** 通过关卡号获取 Boss 配置 */
export function getLevelBossConfig(level: number): LevelBossConfig | undefined {
  return LEVEL_BOSS_CONFIGS[level - 1]
}

// 设计分辨率
export const BASE_W = 360
export const BASE_H = 800

// 安全区
export const SAFE_L = 20
export const SAFE_R = 25
export const SAFE_T = 15
export const SAFE_B = 15

// 玩家
export const PLAYER_W = 36
export const PLAYER_H = 32
export const BULLET_SPEED = 12
export const SHOOT_CD = 120
export const STAR_COUNT = 80
export const TOUCH_OFFSET_Y = 80

// 对象数量上限
export const MAX_BULLETS = 20
export const MAX_ENEMY_BULLETS = 35
export const MAX_PARTICLES = 80
export const MAX_FLOAT_TEXTS = 8
export const MAX_SHOCKWAVES = 5
export const MAX_POWERUPS = 8
export const MAX_TURRETS = 3

// 敌人类型模板 [circle | diamond | hex | triangle(zigzag) | square(shield) | pentagon | circle(split) | boss | final_boss]
export const ENEMY_TYPES: EnemyType[] = [
  { w: 24, h: 20, hp: 1, score: 10,  color: '#FF6B6B', shape: 'circle',    speed: 1.3,  behavior: 'straight' },
  { w: 30, h: 26, hp: 1, score: 25,  color: '#FFA502', shape: 'diamond',   speed: 1.1,  behavior: 'straight' },
  { w: 36, h: 30, hp: 2, score: 60,  color: '#FF4757', shape: 'hex',      speed: 0.9,  behavior: 'straight' },
  { w: 18, h: 16, hp: 1, score: 15,  color: '#00D2FF', shape: 'triangle',  speed: 2.2,  behavior: 'zigzag'   },
  { w: 28, h: 24, hp: 2, score: 40,  color: '#2ECC71', shape: 'square',    speed: 1.0,  behavior: 'shield'   },
  { w: 40, h: 36, hp: 5, score: 120, color: '#8E44AD', shape: 'pentagon', speed: 0.6,  behavior: 'straight' },
  { w: 32, h: 28, hp: 1, score: 35,  color: '#E74C3C', shape: 'circle',   speed: 1.2,  behavior: 'split'    },
  { w: 42, h: 36, hp: 3, score: 150, color: '#9C27B0', shape: 'boss',     speed: 0.6,  behavior: 'straight' },
  { w: 80, h: 70, hp: 5000, score: 1000, color: '#FF0000', shape: 'final_boss', speed: 0, behavior: 'straight' },
]

// 关卡配置 Lv1~10（weights: [circle, diamond, hex, triangle, square, pentagon, split, boss/final]）
export const LEVEL_CONFIG: (LevelCfg | null)[] = [
  null!, // 索引0无意义
  { spawnMs: 700, weights: [0.55, 0.30, 0.15, 0.0,  0.0,  0.0,  0.0,  0.0],  hpBonus: 0, spdMul: 0.9, bossRate: 0,    label: '初入星域', desc: '熟悉操作' },
  { spawnMs: 600, weights: [0.40, 0.30, 0.20, 0.10, 0.0,  0.0,  0.0,  0.0],  hpBonus: 1, spdMul: 1.0, bossRate: 0,    label: '菱形来袭', desc: '新敌出现' },
  { spawnMs: 500, weights: [0.30, 0.25, 0.20, 0.10, 0.10, 0.0,  0.0,  0.05], hpBonus: 3, spdMul: 1.15, bossRate: 0,    label: '六角之围', desc: '精英现身' },
  { spawnMs: 450, weights: [0.20, 0.20, 0.18, 0.12, 0.12, 0.08, 0.0,  0.10], hpBonus: 6, spdMul: 1.25, bossRate: 0.08, label: '初见Boss', desc: '⚠️ Boss来袭' },
  { spawnMs: 400, weights: [0.15, 0.18, 0.17, 0.13, 0.13, 0.10, 0.0,  0.14], hpBonus: 10, spdMul: 1.35, bossRate: 0.12, label: '高速混编', desc: '加速进击' },
  { spawnMs: 350, weights: [0.10, 0.15, 0.18, 0.12, 0.12, 0.12, 0.08, 0.13], hpBonus: 15, spdMul: 1.45, bossRate: 0.15, label: '火力升级', desc: '伤害增强' },
  { spawnMs: 300, weights: [0.08, 0.10, 0.17, 0.12, 0.12, 0.15, 0.10, 0.16], hpBonus: 20, spdMul: 1.55, bossRate: 0.20, label: '精英集结', desc: 'Boss群出' },
  { spawnMs: 250, weights: [0.05, 0.08, 0.15, 0.12, 0.12, 0.18, 0.12, 0.18], hpBonus: 26, spdMul: 1.7, bossRate: 0.25, label: '钢铁洪流', desc: '极限压力' },
  { spawnMs: 200, weights: [0.05, 0.05, 0.12, 0.10, 0.12, 0.20, 0.14, 0.22], hpBonus: 32, spdMul: 1.85, bossRate: 0.28, label: 'Boss逼近', desc: '⚠️ 最终准备' },
  { spawnMs: 600, weights: [0.20, 0.15, 0.15, 0.10, 0.10, 0.12, 0.08, 0.10], hpBonus: 12, spdMul: 1.2, bossRate: 0,    label: '最终决战', desc: '🔥 击败Boss' },
]

/** 获取关卡配置 */
export function getLevelConfig(level: number): LevelCfg {
  return LEVEL_CONFIG[Math.min(10, Math.max(1, level))]!
}

// === 变身系统配置 ===

/** 变身配置 */
export interface TransformConfig {
  type: TransformType
  name: string          // 变身名称
  color: string         // 主颜色
  accentColor: string   // 点缀色
  duration: number      // 持续时间(ms)
  cooldown: number      // 冷却时间(ms)
  bulletSpeed: number   // 子弹速度倍率
  bulletCount: number   // 子弹数量
  damage: number        // 伤害倍率
  fireRate: number      // 射速倍率
  description: string   // 描述
  icon: string          // 图标
}

export type TransformType = 'super' | 'fire' | 'ice' | 'lightning' | 'dark'

/** 各变身形态配置 */
export const TRANSFORM_CONFIGS: Record<TransformType, TransformConfig> = {
  super: {
    type: 'super',
    name: '超级形态',
    color: '#FFD700',
    accentColor: '#FFA000',
    duration: 15000,
    cooldown: 30000,
    bulletSpeed: 1.5,
    bulletCount: 3,
    damage: 2,
    fireRate: 1.5,
    description: '全方位强化，威力倍增',
    icon: '⭐'
  },
  fire: {
    type: 'fire',
    name: '烈焰形态',
    color: '#FF5722',
    accentColor: '#FF8A00',
    duration: 12000,
    cooldown: 25000,
    bulletSpeed: 1.2,
    bulletCount: 5,
    damage: 1.8,
    fireRate: 1.8,
    description: '火焰喷射，范围攻击',
    icon: '🔥'
  },
  ice: {
    type: 'ice',
    name: '冰霜形态',
    color: '#00BCD4',
    accentColor: '#84FFFF',
    duration: 10000,
    cooldown: 25000,
    bulletSpeed: 2,
    bulletCount: 2,
    damage: 1.5,
    fireRate: 1.2,
    description: '冰冻减速，高速穿透',
    icon: '❄️'
  },
  lightning: {
    type: 'lightning',
    name: '雷电形态',
    color: '#FFEB3B',
    accentColor: '#FFEA00',
    duration: 8000,
    cooldown: 20000,
    bulletSpeed: 3,
    bulletCount: 1,
    damage: 3,
    fireRate: 0.8,
    description: '闪电一击，超高伤害',
    icon: '⚡'
  },
  dark: {
    type: 'dark',
    name: '暗影形态',
    color: '#9C27B0',
    accentColor: '#E040FB',
    duration: 10000,
    cooldown: 30000,
    bulletSpeed: 1.3,
    bulletCount: 7,
    damage: 1.3,
    fireRate: 2,
    description: '暗影爆发，弹幕攻击',
    icon: '🌑'
  }
}

/** 获取随机变身类型 */
export function getRandomTransformType(): TransformType {
  const types: TransformType[] = ['super', 'fire', 'ice', 'lightning', 'dark']
  const weights = [0.25, 0.2, 0.2, 0.15, 0.2]
  let r = Math.random()
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return types[i]
  }
  return 'super'
}