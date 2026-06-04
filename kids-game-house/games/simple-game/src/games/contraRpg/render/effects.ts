import type { Bullet, Powerup, Particle, Shockwave, FloatText } from '../types'

interface BulletGradients {
  outerGlow: CanvasGradient
  bodyGrad: CanvasGradient
  brightDot: CanvasGradient
}

const bulletGradCache = new Map<string, BulletGradients>()

function getBulletGradients(ctx: CanvasRenderingContext2D, color: string, isPlayer: boolean, w: number): BulletGradients {
  const key = `${color}_${isPlayer}_${Math.round(w * 10)}`
  const cached = bulletGradCache.get(key)
  if (cached) return cached

  const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 2)
  outerGlow.addColorStop(0, `${color}60`)
  outerGlow.addColorStop(0.5, `${color}20`)
  outerGlow.addColorStop(1, 'transparent')

  const bodyGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, w / 2)
  bodyGrad.addColorStop(0, '#FFFFFF')
  bodyGrad.addColorStop(0.3, color)
  bodyGrad.addColorStop(1, `${color}CC`)

  const brightDot = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 4)
  brightDot.addColorStop(0, '#FFFFFF')
  brightDot.addColorStop(1, `${color}40`)

  const gradients = { outerGlow, bodyGrad, brightDot }
  bulletGradCache.set(key, gradients)
  return gradients
}

export function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  for (const bullet of bullets) {
    ctx.save()
    ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2)

    if (bullet.isPlayerBullet) {
      ctx.fillStyle = bullet.color
      ctx.shadowColor = bullet.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.ellipse(0, 0, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(-0.5, -0.5, bullet.width / 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      for (let i = 1; i <= 3; i++) {
        const trailX = -bullet.vx * i * 0.15
        const trailY = -bullet.vy * i * 0.15
        const alpha = (1 - i * 0.3) * 0.4
        const size = bullet.width / 3 * (1 - i * 0.2)
        ctx.globalAlpha = alpha
        ctx.fillStyle = bullet.color
        ctx.beginPath()
        ctx.arc(trailX, trailY, size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = bullet.color
      ctx.shadowColor = bullet.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(0, 0, bullet.width / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.shadowBlur = 3
      ctx.beginPath()
      ctx.arc(0, 0, bullet.width / 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
    }

    ctx.restore()
  }
}

export function drawPowerups(ctx: CanvasRenderingContext2D, powerups: Powerup[]) {
  const t = Date.now()

  for (const powerup of powerups) {
    ctx.save()
    ctx.translate(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2)

    const bob = Math.sin(t / 200 + powerup.id) * 3
    ctx.translate(0, bob)

    const pulse = 1 + Math.sin(t / 150) * 0.15
    ctx.scale(pulse, pulse)

    ctx.fillStyle = powerup.color + '44'
    ctx.shadowColor = powerup.color
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(0, 0, 18, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = powerup.color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(0, 0, 14, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(0, 0, 12, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.arc(0, 0, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText(powerup.icon, 0, 1)

    ctx.restore()
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const lifeRatio = particle.life / particle.maxLife
    const size = particle.size * (0.5 + lifeRatio * 0.5)
    ctx.globalAlpha = lifeRatio * 0.8
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[]) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    ctx.save()
    ctx.globalAlpha = sw.life * 0.6
    ctx.strokeStyle = sw.color
    ctx.lineWidth = 2 + sw.life * 3
    ctx.shadowColor = sw.color
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, floatTexts: FloatText[]) {
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i]
    ctx.save()
    ctx.globalAlpha = Math.min(1, ft.life * 2)
    ctx.fillStyle = ft.color
    ctx.shadowColor = ft.color
    ctx.shadowBlur = 3
    ctx.font = `bold ${ft.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}