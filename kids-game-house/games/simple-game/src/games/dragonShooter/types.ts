// ============================================
// dragonShooter 类型定义（无依赖）
// ============================================

// 路线点
export interface RoutePoint {
  x: number
  y: number
}

// 自定义路线
export interface CustomRoute {
  id: string
  name: string
  points: RoutePoint[]
  // 玩家初始位置（画布坐标）
  playerStartX?: number
  playerStartY?: number
}

// 龙身体节
export interface DragonSegment {
  x: number
  y: number
  size: number
  color: string
  wobblePhase: number
  wobbleAmp: number
  wobbleFreq: number
  isHead: boolean
  hasHorn: boolean
  hasPattern: boolean
  attachedPowerUp?: PowerUpCardType
  hp: number
  maxHp: number
}

// 命中闪白效果
export interface HitFlash {
  x: number
  y: number
  timer: number
  originalColor: string
}

// RouteFollower 类
export class RouteFollower {
  private route: CustomRoute
  private speed: number
  private currentIndex: number = 0
  private t: number = 0
  private cumulativeDistances: number[] = []
  private totalDistance: number = 0

  constructor(route: CustomRoute, speed: number = 8) {
    this.route = route
    this.speed = speed

    this.cumulativeDistances = [0]
    for (let i = 1; i < route.points.length; i++) {
      const dx = route.points[i].x - route.points[i-1].x
      const dy = route.points[i].y - route.points[i-1].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      this.cumulativeDistances.push(this.cumulativeDistances[i-1] + dist)
    }
    this.totalDistance = this.cumulativeDistances[this.cumulativeDistances.length - 1]
  }

  update(dt: number): { x: number; y: number } | null {
    if (this.route.points.length < 2) return null

    const avgPointDistance = 5
    const pixelSpeed = this.speed * avgPointDistance
    const moveDistance = pixelSpeed * dt
    let currentDist = this.getCurrentDistance()
    currentDist += moveDistance

    if (currentDist >= this.totalDistance) {
      currentDist = this.totalDistance
      this.setCurrentDistance(currentDist)
      ;(this as any)._currentDistance = currentDist
      return { ...this.route.points[this.route.points.length - 1] }
    }

    this.setCurrentDistance(currentDist)
    ;(this as any)._currentDistance = currentDist
    return this.getPositionByDistance(currentDist)
  }

  getPositionByDistance(distance: number): { x: number; y: number } {
    let left = 0
    let right = this.cumulativeDistances.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.cumulativeDistances[mid] < distance) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    const segmentIndex = Math.max(0, left - 1)
    const segStartDist = this.cumulativeDistances[segmentIndex]
    const segEndDist = this.cumulativeDistances[segmentIndex + 1]
    const segLength = segEndDist - segStartDist
    const t = segLength > 0 ? (distance - segStartDist) / segLength : 0

    // Catmull-Rom 样条平滑：取前后各一个邻接点做曲线插值
    // 边界处用端点镜像，保证曲线连续
    const pts = this.route.points
    const n = pts.length
    const p0 = pts[Math.max(0, segmentIndex - 1)]
    const p1 = pts[segmentIndex]
    const p2 = pts[Math.min(n - 1, segmentIndex + 1)]
    const p3 = pts[Math.min(n - 1, segmentIndex + 2)]

    const t2 = t * t
    const t3 = t2 * t
    // Catmull-Rom 矩阵系数
    const bx = -0.5 * p0.x + 1.5 * p1.x - 1.5 * p2.x + 0.5 * p3.x
    const ax = 1.0 * p0.x - 2.5 * p1.x + 2.0 * p2.x - 0.5 * p3.x
    const cx = -0.5 * p0.x + 0.5 * p2.x
    const dx = 1.0 * p1.x
    const by = -0.5 * p0.y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3.y
    const ay = 1.0 * p0.y - 2.5 * p1.y + 2.0 * p2.y - 0.5 * p3.y
    const cy = -0.5 * p0.y + 0.5 * p2.y
    const dy = 1.0 * p1.y

