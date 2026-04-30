import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'

const BASE_W = 360
const BASE_H = 640

// 扩大画布尺寸（用于路线编辑和龙移动空间）
// 龙可以从画面外进入游戏区域
const CANVAS_W = 640  // 比游戏画面宽
const CANVAS_H = 800  // 比游戏画面高
const CANVAS_OFFSET_X = (CANVAS_W - BASE_W) / 2  // 水平居中
const CANVAS_OFFSET_Y = 100  // 顶部预留空间（龙从上方进入）

// 国风配色：青蓝+淡金+朱砂红
const COLORS = {
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

// ============================================
// 用户绘制路线系统
// 玩家可以设计龙的移动路线
// ============================================

interface RoutePoint {
  x: number
  y: number
}

interface CustomRoute {
  id: string
  name: string
  points: RoutePoint[]
}

// 安全边界常量（需要在生成预设路线前定义）
const SAFE_LEFT = 100
const SAFE_RIGHT = BASE_W - 100
const CENTER_X = BASE_W / 2

// 预设路线生成函数
function generateWaveRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitude = 70
  for (let i = 0; i <= 50; i++) {
    const progress = i / 50
    points.push({
      x: CENTER_X + Math.sin(progress * Math.PI * 4) * amplitude,
      y: -50 + progress * (BASE_H + 50)
    })
  }
  return points
}

function generateSweepRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitude = 90
  for (let i = 0; i <= 50; i++) {
    const progress = i / 50
    points.push({
      x: CENTER_X + Math.sin(progress * Math.PI * 2) * amplitude,
      y: -50 + progress * (BASE_H + 50)
    })
  }
  return points
}

function generateSpiralRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const amplitudeX = 60
  const amplitudeY = 40
  for (let i = 0; i <= 60; i++) {
    const progress = i / 60
    points.push({
      x: CENTER_X + Math.cos(progress * Math.PI * 5) * amplitudeX,
      y: -50 + progress * (BASE_H + 50) + Math.sin(progress * Math.PI * 5) * amplitudeY
    })
  }
  return points
}

function generateZigzagRoute(): RoutePoint[] {
  const points: RoutePoint[] = []
  const segments = 8
  const segmentHeight = (BASE_H + 100) / segments
  for (let i = 0; i <= segments; i++) {
    points.push({
      x: i % 2 === 0 ? SAFE_LEFT + 30 : SAFE_RIGHT - 30,
      y: -50 + i * segmentHeight
    })
  }
  return points
}

// 预设路线库（在所有生成函数之后定义）
const PRESET_ROUTES: CustomRoute[] = [
  { id: 'wave', name: '波浪路线', points: generateWaveRoute() },
  { id: 'sweep', name: '横冲路线', points: generateSweepRoute() },
  { id: 'spiral', name: '螺旋路线', points: generateSpiralRoute() },
  { id: 'zigzag', name: '之字路线', points: generateZigzagRoute() }
]

// 存储玩家绘制的自定义路线
let customRoutes: CustomRoute[] = []
let currentDrawingRoute: CustomRoute | null = null
let isDrawingMode = false

// 路线编辑器管理器
class RouteEditor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private currentRoute: RoutePoint[] = []
  private isDrawing = false

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas
    this.ctx = ctx
  }

  startDrawing() {
    this.currentRoute = []
    this.isDrawing = true
    isDrawingMode = true
  }

  addPoint(x: number, y: number) {
    if (!this.isDrawing) return
    // 路线可以在整个扩大画布区域内绘制
    // 不限制坐标，让龙可以从画面外进入
    this.currentRoute.push({ x, y })
  }

  endDrawing(): CustomRoute | null {
    this.isDrawing = false
    isDrawingMode = false

    if (this.currentRoute.length < 3) {
      this.currentRoute = []
      return null
    }

    // 转换为游戏区域坐标（减去画布偏移）
    const points: RoutePoint[] = this.currentRoute.map(p => ({
      x: p.x - CANVAS_OFFSET_X,
      y: p.y - CANVAS_OFFSET_Y
    }))

    const route: CustomRoute = {
      id: `custom_${Date.now()}`,
      name: `自定义路线 ${customRoutes.length + 1}`,
      points
    }

    this.currentRoute = []
    return route
  }

  clear() {
    this.currentRoute = []
    this.isDrawing = false
    isDrawingMode = false
  }

  // 停止当前绘制，但不删除路线
  stopDrawing() {
    this.isDrawing = false
    isDrawingMode = false
  }

  getCurrentPoints(): RoutePoint[] {
    return this.currentRoute
  }

  // 绘制当前正在绘制的路线（绘制时直接跟随鼠标，不应用偏移）
  drawCurrentRoute() {
    if (this.currentRoute.length < 2) return

    this.ctx.save()
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([8, 4])
    this.ctx.shadowColor = '#FFD700'
    this.ctx.shadowBlur = 10

    this.ctx.beginPath()
    this.ctx.moveTo(this.currentRoute[0].x, this.currentRoute[0].y)
    for (let i = 1; i < this.currentRoute.length; i++) {
      this.ctx.lineTo(this.currentRoute[i].x, this.currentRoute[i].y)
    }
    this.ctx.stroke()

    // 绘制起点和终点标记
    const start = this.currentRoute[0]
    const end = this.currentRoute[this.currentRoute.length - 1]

    this.ctx.setLineDash([])
    this.ctx.fillStyle = '#90EE90'
    this.ctx.beginPath()
    this.ctx.arc(start.x, start.y, 8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.beginPath()
    this.ctx.arc(end.x, end.y, 8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
  }
}

// 路线跟随器（让龙沿着路线移动）
class RouteFollower {
  private route: CustomRoute
  private speed: number  // 每秒走的点数
  private currentIndex: number = 0
  private t: number = 0  // 两个点之间的插值 0-1

  constructor(route: CustomRoute, speed: number = 8) {
    this.route = route
    this.speed = speed
  }

  // 更新位置
  update(dt: number): { x: number; y: number } | null {
    if (this.route.points.length < 2) return null

    const pointsPerSecond = this.speed
    this.t += pointsPerSecond * dt

    while (this.t >= 1 && this.currentIndex < this.route.points.length - 1) {
      this.t -= 1
      this.currentIndex++
    }

    if (this.currentIndex >= this.route.points.length - 1) {
      return this.route.points[this.route.points.length - 1]
    }

    const p1 = this.route.points[this.currentIndex]
    const p2 = this.route.points[this.currentIndex + 1]

    return {
      x: p1.x + (p2.x - p1.x) * this.t,
      y: p1.y + (p2.y - p1.y) * this.t
    }
  }

  // 获取任意进度的位置（进度单位：点数）
  // 支持负数（在路线起点之前，通过推算方向延伸）和超过路线长度（在路线终点之后）
  getPositionAt(progress: number): { x: number; y: number } | null {
    if (this.route.points.length < 2) return null

    const lastIndex = this.route.points.length - 1

    // 终点之外：返回路线终点
    if (progress >= lastIndex) {
      return { ...this.route.points[lastIndex] }
    }

    // 在路线起点之前：用起点和第二点的方向推算
    if (progress < 0) {
      const p0 = this.route.points[0]
      const p1 = this.route.points[1]
      // 方向向量
      const dx = p1.x - p0.x
      const dy = p1.y - p0.y
      // 推算到负进度位置
      return {
        x: p0.x + dx * progress,
        y: p0.y + dy * progress
      }
    }

    const index = Math.floor(progress)
    const t = progress - index

    const p1 = this.route.points[index]
    const p2 = this.route.points[index + 1]

    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    }
  }

  // 获取路线总长度（点数）
  getTotalLength(): number {
    return this.route.points.length
  }

  // 获取路线总像素长度
  getPixelLength(): number {
    let len = 0
    for (let i = 1; i < this.route.points.length; i++) {
      const dx = this.route.points[i].x - this.route.points[i - 1].x
      const dy = this.route.points[i].y - this.route.points[i - 1].y
      len += Math.sqrt(dx * dx + dy * dy)
    }
    return len
  }

  // 获取距离头指定像素距离的身体节位置
  // distance: 距离头部的像素距离（身体节在头部后方，所以是负值）
  getPositionBehindHead(headProgress: number, distance: number): { x: number; y: number } | null {
    // 头部在路线上的像素位置
    const headPixelPos = headProgress * this.getPixelLength()

    // 目标像素位置（头部后方）
    const targetPixelPos = headPixelPos + distance  // distance是负值，所以是向后

    if (targetPixelPos <= 0) {
      // 在路线起点之前，返回起点
      return { ...this.route.points[0] }
    }

    if (targetPixelPos >= this.getPixelLength()) {
      // 超过路线终点，返回终点
      const last = this.route.points[this.route.points.length - 1]
      return { ...last }
    }

    // 找到目标像素位置对应的路线点
    let accumulatedDist = 0
    for (let i = 1; i < this.route.points.length; i++) {
      const dx = this.route.points[i].x - this.route.points[i - 1].x
      const dy = this.route.points[i].y - this.route.points[i - 1].y
      const segmentLen = Math.sqrt(dx * dx + dy * dy)

      if (accumulatedDist + segmentLen >= targetPixelPos) {
        // 找到所在段
        const t = (targetPixelPos - accumulatedDist) / segmentLen
        return {
          x: this.route.points[i - 1].x + dx * t,
          y: this.route.points[i - 1].y + dy * t
        }
      }
      accumulatedDist += segmentLen
    }

    return null
  }

  // 获取进度 0-1
  getProgress(): number {
    if (this.route.points.length < 2) return 1
    return Math.min(1, (this.currentIndex + this.t) / (this.route.points.length - 1))
  }

  // 设置进度（用于回缩时同步更新）
  setProgress(progress: number) {
    const totalPoints = this.route.points.length - 1
    const target = progress * totalPoints
    this.currentIndex = Math.floor(target)
    this.t = target - this.currentIndex
    // 确保不超出范围
    if (this.currentIndex >= totalPoints) {
      this.currentIndex = totalPoints - 1
      this.t = 1
    }
  }

  // 是否到达终点
  isFinished(): boolean {
    return this.currentIndex >= this.route.points.length - 1
  }

  reset() {
    this.currentIndex = 0
    this.t = 0
  }
}

