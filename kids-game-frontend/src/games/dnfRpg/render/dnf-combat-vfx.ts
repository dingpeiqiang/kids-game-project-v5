/**
 * DNF 风格战斗刀光 / 技能轨迹（程序化，无贴图）
 */

import type { ClassType } from '../types'
import * as C from '../config'

export type SlashStyle = 'horizontal' | 'upward' | 'cross' | 'launcher' | 'punch' | 'kick' | 'shot' | 'magic'

const CLASS_ACCENT: Record<ClassType, string> = {
  swordsman: '#FF3344',
  fighter: '#FF8800',
  archer: '#7CFC00',
  mage: '#B388FF',
  gunner: '#42A5F5',
}

/** 普攻连击段 → 刀光类型 */
export function slashStyleForAttack(classType: ClassType, attackStep: number): SlashStyle {
  if (classType === 'fighter') {
    return attackStep >= 2 ? 'kick' : 'punch'
  }
  if (classType === 'archer' || classType === 'gunner') {
    return 'shot'
  }
  if (classType === 'mage') {
    return attackStep >= 2 ? 'magic' : 'horizontal'
  }
  const styles: SlashStyle[] = ['horizontal', 'upward', 'cross', 'launcher']
  return styles[Math.min(attackStep, 3)]
}

/** DNF 式多层刀光 */
export function drawDnfSlash(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: number,
  progress: number,
  classType: ClassType,
  style: SlashStyle,
): void {
  const accent = CLASS_ACCENT[classType]
  const t = Math.min(1, Math.max(0, progress))
  const fade = 1 - t * t

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  if (style === 'shot') {
    drawMuzzleFlash(ctx, cx + facing * 28, cy - 4, facing, accent, fade)
    ctx.restore()
    return
  }

  if (style === 'magic') {
    drawMagicArc(ctx, cx, cy, facing, accent, fade, t)
    ctx.restore()
    return
  }

  if (style === 'punch' || style === 'kick') {
    drawImpactWave(ctx, cx + facing * (style === 'kick' ? 32 : 22), cy + (style === 'kick' ? 8 : 0), facing, accent, fade, style === 'kick')
    ctx.restore()
    return
  }

  const arcs = getSlashArcs(style, facing)
  for (let layer = 0; layer < 4; layer++) {
    const expand = t * (18 + layer * 6)
    const alpha = fade * (1 - layer * 0.22)
    if (alpha <= 0.02) continue

    ctx.globalAlpha = alpha
    ctx.lineWidth = layer === 0 ? 5 : layer === 1 ? 3.5 : 2
    ctx.strokeStyle = layer === 0 ? '#FFFFFF' : layer === 1 ? accent : `${accent}88`
    ctx.shadowColor = layer <= 1 ? '#FFFFFF' : accent
    ctx.shadowBlur = layer === 0 ? 14 : 6

    ctx.beginPath()
    ctx.arc(
      cx + facing * (12 + expand),
      cy + getSlashYOffset(style),
      26 + layer * 4 + expand * 0.5,
      arcs.start,
      arcs.end,
    )
    ctx.stroke()
  }

  // 斩击残影线（DNF 标志性白线）
  ctx.shadowBlur = 0
  ctx.globalAlpha = fade * 0.9
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.beginPath()
  const tipX = cx + facing * (45 + t * 35)
  const tipY = cy + getSlashYOffset(style) - (style === 'upward' ? 25 + t * 15 : style === 'launcher' ? 35 : 5)
  ctx.moveTo(cx + facing * 8, cy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()

  ctx.restore()
}

function getSlashArcs(style: SlashStyle, facing: number): { start: number; end: number } {
  const f = facing > 0 ? 1 : -1
  switch (style) {
    case 'upward':
      return f > 0
        ? { start: -Math.PI * 0.95, end: -Math.PI * 0.35 }
        : { start: Math.PI * 0.35, end: Math.PI * 0.95 }
    case 'cross':
      return f > 0
        ? { start: -0.2, end: Math.PI + 0.2 }
        : { start: -0.2, end: Math.PI + 0.2 }
    case 'launcher':
      return f > 0
        ? { start: -Math.PI * 0.75, end: Math.PI * 0.15 }
        : { start: Math.PI * 0.85, end: Math.PI * 1.65 }
    default:
      return f > 0
        ? { start: -0.55, end: 0.55 }
        : { start: Math.PI - 0.55, end: Math.PI + 0.55 }
  }
}

function getSlashYOffset(style: SlashStyle): number {
  if (style === 'upward') return -12
  if (style === 'launcher') return -18
  if (style === 'cross') return -4
  return 2
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  accent: string,
  fade: number,
): void {
  ctx.globalAlpha = fade
  const g = ctx.createRadialGradient(x, y, 0, x, y, 22)
  g.addColorStop(0, '#FFFFFF')
  g.addColorStop(0.35, accent)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(x, y, 18 + fade * 8, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - facing * 8, y)
  ctx.lineTo(x + facing * 28, y)
  ctx.stroke()
}

function drawMagicArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: number,
  accent: string,
  fade: number,
  t: number,
): void {
  ctx.globalAlpha = fade * 0.85
  for (let i = 0; i < 3; i++) {
    const r = 20 + i * 12 + t * 25
    ctx.strokeStyle = i === 0 ? '#FFFFFF' : accent
    ctx.lineWidth = 3 - i * 0.8
    ctx.beginPath()
    ctx.arc(cx + facing * 15, cy - 8, r, -Math.PI * 0.4, Math.PI * 0.4)
    ctx.stroke()
  }
}

function drawImpactWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  accent: string,
  fade: number,
  isKick: boolean,
): void {
  ctx.globalAlpha = fade
  const w = isKick ? 50 : 38
  const h = isKick ? 28 : 22
  const g = ctx.createRadialGradient(x, y, 0, x, y, w)
  g.addColorStop(0, '#FFFFFF')
  g.addColorStop(0.4, accent)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - facing * 15, y)
  ctx.lineTo(x + facing * (isKick ? 35 : 25), y + (isKick ? -8 : 0))
  ctx.stroke()
}

/** 技能释放时的身外特效（与 spawnSkillEffects 粒子互补） */
export function drawDnfSkillAura(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  classType: ClassType,
  skillSlot: number,
  skillProgress: number,
  facing: number,
): void {
  const accent = CLASS_ACCENT[classType]
  const p = Math.min(1, skillProgress)
  const pulse = 1 - p * 0.5

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  if (skillSlot === 0) {
  // 小技能：前方锥形气浪（上挑/崩拳等）
    drawSkillCone(ctx, cx + facing * 20, cy, facing, accent, pulse, 55, p)
  } else if (skillSlot === 1) {
    // 中技能：周身爆发环
    for (let ring = 0; ring < 3; ring++) {
      const r = 30 + ring * 22 + p * 40
      ctx.globalAlpha = pulse * (0.5 - ring * 0.12)
      ctx.strokeStyle = ring === 0 ? '#FFFFFF' : accent
      ctx.lineWidth = 4 - ring
      ctx.beginPath()
      ctx.ellipse(cx, cy + 12, r, r * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (skillSlot === 2) {
    // 大技能：纵向斩击柱
    ctx.globalAlpha = pulse * 0.7
    const g = ctx.createLinearGradient(cx - 40, cy - 80, cx + 40, cy + 40)
    g.addColorStop(0, '#FFFFFF')
    g.addColorStop(0.5, accent)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(cx - 25 + facing * 10, cy - 70 - p * 20, 50, 100)
  } else {
    // 觉醒感：全屏向心闪
    ctx.globalAlpha = pulse * 0.35
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, C.CANVAS_WIDTH * 0.45)
    g.addColorStop(0, '#FFFFFF')
    g.addColorStop(0.25, accent)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(cx - C.CANVAS_WIDTH / 2, cy - C.CANVAS_HEIGHT / 2, C.CANVAS_WIDTH, C.CANVAS_HEIGHT)
  }

  ctx.restore()
}

function drawSkillCone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  color: string,
  alpha: number,
  length: number,
  progress: number,
): void {
  ctx.globalAlpha = alpha
  const len = length + progress * 30
  const g = ctx.createLinearGradient(x, y, x + facing * len, y - 40)
  g.addColorStop(0, color)
  g.addColorStop(0.6, '#FFFFFF')
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x, y + 15)
  ctx.lineTo(x + facing * len, y - 50 - progress * 20)
  ctx.lineTo(x + facing * len, y + 25)
  ctx.closePath()
  ctx.fill()
}

/** 战斗待机：轻微下蹲重心（DNF 格斗站姿） */
export function getBattlePoseOffset(player: {
  attacking: boolean
  attackStep: number
  usingSkill1: boolean
  usingSkill2: boolean
  usingSkill3: boolean
  usingSkill4: boolean
  dashing: boolean
  vx: number
  y: number
  height: number
}): { offsetY: number; lean: number; armRaise: number } {
  const onGround = player.y + player.height >= C.GROUND_Y - 6
  let offsetY = onGround && Math.abs(player.vx) < 0.5 ? 2 : 0
  let lean = 0
  let armRaise = 0

  if (player.dashing) {
    lean = 0.15
    offsetY = 4
  } else if (player.attacking) {
    lean = 0.08 + player.attackStep * 0.04
    offsetY = 3
    armRaise = player.attackStep >= 2 ? 12 : 6
  } else if (player.usingSkill1 || player.usingSkill2 || player.usingSkill3 || player.usingSkill4) {
    lean = 0.12
    offsetY = 5
    armRaise = 18
  } else if (Math.abs(player.vx) > 1) {
    offsetY = 1
    lean = 0.05
  }

  return { offsetY, lean, armRaise }
}

export function getActiveSkillSlot(player: {
  usingSkill1: boolean
  usingSkill2: boolean
  usingSkill3: boolean
  usingSkill4: boolean
}): number {
  if (player.usingSkill4) return 3
  if (player.usingSkill3) return 2
  if (player.usingSkill2) return 1
  if (player.usingSkill1) return 0
  return -1
}