    return {
      x: bx * t3 + ax * t2 + cx * t + dx,
      y: by * t3 + ay * t2 + cy * t + dy
    }
  }

  private getCurrentDistance(): number {
    if (this.currentIndex >= this.cumulativeDistances.length - 1) {
      return this.totalDistance
    }
    const segStartDist = this.cumulativeDistances[this.currentIndex]
    const segEndDist = this.cumulativeDistances[this.currentIndex + 1]
    const segLength = segEndDist - segStartDist
    return segStartDist + segLength * this.t
  }

  private setCurrentDistance(distance: number) {
    let left = 0
    let right = this.cumulativeDistances.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.cumulativeDistances[mid] < distance) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    const segmentIndex = Math.max(0, left - 1)
    this.currentIndex = segmentIndex
    const segStartDist = this.cumulativeDistances[segmentIndex]
    const segEndDist = this.cumulativeDistances[segmentIndex + 1]
    const segLength = segEndDist - segStartDist
    this.t = segLength > 0 ? (distance - segStartDist) / segLength : 0
  }

  getPositionAt(progress: number): { x: number; y: number } | null {
    if (this.route.points.length < 2) return null

    const lastIndex = this.route.points.length - 1
    if (progress >= lastIndex) {
      return { ...this.route.points[lastIndex] }
    }

    if (progress < 0) {
      const p0 = this.route.points[0]
      const p1 = this.route.points[1]
      const dx = p1.x - p0.x
      const dy = p1.y - p0.y
      return {
        x: p0.x + dx * progress,
        y: p0.y + dy * progress
      }
    }

    const index = Math.floor(progress)
    const t = progress - index

    if (index < 0 || index >= this.route.points.length - 1) {
      if (index < 0) {
        return { ...this.route.points[0] }
      } else {
        return { ...this.route.points[this.route.points.length - 1] }
      }
    }

    const p1 = this.route.points[index]
    const p2 = this.route.points[index + 1]

    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    }
  }

  getTotalLength(): number {
    return this.route.points.length
  }

  getPixelLength(): number {
    let len = 0
    for (let i = 1; i < this.route.points.length; i++) {
      const dx = this.route.points[i].x - this.route.points[i - 1].x
      const dy = this.route.points[i].y - this.route.points[i - 1].y
      len += Math.sqrt(dx * dx + dy * dy)
    }
    return len
  }

  getProgress(): number {
    if (this.route.points.length < 2) return 1
    return Math.min(1, (this.currentIndex + this.t) / (this.route.points.length - 1))
  }

  setProgress(progress: number) {
    const totalPoints = this.route.points.length - 1
    const target = progress * totalPoints
    this.currentIndex = Math.floor(target)
    this.t = target - this.currentIndex
    if (this.currentIndex >= totalPoints) {
      this.currentIndex = totalPoints - 1
      this.t = 1
    }
  }

  isFinished(): boolean {
    return this.currentIndex >= this.route.points.length - 1
  }

  reset() {
    this.currentIndex = 0
    this.t = 0
  }
}

// 龙实体（无分裂，纯击打长龙）
export interface Dragon {
  id: number
  segments: DragonSegment[]
  alive: boolean
  type: 'small' | 'medium' | 'large' | 'elite' | 'boss'
  speed: number
  slowed: boolean
  slowTimer: number
  routeFollower: RouteFollower
  progress: number
  spawnX: number
  retracting: boolean
  retractTimer: number
  totalSegments: number
  isRetracting: boolean
  retractAnimProgress: number
  retractStartProgress: number
  retractTargetProgress: number
  // 🎯 新增：路线索引，用于区分不同路线的龙
  routeIndex?: number
  // 灼烧/毒素状态
  burnTimer: number
  burnDamage: number
  poisonStacks: number
  poisonTimer: number
  // _isRetracting 标记（渲染器用）
  _isRetracting?: boolean
  // 动态加速状态（内部使用）
  _boostTimer?: number      // 加速剩余时间
  _boostCheckInterval?: number  // 下次检查加速的倒计时（5秒间隔）
  _isBoosting?: boolean     // 是否正在加速
}

