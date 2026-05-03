// ============================================
// dragonShooter 常量配置
// ============================================

import type { RoutePoint, CustomRoute, PowerUpCard, PowerUpCardType, PowerUpCategory, LevelConfig } from './types'

// 国风配色
export const COLORS = {
  primary: '#5B8FB9',
  secondary: '#FFF8DC',
  accent: '#C41E3A',
  jade: '#87CEEB',
  gold: '#DAA520',
  cloudWhite: '#F5F5F5',
  dragonCyan: '#00CED1',
  dragonGold: '#FFD700',
  dragonRed: '#FF6347',
  dragonPurple: '#9370DB',
  text: '#2F2F2F'
}

// 画布尺寸
export const BASE_W = 360
export const BASE_H = 640
export const CANVAS_W = 640
export const CANVAS_H = 800
export const CANVAS_OFFSET_X = (CANVAS_W - BASE_W) / 2
export const CANVAS_OFFSET_Y = 100

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

// 龙类型配置（HP 基础值，LEVEL_CONFIGS 的 hpMult 会进一步缩放）
// 无分裂，纯击打长龙
export const DRAGON_CONFIGS = {
  small:  { segments: 50,  hp: 80,  size: 12, color: COLORS.dragonCyan,   score: 10  },
  medium: { segments: 100, hp: 80,  size: 14, color: COLORS.dragonCyan,   score: 25  },
  large:  { segments: 160, hp: 120, size: 16, color: COLORS.dragonPurple, score: 50  },
  elite:  { segments: 240, hp: 180, size: 18, color: COLORS.dragonRed,    score: 100 },
  boss:   { segments: 350, hp: 300, size: 22, color: COLORS.dragonGold,   score: 500 },
}

// 性能限制
export const MAX_PARTICLES = 200
export const MAX_POWERUPS = 10
export const MAX_COIN_DROPS = 20
export const MAX_FLOAT_TEXTS = 30
export const MAX_BULLETS = 50

// 道具节段出现概率（约 8%，接近经典祖玛，每 12 节左右一个道具节）
export const POWERUP_SEGMENT_CHANCE = 0.08

// ============================================
// 20 个道具卡（分类清晰，层层递进）
// ============================================
export const BUFF_OPTIONS: PowerUpCard[] = [
  // ── 一，普攻强化类（6）────────────────────────────────
  { type: 'rapidFire',   category: 'attack',  name: '⚡ 迅击弹',      desc: '攻击频率大幅提升',         color: '#FF6B6B', icon: '⚡' },
  { type: 'multiShot',   category: 'attack',  name: '🔫 多重弹',      desc: '额外增加弹道数量',         color: '#2ED573', icon: '🔫' },
  { type: 'armorPierce', category: 'attack',  name: '🔪 破甲弹',      desc: '无视部分龙防御',           color: '#FFD32A', icon: '🔪' },
  { type: 'heavyHit',    category: 'attack',  name: '💪 重击弹',      desc: '单发伤害大幅提高',         color: '#FF9F43', icon: '💪' },
  { type: 'rapidBurst',  category: 'attack',  name: '🔥 连射增幅',    desc: '短时间极速连射',           color: '#EE5A24', icon: '🔥' },
  { type: 'autoAim',     category: 'attack',  name: '🎯 精准锁定',    desc: '子弹自动吸附龙身',         color: '#8E44AD', icon: '🎯' },
  // ── 二，范围爆发类（6）────────────────────────────────
  { type: 'blast',       category: 'burst',   name: '💥 爆裂冲击',    desc: '命中产生小范围爆炸',       color: '#FF4757', icon: '💥' },
  { type: 'slash',       category: 'burst',   name: '⚔️ 横向横扫',    desc: '横向范围攻击',             color: '#7F8C8D', icon: '⚔️' },
  { type: 'ringWave',    category: 'burst',   name: '🌊 环形震荡',    desc: '定时释放环形冲击波',       color: '#3498DB', icon: '🌊' },
  { type: 'windPressure',category: 'burst',   name: '🌪️ 全屏风压',    desc: '大范围压制，减缓移动',     color: '#9B59B6', icon: '🌪️' },
  { type: 'chainBlast',  category: 'burst',   name: '⛓️ 分段爆破',    desc: '命中后触发连锁爆破',       color: '#E67E22', icon: '⛓️' },
  { type: 'splash',      category: 'burst',   name: '💦 范围溅射',    desc: '伤害小幅溅射周围',         color: '#1ABC9C', icon: '💦' },
  // ── 三，持续压制类（5）────────────────────────────────
  { type: 'burn',        category: 'sustain', name: '🔥 持续灼烧',    desc: '命中附加持续灼烧',         color: '#E74C3C', icon: '🔥' },
  { type: 'slowField',   category: 'sustain', name: '❄️ 迟缓领域',    desc: '降低整条龙移动速度',       color: '#00CEC9', icon: '❄️' },
  { type: 'toxin',       category: 'sustain', name: '☠️ 毒素侵蚀',    desc: '持续叠加毒素掉血',         color: '#6C5CE7', icon: '☠️' },
  { type: 'energyField', category: 'sustain', name: '⚡ 能量涌动',    desc: '角色周围持续生成伤害圈',   color: '#FDCB6E', icon: '⚡' },
  { type: 'defDown',     category: 'sustain', name: '🛡️ 减防光环',    desc: '降低全场巨龙防御',         color: '#636E72', icon: '🛡️' },
  // ── 四，特殊斩杀类（3）────────────────────────────────
  { type: 'slashBlade',  category: 'execute', name: '🗡️ 断龙利刃',    desc: '概率直接斩断一节龙身',     color: '#D63031', icon: '🗡️' },
  { type: 'executeWave', category: 'execute', name: '⚡ 斩杀剑气',    desc: '纵向长剑气贯穿路线',       color: '#0984E3', icon: '⚡' },
  { type: 'crit',        category: 'execute', name: '💢 极限暴击',    desc: '大幅提升暴击概率',         color: '#E84393', icon: '💢' },
]

