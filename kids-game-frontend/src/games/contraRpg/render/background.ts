import { GAME_CONFIG } from '../config'
import type { LevelConfig } from '../types/level'

export interface Star {
  x: number
  y: number
  size: number
  speed: number
  bright: number
  layer: number
}

export interface BgParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Cloud {
  x: number
  y: number
  width: number
  height: number
  speed: number
  opacity: number
}

export function initStars(): Star[] {
  const stars: Star[] = []
  for (let layer = 1; layer <= 3; layer++) {
    const count = layer === 1 ? 40 : layer === 2 ? 35 : 25
    const baseSpeed = layer === 1 ? 0.3 : layer === 2 ? 0.6 : 1.2
    const baseSize = layer === 1 ? 1 : layer === 2 ? 1.5 : 2
    const baseBright = layer === 1 ? 0.3 : layer === 2 ? 0.5 : 0.8

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
        y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
        size: Math.random() * baseSize + baseSize * 0.5,
        speed: Math.random() * baseSpeed + baseSpeed * 0.5,
        bright: Math.random() * 0.3 + baseBright,
        layer,
      })
    }
  }
  return stars
}

export function initBgParticles(): BgParticle[] {
  const particles: BgParticle[] = []
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
      y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      life: 1,
      maxLife: 1,
      color: Math.random() > 0.5 ? 'rgba(100, 150, 255, 0.3)' : 'rgba(255, 150, 100, 0.3)',
      size: Math.random() * 4 + 2,
    })
  }
  return particles
}

export function initClouds(): Cloud[] {
  const clouds: Cloud[] = []
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
      y: Math.random() * (GAME_CONFIG.CANVAS_HEIGHT * 0.4),
      width: Math.random() * 80 + 60,
      height: Math.random() * 20 + 15,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.3 + 0.1,
    })
  }
  return clouds
}

export function updateStars(stars: Star[], isScrolling: boolean, currentLevel: number) {
  const difficulty = currentLevel * 0.3 + 0.5
  for (const star of stars) {
    const speedMultiplier = star.layer * (isScrolling ? 1.5 : 1)
    star.y += star.speed * speedMultiplier * difficulty
    if (star.y > GAME_CONFIG.CANVAS_HEIGHT) {
      star.y = -2
      star.x = Math.random() * GAME_CONFIG.CANVAS_WIDTH
    }
  }
}

export function updateBgParticles(particles: BgParticle[], now: number) {
  for (const p of particles) {
    p.x += p.vx + Math.sin(now / 2000 + p.x) * 0.2
    p.y += p.vy + Math.cos(now / 3000 + p.y) * 0.15

    if (p.x < -10) p.x = GAME_CONFIG.CANVAS_WIDTH + 10
    if (p.x > GAME_CONFIG.CANVAS_WIDTH + 10) p.x = -10
    if (p.y < -10) p.y = GAME_CONFIG.CANVAS_HEIGHT + 10
    if (p.y > GAME_CONFIG.CANVAS_HEIGHT + 10) p.y = -10
  }
}

export function updateClouds(clouds: Cloud[], isScrolling: boolean) {
  for (const cloud of clouds) {
    cloud.x += cloud.speed * (isScrolling ? 2 : 1)
    if (cloud.x > GAME_CONFIG.CANVAS_WIDTH + cloud.width) {
      cloud.x = -cloud.width
      cloud.y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT * 0.4)
    }
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount * 255))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount * 255))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount * 255))
  return `#${((1 << 24) + (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b)).toString(16).slice(1)}`
}

const groundGradCache = new Map<string, CanvasGradient>()
const platformGradCache = new Map<string, CanvasGradient>()

function getGroundGrad(ctx: CanvasRenderingContext2D, colors: string[], key: string): CanvasGradient {
  const cached = groundGradCache.get(key)
  if (cached) return cached
  const grad = ctx.createLinearGradient(0, GAME_CONFIG.CANVAS_HEIGHT - 35, 0, GAME_CONFIG.CANVAS_HEIGHT)
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
  groundGradCache.set(key, grad)
  return grad
}