// 获取或创建路线（优先使用玩家绘制的，否则用预设）
function getRouteForDragon(dragonId: number, level: number): CustomRoute {
  // 如果有自定义路线，随机选择一个
  if (customRoutes.length > 0) {
    return customRoutes[dragonId % customRoutes.length]
  }
  // 否则使用预设路线
  return PRESET_ROUTES[dragonId % PRESET_ROUTES.length]
}

// 速度曲线（难度自动上升）
// 乘数越大，速度越快
function getSpeedMultiplier(level: number): number {
  if (level % 5 === 0) return 1.1     // BOSS关：1.1倍加速，更有压迫感
  if (level >= 10) return 1.0         // 10+关：基础速度
  if (level >= 7) return 0.95         // 7-9关
  if (level >= 4) return 0.9          // 4-6关
  return 0.85                          // 1-3关：新手保护
}

// 龙类型配置（竖屏9:16适配）
const DRAGON_CONFIGS = {
  small: { segments: 20, hp: 1, size: 12, color: COLORS.dragonCyan, score: 10, canSplit: true },
  medium: { segments: 28, hp: 2, size: 14, color: COLORS.dragonCyan, score: 25, canSplit: true },
  large: { segments: 38, hp: 3, size: 16, color: COLORS.dragonPurple, score: 50, canSplit: true },
  elite: { segments: 50, hp: 4, size: 18, color: COLORS.dragonRed, score: 100, canSplit: true },
  boss: { segments: 70, hp: 15, size: 22, color: COLORS.dragonGold, score: 500, canSplit: false },
  treasure: { segments: 30, hp: 2, size: 14, color: COLORS.gold, score: 150, canSplit: false, isTreasure: true },
  coin: { segments: 22, hp: 1, size: 12, color: '#FFD700', score: 80, canSplit: false, isCoin: true }
}

// 性能限制常量
const MAX_PARTICLES = 200
const MAX_POWERUPS = 10
const MAX_COIN_DROPS = 20
const MAX_FLOAT_TEXTS = 30
const MAX_BULLETS = 50

// 道具类型（精简版）
const POWERUP_ICONS = {
  damage: { icon: '⚔️', color: '#FF6B6B' },
  multiShot: { icon: '🔫', color: '#98FB98' },
  pierce: { icon: '💥', color: '#FF8E53' },
  heal: { icon: '❤️', color: '#FF69B4' }
}

// Buff选项（精简版）
const BUFF_OPTIONS = [
  { id: 'damage', name: '⚔️ 攻击+1', desc: '子弹伤害提升', color: '#FF6B6B' },
  { id: 'multiShot', name: '🔫 多重射击', desc: '子弹数量+1', color: '#98FB98' },
  { id: 'pierce', name: '💥 穿透+', desc: '子弹穿透敌人', color: '#FF8E53' },
  { id: 'heal', name: '❤️ 回复', desc: '恢复1点生命', color: '#FF69B4' }
]

// 场景配置
const SCENES = [
  { name: '青云', bg: ['#87CEEB', '#E0F7FA', '#B2EBF2'] },
  { name: '灵山', bg: ['#81C784', '#A5D6A7', '#C8E6C9'] },
  { name: '龙宫', bg: ['#4FC3F7', '#29B6F6', '#03A9F4'] },
  { name: '九霄', bg: ['#9575CD', '#7E57C2', '#673AB7'] }
]

interface DragonSegment {
  x: number
  y: number
  hp: number
  maxHp: number
  size: number
  color: string
  wobblePhase: number
  wobbleAmp: number
  wobbleFreq: number
  isHead: boolean
  hasHorn: boolean
  hasPattern: boolean
  attachedPowerUp?: keyof typeof POWERUP_ICONS  // 附加的道具
}

interface Dragon {
  id: number
  segments: DragonSegment[]
  alive: boolean
  type: keyof typeof DRAGON_CONFIGS
  speed: number
  slowed: boolean
  slowTimer: number
  routeFollower: RouteFollower  // 路线跟随器
  progress: number        // 0-1，表示当前在路线上的位置
  spawnX: number          // 出生时的X位置
  retracting: boolean     // 是否在回缩状态
  retractTimer: number    // 回缩计时器
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  pierce: number
  size: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface PowerUp {
  x: number
  y: number
  type: keyof typeof POWERUP_ICONS
  life: number
  bobPhase: number
}

interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  vy: number
  size: number
}

interface CoinDrop {
  x: number
  y: number
  vy: number
  life: number
}

