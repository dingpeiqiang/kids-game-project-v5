import type { SkillEffect, Particle, FloatText } from '../types'

/**
 * 绘制技能特效
 */
export function drawSkillEffect(ctx: CanvasRenderingContext2D, effect: SkillEffect): void {
  const alpha = 1 - effect.elapsed / effect.duration
  ctx.save()
  ctx.globalAlpha = alpha * 0.6
  ctx.fillStyle = effect.color
  ctx.beginPath()
  ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2)
  ctx.fill()

  // 外圈
  ctx.globalAlpha = alpha * 0.3
  ctx.strokeStyle = effect.color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(effect.x, effect.y, effect.radius + 5, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

/**
 * 绘制粒子
 */
export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const alpha = p.life / p.maxLife
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * 绘制浮动文字
 */
export function drawFloatText(ctx: CanvasRenderingContext2D, t: FloatText): void {
  const alpha = t.life / t.maxLife
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = t.color
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(t.text, t.x, t.y)
  ctx.restore()
}