function getPlatformGrad(ctx: CanvasRenderingContext2D, colors: string[], key: string): CanvasGradient {
  const cached = platformGradCache.get(key)
  if (cached) return cached
  const grad = ctx.createLinearGradient(0, 0, 0, 15)
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
  platformGradCache.set(key, grad)
  return grad
}

function drawGear(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerRadius: number, teeth: number) {
  const innerRadius = outerRadius * 0.6

  ctx.beginPath()
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI * 2) / teeth
    const x1 = cx + Math.cos(angle) * outerRadius
    const y1 = cy + Math.sin(angle) * outerRadius
    const x2 = cx + Math.cos(angle + Math.PI / teeth) * innerRadius
    const y2 = cy + Math.sin(angle + Math.PI / teeth) * innerRadius

    if (i === 0) ctx.moveTo(x1, y1)
    else ctx.lineTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#555'
  ctx.beginPath()
  ctx.arc(cx, cy, outerRadius * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

function drawJungleDecor(ctx: CanvasRenderingContext2D, cameraX: number) {
  const t = Date.now()

  ctx.fillStyle = getGroundGrad(ctx, ['#1a4a1a', '#0f3d0f'], 'jungle')
  ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - 30, GAME_CONFIG.CANVAS_WIDTH, 30)

  ctx.fillStyle = '#228B22'
  for (let i = 0; i < 12; i++) {
    const x = (i * 50) - (cameraX * 0.3) % 50
    const wave = Math.sin(t / 500 + i) * 2
    ctx.beginPath()
    ctx.moveTo(x, GAME_CONFIG.CANVAS_HEIGHT - 30)
    ctx.lineTo(x + 25, GAME_CONFIG.CANVAS_HEIGHT - 45 + wave)
    ctx.lineTo(x + 50, GAME_CONFIG.CANVAS_HEIGHT - 30)
    ctx.closePath()
    ctx.fill()
  }

  for (let i = 0; i < 5; i++) {
    const x = (i * 180) - (cameraX * 0.15) % 180
    const treeHeight = 80 + Math.sin(t / 2000 + i) * 5

    ctx.fillStyle = '#5D4037'
    ctx.fillRect(x + 20, GAME_CONFIG.CANVAS_HEIGHT - 80, 15, 50)

    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.moveTo(x + 27, GAME_CONFIG.CANVAS_HEIGHT - 130 - treeHeight)
    ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT - 80)
    ctx.lineTo(x + 55, GAME_CONFIG.CANVAS_HEIGHT - 80)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#32CD32'
    ctx.beginPath()
    ctx.moveTo(x + 27, GAME_CONFIG.CANVAS_HEIGHT - 120 - treeHeight)
    ctx.lineTo(x + 12, GAME_CONFIG.CANVAS_HEIGHT - 95)
    ctx.lineTo(x + 27, GAME_CONFIG.CANVAS_HEIGHT - 90)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(34, 139, 34, 0.6)'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    const x = (i * 150 + 75) - (cameraX * 0.2) % 150
    ctx.beginPath()
    ctx.moveTo(x, 0)
    for (let j = 0; j < 8; j++) {
      const y = j * 50
      const wave = Math.sin(t / 800 + i + j) * 15
      ctx.lineTo(x + wave, y)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 3; i++) {
    const x = (i * 200 + 50) - (cameraX * 0.25) % 200
    const scale = 0.8 + Math.sin(t / 1000 + i) * 0.1

    ctx.save()
    ctx.translate(x, GAME_CONFIG.CANVAS_HEIGHT - 35)
    ctx.scale(scale, scale)

    ctx.fillStyle = '#F5F5DC'
    ctx.fillRect(-5, 0, 10, 15)

    ctx.fillStyle = '#FF6B6B'
    ctx.beginPath()
    ctx.arc(0, -8, 15, Math.PI, 0)
    ctx.fill()

    ctx.fillStyle = '#FFE4E1'
    ctx.beginPath()
    ctx.arc(-5, -10, 3, 0, Math.PI * 2)
    ctx.arc(5, -7, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

function drawFactoryDecor(ctx: CanvasRenderingContext2D, cameraX: number) {
  const t = Date.now()

  ctx.fillStyle = getGroundGrad(ctx, ['#4a4a5a', '#3a3a4a', '#2a2a3a'], 'factory')
  ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - 35, GAME_CONFIG.CANVAS_WIDTH, 35)

  ctx.fillStyle = '#5a5a6a'
  for (let i = 0; i < 15; i++) {
    const x = (i * 40) - (cameraX * 0.2) % 40
    ctx.fillRect(x, GAME_CONFIG.CANVAS_HEIGHT - 35, 35, 2)
    ctx.fillRect(x, GAME_CONFIG.CANVAS_HEIGHT - 18, 35, 2)
  }

  for (let i = 0; i < 4; i++) {
    const x = (i * 170) - (cameraX * 0.15) % 170

    ctx.fillStyle = '#666'
    ctx.fillRect(x + 80, GAME_CONFIG.CANVAS_HEIGHT - 120, 8, 80)

    ctx.fillStyle = '#555'
    ctx.beginPath()
    ctx.roundRect(x, GAME_CONFIG.CANVAS_HEIGHT - 140, 170, 15, 7)
    ctx.fill()

    ctx.fillStyle = '#777'
    ctx.beginPath()
    ctx.roundRect(x + 5, GAME_CONFIG.CANVAS_HEIGHT - 138, 160, 3, 1)
    ctx.fill()
  }

  for (let i = 0; i < 3; i++) {
    const x = (i * 250 + 100) - (cameraX * 0.2) % 250
    const rotation = (t / 3000) * (i % 2 === 0 ? 1 : -1)

    ctx.save()
    ctx.translate(x, GAME_CONFIG.CANVAS_HEIGHT - 80)
    ctx.rotate(rotation)

    ctx.fillStyle = '#666'
    drawGear(ctx, 0, 0, 25, 8)

    ctx.restore()
  }

  ctx.fillStyle = '#FFD700'
  for (let i = 0; i < 8; i++) {
    const x = (i * 70) - (cameraX * 0.25) % 70
    ctx.fillRect(x, GAME_CONFIG.CANVAS_HEIGHT - 35, 35, 3)
    ctx.fillRect(x + 35, GAME_CONFIG.CANVAS_HEIGHT - 35, 5, 3)
  }

  for (let i = 0; i < 5; i++) {
    const x = (i * 120 + 60) - (cameraX * 0.3) % 120
    const sparkY = GAME_CONFIG.CANVAS_HEIGHT - 60 - Math.sin(t / 200 + i) * 15
    const sparkSize = 2 + Math.sin(t / 100 + i)

    ctx.fillStyle = `rgba(255, ${150 + Math.sin(t / 50 + i) * 50}, 0, ${0.6 + Math.sin(t / 50 + i) * 0.4})`
    ctx.shadowColor = '#FF8C00'
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(x, sparkY, sparkSize, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0
}

function drawAirDecor(ctx: CanvasRenderingContext2D, cameraX: number) {
  const t = Date.now()

  for (let layer = 0; layer < 3; layer++) {
    const opacity = [0.15, 0.1, 0.08][layer]
    const speed = [0.1, 0.15, 0.2][layer]
    const yBase = [30, 80, 130][layer]
    const size = [1.2, 1, 0.8][layer]

    for (let i = 0; i < 4; i++) {
      const x = (i * 150 + layer * 50) - (cameraX * speed) % 150
      const cloudY = yBase + Math.sin(t / 5000 + i + layer) * 10

      ctx.fillStyle = `rgba(200, 200, 220, ${opacity})`
      ctx.beginPath()

      for (let j = 0; j < 5; j++) {
        const cx = x + j * 25
        const cy = cloudY + Math.sin(j * Math.PI / 4) * 8
        const r = (12 + Math.sin(t / 2000 + j) * 2) * size
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }

      ctx.fill()
    }
  }

  for (let i = 0; i < 3; i++) {
    const x = (i * 200) - (cameraX * 0.25) % 200
    const platformY = GAME_CONFIG.CANVAS_HEIGHT * 0.3 + Math.sin(t / 3000 + i) * 10

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(x - 5, platformY + 5, 100, 8)

    ctx.fillStyle = getPlatformGrad(ctx, ['#5a6a8a', '#4a5a7a', '#3a4a6a'], 'air')
    ctx.beginPath()
    ctx.roundRect(x, platformY, 90, 15, 5)
    ctx.fill()

    ctx.fillStyle = '#6a7a9a'
    ctx.fillRect(x + 5, platformY + 2, 80, 3)
  }

  for (let i = 0; i < 4; i++) {
    const x = (i * 180 + 90) - (cameraX * 0.3) % 180
    const y = 100 + (i % 2) * 80
    const pulse = 0.8 + 0.2 * Math.sin(t / 800 + i)
    const radius = 25 * pulse

    ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 + Math.sin(t / 600 + i) * 0.2})`
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = `rgba(150, 200, 255, ${0.3 + Math.sin(t / 400 + i) * 0.2})`
    ctx.beginPath()
    ctx.arc(x, y, 8 * pulse, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 6; i++) {
    const x = (i * 120 + 60) - (cameraX * 0.35) % 120
    const y = GAME_CONFIG.CANVAS_HEIGHT * 0.5 + Math.sin(t / 1500 + i) * 30
    const rotation = t / 2000 + i

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + Math.sin(t / 300 + i) * 0.2})`
    ctx.shadowColor = '#64C8FF'
    ctx.shadowBlur = 4

    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(6, 0)
    ctx.lineTo(0, 8)
    ctx.lineTo(-6, 0)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }
  ctx.shadowBlur = 0
}

function drawFinalDecor(ctx: CanvasRenderingContext2D, cameraX: number) {
  const t = Date.now()
  const centerX = GAME_CONFIG.CANVAS_WIDTH / 2
  const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2
  const pulse = 1 + Math.sin(t / 500) * 0.1
  const rotation = t / 3000

  const blackHoleGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, GAME_CONFIG.CANVAS_WIDTH * 0.6)
  blackHoleGrad.addColorStop(0, 'rgba(10, 0, 20, 0.8)')
  blackHoleGrad.addColorStop(0.3, 'rgba(30, 10, 60, 0.5)')
  blackHoleGrad.addColorStop(0.6, 'rgba(50, 20, 100, 0.3)')
  blackHoleGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = blackHoleGrad
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)

  for (let i = 0; i < 3; i++) {
    const ringRadius = 80 + i * 40
    const ringPulse = 0.95 + 0.05 * Math.sin(t / (300 + i * 100))
    const opacity = 0.3 - i * 0.08

    ctx.strokeStyle = `rgba(155, 89, 182, ${opacity})`
    ctx.lineWidth = 3 - i * 0.5
    ctx.beginPath()
    ctx.arc(0, 0, ringRadius * ringPulse, 0, Math.PI * 2)
    ctx.stroke()

    for (let j = 0; j < 12; j++) {
      const angle = (j * Math.PI * 2) / 12 + rotation * (i + 1)
      const px = Math.cos(angle) * ringRadius * ringPulse
      const py = Math.sin(angle) * ringRadius * ringPulse
      const particlePulse = 0.6 + 0.4 * Math.sin(t / 200 + j + i * 5)

      ctx.fillStyle = `rgba(200, 150, 255, ${opacity * particlePulse})`
      ctx.shadowColor = '#C89BFF'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(px, py, 3 * particlePulse, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.shadowBlur = 0
  ctx.restore()

  const corePulse = 0.8 + 0.2 * Math.sin(t / 150)
  const coreGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50 * corePulse)
  coreGlow.addColorStop(0, 'rgba(255, 0, 150, 0.8)')
  coreGlow.addColorStop(0.3, 'rgba(155, 89, 182, 0.5)')
  coreGlow.addColorStop(0.6, 'rgba(100, 50, 150, 0.3)')
  coreGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = coreGlow
  ctx.beginPath()
  ctx.arc(centerX, centerY, 50 * corePulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FF0099'
  ctx.shadowColor = '#FF0099'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(centerX, centerY, 15 * corePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(-rotation)

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6
    const runeRadius = 180
    const px = Math.cos(angle) * runeRadius
    const py = Math.sin(angle) * runeRadius

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(rotation * 2 + angle)

    ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 + Math.sin(t / 400 + i) * 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-15, 0)
    ctx.lineTo(15, 0)
    ctx.moveTo(0, -15)
    ctx.lineTo(0, 15)
    ctx.stroke()

    ctx.restore()
  }
  ctx.restore()

  for (let i = 0; i < 2; i++) {
    if (Math.random() < 0.02) {
      const startX = Math.random() * GAME_CONFIG.CANVAS_WIDTH
      const startY = Math.random() * GAME_CONFIG.CANVAS_HEIGHT * 0.5

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 10

      ctx.beginPath()
      ctx.moveTo(startX, startY)

      let x = startX
      let y = startY
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 60
        y += 40 + Math.random() * 30
        ctx.lineTo(x, y)
      }

      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  const groundY = GAME_CONFIG.CANVAS_HEIGHT - 40
  ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)'
  ctx.lineWidth = 3

  for (let i = 0; i < 4; i++) {
    const x = (i * 150 + 75) - (cameraX * 0.1) % 150
    const runePulse = 0.9 + 0.1 * Math.sin(t / 600 + i)

    ctx.save()
    ctx.translate(x, groundY)
    ctx.scale(runePulse, runePulse)
    ctx.rotate(rotation + i)

    ctx.beginPath()
    for (let j = 0; j < 8; j++) {
      const angle = (j * Math.PI * 2) / 8
      const r = j % 2 === 0 ? 25 : 15
      const px = Math.cos(angle) * r
      const py = Math.sin(angle) * r
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  stars: Star[],
  bgParticles: BgParticle[],
  clouds: Cloud[],
  cameraX: number,
) {
  const bgColors: Record<string, { top: string; mid: string; bottom: string; accent: string; gradientTop: string; gradientMid: string; gradientBottom: string }> = {
    '丛林突围': {
      top: '#0a3d0a', mid: '#1a5a1a', bottom: '#0d280d', accent: '#2d8a2d',
      gradientTop: '#1a4a1a', gradientMid: '#0f3d0f', gradientBottom: '#052505',
    },
    '机械防线': {
      top: '#1a1a2e', mid: '#2a2a4a', bottom: '#151528', accent: '#4a4a6a',
      gradientTop: '#2a2a4a', gradientMid: '#1a1a3a', gradientBottom: '#0f0f25',
    },
    '空中突袭': {
      top: '#0f0f1a', mid: '#1a1a3a', bottom: '#0a0a15', accent: '#3a3a5a',
      gradientTop: '#1a1a3a', gradientMid: '#0f0f25', gradientBottom: '#050515',
    },
    '最终决战': {
      top: '#050510', mid: '#0a0a20', bottom: '#020208', accent: '#5a2d7a',
      gradientTop: '#1a0a2a', gradientMid: '#0a0a1f', gradientBottom: '#020208',
    },
  }

  const colors = bgColors[level.name] || bgColors['丛林突围']
  const t = Date.now()

  const mainGrad = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT)
  const pulse = 0.03 * Math.sin(t / 3000)
  mainGrad.addColorStop(0, adjustColor(colors.gradientTop, pulse))
  mainGrad.addColorStop(0.4, adjustColor(colors.gradientMid, pulse * 0.3))
  mainGrad.addColorStop(0.6, adjustColor(colors.gradientMid, -pulse * 0.3))
  mainGrad.addColorStop(1, adjustColor(colors.gradientBottom, -pulse))
  ctx.fillStyle = mainGrad
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

  const glowGrad = ctx.createRadialGradient(
    GAME_CONFIG.CANVAS_WIDTH / 2,
    GAME_CONFIG.CANVAS_HEIGHT / 2,
    0,
    GAME_CONFIG.CANVAS_WIDTH / 2,
    GAME_CONFIG.CANVAS_HEIGHT / 2,
    GAME_CONFIG.CANVAS_WIDTH * 0.8,
  )
  glowGrad.addColorStop(0, `rgba(99, 102, 241, ${0.1 + Math.sin(t / 4000) * 0.05})`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)

  for (const cloud of clouds) {
    ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`
    ctx.beginPath()
    const segments = 5
    for (let i = 0; i < segments; i++) {
      const x = cloud.x + (cloud.width / (segments - 1)) * i
      const y = cloud.y + Math.sin(i * Math.PI / (segments - 1)) * cloud.height * 0.5
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.quadraticCurveTo(cloud.x + cloud.width, cloud.y + cloud.height, cloud.x + cloud.width / 2, cloud.y + cloud.height * 1.5)
    ctx.quadraticCurveTo(cloud.x, cloud.y + cloud.height, cloud.x, cloud.y)
    ctx.fill()
  }

  for (const star of stars) {
      const twinkle = 0.6 + 0.4 * Math.sin(t / 150 + star.x * 0.1)
      const alpha = star.bright * twinkle * star.layer * 0.35
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = star.layer * 3
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

  for (const p of bgParticles) {
    const pulse2 = 0.6 + 0.4 * Math.sin(t / 500 + p.x)
    ctx.globalAlpha = 0.18 * pulse2
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (level.name === '丛林突围') {
    drawJungleDecor(ctx, cameraX)
  } else if (level.name === '机械防线') {
    drawFactoryDecor(ctx, cameraX)
  } else if (level.name === '空中突袭') {
    drawAirDecor(ctx, cameraX)
  } else if (level.name === '最终决战') {
    drawFinalDecor(ctx, cameraX)
  }
}

export function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: { x: number; y: number; width: number; height: number }[], cameraX: number) {
  for (const platform of platforms) {
    const px = platform.x - cameraX

    ctx.fillStyle = '#4a4a5a'
    ctx.fillRect(px, platform.y, platform.width, platform.height)

    ctx.fillStyle = '#6a6a7a'
    ctx.fillRect(px, platform.y, platform.width, 4)

    ctx.strokeStyle = '#1a1a2a'
    ctx.lineWidth = 2
    ctx.strokeRect(px, platform.y, platform.width, platform.height)

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(px, platform.y + platform.height, platform.width, 8)
  }
}

export function drawExit(ctx: CanvasRenderingContext2D, exit: { x: number; y: number; width: number; height: number }, cameraX: number) {
  const px = exit.x - cameraX
  const t = Date.now()
  const pulse = 1 + Math.sin(t / 200) * 0.08
  const rotation = t / 500

  ctx.save()

  // 外层光环效果
  const outerGlow = ctx.createRadialGradient(px + exit.width / 2, exit.y + exit.height / 2, 0, px + exit.width / 2, exit.y + exit.height / 2, exit.width * 1.5)
  outerGlow.addColorStop(0, 'rgba(138, 43, 226, 0.4)')
  outerGlow.addColorStop(0.3, 'rgba(75, 0, 130, 0.3)')
  outerGlow.addColorStop(0.6, 'rgba(0, 191, 255, 0.2)')
  outerGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = outerGlow
  ctx.fillRect(px - exit.width, exit.y - exit.height, exit.width * 3, exit.height * 3)

  // 传送门主体
  ctx.translate(px + exit.width / 2, exit.y + exit.height / 2)
  ctx.scale(pulse, pulse)

  // 内圈漩涡效果
  ctx.save()
  ctx.rotate(rotation)
  const swirlGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, exit.width / 2 - 5)
  swirlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  swirlGrad.addColorStop(0.2, 'rgba(147, 112, 219, 0.8)')
  swirlGrad.addColorStop(0.5, 'rgba(75, 0, 130, 0.6)')
  swirlGrad.addColorStop(0.8, 'rgba(0, 191, 255, 0.4)')
  swirlGrad.addColorStop(1, 'rgba(0, 0, 139, 0.3)')
  ctx.fillStyle = swirlGrad
  ctx.beginPath()
  ctx.roundRect(-exit.width / 2 + 5, -exit.height / 2 + 5, exit.width - 10, exit.height - 10, 15)
  ctx.fill()
  ctx.restore()

  // 边框发光效果
  const frameGrad = ctx.createLinearGradient(-exit.width / 2, 0, exit.width / 2, 0)
  frameGrad.addColorStop(0, '#9400D3')
  frameGrad.addColorStop(0.3, '#4B0082')
  frameGrad.addColorStop(0.5, '#00BFFF')
  frameGrad.addColorStop(0.7, '#4B0082')
  frameGrad.addColorStop(1, '#9400D3')

  ctx.strokeStyle = frameGrad
  ctx.lineWidth = 4
  ctx.shadowColor = '#00BFFF'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.roundRect(-exit.width / 2, -exit.height / 2, exit.width, exit.height, 15)
  ctx.stroke()

  // 边框闪烁效果
  const flashIntensity = 0.5 + Math.sin(t / 100) * 0.3
  ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity})`
  ctx.lineWidth = 2
  ctx.shadowColor = '#FFFFFF'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.roundRect(-exit.width / 2 + 2, -exit.height / 2 + 2, exit.width - 4, exit.height - 4, 13)
  ctx.stroke()

  // 传送门内部星星粒子
  for (let i = 0; i < 12; i++) {
    const starAngle = (Math.PI * 2 / 12) * i + t / 200
    const starDist = (exit.width / 2 - 20) * (0.5 + Math.sin(t / 300 + i) * 0.3)
    const starX = Math.cos(starAngle) * starDist
    const starY = Math.sin(starAngle) * starDist
    const starSize = 2 + Math.sin(t / 150 + i) * 1
    const starAlpha = 0.6 + Math.sin(t / 100 + i) * 0.4

    ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`
    ctx.shadowColor = '#FFFFFF'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(starX, starY, starSize, 0, Math.PI * 2)
    ctx.fill()
  }

  // 中心箭头图标
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = '#00FFFF'
  ctx.shadowBlur = 25
  ctx.font = 'bold 36px "Arial Black", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('▶', 0, 0)

  ctx.shadowBlur = 0
  ctx.restore()

  // 外圈环绕粒子
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i + t / 250
    const dist = exit.width / 2 + 20 + Math.sin(t / 150 + i) * 8
    const ex = px + exit.width / 2 + Math.cos(angle) * dist
    const ey = exit.y + exit.height / 2 + Math.sin(angle) * dist
    const size = 4 + Math.sin(t / 80 + i) * 2
    const alpha = 0.7 + Math.sin(t / 120 + i) * 0.3

    const particleGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, size)
    particleGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    particleGrad.addColorStop(0.5, `rgba(147, 112, 219, ${alpha * 0.8})`)
    particleGrad.addColorStop(1, 'transparent')
    
    ctx.fillStyle = particleGrad
    ctx.shadowColor = '#9370DB'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(ex, ey, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 底部发光效果
  const bottomGlow = ctx.createRadialGradient(px + exit.width / 2, exit.y + exit.height, 0, px + exit.width / 2, exit.y + exit.height, exit.width / 2)
  bottomGlow.addColorStop(0, 'rgba(147, 112, 219, 0.5)')
  bottomGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = bottomGlow
  ctx.fillRect(px - exit.width / 2, exit.y + exit.height / 2, exit.width, exit.height / 2)

  ctx.shadowBlur = 0
}