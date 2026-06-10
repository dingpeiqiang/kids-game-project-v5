import {
  ALLY_CRYSTAL,
  BASE_H,
  BASE_W,
  BUSHES,
  COLORS,
  ENEMY_CRYSTAL,
  ENEMY_XIAOBING,
  ENEMY_YUJI,
  HERO_LIUBEI,
  ITEM_SHIELD,
  LEVELS,
  MATCH,
} from '../config'
import { getUiLayout } from '../input'
import type { GameState } from '../types'
import type { KingBabyImages } from './assets'

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fill: string,
  bg = 'rgba(0,0,0,0.25)',
) {
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h)
}

function drawEmojiSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  emoji: string,
  fill: string,
  wobble = 0,
) {
  const s = 1 + Math.sin(wobble * 8) * 0.06
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#fff'
  ctx.stroke()
  ctx.font = `${r * 1.1}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, 0, 2)
  ctx.restore()
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  assets: KingBabyImages,
  canvasW: number,
  canvasH: number,
) {
  const sx = canvasW / BASE_W
  const sy = canvasH / BASE_H
  ctx.save()
  ctx.scale(sx, sy)

  if (assets.bg) {
    ctx.drawImage(assets.bg, 0, 0, BASE_W, BASE_H)
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, BASE_H)
    g.addColorStop(0, '#D4EDFC')
    g.addColorStop(1, COLORS.bg)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, BASE_W, BASE_H)
    ctx.fillStyle = '#C8E6C9'
    ctx.fillRect(0, BASE_H * 0.3, BASE_W, BASE_H * 0.45)
  }

  for (const b of BUSHES) {
    ctx.fillStyle = COLORS.bush
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 12)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const fx of state.skillFx) {
    const t = fx.life / fx.maxLife
    ctx.globalAlpha = 0.35 * t
    ctx.fillStyle = fx.kind === 'ult' ? COLORS.accent : COLORS.primary
    ctx.beginPath()
    ctx.arc(fx.x, fx.y, fx.radius * (1.1 - t * 0.3), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const p of state.particles) {
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  drawEmojiSprite(ctx, ALLY_CRYSTAL.x, ALLY_CRYSTAL.y, CRYSTAL_R(), '��', COLORS.primary)
  drawEmojiSprite(ctx, ENEMY_CRYSTAL.x, ENEMY_CRYSTAL.y, CRYSTAL_R(), '💎', COLORS.danger)
  drawBar(ctx, 24, 16, 200, 14, state.allyCrystal.hp / state.allyCrystal.maxHp, COLORS.primary)
  drawBar(ctx, BASE_W - 224, 16, 200, 14, state.enemyCrystal.hp / state.enemyCrystal.maxHp, COLORS.danger)

  for (const m of state.minions) {
    const img = assets.minion
    if (img) {
      const s = ENEMY_XIAOBING.radius * 2.2
      ctx.drawImage(img, m.x - s / 2, m.y - s / 2, s, s)
    } else {
      drawEmojiSprite(
        ctx,
        m.x,
        m.y,
        ENEMY_XIAOBING.radius,
        ENEMY_XIAOBING.emoji,
        m.friendly ? COLORS.primary : COLORS.danger,
        m.wobble,
      )
    }
    if (!m.friendly && m.hp < m.maxHp) {
      drawBar(ctx, m.x - 22, m.y - 32, 44, 5, m.hp / m.maxHp, COLORS.danger)
    }
  }

  for (const p of state.pickups) {
    drawEmojiSprite(ctx, p.x, p.y, 22, ITEM_SHIELD.emoji, '#E3F2FD', p.life)
  }

  const eh = state.enemyHero
  if (eh.active && eh.hp > 0) {
    if (assets.enemyHero) {
      const s = 80
      ctx.drawImage(assets.enemyHero, eh.x - s / 2, eh.y - s / 2, s, s)
    } else {
      drawEmojiSprite(ctx, eh.x, eh.y, ENEMY_YUJI.radius, ENEMY_YUJI.emoji, COLORS.danger, eh.wobble)
    }
    drawBar(ctx, eh.x - 40, eh.y - 52, 80, 8, eh.hp / eh.maxHp, COLORS.danger)
  }

  const h = state.hero
  if (!h.dead) {
    if (assets.hero) {
      const s = 88
      ctx.save()
      ctx.translate(h.x, h.y)
      ctx.scale(h.facing, 1)
      ctx.drawImage(assets.hero, -s / 2, -s / 2, s, s)
      ctx.restore()
    } else {
      drawEmojiSprite(ctx, h.x, h.y, HERO_LIUBEI.radius, HERO_LIUBEI.emoji, COLORS.primary, h.wobble)
    }
    drawBar(ctx, h.x - 50, h.y - 58, 100, 10, h.hp / h.maxHp, COLORS.success)
    if (h.shield > 0) {
      ctx.strokeStyle = COLORS.primary
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(h.x, h.y, HERO_LIUBEI.radius + 8, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`复活 ${Math.ceil(h.respawnTimer)}s`, h.x, h.y)
  }

  for (const t of state.floatTexts) {
    ctx.globalAlpha = Math.min(1, t.life)
    ctx.fillStyle = t.color
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x, t.y)
    ctx.globalAlpha = 1
  }

  const level = LEVELS[state.levelIndex]
  ctx.fillStyle = '#455A64'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`${level.label} · 波 ${state.waveIndex}/${state.wavesTotal}`, 24, 52)
  ctx.textAlign = 'right'
  const timeLeft = Math.max(0, MATCH.maxDurationSec - state.matchTime)
  ctx.fillText(`⏱ ${Math.floor(timeLeft / 60)}:${String(Math.floor(timeLeft % 60)).padStart(2, '0')}`, BASE_W - 24, 52)
  ctx.fillText(`🪙${state.gold}  ⭐${state.score}`, BASE_W - 24, 78)

  ctx.restore()

  drawHudButtons(ctx, state, canvasW, canvasH)
  if (state.phase === 'victory' || state.phase === 'defeat') {
    drawResultOverlay(ctx, state, canvasW, canvasH)
  }
}

function CRYSTAL_R() {
  return 44
}

function drawHudButtons(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const ui = getUiLayout(canvasW, canvasH)
  const h = state.hero
  drawSkillBtn(ctx, ui.skill1.cx, ui.skill1.cy, ui.skill1.r, '技', h.skill1Cd, HERO_LIUBEI.skill1Cd, COLORS.primary)
  drawSkillBtn(ctx, ui.ult.cx, ui.ult.cy, ui.ult.r, '大', h.ultCd, HERO_LIUBEI.ultCd, COLORS.accent)
  ctx.fillStyle = state.autoFight ? COLORS.success : 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(ui.auto.cx, ui.auto.cy, ui.auto.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#37474F'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(state.autoFight ? '自动' : '手动', ui.auto.cx, ui.auto.cy)
}

function drawSkillBtn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  label: string,
  cd: number,
  maxCd: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.globalAlpha = cd > 0 ? 0.45 : 1
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${r * 0.45}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, cy)
  if (cd > 0) {
    ctx.fillStyle = '#263238'
    ctx.font = `bold ${r * 0.35}px sans-serif`
    ctx.fillText(cd.toFixed(1), cx, cy + r * 0.55)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (1 - cd / maxCd) * Math.PI * 2, true)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()
  }
}

function drawResultOverlay(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  ctx.fillStyle = 'rgba(232,244,252,0.75)'
  ctx.fillRect(0, 0, canvasW, canvasH)
  const ui = getUiLayout(canvasW, canvasH)
  const r = ui.result
  ctx.fillStyle = '#fff'
  ctx.roundRect(r.x, r.y, r.w, r.h, 16)
  ctx.fill()
  ctx.fillStyle = state.phase === 'victory' ? COLORS.success : COLORS.danger
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(state.phase === 'victory' ? '萌斗胜利!' : '再试一次', canvasW / 2, r.y + 48)
  if (state.phase === 'victory') {
    ctx.fillStyle = '#FFB300'
    ctx.font = '32px sans-serif'
    ctx.fillText('★'.repeat(state.stars) + '☆'.repeat(3 - state.stars), canvasW / 2, r.y + 90)
  }
  ctx.fillStyle = '#546E7A'
  ctx.font = '18px sans-serif'
  ctx.fillText(`得分 ${state.score} · 击杀 ${state.kills}`, canvasW / 2, r.y + r.h - 48)
  ctx.fillStyle = COLORS.primary
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('点击继续', canvasW / 2, r.y + r.h - 20)
}