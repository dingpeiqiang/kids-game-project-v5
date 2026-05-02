// ============================================
// dragonShooter 常量配置
// ============================================

import type { RoutePoint, CustomRoute } from './types'

// 国风配色
export const COLORS = {
  primary: '#5B8FB9',      // 青蓝
  secondary: '#FFF8DC',    // 淡金/米白
  accent: '#C41E3A',       // 朱砂红
  jade: '#87CEEB',         // 玉色
  gold: '#DAA520',         // 暗金
  cloudWhite: '#F5F5F5',
  dragonCyan: '#00CED1',   // 青色龙
  dragonGold: '#FFD700',   // 金龙
  dragonRed: '#FF6347',    // 朱红龙
  dragonPurple: '#9370DB', // 紫色龙
  text: '#2F2F2F'
}

// 画布尺寸
export const BASE_W = 360
export const BASE_H = 640

// 扩大画布尺寸（用于路线编辑和龙移动空间）
export const CANVAS_W = 640
export const CANVAS_H = 800
export const CANVAS_OFFSET_X = (CANVAS_W - BASE_W) / 2
export const CANVAS_OFFSET_Y = 100

// 安全边界
export const SAFE_LEFT = 100
export const SAFE_RIGHT = BASE_W - 100
export const CENTER_X = BASE_W / 2

// 场景配置
export const SCENES = [
  { name: '青云', bg: ['#87CEEB', '#E0F7FA', '#B2EBF2'] },
  { name: '灵山', bg: ['#81C784', '#A5D6A7', '#C8E6C9'] },
  { name: '龙宫', bg: ['#4FC3F7', '#29B6F6', '#03A9F4'] },
  { name: '九霄', bg: ['#9575CD', '#7E57C2', '#673AB7'] }
]

// 龙类型配置
export const DRAGON_CONFIGS = {
  small: { segments: 100, hp: 75, size: 12, color: COLORS.dragonCyan, score: 10, canSplit: false },
  medium: { segments: 140, hp: 75, size: 14, color: COLORS.dragonCyan, score: 25, canSplit: false },
  large: { segments: 190, hp: 120, size: 16, color: COLORS.dragonPurple, score: 50, canSplit: false },
  elite: { segments: 250, hp: 120, size: 18, color: COLORS.dragonRed, score: 100, canSplit: false },
  boss: { segments: 350, hp: 300, size: 22, color: COLORS.dragonGold, score: 500, canSplit: false },
  treasure: { segments: 150, hp: 75, size: 14, color: COLORS.gold, score: 150, canSplit: false, isTreasure: true },
  coin: { segments: 110, hp: 75, size: 12, color: '#FFD700', score: 80, canSplit: false, isCoin: true }
}

// 性能限制常量
export const MAX_PARTICLES = 200
export const MAX_POWERUPS = 10
export const MAX_COIN_DROPS = 20
export const MAX_FLOAT_TEXTS = 30
export const MAX_BULLETS = 50

// 道具配置
export const POWERUP_ICONS = {
  damage: { icon: '⚔️', color: '#FF6B6B' },
  multiShot: { icon: '🔫', color: '#98FB98' },
  pierce: { icon: '💥', color: '#FF8E53' },
  heal: { icon: '❤️', color: '#FF69B4' }
}

// Buff选项
export const BUFF_OPTIONS = [
  { id: 'damage', name: '⚔️ 攻击+1', desc: '子弹伤害提升', color: '#FF6B6B' },
  { id: 'multiShot', name: '🔫 多重射击', desc: '子弹数量+1', color: '#98FB98' },
  { id: 'pierce', name: '💥 穿透+', desc: '子弹穿透敌人', color: '#FF8E53' },
  { id: 'heal', name: '❤️ 回复', desc: '恢复1点生命', color: '#FF69B4' }
]

// localStorage 键名
export const STORAGE_KEY = 'dragonShooter_customRoutes'

// ============================================
// 预设路线生成函数
// ============================================

function generateWaveRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitude = 70
  const totalPoints = 1600
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    points.push({
      x: CENTER_X + Math.sin(progress * Math.PI * 8) * amplitude,
      y: -200 + progress * (BASE_H + 400)
    })
  }
  return points
}

function generateSweepRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitude = 90
  const totalPoints = 1600
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    points.push({
      x: CENTER_X + Math.sin(progress * Math.PI * 4) * amplitude,
      y: -200 + progress * (BASE_H + 400)
    })
  }
  return points
}

function generateSpiralRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitudeX = 60
  const amplitudeY = 40
  const totalPoints = 1600
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    points.push({
      x: CENTER_X + Math.cos(progress * Math.PI * 10) * amplitudeX,
      y: -200 + progress * (BASE_H + 400) + Math.sin(progress * Math.PI * 10) * amplitudeY
    })
  }
  return points
}

function generateZigzagRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const zigzagCount = 20
  const pointsPerZigzag = 80
  const totalPoints = zigzagCount * pointsPerZigzag

  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    const zigzagIndex = Math.floor(progress * zigzagCount)
    const segmentProgress = (progress * zigzagCount) - zigzagIndex
    const isLeft = zigzagIndex % 2 === 0
    const x = isLeft
      ? SAFE_LEFT + 30 + (SAFE_RIGHT - SAFE_LEFT - 60) * segmentProgress
      : SAFE_RIGHT - 30 - (SAFE_RIGHT - SAFE_LEFT - 60) * segmentProgress
    const y = -200 + progress * (BASE_H + 400)
    points.push({ x, y })
  }
  return points
}

// 预设路线库
export const PRESET_ROUTES = [
  { id: 'wave', name: '波浪路线', points: generateWaveRoute() },
  { id: 'sweep', name: '横冲路线', points: generateSweepRoute() },
  { id: 'spiral', name: '螺旋路线', points: generateSpiralRoute() },
  { id: 'zigzag', name: '之字路线', points: generateZigzagRoute() }
]

// 关卡路线生成器
export function generateLevelRoute(level: number, type: string): RoutePoint[] {
  const points: RoutePoint[] = []
  const totalPoints = 1600

  switch (type) {
    case 'wave':
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        points.push({
          x: CENTER_X + Math.sin(progress * Math.PI * 4) * 40,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break

    case 'zigzag':
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const zigzag = Math.sin(progress * Math.PI * 12) > 0 ? 1 : -1
        points.push({
          x: CENTER_X + zigzag * 80,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break

    case 'spiral':
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const radius = 60 + progress * 30
        points.push({
          x: CENTER_X + Math.cos(progress * Math.PI * 16) * radius,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break

    case 'boss':
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        const wave1 = Math.sin(progress * Math.PI * 6) * 50
        const wave2 = Math.cos(progress * Math.PI * 10) * 30
        points.push({
          x: CENTER_X + wave1 + wave2,
          y: -200 + progress * (BASE_H + 400)
        })
      }
      break

    default:
      for (let i = 0; i <= totalPoints; i++) {
        const progress = i / totalPoints
        points.push({
          x: CENTER_X + Math.sin(progress * Math.PI * 6) * 60,
          y: -200 + progress * (BASE_H + 400)
        })
      }
  }

  return points
}

// 速度曲线（难度自动上升）
export function getSpeedMultiplier(level: number): number {
  if (level % 5 === 0) return 1.1
  if (level >= 10) return 1.0
  if (level >= 7) return 0.95
  if (level >= 4) return 0.9
  return 0.85
}

// 关卡专属路线配置
export const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {
  1: {
    id: 'level_1_easy',
    name: '第1关 - 简单波浪',
    points: generateLevelRoute(1, 'wave')
  },
  3: {
    id: 'level_3_zigzag',
    name: '第3关 - Z字形',
    points: generateLevelRoute(3, 'zigzag')
  },
  5: {
    id: 'level_5_spiral',
    name: '第5关 - 螺旋挑战',
    points: generateLevelRoute(5, 'spiral')
  },
  10: {
    id: 'level_10_boss',
    name: '第10关 - BOSS战场',
    points: generateLevelRoute(10, 'boss')
  }
}