// 子弹
export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  pierce: number
  size: number
}

// 粒子效果
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

// 飘字
export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  vy: number
  size: number
}

// 金币掉落
export interface CoinDrop {
  x: number
  y: number
  vy: number
  life: number
}

// 云朵
export interface Cloud {
  x: number
  y: number
  speed: number
  size: number
  opacity: number
}

// 道具（直接拾取型，用旧版 type）
export interface PowerUp {
  x: number
  y: number
  type: 'damage' | 'multiShot' | 'pierce' | 'heal'
  bobPhase: number
  life: number
}

// 尘埃
export interface Dust {
  x: number
  y: number
  speed: number
  size: number
}

// 触摸状态
export interface TouchState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number  // 🎯 新增：当前Y坐标，用于实时跟随鼠标位置
  startTime: number
}

// 游戏状态
export interface GameState {
  mode: 'challenge'
  phase: 'start' | 'playing' | 'paused' | 'buffSelect' | 'powerup_select' | 'gameOver' | 'routeEdit' | 'levelComplete'
  level: number
  score: number
  coins: number
  combo: number
  comboTimer: number
  maxCombo: number
  totalKills: number
  timeLeft: number
  playerX: number
  playerY: number          // 玩家Y坐标（底部或中间）
  playerStartX: number     // 玩家初始位置X
  playerStartY: number     // 玩家初始位置Y
  shootAngle: number       // 射击角度（弧度，-PI/2为向上）
  canMove: boolean         // 是否可以移动
  isSelected: boolean      // 玩家是否被选中（选中才能移动，未选中只能调射击方向）
  playerHP: number
  playerMaxHP: number
  invincibleTimer: number
  // === BUFF 叠加计数（可叠加道具） ===
  rapidFireStacks: number     // 迅击弹
  multiShotStacks: number     // 多重弹
  armorPierceStacks: number   // 破甲弹
  heavyHitStacks: number      // 重击弹
  rapidBurstStacks: number    // 连射增幅
  autoAimStacks: number       // 精准锁定
  blastStacks: number         // 爆裂冲击
  slashStacks: number         // 横向横扫
  ringWaveStacks: number      // 环形震荡（持续）
  windPressureStacks: number  // 全屏风压（持续）
  chainBlastStacks: number    // 分段爆破
  splashStacks: number        // 范围溅射
  burnStacks: number          // 持续灼烧（叠加层数）
  slowFieldStacks: number     // 迟缓领域（持续）
  toxinStacks: number         // 毒素侵蚀（叠加层数）
  energyFieldStacks: number   // 能量涌动（持续）
  defDownStacks: number       // 减防光环（持续）
  // === 一次性/状态型道具 ===
  freezeTimer: number
  bombReady: boolean
  bombDamageStacks: number
  shieldTimer: number
  slowAllTimer: number
  bigShotTimer: number        // 巨型灵珠（持续计时）
  bigShotStacks: number       // 巨型灵珠（叠加）
  lightningStacks: number     // 连锁闪电
  slowBulletStacks: number    // 灵珠缓行
  slowBulletTimer: number     // 灵珠缓行（持续计时）
  // === 斩杀型 ===
  slashBladeStacks: number    // 断龙利刃
  executeWaveStacks: number   // 斩杀剑气
  critStacks: number          // 极限暴击
  // === 基础射击参数 ===
  bulletDamage: number
  bulletSpeed: number
  shootCooldown: number
  bulletCount: number
  bulletPierce: number
  lastShotTime: number
  // === 实体列表 ===
  dragons: Dragon[]
  bullets: Bullet[]
  particles: Particle[]
  powerUps: PowerUp[]
  floatTexts: FloatText[]
  coinDrops: CoinDrop[]
  clouds: Cloud[]
  dusts: Dust[]
  lastDragonId: number
  levelProgress: number
  levelTarget: number
  dragonsSpawnedInLevel: number  // 本关已生成的龙总数
  // 关卡过渡状态
  levelTransition: boolean
  levelTransitionTimer: number
  // 关卡完成统计
  levelCompleteScore: number
  levelCompleteKills: number
  currentScene: number
  isPaused: boolean
  touch: TouchState
  dragCount: number
  maxDragons: number
  isRouteEditMode: boolean
  isRouteSelectMode: boolean
  powerupSelect: PowerUpSelectState | null
  activeBuffs: ActiveBuff[]
  // 🎯 屏幕震动效果
  screenShake: {
    intensity: number  // 震动强度
    duration: number   // 剩余持续时间
    cooldown: number   // 🎯 冷却时间（秒），防止频繁触发
  }
}

