import {
  BASE_H,
  BASE_W,
  BUFF_OPTIONS,
  COLORS,
  DRAGON_FIRE,
  DRAGON_NORMAL,
  HERO,
  WAVES,
  type BuffId,
} from '../config'
import type { GameState } from '../types'
import type { BeatDragonImages } from './assets'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: BeatDragonImages,
) {
  drawBackground(ctx, assets)

  const dragon = state.dragon
  if (dragon) {
    const segDef = dragon.kind === 'dragon_fire' ? DRAGON_FIRE : DRAGON_NORMAL
    const sheet = dragon.kind === 'dragon_fire' ? assets.dragonFire : assets.dragonNormal
    for (const seg of dragon.segments) {
      if (seg.hp <= 0) continue
      const bob = Math.sin(seg.wobble) * 3
      const w = segDef.segmentWidth
      const h = segDef.segmentHeight
      const x = seg.x - w / 2
      const y = seg.y - h / 2 + bob

      if (sheet) {
        const frame = seg.hp < seg.maxHp * 0.5 ? 1 : 0
        const fw = sheet.width / 2
        ctx.drawImage(sheet, frame * fw, 0, fw, sheet.height, x, y, w, h)
      } else {
        ctx.fillStyle = seg.isBox ? COLORS.boxBuff : segDef.color
        roundRect(ctx, x, y, w, h, 12)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        if (seg.isBox) {
          ctx.font = '20px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = '#5c4a00'
          ctx.fillText('BUFF', seg.x, seg.y + 6)
        }
      }

      const hpRatio = Math.max(0, seg.hp / seg.maxHp)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      roundRect(ctx, x, y - 8, w, 5, 2)
      ctx.fill()
      ctx.fillStyle = COLORS.success
      roundRect(ctx, x, y - 8, w * hpRatio, 5, 2)
      ctx.fill()
    }
  }

  for (const b of state.bullets) {
    ctx.beginPath()
    if (b.friendly) {
      ctx.fillStyle = COLORS.bullet
      ctx.shadowColor = COLORS.primary
      ctx.shadowBlur = 8
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    } else {
      ctx.fillStyle = COLORS.danger
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const p = state.player
  if (assets.hero) {
    const size = HERO.radius * 2.2
    ctx.drawImage(assets.hero, p.x - size / 2, p.y - size / 2, size, size)
  } else {
    ctx.fillStyle = COLORS.hero
    ctx.beginPath()
    ctx.arc(p.x, p.y, HERO.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.fillText(HERO.emoji, p.x, p.y + 8)
  }

  for (const pt of state.particles) {
    const a = pt.life / pt.maxLife
    ctx.globalAlpha = a
    ctx.fillStyle = pt.color
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const t of state.floatTexts) {
    ctx.globalAlpha = Math.min(1, t.life)
    ctx.fillStyle = t.color
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x, t.y)
    ctx.globalAlpha = 1
  }

  drawHud(ctx, state)

  if (state.phase === 'buffPick') drawBuffOverlay(ctx, state)
  if (state.phase === 'victory' || state.phase === 'defeat') drawResultOverlay(ctx, state)
}

function drawBackground(ctx: CanvasRenderingContext2D, assets: BeatDragonImages) {
  if (assets.bg) {
    ctx.drawImage(assets.bg, 0, 0, BASE_W, BASE_H)
    return
  }
  const g = ctx.createLinearGradient(0, 0, 0, BASE_H)
  g.addColorStop(0, '#E8F0FF')
  g.addColorStop(1, COLORS.bg)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, BASE_W, BASE_H)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  for (let i = 0; i < 6; i++) {
    const cx = (i * 97) % BASE_W
    const cy = 80 + (i * 53) % 200
    ctx.beginPath()
    ctx.ellipse(cx, cy, 40 + i * 4, 18, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  roundRect(ctx, 10, 10, BASE_W - 20, 44, 12)
  ctx.fill()

  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.primary
  const waveLabel = state.endless
    ? `无尽 ${state.waveIndex - WAVES.length + 2}`
    : `波次 ${state.waveIndex + 1}/${WAVES.length}`
  ctx.fillText(waveLabel, 20, 32)
  ctx.textAlign = 'right'
  ctx.fillText(`得分 ${state.score}`, BASE_W - 20, 32)

  const p = state.player
  for (let i = 0; i < p.maxHp; i++) {
    ctx.fillStyle = i < p.hp ? COLORS.danger : '#cbd5e1'
    roundRect(ctx, 20 + i * 22, 48, 16, 16, 4)
    ctx.fill()
  }
}

function drawBuffOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(15,23,42,0.45)'
  ctx.fillRect(0, 0, BASE_W, BASE_H)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('选择强化 Buff', BASE_W / 2, 120)

  const cardW = 108
  const gap = 12
  const total = cardW * 3 + gap * 2
  const startX = (BASE_W - total) / 2

  state.buffChoices.forEach((id, i) => {
    const meta = BUFF_OPTIONS.find(b => b.id === id)!
    const x = startX + i * (cardW + gap)
    const y = 200
    ctx.fillStyle = '#fff'
    roundRect(ctx, x, y, cardW, 140, 14)
    ctx.fill()
    ctx.strokeStyle = COLORS.accent
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = '28px sans-serif'
    ctx.fillText(meta.emoji, x + cardW / 2, y + 48)
    ctx.fillStyle = COLORS.primary
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(meta.name, x + cardW / 2, y + 78)
    ctx.fillStyle = '#64748b'
    ctx.font = '11px sans-serif'
    ctx.fillText(meta.desc, x + cardW / 2, y + 110)
  })
}

function drawResultOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(15,23,42,0.5)'
  ctx.fillRect(0, 0, BASE_W, BASE_H)
  const win = state.phase === 'victory'
  ctx.fillStyle = '#fff'
  roundRect(ctx, 40, 180, BASE_W - 80, 200, 16)
  ctx.fill()
  ctx.fillStyle = win ? COLORS.success : COLORS.danger
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(win ? '屠龙通关' : '再试一次', BASE_W / 2, 240)
  ctx.fillStyle = COLORS.primary
  ctx.font = '16px sans-serif'
  ctx.fillText(`得分 ${state.score}`, BASE_W / 2, 275)
  if (win) {
    ctx.fillText('★'.repeat(state.stars) + '☆'.repeat(3 - state.stars), BASE_W / 2, 310)
  }
  ctx.fillStyle = '#64748b'
  ctx.font = '13px sans-serif'
  ctx.fillText('点击屏幕返回大厅', BASE_W / 2, 350)
}

export function hitBuffCard(state: GameState, x: number, y: number): BuffId | null {
  if (state.phase !== 'buffPick' || state.buffChoices.length === 0) return null
  const cardW = 108
  const gap = 12
  const total = cardW * 3 + gap * 2
  const startX = (BASE_W - total) / 2
  const cardY = 200
  const cardH = 140
  for (let i = 0; i < state.buffChoices.length; i++) {
    const cx = startX + i * (cardW + gap)
    if (x >= cx && x <= cx + cardW && y >= cardY && y <= cardY + cardH) {
      return state.buffChoices[i]
    }
  }
  return null
}

export function isResultTap(state: GameState): boolean {
  return state.phase === 'victory' || state.phase === 'defeat'
}