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
  attachedPowerUp?: 'damage' | 'multiShot' | 'pierce' | 'heal'
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

    const p1 = this.route.points[segmentIndex]
    const p2 = this.route.points[segmentIndex + 1]

    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
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

// 龙实体
export interface Dragon {
  id: number
  segments: DragonSegment[]
  alive: boolean
  type: 'small' | 'medium' | 'large' | 'elite' | 'boss' | 'treasure' | 'coin'
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

// 道具
export interface PowerUp {
  x: number
  y: number
  type: 'damage' | 'multiShot' | 'pierce' | 'heal'
  life: number
  bobPhase: number
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
  startTime: number
}

// 游戏状态
export interface GameState {
  mode: 'challenge' | 'endless'
  phase: 'start' | 'playing' | 'paused' | 'buffSelect' | 'gameOver' | 'routeEdit'
  level: number
  score: number
  coins: number
  combo: number
  comboTimer: number
  maxCombo: number
  totalKills: number
  timeLeft: number
  playerX: number
  playerHP: number
  playerMaxHP: number
  invincibleTimer: number
  bulletDamage: number
  bulletSpeed: number
  shootCooldown: number
  bulletCount: number
  bulletPierce: number
  lastShotTime: number
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
  currentScene: number
  isPaused: boolean
  touch: TouchState
  dragCount: number
  maxDragons: number
  isRouteEditMode: boolean
  isRouteSelectMode: boolean
}