// ============================================
// 道具分类 & 类型
// ============================================
export type PowerUpCategory = 'attack' | 'burst' | 'sustain' | 'execute'

/** 20个道具类型 */
export type PowerUpCardType =
  // 普攻强化（6）
  | 'rapidFire'   // 迅击弹：攻速+
  | 'multiShot'   // 多重弹：弹道+
  | 'armorPierce' // 破甲弹：无视防御
  | 'heavyHit'    // 重击弹：单发伤害+
  | 'rapidBurst'  // 连射增幅：短时极速连射
  | 'autoAim'     // 精准锁定：子弹吸附
  // 范围爆发（6）
  | 'blast'       // 爆裂冲击：小范围爆炸
  | 'slash'       // 横向横扫：横向AOE
  | 'ringWave'    // 环形震荡：持续环形波
  | 'windPressure'// 全屏风压：大范围减速
  | 'chainBlast'  // 分段爆破：连锁爆破
  | 'splash'      // 范围溅射：小幅溅射
  // 持续压制（5）
  | 'burn'        // 持续灼烧
  | 'slowField'   // 迟缓领域
  | 'toxin'       // 毒素侵蚀（叠加）
  | 'energyField' // 能量涌动（持续伤害圈）
  | 'defDown'     // 减防光环
  // 特殊斩杀（3）
  | 'slashBlade'  // 断龙利刃：概率直接斩断
  | 'executeWave' // 斩杀剑气：纵向长剑气
  | 'crit'        // 极限暴击：高暴击率

/** 关卡配置 */
export interface LevelConfig {
  /** 关卡号 */
  level: number
  /** 龙基础HP倍率 */
  hpMult: number
  /** 龙速度倍率 */
  speedMult: number
  /** 每次掉落需要的击杀数 */
  killsPerDrop: number
  /** 可用道具分类 ['attack','burst','sustain','execute'] */
  allowedCategories: PowerUpCategory[]
  /** 是否生成精英/BOSS */
  eliteChance: number
  bossChance: number
  /** 龙身节数基数 */
  baseSegments: number
}

/** 道具选择页面状态 */
export interface PowerUpSelectState {
  cards: PowerUpCard[]
  revealedIdx: number | null
  revealProgress: number
  closeProgress: number
  closing: boolean
}

/** 道具卡片 */
export interface PowerUpCard {
  type: PowerUpCardType
  category: PowerUpCategory
  name: string
  desc: string
  color: string
  icon: string
}

/** 有持续时间的主动道具 */
export interface ActiveBuff {
  type: string        // 唯一标识（如 'rapidFire', 'slowField'）
  name: string        // 显示名
  icon: string        // emoji 图标
  color: string       // 颜色
  duration: number    // 总持续时间（秒）
  remaining: number   // 剩余时间（秒）
  stacks?: number     // 叠加层数（可选）
}