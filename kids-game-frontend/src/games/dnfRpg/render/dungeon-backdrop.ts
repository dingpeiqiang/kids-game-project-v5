/**
 * 副本远景插画层（程序绘制，模拟 DNF 多层布景）
 */

import type { DungeonRoom } from '../types'
import type { DungeonVisualTheme } from './dungeon-theme'
import * as C from '../config'

function parseHex(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function rgb(c: { r: number; g: number; b: number }, a = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`
}

function darken(c: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.max(0, Math.floor(c.r * (1 - t))),
    g: Math.max(0, Math.floor(c.g * (1 - t))),
    b: Math.max(0, Math.floor(c.b * (1 - t))),
  }
}

/** 最远景：天空 / 洞顶（慢视差） */
export function drawBackdropSky(
  ctx: CanvasRenderingContext2D,
  room: DungeonRoom,
  theme: DungeonVisualTheme,
  camX: number,
): void {
  const parallax = camX * 0.06
  const bg = parseHex(room.bgColor)
  const w = room.width

  ctx.save()

  if (theme.id === 'forest') {
    const g = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y * 0.55)
    g.addColorStop(0, '#0a1a12')
    g.addColorStop(0.45, '#1a3a28')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, C.GROUND_Y)

    // 树冠剪影（极远）
    for (let i = -2; i < Math.ceil(w / 140) + 3; i++) {
      const tx = i * 140 - parallax
      if (tx < -120 || tx > C.CANVAS_WIDTH + 120) continue
      const th = 90 + (i % 3) * 25
      ctx.fillStyle = rgb(darken(bg, 0.65), 0.85)
      ctx.beginPath()
      ctx.moveTo(tx, C.GROUND_Y - 40)
      ctx.lineTo(tx + 35, C.GROUND_Y - 40 - th)
      ctx.lineTo(tx + 70, C.GROUND_Y - 40)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = rgb(darken(bg, 0.55), 0.7)
      ctx.beginPath()
      ctx.moveTo(tx + 25, C.GROUND_Y - 50)
      ctx.lineTo(tx + 55, C.GROUND_Y - 50 - th * 0.7)
      ctx.lineTo(tx + 85, C.GROUND_Y - 50)
      ctx.closePath()
      ctx.fill()
    }

    // 光束（林间）
    for (let b = 0; b < 4; b++) {
      const bx = (w * 0.15 + b * w * 0.22) - parallax * 1.2
      if (bx < -80 || bx > C.CANVAS_WIDTH + 80) continue
      const beam = ctx.createLinearGradient(bx, 0, bx + 40, C.GROUND_Y)
      beam.addColorStop(0, 'rgba(255, 255, 200, 0.06)')
      beam.addColorStop(0.5, 'rgba(180, 220, 140, 0.04)')
      beam.addColorStop(1, 'transparent')
      ctx.fillStyle = beam
      ctx.beginPath()
      ctx.moveTo(bx, 0)
      ctx.lineTo(bx + 55, 0)
      ctx.lineTo(bx + 25, C.GROUND_Y - 60)
      ctx.lineTo(bx - 20, C.GROUND_Y - 60)
      ctx.closePath()
      ctx.fill()
    }
  } else if (theme.id === 'ruins') {
    const g = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y * 0.5)
    g.addColorStop(0, '#1a1810')
    g.addColorStop(0.6, '#2a2820')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, C.GROUND_Y)

    for (let i = -1; i < Math.ceil(w / 200) + 2; i++) {
      const rx = i * 200 - parallax
      if (rx < -100 || rx > C.CANVAS_WIDTH + 100) continue
      ctx.fillStyle = 'rgba(60, 55, 48, 0.5)'
      ctx.fillRect(rx, C.GROUND_Y - 120, 12, 90)
      ctx.fillRect(rx - 8, C.GROUND_Y - 125, 28, 8)
      ctx.beginPath()
      ctx.arc(rx + 6, C.GROUND_Y - 128, 18, Math.PI, 0)
      ctx.fill()
    }
  } else if (theme.id === 'boss') {
    const g = ctx.createRadialGradient(w * 0.5 - parallax, C.GROUND_Y * 0.3, 20, w * 0.5 - parallax, C.GROUND_Y * 0.35, w * 0.6)
    g.addColorStop(0, 'rgba(80, 20, 20, 0.35)')
    g.addColorStop(0.5, 'rgba(40, 10, 10, 0.2)')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, C.GROUND_Y)
  } else {
    // cave / default：钟乳石远景
    for (let i = 0; i < Math.ceil(w / 100) + 2; i++) {
      const sx = i * 100 - parallax
      if (sx < -60 || sx > C.CANVAS_WIDTH + 60) continue
      ctx.fillStyle = rgb(darken(bg, 0.5), 0.6)
      ctx.beginPath()
      ctx.moveTo(sx, C.CEILING_Y)
      ctx.lineTo(sx + 15 + (i % 3) * 8, C.CEILING_Y + 35 + (i % 4) * 10)
      ctx.lineTo(sx + 30, C.CEILING_Y)
      ctx.closePath()
      ctx.fill()
    }
  }

  ctx.restore()
}

/** 中远景：主题布景（中慢视差） */
export function drawBackdropMidground(
  ctx: CanvasRenderingContext2D,
  room: DungeonRoom,
  theme: DungeonVisualTheme,
  camX: number,
): void {
  const parallax = camX * 0.22
  const time = Date.now() / 1000
  const w = room.width

  ctx.save()

  if (theme.id === 'forest') {
    for (let i = -2; i < Math.ceil(w / 95) + 3; i++) {
      const tx = i * 95 - parallax
      if (tx < -80 || tx > C.CANVAS_WIDTH + 80) continue
      const trunkH = 70 + (i % 4) * 15
      const baseY = C.GROUND_Y - 8
      ctx.fillStyle = '#3d2818'
      ctx.fillRect(tx + 28, baseY - trunkH, 14, trunkH)
      ctx.fillStyle = `rgba(30, 90, 45, ${0.75 + (i % 2) * 0.1})`
      ctx.beginPath()
      ctx.ellipse(tx + 35, baseY - trunkH - 8, 42, 28, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(50, 120, 60, 0.4)'
      ctx.beginPath()
      ctx.ellipse(tx + 35, baseY - trunkH - 18, 30, 18, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // 地面草丛
    for (let i = 0; i < Math.ceil(w / 45); i++) {
      const gx = i * 45 - parallax * 0.5
      if (gx < -20 || gx > C.CANVAS_WIDTH + 20) continue
      ctx.strokeStyle = 'rgba(40, 100, 50, 0.35)'
      ctx.lineWidth = 2
      for (let b = 0; b < 3; b++) {
        ctx.beginPath()
        ctx.moveTo(gx + b * 4, C.GROUND_Y)
        ctx.quadraticCurveTo(gx + b * 4 + 3, C.GROUND_Y - 12 - (i + b) % 5, gx + b * 4 + 6, C.GROUND_Y)
        ctx.stroke()
      }
    }
  } else if (theme.id === 'ruins') {
    for (let i = -1; i < Math.ceil(w / 160) + 2; i++) {
      const px = i * 160 - parallax
      if (px < -90 || px > C.CANVAS_WIDTH + 90) continue
      ctx.fillStyle = 'rgba(90, 82, 70, 0.55)'
      ctx.fillRect(px, C.GROUND_Y - 95, 22, 88)
      ctx.fillRect(px - 6, C.GROUND_Y - 100, 34, 10)
      ctx.strokeStyle = 'rgba(120, 110, 90, 0.4)'
      ctx.lineWidth = 1
      for (let r = 0; r < 4; r++) {
        ctx.strokeRect(px + 2, C.GROUND_Y - 88 + r * 20, 18, 14)
      }
    }
    // 碎墙
    for (let i = 0; i < 5; i++) {
      const wx = (w * 0.1 + i * w * 0.18) - parallax
      if (wx < -50 || wx > C.CANVAS_WIDTH + 50) continue
      ctx.fillStyle = 'rgba(70, 65, 58, 0.45)'
      ctx.beginPath()
      ctx.moveTo(wx, C.GROUND_Y - 25)
      ctx.lineTo(wx + 40, C.GROUND_Y - 45)
      ctx.lineTo(wx + 55, C.GROUND_Y - 20)
      ctx.lineTo(wx + 15, C.GROUND_Y - 15)
      ctx.closePath()
      ctx.fill()
    }
  } else if (theme.id === 'treasure') {
    const flicker = Math.sin(time * 2) * 0.15 + 0.85
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.2 + i * 0.3) - parallax
      const g = ctx.createRadialGradient(cx, C.GROUND_Y - 80, 0, cx, C.GROUND_Y - 80, 100)
      g.addColorStop(0, `rgba(255, 220, 100, ${0.08 * flicker})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(cx - 100, 0, 200, C.GROUND_Y)
    }
  }

  ctx.restore()
}

