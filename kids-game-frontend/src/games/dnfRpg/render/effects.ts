import type { Particle, Shockwave, FloatText, Bullet, DropItem } from '../types'
import * as C from '../config'
import { EQUIP_QUALITY_COLORS } from '../types'

// ============ 粒子系统绘制 ============
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], now: number): void {
  particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(p.x, p.y)

    if (p.rotation !== undefined) {
      ctx.rotate(p.rotation * Math.PI / 180)
    }

    ctx.fillStyle = p.color

    switch (p.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        // 发光内圈
        ctx.globalAlpha = alpha * 0.6
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'star':
        ctx.shadowColor = p.color
        ctx.shadowBlur = 5
        drawStarShape(ctx, 0, 0, p.size)
        break

      case 'spark':
        ctx.shadowColor = p.color
        ctx.shadowBlur = 4
        ctx.fillRect(-p.size / 2, -1.5, p.size, 3)
        // 中间亮线
        ctx.fillStyle = '#FFFFFF'
        ctx.globalAlpha = alpha * 0.8
        ctx.fillRect(-p.size / 4, -0.5, p.size / 2, 1)
        break

      case 'glow': {
        // 柔和光晕粒子（径向渐变）
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
        grad.addColorStop(0, p.color)
        grad.addColorStop(0.4, p.color + 'AA')
        grad.addColorStop(1, p.color + '00')
        ctx.fillStyle = grad
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        // 核心亮点
        ctx.globalAlpha = alpha * 0.9
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      case 'ring': {
        // 圆环粒子
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2
        ctx.shadowColor = p.color
        ctx.shadowBlur = 5
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.stroke()
        // 内圈细线
        ctx.globalAlpha = alpha * 0.6
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2)
        ctx.stroke()
        break
      }

      case 'text':
        if (p.text) {
          ctx.shadowColor = 'rgba(0,0,0,0.6)'
          ctx.shadowBlur = 3
          ctx.font = `bold ${p.size}px Arial`
          ctx.textAlign = 'center'
          ctx.fillText(p.text, 0, 0)
        }
        break
    }

    ctx.restore()
  })
}

function drawStarShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const px = x + Math.cos(angle) * size
    const py = y + Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

// ============ 冲击波绘制（精简版） ============
export function drawShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[]): void {
  shockwaves.forEach(sw => {
    const lifeRatio = sw.life / 450
    const alpha = Math.min(1, lifeRatio * 1.5)

    ctx.save()
    ctx.globalAlpha = alpha

    // 外圈 - 主色
    ctx.strokeStyle = sw.color
    ctx.lineWidth = 3 * alpha + 1.5
    ctx.shadowColor = sw.color
    ctx.shadowBlur = 10 * alpha
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
    ctx.stroke()

    // 内圈 - 白色细线
    ctx.globalAlpha = alpha * 0.6
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5 * alpha + 0.5
    ctx.shadowBlur = 4 * alpha
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.radius * 0.6, 0, Math.PI * 2)
    ctx.stroke()

    // 半透明填充（轻微）
    if (alpha > 0.3) {
      ctx.globalAlpha = alpha * 0.08
      ctx.fillStyle = sw.color
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  })
}

// ============ 浮动文字绘制 ============
export function drawFloatTexts(ctx: CanvasRenderingContext2D, floatTexts: FloatText[]): void {
  floatTexts.forEach(ft => {
    const alpha = Math.max(0, ft.life / ft.maxLife)
    const progress = 1 - alpha

    ctx.save()
    ctx.globalAlpha = alpha

    // 文字描边
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 3
    ctx.textAlign = 'center'

    if (ft.type === 'combo') {
      // 连击数字 - 大号金色
      const scale = 1 + progress * 0.3
      ctx.font = `bold ${ft.size * scale}px Arial`
      ctx.strokeText(ft.text, ft.x, ft.y)
      ctx.fillStyle = '#FFD700'
      ctx.shadowColor = '#FF6600'
      ctx.shadowBlur = 8
      ctx.fillText(ft.text, ft.x, ft.y)
      ctx.shadowBlur = 0
    } else if (ft.type === 'damage') {
      // 伤害数字 - 红色带大小
      const scale = 1 + progress * 0.2
      ctx.font = `bold ${ft.size * scale}px Arial`
      ctx.strokeText(ft.text, ft.x, ft.y)
      ctx.fillStyle = ft.color
      ctx.fillText(ft.text, ft.x, ft.y)
    } else if (ft.type === 'exp') {
      ctx.font = `bold ${ft.size}px Arial`
      ctx.strokeText(ft.text, ft.x, ft.y)
      ctx.fillStyle = '#00E5FF'
      ctx.fillText(ft.text, ft.x, ft.y)
    } else if (ft.type === 'gold') {
      ctx.font = `bold ${ft.size}px Arial`
      ctx.strokeText(ft.text, ft.x, ft.y)
      ctx.fillStyle = '#FFD700'
      ctx.fillText(ft.text, ft.x, ft.y)
    } else {
      ctx.font = `bold ${ft.size}px Arial`
      ctx.strokeText(ft.text, ft.x, ft.y)
      ctx.fillStyle = ft.color
      ctx.fillText(ft.text, ft.x, ft.y)
    }

    ctx.restore()
  })
}