export function initDragonShooter(engine: GameEngine, onEnd: () => void) {
  const container = document.getElementById('gameCanvas')!
  container.innerHTML = ''

  // 检测是否为移动设备
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (window.visualViewport ? window.visualViewport.width < 768 : window.innerWidth < 768)

  // 创建 canvas（扩大画布用于路线编辑和龙移动空间）
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  if (isMobile) {
    // 移动端：创建全屏覆盖层
    const wrapper = document.createElement('div')
    wrapper.id = 'dragon-shooter-wrapper'
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      background: linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 50%, #B2EBF2 100%);
      overflow: hidden;
    `
    canvas.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      object-fit: contain;
    `
    wrapper.appendChild(canvas)
    document.body.appendChild(wrapper)
  } else {
    // PC端：直接添加到容器，画布尺寸与显示尺寸一致
    canvas.style.cssText = `
      display: block;
      width: ${CANVAS_W}px;
      height: ${CANVAS_H}px;
    `
    container.appendChild(canvas)
  }

  const ctx = canvas.getContext('2d')!

  // 游戏状态
  let state = {
    mode: 'challenge' as 'challenge' | 'endless',
    phase: 'start' as 'start' | 'playing' | 'paused' | 'buffSelect' | 'gameOver' | 'routeEdit' | 'routeSelect',
    level: 1,
    score: 0,
    coins: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    totalKills: 0,
    timeLeft: 300,
    playerX: BASE_W / 2,
    playerHP: 3,            // 3血，平衡难度
    playerMaxHP: 3,
    invincibleTimer: 0,
    bulletDamage: 0.18,       // 伤害适中
    bulletSpeed: 7,           // 子弹速度
    shootCooldown: 250,       // 射击间隔
    bulletCount: 1,
    bulletPierce: 0,
    lastShotTime: 0,
    dragons: [] as Dragon[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    floatTexts: [] as FloatText[],
    coinDrops: [] as CoinDrop[],
    clouds: [] as { x: number; y: number; speed: number; size: number; opacity: number }[],
    dusts: [] as { x: number; y: number; speed: number; size: number }[],
    lastDragonId: 0,
    levelProgress: 0,
    levelTarget: 3,
    currentScene: 0,
    isPaused: false,
    touch: { active: false, startX: 0, startY: 0, currentX: 0, startTime: 0 },
    dragCount: 0,
    maxDragons: 1,            // 初始1条龙，逐个击杀更有节奏感
    isRouteEditMode: false,   // 是否在路线编辑模式
    isRouteSelectMode: false  // 是否在路线选择模式
  }

  function initClouds() {
    state.clouds = []
    state.dusts = []
    for (let i = 0; i < 12; i++) {
      state.clouds.push({
        x: Math.random() * BASE_W,
        y: Math.random() * BASE_H,
        speed: 0.15 + Math.random() * 0.25,
        size: 25 + Math.random() * 45,
        opacity: 0.3 + Math.random() * 0.3
      })
    }
    for (let i = 0; i < 5; i++) {
      state.dusts.push({
        x: Math.random() * BASE_W,
        y: Math.random() * BASE_H,
        speed: 0.03 + Math.random() * 0.05,
        size: 2 + Math.random() * 2
      })
    }
  }

  function lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
    const B = Math.min(255, (num & 0x0000FF) + amt)
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`
  }

  function createDragon(x: number, type: keyof typeof DRAGON_CONFIGS): Dragon {
    const config = DRAGON_CONFIGS[type]
    const segments: DragonSegment[] = []

    // 随机为少量身体节附加道具（根据龙类型决定）
    const powerUpTypes = Object.keys(POWERUP_ICONS) as Array<keyof typeof POWERUP_ICONS>

    // 根据龙的类型和关卡决定道具数量
    let attachCount = 0
    if (type === 'boss') attachCount = 3      // BOSS: 3个道具
    else if (type === 'elite') attachCount = 2  // 精英: 2个
    else if (type === 'large') attachCount = 1  // 大龙: 1个
    else if (type === 'medium') attachCount = 1 // 中龙: 1个
    else if (state.level >= 3) attachCount = 1  // 3关后小龙也有1个道具
    // 1-2关小龙无道具，保持挑战

    const attachedIndices = new Set<number>()
    for (let i = 0; i < attachCount; i++) {
      // 随机选择一个身体节（排除头部和前几节）
      const maxIdx = Math.min(config.segments - 2, 20)  // 限制范围
      const idx = Math.floor(Math.random() * (maxIdx - 3)) + 3
      attachedIndices.add(idx)
    }

    for (let i = 0; i < config.segments; i++) {
      const hpMult = i === 0 ? 1.5 : 1
      const hp = Math.max(1, Math.floor(config.hp * hpMult * (1 + state.level * 0.06)))
      const size = Math.max(4, config.size * (1 - i * 0.012))

      // 确定附加的道具类型
      let attachedPowerUp: keyof typeof POWERUP_ICONS | undefined
      if (attachedIndices.has(i)) {
        attachedPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
      }

      segments.push({
        x: x,
        y: -i * config.size * 1.2 - 10,  // 龙段从出生点开始排列
        hp: hp,
        maxHp: hp,
        size: size,
        color: i === 0 ? lightenColor(config.color, 25) : config.color,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 6 + Math.random() * 6,
        wobbleFreq: 0.002,
        isHead: i === 0,
        hasHorn: type === 'elite' || type === 'boss',
        hasPattern: type === 'elite' || type === 'boss',
        attachedPowerUp
      })
    }

    // 使用用户路线系统
    const dragonId = ++state.lastDragonId
    const route = getRouteForDragon(dragonId, state.level)
    // 速度根据关卡调整
    const speedMultiplier = 1 + (state.level - 1) * 0.05
    const routeFollower = new RouteFollower(route, 8 * speedMultiplier)

    return {
      id: dragonId,
      segments,
      alive: true,
      type,
      speed: 0,
      slowed: false,
      slowTimer: 0,
      routeFollower,
      progress: 0,
      spawnX: x,
      retracting: false,
      retractTimer: 0
    }
  }

  function spawnDragons() {
    if (state.phase !== 'playing' || state.isPaused) return
    if (state.dragons.length >= state.maxDragons) return

    // 游戏开始时确保快速生成龙
    const timeElapsed = 300 - state.timeLeft  // 已过去的时间（秒）

    // 没有龙时立即生成，不再等待概率
    if (state.dragons.length === 0) {
      const x = 60 + Math.random() * (BASE_W - 120)
      state.dragons.push(createDragon(x, 'small'))
      return
    }

    // 正常情况下的生成
    const spawnChance = 0.4 + state.level * 0.03  // 40%基础概率，逐渐增加
    if (Math.random() > spawnChance) return

    let type: keyof typeof DRAGON_CONFIGS = 'small'
    const r = Math.random()

    // BOSS关卡（每5关一次）
    if (state.level % 5 === 0 && !state.dragons.some(d => d.type === 'boss')) {
      if (Math.random() < 0.4) type = 'boss'
    }

    if (type !== 'boss') {
      if (r < 0.05 && state.level >= 8) type = 'treasure'
      else if (r < 0.1 && state.level >= 6) type = 'coin'
      else if (r < 0.2 && state.level >= 15) type = 'elite'
      else if (r < 0.35 && state.level >= 10) type = 'large'
      else if (r < 0.5 && state.level >= 5) type = 'medium'
      else type = 'small'
    }

    const x = 60 + Math.random() * (BASE_W - 120)
    state.dragons.push(createDragon(x, type))
  }

  function splitDragon(dragon: Dragon, splitIdx: number) {
    const config = DRAGON_CONFIGS[dragon.type]
    if (!config.canSplit) return

    const backSegs = dragon.segments.slice(splitIdx + 1)
    if (backSegs.length < 2) return

    const splitCount = 2 + Math.floor(Math.random() * 2)
    const perSplit = Math.floor(backSegs.length / splitCount)

    for (let i = 0; i < splitCount; i++) {
      const start = i * perSplit
      const end = Math.min(start + perSplit, backSegs.length)
      if (end - start < 2) continue

      const newSegs = backSegs.slice(start, end)
      const newType = newSegs.length >= 5 ? 'medium' : 'small'
      const newConfig = DRAGON_CONFIGS[newType]

      // 分裂的龙使用新路线
      const newDragonId = ++state.lastDragonId
      const newRoute = getRouteForDragon(newDragonId, state.level)
      const speedMultiplier = 1 + (state.level - 1) * 0.05
      const newRouteFollower = new RouteFollower(newRoute, 8 * speedMultiplier)

      const newDragon: Dragon = {
        id: newDragonId,
        segments: newSegs.map((seg, idx) => ({
          ...seg,
          x: seg.x + (Math.random() - 0.5) * 35,
          y: seg.y,
          isHead: idx === 0,
          size: newConfig.size * (1 - idx * 0.04),
          hp: Math.max(1, Math.floor(newConfig.hp * (1 + state.level * 0.08))),
          maxHp: Math.max(1, Math.floor(newConfig.hp * (1 + state.level * 0.08)))
        })),
        alive: true,
        type: newType,
        speed: dragon.speed,
        slowed: false,
        slowTimer: 0,
        routeFollower: newRouteFollower,
        progress: 0,
        spawnX: newSegs[0]?.x || dragon.spawnX,
        retracting: false,
        retractTimer: 0
      }

      state.dragons.push(newDragon)
    }

    dragon.segments = dragon.segments.slice(0, splitIdx)
  }

  function updateDragons(dt: number) {
    for (let i = state.dragons.length - 1; i >= 0; i--) {
      const dragon = state.dragons[i]
      if (!dragon.alive) {
        state.dragons.splice(i, 1)
        continue
      }

      // 更新减速状态
      if (dragon.slowTimer > 0) {
        dragon.slowTimer -= dt
        dragon.slowed = true
      } else {
        dragon.slowed = false
      }

      const speedMult = dragon.slowed ? 0.5 : 1
      const head = dragon.segments[0]

      // 使用路线跟随器更新位置
      const follower = dragon.routeFollower
      const pos = follower.update(dt * speedMult)

      if (pos) {
        // 平滑跟随目标位置
        head.x += (pos.x - head.x) * 0.3
        head.y += (pos.y - head.y) * 0.3
      }

      // 更新进度
      dragon.progress = follower.getProgress()

      // 检查是否到达终点
      if (follower.isFinished()) {
        // 龙到达底部
        if (dragon.type === 'boss' || dragon.segments.length > 15) {
          endGame(false)
          return
        }
        // 非BOSS龙消失，不触发失败
        dragon.alive = false
        continue
      }

      // 更新龙身跟随（每段沿着路线移动，按路线点索引步进）
      const routeLen = dragon.routeFollower.getTotalLength()
      // 龙头在路线上的点索引
      const headRouteIndex = dragon.progress * routeLen

      // 每个身体节间隔固定的路线点数
      const pointSpacing = 4.0  // 每隔4个路线点放置一个身体节

      for (let j = 1; j < dragon.segments.length; j++) {
        const seg = dragon.segments[j]
        // 身体节在路线上的点索引 = 龙头索引 - j * 间隔
        const segRouteIndex = headRouteIndex - j * pointSpacing
        // 获取该索引对应的路线位置
        const pos = dragon.routeFollower.getPositionAt(segRouteIndex)

        if (pos) {
          // 身体节平滑跟随路线位置
          const followSpeed = 0.3
          seg.x += (pos.x - seg.x) * followSpeed
          seg.y += (pos.y - seg.y) * followSpeed
        }
      }

      // 碰撞检测
      const playerY = BASE_H - 55
      for (const seg of dragon.segments) {
        const dist = Math.sqrt(
          Math.pow(seg.x - state.playerX, 2) +
          Math.pow(seg.y - playerY, 2)
        )
        if (dist < seg.size + 20) {
          if (state.invincibleTimer <= 0) {
            state.playerHP--
            state.invincibleTimer = 1.5
            createExplosion(state.playerX, playerY, COLORS.accent, 15)

            if (state.playerHP <= 0) {
              endGame(false)
              return
            }
          }
          break
        }
      }
    }
  }

  function shoot() {
    if (state.phase !== 'playing' || state.isPaused) return

    const now = Date.now()
    if (now - state.lastShotTime < state.shootCooldown) return
    state.lastShotTime = now

    const count = state.bulletCount
    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? 0.12 : 0
      const angle = -Math.PI / 2 + (i - (count - 1) / 2) * spread
      state.bullets.push({
        x: state.playerX,
        y: BASE_H - 80,
        vx: Math.cos(angle) * state.bulletSpeed,
        vy: Math.sin(angle) * state.bulletSpeed,
        damage: state.bulletDamage,
        pierce: state.bulletPierce,
        size: 5
      })
    }

    audioService.click()
  }

  function updateBullets() {
    // 限制子弹数量
    while (state.bullets.length > MAX_BULLETS) {
      state.bullets.shift()
    }

    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i]
      b.x += b.vx
      b.y += b.vy

      if (b.y < -20 || b.x < -20 || b.x > BASE_W + 20) {
        state.bullets.splice(i, 1)
        continue
      }

      let hit = false

      for (const dragon of state.dragons) {
        if (!dragon.alive) continue

        // 只检测身体（索引 > 0），头部无敌不能被打
        for (let j = dragon.segments.length - 1; j > 0; j--) {
          const seg = dragon.segments[j]
          const dx = b.x - seg.x
          const dy = b.y - seg.y
          const distSq = dx * dx + dy * dy
          const hitRadius = seg.size + b.size

          if (distSq < hitRadius * hitRadius) {
            seg.hp -= b.damage
            createHitEffect(b.x, b.y, seg.color)
            createHitFlash(seg)

            if (b.pierce > 0) {
              b.pierce--
            } else {
              state.bullets.splice(i, 1)
              hit = true
            }

            if (seg.hp <= 0) {
              killDragonSegment(dragon, j)
            }

            if (hit) break
          }
        }
        if (hit) break
      }
    }
  }

  function killDragonSegment(dragon: Dragon, segIdx: number) {
    const seg = dragon.segments[segIdx]
    const config = DRAGON_CONFIGS[dragon.type]

    createExplosion(seg.x, seg.y, seg.color, seg.size)

    state.combo++
    state.comboTimer = 2.5
    if (state.combo > state.maxCombo) state.maxCombo = state.combo

    const comboMult = Math.min(state.combo, 25)
    const score = config.score * comboMult
    state.score += score
    state.totalKills++
    state.levelProgress++
    engine.addScore(score, seg.x, seg.y)

    state.floatTexts.push({
      x: seg.x,
      y: seg.y,
      text: `+${score}`,
      color: COLORS.gold,
      life: 1,
      vy: -1.5,
      size: 16
    })

    // 道具掉落 - 优先掉落龙身上附加的道具
    if (seg.attachedPowerUp && state.powerUps.length < 5) {
      // 掉落附加的道具
      state.powerUps.push({
        x: seg.x,
        y: seg.y,
        type: seg.attachedPowerUp,
        life: 5,
        bobPhase: Math.random() * Math.PI * 2
      })
      const icon = POWERUP_ICONS[seg.attachedPowerUp]
      state.floatTexts.push({
        x: seg.x, y: seg.y - 20,
        text: icon.icon,
        color: icon.color,
        life: 0.8, vy: -1.5, size: 18
      })
    } else if (dragon.type === 'treasure') {
      // 宝箱龙掉落回血道具
      if (Math.random() < 0.3 && state.powerUps.length < 3) {
        state.powerUps.push({
          x: seg.x,
          y: seg.y,
          type: 'heal',
          life: 5,
          bobPhase: Math.random() * Math.PI * 2
        })
      }
      state.floatTexts.push({
        x: seg.x, y: seg.y - 30,
        text: '🎁 宝箱!',
        color: COLORS.gold,
        life: 1.5, vy: -1, size: 22
      })
    } else if (dragon.type === 'coin') {
      // 金币龙掉落金币
      if (state.coinDrops.length < 8) {
        for (let k = 0; k < 2; k++) {
          state.coinDrops.push({
            x: seg.x + (Math.random() - 0.5) * 30,
            y: seg.y,
            vy: -3 - Math.random() * 2,
            life: 2
          })
        }
      }
      state.coins += 10
    }
    // 注意：普通龙不再有额外随机掉落，道具都在龙身上

    // 龙身回缩：身体被打掉后，头部往回缩填补空缺
    // 回缩量 = 身体节间距（4个路线点对应的像素距离）
    const routeLen = dragon.routeFollower.getTotalLength()
    const retractAmount = (4.0 / routeLen) * 0.15  // 回缩15%的进度（对应4个点的距离）
    dragon.progress = Math.max(0, dragon.progress - retractAmount)
    dragon.routeFollower.setProgress(dragon.progress)

    // 移除被击杀的身体节
    dragon.segments.splice(segIdx, 1)

    // 检查剩余节数
    if (dragon.segments.length === 0) {
      // 完全死亡（不应该发生，头不会被打）
      dragon.alive = false
    } else if (dragon.segments.length === 1) {
      // 只剩头部，龙死亡爆炸
      const head = dragon.segments[0]
      dragon.alive = false
      createExplosion(head.x, head.y, head.color, head.size * 3)

      if (dragon.type === 'boss') {
        for (let k = 0; k < 40; k++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 5
          state.particles.push({
            x: head.x,
            y: head.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.2,
            maxLife: 1.2,
            size: 4 + Math.random() * 6,
            color: k % 2 === 0 ? COLORS.gold : '#FFD700'
          })
        }
        state.floatTexts.push({
          x: BASE_W / 2, y: BASE_H / 2 - 40,
          text: '👑 BOSS击败!',
          color: COLORS.gold,
          life: 2, vy: -0.5, size: 26
        })
      }
    } else {
      // 还有身体，头部回缩（向回退方向移动）
      const head = dragon.segments[0]
      const retractDist = head.size * 1.5
      // 回缩：让头部向身体方向移动（Y方向增加，因为身体在下方）
      // 同时稍微回退一点 progress
      head.y += retractDist
      dragon.progress -= 0.02  // 进度稍微回退

      // 限制进度不小于0
      dragon.progress = Math.max(0, dragon.progress)
    }

    audioService.win()
    checkLevelComplete()
  }

  function checkLevelComplete() {
    if (state.levelProgress >= state.levelTarget) {
      // 关卡完成 - 给予Buff并进入下一关
      if (state.mode === 'challenge') {
        // 显示Buff选择效果
        state.floatTexts.push({
          x: BASE_W / 2,
          y: BASE_H / 2,
          text: '✨ 选择强化!',
          color: COLORS.gold,
          life: 1.5,
          vy: 0,
          size: 28
        })

        const shuffled = [...BUFF_OPTIONS].sort(() => Math.random() - 0.5)
        const buff = shuffled[0]
        applyBuff(buff)

        // 显示获得的Buff
        state.floatTexts.push({
          x: BASE_W / 2,
          y: BASE_H / 2 + 40,
          text: buff.name,
          color: buff.color,
          life: 2,
          vy: -0.5,
          size: 20
        })
      }
      nextLevel()
    }
  }

  function applyBuff(buff: typeof BUFF_OPTIONS[0]) {
    switch (buff.id) {
      case 'damage':
        state.bulletDamage += 0.08
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 100, text: '⚔️ 攻击+', color: buff.color, life: 1, vy: -1.5, size: 16 })
        break
      case 'multiShot':
        state.bulletCount = Math.min(3, state.bulletCount + 1)
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 100, text: '🔫 多重+', color: buff.color, life: 1, vy: -1.5, size: 16 })
        break
      case 'pierce':
        state.bulletPierce = Math.min(3, state.bulletPierce + 1)
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 100, text: '💥 穿透+', color: buff.color, life: 1, vy: -1.5, size: 16 })
        break
      case 'heal':
        state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 1)
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 100, text: '❤️ 回血', color: buff.color, life: 1, vy: -1.5, size: 16 })
        break
    }
  }

  function nextLevel() {
    state.level++
    state.levelProgress = 0
    // 关卡目标：3 + level/3，缓慢增加
    state.levelTarget = Math.min(8, 3 + Math.floor(state.level / 3))

    // 场景切换（每4关换一次）
    state.currentScene = Math.floor((state.level - 1) / 4) % SCENES.length

    // 最大龙数量：2 + level/4，缓慢增加
    state.maxDragons = Math.min(4, 2 + Math.floor(state.level / 4))

    state.floatTexts.push({
      x: BASE_W / 2,
      y: BASE_H / 2 - 50,
      text: state.mode === 'endless' ? `💫 第 ${state.level} 波` : `🎉 第 ${state.level} 关`,
      color: COLORS.gold,
      life: 2,
      vy: -0.5,
      size: 26
    })
  }

  function createHitEffect(x: number, y: number, color: string) {
    // 命中粒子效果 - 增加数量和视觉冲击力
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        size: 2 + Math.random() * 3,
        color
      })
    }
    // 添加数字伤害飘字
    if (state.combo > 1) {
      state.floatTexts.push({
        x: x,
        y: y - 10,
        text: `x${Math.min(state.combo, 99)}`,
        color: COLORS.gold,
        life: 0.8,
        vy: -2,
        size: 14
      })
    }
  }

  // 命中闪白效果 - 让龙身短暂变白
  interface HitFlash {
    x: number
    y: number
    timer: number
    originalColor: string
  }
  let hitFlashes: HitFlash[] = []

  function createHitFlash(seg: DragonSegment) {
    hitFlashes.push({
      x: seg.x,
      y: seg.y,
      timer: 0.1,
      originalColor: seg.color
    })
  }

  function updateHitFlashes(dt: number) {
    for (let i = hitFlashes.length - 1; i >= 0; i--) {
      hitFlashes[i].timer -= dt
      if (hitFlashes[i].timer <= 0) {
        hitFlashes.splice(i, 1)
      }
    }
  }

  function isFlashing(x: number, y: number): HitFlash | undefined {
    return hitFlashes.find(f => Math.abs(f.x - x) < 5 && Math.abs(f.y - y) < 5)
  }

  function createExplosion(x: number, y: number, color: string, size: number) {
    const count = Math.floor(size / 2.5)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 4
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: 2 + Math.random() * 4,
        color: i % 2 === 0 ? color : lightenColor(color, 30)
      })
    }
  }

  function updateParticles(dt: number) {
    // 限制粒子数量，防止性能问题
    while (state.particles.length > MAX_PARTICLES) {
      state.particles.shift()
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= dt
      p.size *= 0.97
      if (p.life <= 0) {
        state.particles.splice(i, 1)
      }
    }
  }

  function updatePowerUps(dt: number) {
    // 限制道具数量
    while (state.powerUps.length > MAX_POWERUPS) {
      state.powerUps.shift()
    }

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const p = state.powerUps[i]
      p.y += 0.8
      p.life -= dt
      p.bobPhase += 0.05

      if (p.y > BASE_H + 30 || p.life <= 0) {
        state.powerUps.splice(i, 1)
        continue
      }

      const dist = Math.sqrt(
        Math.pow(p.x - state.playerX, 2) +
        Math.pow(p.y - (BASE_H - 55), 2)
      )
      if (dist < 38) {
        applyPowerUp(p.type)
        state.powerUps.splice(i, 1)
      }
    }
  }

  function applyPowerUp(type: keyof typeof POWERUP_ICONS) {
    const icon = POWERUP_ICONS[type]
    switch (type) {
      case 'damage':
        state.bulletDamage++
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 90, text: '⚔️', color: icon.color, life: 1, vy: -1.5, size: 18 })
        break
      case 'multiShot':
        state.bulletCount++
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 90, text: '🔫', color: icon.color, life: 1, vy: -1.5, size: 18 })
        break
      case 'pierce':
        state.bulletPierce++
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 90, text: '💥', color: icon.color, life: 1, vy: -1.5, size: 18 })
        break
      case 'heal':
        state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 1)
        state.floatTexts.push({ x: state.playerX, y: BASE_H - 90, text: '❤️', color: icon.color, life: 1, vy: -1.5, size: 18 })
        break
    }
    audioService.win()
  }

  function updateCoinDrops(dt: number) {
    // 限制金币数量
    while (state.coinDrops.length > MAX_COIN_DROPS) {
      state.coinDrops.shift()
    }

    for (let i = state.coinDrops.length - 1; i >= 0; i--) {
      const c = state.coinDrops[i]
      c.y += c.vy
      c.vy += 0.15
      c.life -= dt
      if (c.life <= 0 || c.y > BASE_H + 20) {
        state.coinDrops.splice(i, 1)
      }
    }
  }

  function updateClouds() {
    for (const cloud of state.clouds) {
      cloud.y += cloud.speed
      if (cloud.y > BASE_H + cloud.size) {
        cloud.y = -cloud.size
        cloud.x = Math.random() * BASE_W
      }
    }
    for (const dust of state.dusts) {
      dust.y += dust.speed
      if (dust.y > BASE_H + 10) {
        dust.y = -10
        dust.x = Math.random() * BASE_W
      }
    }
  }

  function updateFloatTexts(dt: number) {
    // 限制浮动文字数量
    while (state.floatTexts.length > MAX_FLOAT_TEXTS) {
      state.floatTexts.shift()
    }

    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      const ft = state.floatTexts[i]
      ft.y += ft.vy
      ft.life -= dt
      if (ft.life <= 0) {
        state.floatTexts.splice(i, 1)
      }
    }
  }

  function updateTimer(dt: number) {
    if (state.mode === 'challenge' && state.phase === 'playing' && !state.isPaused) {
      state.timeLeft -= dt
      if (state.timeLeft <= 0) {
        endGame(false)
      }
    }
  }

  function endGame(victory: boolean) {
    state.phase = 'gameOver'
    engine.setVictory(victory)
    ;(engine as any).setGameStats({
      score: state.score,
      maxCombo: state.maxCombo,
      totalKills: state.totalKills,
      gameTime: 0,
      won: victory,
      level: state.level,
      coins: state.coins
    })

    setTimeout(() => {
      // 清理全屏覆盖层（如果存在）
      const wrap = document.getElementById('dragon-shooter-wrapper')
      if (wrap) wrap.remove()
      onEnd()
    }, 2000)
  }

  function togglePause() {
    if (state.phase !== 'playing') return
    state.isPaused = !state.isPaused
  }

  // 绘制
  function drawCloud(ctx: CanvasRenderingContext2D, cloud: { x: number; y: number; size: number; opacity: number }) {
    ctx.save()
    ctx.globalAlpha = cloud.opacity
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.1, cloud.size * 0.4, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.45, 0, Math.PI * 2)
    ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawDragon(dragon: Dragon) {
    if (!dragon.alive) return

    for (let i = dragon.segments.length - 1; i >= 0; i--) {
      const seg = dragon.segments[i]
      drawDragonSegment(seg, dragon.type, dragon.slowed)
    }
  }

  function drawDragonSegment(seg: DragonSegment, type: keyof typeof DRAGON_CONFIGS, isSlowed: boolean) {
    ctx.save()
    ctx.translate(seg.x, seg.y)

    const config = DRAGON_CONFIGS[type]

    // 光晕
    ctx.shadowColor = seg.color
    ctx.shadowBlur = type === 'boss' ? 18 : 10

    // 龙身
    ctx.fillStyle = seg.color
    ctx.beginPath()
    ctx.arc(0, 0, seg.size, 0, Math.PI * 2)
    ctx.fill()

    // 龙纹（精英/BOSS有）
    if (seg.hasPattern) {
      ctx.strokeStyle = lightenColor(seg.color, 40)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, seg.size * 0.65, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (seg.isHead) {
      // 眼睛
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.28, -seg.size * 0.12, seg.size * 0.2, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.28, -seg.size * 0.12, seg.size * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#222222'
      ctx.beginPath()
      ctx.arc(-seg.size * 0.28, -seg.size * 0.12, seg.size * 0.09, 0, Math.PI * 2)
      ctx.arc(seg.size * 0.28, -seg.size * 0.12, seg.size * 0.09, 0, Math.PI * 2)
      ctx.fill()

      // 龙角（精英/BOSS有）
      if (seg.hasHorn) {
        ctx.strokeStyle = lightenColor(seg.color, 50)
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(-seg.size * 0.45, -seg.size * 0.2)
        ctx.lineTo(-seg.size * 0.8, -seg.size * 0.5)
        ctx.moveTo(seg.size * 0.45, -seg.size * 0.2)
        ctx.lineTo(seg.size * 0.8, -seg.size * 0.5)
        ctx.stroke()
      }

      // 龙须
      ctx.strokeStyle = lightenColor(seg.color, 45)
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(-seg.size * 0.4, -seg.size * 0.1)
      ctx.quadraticCurveTo(-seg.size * 0.8, -seg.size * 0.4, -seg.size * 1.0, -seg.size * 0.25)
      ctx.moveTo(seg.size * 0.4, -seg.size * 0.1)
      ctx.quadraticCurveTo(seg.size * 0.8, -seg.size * 0.4, seg.size * 1.0, -seg.size * 0.25)
      ctx.stroke()

      // BOSS显示"王"
      if (type === 'boss') {
        ctx.fillStyle = COLORS.accent
        ctx.font = `bold ${seg.size * 0.65}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('王', 0, 0)
      }

      // 宝箱龙显示"宝"
      if (type === 'treasure') {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${seg.size * 0.6}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('宝', 0, 0)
      }

      // 金币龙显示"$"
      if (type === 'coin') {
        ctx.fillStyle = '#FFD700'
        ctx.font = `bold ${seg.size * 0.7}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('$', 0, 0)
      }
    }

    // 减速效果
    if (isSlowed) {
      ctx.strokeStyle = '#87CEEB'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(0, 0, seg.size + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 血条
    if (seg.hp < seg.maxHp) {
      const barW = seg.size * 1.5
      const barH = 4
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(-barW / 2, -seg.size - 10, barW, barH)

      const pct = seg.hp / seg.maxHp
      ctx.fillStyle = pct > 0.5 ? '#90EE90' : pct > 0.25 ? '#FFD93D' : '#FF6B6B'
      ctx.fillRect(-barW / 2, -seg.size - 10, barW * pct, barH)
    }

    // 绘制附加的道具图标（在龙身上方）
    if (seg.attachedPowerUp) {
      const icon = POWERUP_ICONS[seg.attachedPowerUp]
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15

      ctx.save()
      ctx.translate(0, -seg.size - 10)
      ctx.scale(pulse, pulse)

      // 道具光晕
      ctx.shadowColor = icon.color
      ctx.shadowBlur = 10
      ctx.fillStyle = icon.color
      ctx.beginPath()
      ctx.arc(0, 0, 7, 0, Math.PI * 2)
      ctx.fill()

      // 道具图标
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon.icon, 0, 1)

      ctx.restore()
    }

    ctx.restore()
  }

  function drawPlayer() {
    ctx.save()
    ctx.translate(state.playerX, BASE_H - 55)

    // 无敌状态 - 三层护盾特效
    if (state.invincibleTimer > 0) {
      const shieldPulse = 1 + Math.sin(Date.now() / 100) * 0.1
      const shieldRotation = Date.now() / 500

      ctx.save()
      ctx.rotate(shieldRotation)

      ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)'
      ctx.lineWidth = 3
      ctx.shadowColor = '#4FC3F7'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(0, 0, 35 * shieldPulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(0, 0, 28 * shieldPulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()

      for (let i = 0; i < 8; i++) {
        const angle = (Date.now() / 300) + (i * Math.PI / 4)
        const px = Math.cos(angle) * 32 * shieldPulse
        const py = Math.sin(angle) * 32 * shieldPulse

        ctx.fillStyle = '#4FC3F7'
        ctx.shadowColor = '#4FC3F7'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    ctx.shadowBlur = 0

    // 国风小侠客
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
    grad.addColorStop(0, COLORS.gold)
    grad.addColorStop(1, '#CD853F')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.moveTo(-26, -4)
    ctx.lineTo(0, -28)
    ctx.lineTo(26, -4)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-18, -8)
    ctx.lineTo(18, -8)
    ctx.stroke()

    ctx.fillStyle = '#333333'
    ctx.beginPath()
    ctx.arc(-6, -2, 3, 0, Math.PI * 2)
    ctx.arc(6, -2, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(0, 4, 6, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()

    ctx.restore()

    // 绘制射击准星（玩家头顶）
    ctx.save()
    ctx.translate(state.playerX, BASE_H - 100)

    const aimPulse = 1 + Math.sin(Date.now() / 150) * 0.15
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'
    ctx.lineWidth = 2
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 8

    // 准星圈
    ctx.beginPath()
    ctx.arc(0, 0, 6 * aimPulse, 0, Math.PI * 2)
    ctx.stroke()

    // 准星十字
    const crossSize = 10 * aimPulse
    ctx.beginPath()
    ctx.moveTo(0, -crossSize)
    ctx.lineTo(0, -crossSize + 5)
    ctx.moveTo(0, crossSize)
    ctx.lineTo(0, crossSize - 5)
    ctx.moveTo(-crossSize, 0)
    ctx.lineTo(-crossSize + 5, 0)
    ctx.moveTo(crossSize, 0)
    ctx.lineTo(crossSize - 5, 0)
    ctx.stroke()

    ctx.restore()
  }

  function drawBullets() {
    for (const b of state.bullets) {
      ctx.save()
      ctx.translate(b.x, b.y)

      // 外层光晕
      ctx.shadowColor = COLORS.gold
      ctx.shadowBlur = 15
      ctx.fillStyle = COLORS.gold
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()

      // 内层亮点
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-2, -2, 3, 0, Math.PI * 2)
      ctx.fill()

      // 尾迹
      const trail = ctx.createLinearGradient(0, 0, 0, 26)
      trail.addColorStop(0, 'rgba(255, 215, 0, 0.85)')
      trail.addColorStop(1, 'transparent')
      ctx.fillStyle = trail
      ctx.fillRect(-4, 0, 8, 26)

      ctx.restore()
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.save()
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  function drawPowerUps() {
    for (const p of state.powerUps) {
      ctx.save()
      const bob = Math.sin(p.bobPhase) * 4
      ctx.translate(p.x, p.y + bob)

      // 脉冲动画 - 85%-115%大小脉动
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15
      ctx.scale(pulse, pulse)

      const icon = POWERUP_ICONS[p.type]

      // 外层：强光晕
      ctx.shadowColor = icon.color
      ctx.shadowBlur = 25  // ✅ 光晕+39% (18 → 25)
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)'  // ✅ 透明度+14%
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)  // ✅ 半径+29% (14 → 18)
      ctx.fill()

      // 中层：白色边框
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(0, 0, 14, 0, Math.PI * 2)
      ctx.stroke()

      // 内层：深色背景（突出图标）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.arc(0, 0, 12, 0, Math.PI * 2)
      ctx.fill()

      // 图标增强
      ctx.shadowBlur = 0
      ctx.font = 'bold 20px sans-serif'  // ✅ 粗体 + 尺寸+25%
      ctx.fillStyle = '#FFFFFF'  // ✅ 纯白色
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon.icon, 0, 1)

      ctx.restore()
    }
  }

  function drawCoinDrops() {
    ctx.fillStyle = '#FFD700'
    ctx.strokeStyle = '#DAA520'
    ctx.lineWidth = 1.5
    for (const c of state.coinDrops) {
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#DAA520'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', 0, 1)
      ctx.restore()
    }
  }

  function drawFloatTexts() {
    for (const ft of state.floatTexts) {
      ctx.save()
      ctx.globalAlpha = ft.life
      ctx.fillStyle = ft.color
      ctx.shadowColor = ft.color
      ctx.shadowBlur = 8
      ctx.font = `bold ${ft.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.restore()
    }
  }

  function drawHUD() {
    // 顶部栏
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(8, 8, BASE_W - 16, 50)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'

    const scene = SCENES[state.currentScene]
    ctx.fillText(`【${scene.name}】第 ${state.level} 关`, 18, 28)

    // 倒计时
    if (state.mode === 'challenge') {
      const mins = Math.floor(state.timeLeft / 60)
      const secs = Math.floor(state.timeLeft % 60)
      ctx.fillStyle = state.timeLeft < 30 ? '#FF6B6B' : '#FFFFFF'
      ctx.fillText(`⏱️ ${mins}:${secs.toString().padStart(2, '0')}`, 18, 48)
    } else {
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`💫 无尽模式`, 18, 48)
    }

    // 进度条
    const barW = 120
    const barH = 6
    const progress = Math.min(1, state.levelProgress / state.levelTarget)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(BASE_W - barW - 50, 42, barW, barH)
    ctx.fillStyle = '#90EE90'
    ctx.fillRect(BASE_W - barW - 50, 42, barW * progress, barH)

    // 血量
    ctx.textAlign = 'right'
    let hearts = ''
    for (let i = 0; i < state.playerMaxHP; i++) {
      hearts += i < state.playerHP ? '❤️' : '🖤'
    }
    ctx.font = '22px sans-serif'
    ctx.fillText(hearts, BASE_W - 18, 32)

    // 暂停按钮
    ctx.font = '18px sans-serif'
    ctx.fillText(state.isPaused ? '▶️' : '⏸️', BASE_W - 18, 52)

    // 连击
    if (state.combo > 1) {
      ctx.save()
      ctx.translate(BASE_W / 2, 85)
      const scale = 1 + Math.sin(Date.now() / 90) * 0.08
      ctx.scale(scale, scale)
      ctx.fillStyle = state.combo > 12 ? COLORS.accent : state.combo > 6 ? COLORS.gold : COLORS.jade
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 15
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${state.combo} 连击!`, 0, 0)
      ctx.restore()
    }

    // 分数显示
    ctx.save()
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.gold
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 5
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(`💰 ${state.score}`, 18, BASE_H - 20)
    ctx.restore()

    // 金币显示
    if (state.coins > 0) {
      ctx.save()
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFD700'
      ctx.font = '14px sans-serif'
      ctx.fillText(`🪙 ${state.coins}`, BASE_W - 18, BASE_H - 20)
      ctx.restore()
    }
  }

  function drawStartScreen() {
    // 标题
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, BASE_H / 2 - 180, BASE_W, 360)

    ctx.fillStyle = COLORS.gold
    ctx.shadowColor = COLORS.gold
    ctx.shadowBlur = 20
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🐉 打龙小游戏', BASE_W / 2, BASE_H / 2 - 100)

    ctx.shadowBlur = 0
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px sans-serif'
    ctx.fillText('国风卡通·休闲割草', BASE_W / 2, BASE_H / 2 - 70)
    ctx.fillText('滑动控制·自动射击', BASE_W / 2, BASE_H / 2 - 50)
    ctx.fillText('龙体分裂·越打越爽', BASE_W / 2, BASE_H / 2 - 30)

    // 按钮1: 开始闯关
    ctx.fillStyle = COLORS.accent
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('🎮 开始闯关', BASE_W / 2 - 75, BASE_H / 2 + 10)

    // 按钮2: 无尽挑战
    ctx.fillStyle = COLORS.jade
    ctx.fillText('💫 无尽挑战', BASE_W / 2 + 75, BASE_H / 2 + 10)

    // 按钮3: 绘制路线（新增）
    ctx.fillStyle = '#9370DB'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('✏️ 绘制路线', BASE_W / 2, BASE_H / 2 + 50)

    // 按钮4: 选择预设路线（新增）
    ctx.fillStyle = '#666666'
    ctx.font = '14px sans-serif'
    ctx.fillText('📋 预设路线', BASE_W / 2, BASE_H / 2 + 75)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '12px sans-serif'
    ctx.fillText('点击对应按钮', BASE_W / 2, BASE_H / 2 + 105)
  }

  // 绘制路线编辑界面
  function drawRouteEditor() {
    // 背景（扩大画布）
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 绘制游戏区域边框（虚线）
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.strokeRect(CANVAS_OFFSET_X, CANVAS_OFFSET_Y, BASE_W, BASE_H)
    ctx.restore()

    // 在游戏区域内显示提示
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✏️ 绘制龙的路线', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 60)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '13px sans-serif'
    ctx.fillText('在下方区域滑动绘制路线', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 90)
    ctx.fillText('龙会沿路线从外向内移动', CANVAS_OFFSET_X + BASE_W / 2, CANVAS_OFFSET_Y + 110)

    // 显示已绘制的路线
    if (routeEditor.getCurrentPoints().length > 0) {
      routeEditor.drawCurrentRoute()
    }

    // 显示所有已保存的路线
    drawSavedRoutes()

    // 按钮区域（底部）- 使用3个等宽按钮
    const btnY = CANVAS_H - 80
    const btnH = 50
    const btnW = 100
    const btnStartX = (CANVAS_W - btnW * 3) / 2

    // 清除按钮
    ctx.fillStyle = '#FF6B6B'
    ctx.fillRect(btnStartX, btnY, btnW - 5, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('🗑️ 清除', btnStartX + btnW / 2, btnY + 32)

    // 保存按钮
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(btnStartX + btnW, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('💾 保存', btnStartX + btnW * 1.5, btnY + 32)

    // 返回按钮
    ctx.fillStyle = COLORS.accent
    ctx.fillRect(btnStartX + btnW * 2, btnY, btnW, btnH)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('⬅️ 返回', btnStartX + btnW * 2.5, btnY + 32)

    // 提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px sans-serif'
    ctx.fillText('可在边框外绘制路线', CANVAS_W / 2, btnY + btnH + 15)
  }

  // 绘制已保存的路线（加上偏移量显示在画布坐标）
  function drawSavedRoutes() {
    for (const route of customRoutes) {
      if (route.points.length < 2) continue

      ctx.save()
      ctx.strokeStyle = '#90EE90'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.shadowColor = '#90EE90'
      ctx.shadowBlur = 5

      ctx.beginPath()
      ctx.moveTo(route.points[0].x + CANVAS_OFFSET_X, route.points[0].y + CANVAS_OFFSET_Y)
      for (let i = 1; i < route.points.length; i++) {
        ctx.lineTo(route.points[i].x + CANVAS_OFFSET_X, route.points[i].y + CANVAS_OFFSET_Y)
      }
      ctx.stroke()

      // 路线名称
      ctx.setLineDash([])
      ctx.fillStyle = '#90EE90'
      ctx.font = '12px sans-serif'
      ctx.fillText(route.name, route.points[0].x + CANVAS_OFFSET_X, route.points[0].y + CANVAS_OFFSET_Y - 15)

      ctx.restore()
    }
  }

  // 绘制预设路线选择界面
  function drawRouteSelector() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📋 选择龙的路线', BASE_W / 2, 80)

    // 显示所有可用路线
    const allRoutes = [...PRESET_ROUTES, ...customRoutes]
    const startY = 130
    const itemHeight = 70

    for (let i = 0; i < allRoutes.length; i++) {
      const route = allRoutes[i]
      const y = startY + i * itemHeight

      // 路线预览框
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(20, y, BASE_W - 40, 55)

      // 路线名称
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(route.name, 35, y + 25)

      // 路线类型标签
      const isPreset = PRESET_ROUTES.some(r => r.id === route.id)
      ctx.fillStyle = isPreset ? '#9370DB' : '#4CAF50'
      ctx.font = '12px sans-serif'
      ctx.fillText(isPreset ? '📌 预设' : '✏️ 自定义', 35, y + 45)

      // 绘制路线预览
      if (route.points.length >= 2) {
        ctx.save()
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 5

        // 缩放路线到预览区域
        const previewX = 150
        const previewW = BASE_W - 190
        const previewH = 45

        const minX = Math.min(...route.points.map(p => p.x))
        const maxX = Math.max(...route.points.map(p => p.x))
        const minY = Math.min(...route.points.map(p => p.y))
        const maxY = Math.max(...route.points.map(p => p.y))
        const scaleX = previewW / (maxX - minX || 1)
        const scaleY = previewH / (maxY - minY || 1)
        const scale = Math.min(scaleX, scaleY) * 0.8

        ctx.beginPath()
        for (const point of route.points) {
          const px = previewX + (point.x - minX) * scale
          const py = y + 27 + (point.y - minY) * scale
          if (point === route.points[0]) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.stroke()
        ctx.restore()
      }

      // 选中提示
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      ctx.fillRect(BASE_W - 50, y, 30, 55)
      ctx.fillStyle = '#FFD700'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('▶', BASE_W - 35, y + 35)
    }

    // 返回按钮
    ctx.fillStyle = '#666666'
    ctx.fillRect(BASE_W / 2 - 50, BASE_H - 80, 100, 40)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⬅️ 返回', BASE_W / 2, BASE_H - 55)
  }

  // 路线编辑器实例
  let routeEditor: RouteEditor

  function initRouteEditor() {
    routeEditor = new RouteEditor(canvas, ctx)
  }

  // 显示的路线预览
  let showRoutePreview = false
  let routePreviewTimer = 0

  function drawPauseOverlay() {
    if (!state.isPaused) return

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⏸️ 已暂停', BASE_W / 2, BASE_H / 2 - 20)

    ctx.font = '16px sans-serif'
    ctx.fillText('点击继续', BASE_W / 2, BASE_H / 2 + 20)
  }

  function drawGameOver(victory: boolean) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    ctx.fillStyle = victory ? '#90EE90' : COLORS.accent
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(victory ? '🎉 通关!' : '💀 失败', BASE_W / 2, BASE_H / 2 - 80)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px sans-serif'
    ctx.fillText(`最高连击: ${state.maxCombo}`, BASE_W / 2, BASE_H / 2 - 45)
    ctx.fillText(`总击杀: ${state.totalKills}`, BASE_W / 2, BASE_H / 2 - 22)
    ctx.fillText(`到达关卡: ${state.level}`, BASE_W / 2, BASE_H / 2 + 1)
    ctx.fillText(`金币: ${state.coins}`, BASE_W / 2, BASE_H / 2 + 24)
    ctx.fillStyle = COLORS.gold
    ctx.fillText(`得分: ${state.score}`, BASE_W / 2, BASE_H / 2 + 52)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '14px sans-serif'
    ctx.fillText('正在返回...', BASE_W / 2, BASE_H / 2 + 85)
  }

  function render() {
    // 清除整个画布
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 路线编辑器模式：显示扩大的画布和游戏区域边框
    if (state.phase === 'routeEdit') {
      drawRouteEditor()
      return
    } else if (state.phase === 'routeSelect') {
      drawRouteSelector()
      return
    }

    // 游戏模式：将游戏区域居中显示
    ctx.save()
    ctx.translate(CANVAS_OFFSET_X, CANVAS_OFFSET_Y)

    // 裁剪：只显示游戏区域，超出的部分不渲染
    ctx.beginPath()
    ctx.rect(0, 0, BASE_W, BASE_H)
    ctx.clip()

    const scene = SCENES[state.currentScene]

    // 国风渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, BASE_H)
    grad.addColorStop(0, scene.bg[0])
    grad.addColorStop(0.5, scene.bg[1])
    grad.addColorStop(1, scene.bg[2])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, BASE_W, BASE_H)

    // 云朵和尘埃
    for (const cloud of state.clouds) {
      drawCloud(ctx, cloud)
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (const dust of state.dusts) {
      ctx.beginPath()
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2)
      ctx.fill()
    }

    if (state.phase === 'start') {
      drawStartScreen()
    } else {
      for (const dragon of state.dragons) {
        drawDragon(dragon)
      }
      drawBullets()
      drawPlayer()
      drawParticles()
      drawPowerUps()
      drawCoinDrops()
      drawFloatTexts()
      drawHUD()

      if (state.isPaused) {
        drawPauseOverlay()
      }

      if (state.phase === 'gameOver') {
        drawGameOver(false)
      }
    }

    ctx.restore()
  }

  // 输入
  function getPos(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    // 考虑画布偏移和缩放
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const canvasX = (e.clientX - rect.left) * scaleX
    const canvasY = (e.clientY - rect.top) * scaleY
    // 转换为游戏区域坐标
    return {
      x: canvasX - CANVAS_OFFSET_X,
      y: canvasY - CANVAS_OFFSET_Y
    }
  }

  // 获取画布坐标（路线编辑时使用，不做偏移）
  function getCanvasPos(e: MouseEvent | Touch) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height)
    }
  }

  function handleDown(x: number, y: number) {
    // 调试日志
    console.log('handleDown:', { x: Math.round(x), y: Math.round(y), phase: state.phase })

    // 路线编辑模式
    if (state.phase === 'routeEdit') {
      const btnY = CANVAS_H - 80
      const btnH = 50
      const btnW = 100
      const btnStartX = (CANVAS_W - btnW * 3) / 2

      // 点击了按钮区域
      if (y > btnY && y < btnY + btnH && x > btnStartX && x < btnStartX + btnW * 3) {
        if (x < btnStartX + btnW) {
          // 清除按钮
          routeEditor.clear()
          return
        } else if (x < btnStartX + btnW * 2) {
          // 保存按钮 - 转换为游戏区域坐标
          const canvasPoints = routeEditor.getCurrentPoints()
          if (canvasPoints.length >= 3) {
            const points: RoutePoint[] = canvasPoints.map(p => ({
              x: p.x - CANVAS_OFFSET_X,
              y: p.y - CANVAS_OFFSET_Y
            }))
            const newRoute: CustomRoute = {
              id: `custom_${Date.now()}`,
              name: `自定义路线 ${customRoutes.length + 1}`,
              points
            }
            customRoutes.push(newRoute)
            routeEditor.clear()
          }
          return
        } else {
          // 返回按钮
          state.phase = 'start'
          state.isRouteEditMode = false
          return
        }
      }

      // 点击屏幕其他地方：开始/继续绘制
      routeEditor.startDrawing()
      return
    }

    // 路线选择模式
    if (state.phase === 'routeSelect') {
      const allRoutes = [...PRESET_ROUTES, ...customRoutes]
      const startY = 130
      const itemHeight = 70

      // 点击了某个路线
      for (let i = 0; i < allRoutes.length; i++) {
        const itemY = startY + i * itemHeight
        if (x > 20 && x < BASE_W - 20 && y > itemY && y < itemY + 55) {
          // 选择路线：将其移到最前面，这样会优先被使用
          const selectedRoute = allRoutes[i]
          // 从原位置移除
          const presetIdx = PRESET_ROUTES.findIndex(r => r.id === selectedRoute.id)
          if (presetIdx >= 0) {
            // 预设路线：复制到自定义路线前面
            customRoutes.unshift({ ...selectedRoute })
          } else {
            const customIdx = customRoutes.findIndex(r => r.id === selectedRoute.id)
            if (customIdx >= 0) {
              customRoutes.splice(customIdx, 1)
              customRoutes.unshift(selectedRoute)
            }
          }
          state.phase = 'start'
          state.isRouteSelectMode = false
          return
        }
      }

      // 返回按钮
      if (y > BASE_H - 80 && y < BASE_H - 40) {
        state.phase = 'start'
        state.isRouteSelectMode = false
      }
      return
    }

    if (state.phase === 'start') {
      // 判断点击哪个按钮
      // 按钮1: 开始闯关 (y = BASE_H/2 + 10)
      if (y > BASE_H / 2 + 10 && y < BASE_H / 2 + 35 && x > BASE_W / 2 - 150 && x < BASE_W / 2) {
        state.mode = 'challenge'
        state.phase = 'playing'
        initClouds()
        initRouteEditor()
        return
      }

      // 按钮2: 无尽挑战

      // 按钮2: 无尽挑战
      if (y > BASE_H / 2 + 10 && y < BASE_H / 2 + 35 && x > BASE_W / 2 && x < BASE_W / 2 + 150) {
        state.mode = 'endless'
        state.timeLeft = 99999
        state.phase = 'playing'
        initClouds()
        initRouteEditor()
        return
      }

      // 按钮3: 绘制路线
      if (y > BASE_H / 2 + 35 && y < BASE_H / 2 + 65) {
        state.phase = 'routeEdit'
        state.isRouteEditMode = true
        initRouteEditor()
        return
      }

      // 按钮4: 选择预设路线
      if (y > BASE_H / 2 + 60 && y < BASE_H / 2 + 90) {
        state.phase = 'routeSelect'
        state.isRouteSelectMode = true
        return
      }
      return
    }

    if (state.phase === 'gameOver') return

    if (state.phase === 'playing' && state.isPaused) {
      state.isPaused = false
      return
    }

    if (state.phase === 'playing' && !state.isPaused) {
      // 检查暂停按钮
      if (x > BASE_W - 40 && y > 35 && y < 60) {
        togglePause()
        return
      }

      state.touch.active = true
      state.touch.startX = x
      state.touch.startY = y
      state.touch.currentX = x
      state.touch.startTime = Date.now()
    }
  }

  function handleMove(x: number, y: number) {
    // 路线编辑模式：鼠标/触摸移动时实时绘制
    if (state.phase === 'routeEdit') {
      if (!isDrawingMode && state.touch.active) {
        // 开始绘制
        routeEditor.startDrawing()
        routeEditor.addPoint(state.touch.startX, state.touch.startY)
      }
      if (isDrawingMode) {
        routeEditor.addPoint(x, y)
      }
      return
    }

    if (!state.touch.active) return
    state.touch.currentX = x
  }

  function handleUp() {
    state.touch.active = false

    // 路线编辑模式：只是停止当前绘制，但不删除路线
    if (state.phase === 'routeEdit') {
      routeEditor.stopDrawing()
    }
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const useCanvas = state.phase === 'routeEdit' || state.phase === 'routeSelect'
    const pos = useCanvas ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleDown(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const useCanvas = state.phase === 'routeEdit' || state.phase === 'routeSelect'
    const pos = useCanvas ? getCanvasPos(e.touches[0]) : getPos(e.touches[0])
    handleMove(pos.x, pos.y)
  }, { passive: false })

  canvas.addEventListener('touchend', handleUp)

  canvas.addEventListener('mousedown', (e) => {
    const useCanvas = state.phase === 'routeEdit' || state.phase === 'routeSelect'
    const pos = useCanvas ? getCanvasPos(e) : getPos(e)
    handleDown(pos.x, pos.y)
  })

  canvas.addEventListener('mousemove', (e) => {
    const useCanvas = state.phase === 'routeEdit' || state.phase === 'routeSelect'
    const pos = useCanvas ? getCanvasPos(e) : getPos(e)
    handleMove(pos.x, pos.y)
  })

  canvas.addEventListener('mouseup', handleUp)
  canvas.addEventListener('mouseleave', handleUp)

  // 游戏循环
  let lastTime = performance.now()
  function gameLoop(timestamp: number) {
    const dt = Math.min(0.033, (timestamp - lastTime) / 1000)
    lastTime = timestamp

    if (state.phase === 'playing' && !state.isPaused) {
      if (state.invincibleTimer > 0) state.invincibleTimer -= dt
      if (state.comboTimer > 0) {
        state.comboTimer -= dt
        if (state.comboTimer <= 0) state.combo = 0
      }

      // 移动 - 优化移动响应，更跟手
      if (state.touch.active) {
        const diff = state.touch.currentX - state.playerX
        // 根据距离调整速度，远距离时更快
        const moveSpeed = Math.abs(diff) > 80 ? 0.35 : Math.abs(diff) > 40 ? 0.25 : 0.18
        state.playerX += diff * moveSpeed
      }
      state.playerX = Math.max(30, Math.min(BASE_W - 30, state.playerX))

      spawnDragons()
      updateDragons(dt)
      shoot()
      updateBullets()
      updatePowerUps(dt)
      updateHitFlashes(dt)
      updateParticles(dt)
      updateCoinDrops(dt)
      updateFloatTexts(dt)
      updateClouds()
      updateTimer(dt)
    }

    render()
    requestAnimationFrame(gameLoop)
  }

  initClouds()
  requestAnimationFrame(gameLoop)
}