/** Boss 房：半圆擂台 + 两侧锁链边界 */
export function drawBossArenaStage(
  ctx: CanvasRenderingContext2D,
  room: DungeonRoom,
  camX: number,
  theme: DungeonVisualTheme,
): void {
  if (room.roomType !== 'boss') return

  const time = Date.now() / 1000
  const centerX = room.width * 0.52
  const stageY = C.GROUND_Y
  const radius = Math.min(room.width * 0.38, 280)

  ctx.save()

  // 擂台地面（半椭圆）
  const stageGrad = ctx.createRadialGradient(centerX, stageY, radius * 0.2, centerX, stageY, radius)
  stageGrad.addColorStop(0, 'rgba(90, 50, 45, 0.95)')
  stageGrad.addColorStop(0.6, 'rgba(55, 30, 28, 0.9)')
  stageGrad.addColorStop(1, 'rgba(30, 15, 15, 0.85)')
  ctx.fillStyle = stageGrad
  ctx.beginPath()
  ctx.ellipse(centerX, stageY + 8, radius, radius * 0.22, 0, Math.PI, 0)
  ctx.fill()

  // 擂台边缘高光
  ctx.strokeStyle = 'rgba(200, 80, 60, 0.55)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(centerX, stageY + 6, radius - 4, radius * 0.2, 0, Math.PI, 0)
  ctx.stroke()

  // 符文环
  ctx.strokeStyle = `rgba(255, 60, 40, ${0.35 + Math.sin(time * 3) * 0.15})`
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI
    const r1 = radius * 0.55
    const r2 = radius * 0.62
    ctx.beginPath()
    ctx.moveTo(centerX + Math.cos(a) * r1, stageY + 8 + Math.sin(a) * r1 * 0.22)
    ctx.lineTo(centerX + Math.cos(a) * r2, stageY + 8 + Math.sin(a) * r2 * 0.22)
    ctx.stroke()
  }

  // 左右锁边（DNF Boss 房空气墙感）
  const lockW = 28
  const lockInset = 40
  for (const side of [-1, 1] as const) {
    const lx = side < 0 ? lockInset : room.width - lockInset - lockW
    if (lx + lockW < camX - 50 || lx > camX + C.CANVAS_WIDTH + 50) continue

    const pillarGrad = ctx.createLinearGradient(lx, C.CEILING_Y, lx + lockW, C.GROUND_Y)
    pillarGrad.addColorStop(0, theme.pillarDark)
    pillarGrad.addColorStop(0.5, theme.pillarLight)
    pillarGrad.addColorStop(1, theme.pillarDark)
    ctx.fillStyle = pillarGrad
    ctx.fillRect(lx, C.CEILING_Y, lockW, C.GROUND_Y - C.CEILING_Y + 15)

    ctx.strokeStyle = 'rgba(255, 80, 60, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(lx + 2, C.CEILING_Y + 4, lockW - 4, C.GROUND_Y - C.CEILING_Y)

    // 锁链装饰
    ctx.strokeStyle = 'rgba(120, 100, 90, 0.7)'
    ctx.lineWidth = 3
    for (let c = 0; c < 6; c++) {
      const cy = C.CEILING_Y + 30 + c * 45
      ctx.beginPath()
      ctx.arc(lx + lockW / 2, cy, 6, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // 顶部 Boss 标识
  const titleX = centerX
  if (titleX > camX - 100 && titleX < camX + C.CANVAS_WIDTH + 100) {
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(titleX - 48, C.CEILING_Y + 4, 96, 22)
    ctx.strokeStyle = 'rgba(255, 80, 60, 0.6)'
    ctx.strokeRect(titleX - 48, C.CEILING_Y + 4, 96, 22)
    ctx.fillStyle = 'rgba(255, 180, 140, 0.95)'
    ctx.fillText('领主之间', titleX, C.CEILING_Y + 19)
  }

  ctx.restore()
}