// 从 BUFF_OPTIONS 构建 POWERUP_ICONS（供渲染器/龙使用）
export const POWERUP_ICONS: Record<PowerUpCardType, { icon: string; color: string }> = {} as any
for (const card of BUFF_OPTIONS) {
  POWERUP_ICONS[card.type] = { icon: card.icon, color: card.color }
}

// 20个道具的节段颜色配置
export const POWERUP_SEGMENT_COLORS: Record<PowerUpCardType, { color: string }> = {
  rapidFire:   { color: '#FF6B6B' },
  multiShot:   { color: '#2ED573' },
  armorPierce: { color: '#FFD32A' },
  heavyHit:    { color: '#FF9F43' },
  rapidBurst:  { color: '#EE5A24' },
  autoAim:     { color: '#8E44AD' },
  blast:       { color: '#FF4757' },
  slash:       { color: '#7F8C8D' },
  ringWave:    { color: '#3498DB' },
  windPressure:{ color: '#9B59B6' },
  chainBlast:  { color: '#E67E22' },
  splash:      { color: '#1ABC9C' },
  burn:        { color: '#E74C3C' },
  slowField:   { color: '#00CEC9' },
  toxin:       { color: '#6C5CE7' },
  energyField: { color: '#FDCB6E' },
  defDown:     { color: '#636E72' },
  slashBlade:  { color: '#D63031' },
  executeWave: { color: '#0984E3' },
  crit:        { color: '#E84393' },
}

// ============================================
// 10 级关卡配置（递增难度）
// ============================================
export const LEVEL_CONFIGS: LevelConfig[] = [
  // ── 1-3 关：低血量，优先普攻+范围基础 ──
  {
    level: 1, hpMult: 1.0, speedMult: 0.9,  // 🎯 提升初始血量（原0.8）
    killsPerDrop: 6,
    allowedCategories: ['attack'],
    eliteChance: 0, bossChance: 0,
    baseSegments: 50,
  },
  {
    level: 2, hpMult: 1.3, speedMult: 0.95,  // 🎯 提升血量（原1.0）
    killsPerDrop: 6,
    allowedCategories: ['attack'],
    eliteChance: 0, bossChance: 0,
    baseSegments: 60,
  },
  {
    level: 3, hpMult: 1.7, speedMult: 1.0,  // 🎯 提升血量（原1.3）
    killsPerDrop: 5,
    allowedCategories: ['attack', 'burst'],
    eliteChance: 0.1, bossChance: 0,
    baseSegments: 75,
  },
  // ── 4-7 关：血量加厚，新增持续压制 ──
  {
    level: 4, hpMult: 2.2, speedMult: 1.05,  // 🎯 大幅提升血量（原1.6）
    killsPerDrop: 5,
    allowedCategories: ['attack', 'burst', 'sustain'],
    eliteChance: 0.15, bossChance: 0,
    baseSegments: 90,
  },
  {
    level: 5, hpMult: 2.8, speedMult: 1.1,  // 🎯 大幅提升血量（原2.0）
    killsPerDrop: 5,
    allowedCategories: ['attack', 'burst', 'sustain'],
    eliteChance: 0.2, bossChance: 0,
    baseSegments: 110,
  },
  {
    level: 6, hpMult: 3.5, speedMult: 1.15,  // 🎯 大幅提升血量（原2.5）
    killsPerDrop: 4,
    allowedCategories: ['attack', 'burst', 'sustain'],
    eliteChance: 0.25, bossChance: 0,
    baseSegments: 130,
  },
  {
    level: 7, hpMult: 4.2, speedMult: 1.2,  // 🎯 大幅提升血量（原3.0）
    killsPerDrop: 4,
    allowedCategories: ['attack', 'burst', 'sustain', 'execute'],
    eliteChance: 0.3, bossChance: 0,
    baseSegments: 155,
  },
  // ── 8-10 关：超高血量+长龙，高频斩杀/爆破 ──
  {
    level: 8, hpMult: 5.2, speedMult: 1.25,  // 🎯 大幅提升血量（原3.8）
    killsPerDrop: 4,
    allowedCategories: ['attack', 'burst', 'sustain', 'execute'],
    eliteChance: 0.35, bossChance: 0.1,
    baseSegments: 185,
  },
  {
    level: 9, hpMult: 6.5, speedMult: 1.3,  // 🎯 大幅提升血量（原4.8）
    killsPerDrop: 3,
    allowedCategories: ['attack', 'burst', 'sustain', 'execute'],
    eliteChance: 0.4, bossChance: 0.15,
    baseSegments: 220,
  },
  {
    level: 10, hpMult: 8.0, speedMult: 1.35,  // 🎯 大幅提升血量（原6.0）
    killsPerDrop: 3,
    allowedCategories: ['burst', 'execute'],
    eliteChance: 0.5, bossChance: 0.2,
    baseSegments: 270,
  },
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
  const startY = 60  // 从画布顶部附近开始，龙立即可见
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints
    points.push({
      x: CENTER_X + Math.sin(progress * Math.PI * 8) * amplitude,
      y: startY + progress * (BASE_H + 100)
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