// ============ 子弹绘制 ============
export function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[], now: number): void {
  bullets.forEach(b => {
    const alpha = Math.min(1, b.life / 300)

    ctx.save()
    ctx.globalAlpha = alpha

    if (b.isPlayerBullet) {
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      const r = b.width / 2

      // 尾部拖尾
      if (b.trail) {
        ctx.globalAlpha = alpha * 0.3
        const trailLen = b.width * 2
        const trailX = cx - (b.vx > 0 ? 1 : -1) * trailLen
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.ellipse((cx + trailX) / 2, cy, trailLen / 2, r * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = alpha

      // 外层光晕
      ctx.shadowColor = b.color
      ctx.shadowBlur = 12
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // 中层
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.globalAlpha = alpha * 0.8
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2)
      ctx.fill()

      // 内芯
      ctx.fillStyle = b.color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 敌人子弹 - 红色能量弹
      ctx.shadowColor = b.color
      ctx.shadowBlur = 10
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFAAAA'
      ctx.beginPath()
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  })
}

// ============ 掉落物绘制 ============
export function drawDrops(ctx: CanvasRenderingContext2D, drops: DropItem[], now: number): void {
  drops.forEach(d => {
    const alpha = Math.min(1, d.life / 120)
    const floatY = Math.sin(now * 0.004 + d.x * 0.1) * 3
    const scale = 1 + Math.sin(now * 0.006 + d.x) * 0.08

    ctx.save()
    ctx.globalAlpha = alpha

    const cx = d.x + d.width / 2
    const cy = d.y + d.height / 2 + floatY

    switch (d.type) {
      case 'gold': {
        const r = (d.width / 2) * scale
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFF8DC'
        ctx.beginPath()
        ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.4, 0, Math.PI * 2)
        ctx.fill()
        // 数量文字
        ctx.fillStyle = '#8B6914'
        ctx.font = 'bold 8px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${d.value}`, cx, cy + 3)
        break
      }

      case 'hpPotion': {
        const w = d.width * scale
        const h = d.height * scale
        const dx = cx - w / 2
        const dy = cy - h / 2
        ctx.shadowColor = '#FF4444'
        ctx.shadowBlur = 6
        ctx.fillStyle = '#FF4444'
        ctx.beginPath()
        ctx.roundRect(dx, dy, w, h, 4)
        ctx.fill()
        ctx.shadowBlur = 0
        // 十字标记
        ctx.fillStyle = '#FFF'
        ctx.fillRect(dx + w * 0.25, dy + h * 0.42, w * 0.5, h * 0.16)
        ctx.fillRect(dx + w * 0.42, dy + h * 0.25, w * 0.16, h * 0.5)
        break
      }

      case 'mpPotion': {
        const w = d.width * scale
        const h = d.height * scale
        const dx = cx - w / 2
        const dy = cy - h / 2
        ctx.shadowColor = '#4488FF'
        ctx.shadowBlur = 6
        ctx.fillStyle = '#4488FF'
        ctx.beginPath()
        ctx.roundRect(dx, dy, w, h, 4)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#FFF'
        ctx.fillRect(dx + w * 0.25, dy + h * 0.42, w * 0.5, h * 0.16)
        ctx.fillRect(dx + w * 0.42, dy + h * 0.25, w * 0.16, h * 0.5)
        break
      }

      case 'equipment':
        if (d.equipment) {
          const color = EQUIP_QUALITY_COLORS[d.equipment.quality]
          const w = d.width * scale
          const h = d.height * scale
          const dx = cx - w / 2
          const dy = cy - h / 2
          ctx.shadowColor = color
          ctx.shadowBlur = 10
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.roundRect(dx, dy, w, h, 3)
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.strokeStyle = '#FFF'
          ctx.lineWidth = 1.5
          ctx.strokeRect(dx, dy, w, h)
          // 图标
          const icon = d.equipment.slot === 'weapon' ? '⚔' : d.equipment.slot === 'armor' ? '🛡' : '💍'
          ctx.fillStyle = '#FFF'
          ctx.font = 'bold 9px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(icon, cx, cy + 3)
        }
        break
    }

    ctx.restore()
  })
}

// ============ 粒子更新 ============
export function updateParticles(particles: Particle[]): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx || 0
    p.y += p.vy || 0
    p.life -= 16
    if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
      p.rotation += p.rotationSpeed
    }
    if (p.life <= 0) particles.splice(i, 1)
  }
}

// ============ 冲击波更新 ============
export function updateShockwaves(shockwaves: Shockwave[]): void {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    sw.radius += 2
    sw.life -= 16
    if (sw.life <= 0) shockwaves.splice(i, 1)
  }
}

// ============ 浮动文字更新 ============
export function updateFloatTexts(floatTexts: FloatText[]): void {
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i]
    ft.y += ft.vy || -1
    ft.life -= 16
    if (ft.life <= 0) floatTexts.splice(i, 1)
  }
}

// ============ 子弹更新 ============
export function updateBullets(bullets: Bullet[]): void {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    b.x += b.vx
    b.y += b.vy
    b.life -= 16
    if (b.life <= 0 || b.x < -100 || b.x > 1000 || b.y < -100 || b.y > 600) {
      bullets.splice(i, 1)
    }
  }
}

// ============ 掉落物更新 ============
export function updateDrops(drops: DropItem[]): void {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]
    // 重力
    if (d.vy !== undefined && d.vy < 0) {
      d.vy += 0.3
      d.y += d.vy
      if (d.y >= C.GROUND_Y - 16) {
        d.y = C.GROUND_Y - 16
        d.vy = 0
      }
    }
    d.life -= 16
    if (d.life <= 0) drops.splice(i, 1)
  }
}
