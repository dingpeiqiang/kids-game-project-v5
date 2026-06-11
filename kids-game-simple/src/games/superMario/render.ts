import { COLORS, MARIO_CONFIG } from './config'
import type { Block, Coin, Enemy, LevelData, MarioGameState, Player, Powerup } from './types'

function drawBlock(ctx: CanvasRenderingContext2D, b: Block, underground: boolean) {
  if (b.kind === 'ground') {
    ctx.fillStyle = underground ? '#6b6b6b' : COLORS.ground
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.fillStyle = underground ? '#4a4a4a' : COLORS.groundTop
    ctx.fillRect(b.x, b.y, b.w, 6)
    return
  }
  if (b.kind === 'pipe') {
    ctx.fillStyle = COLORS.pipe
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.fillStyle = COLORS.pipeDark
    ctx.fillRect(b.x + 8, b.y, b.w - 16, b.h)
    return
  }
  if (b.kind === 'question' || b.kind === 'used') {
    ctx.fillStyle = b.kind === 'used' ? '#8b6914' : COLORS.question
    ctx.fillRect(b.x, b.y, b.w, b.h)
    if (b.kind === 'question') {
      ctx.fillStyle = '#000'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('?', b.x + b.w / 2, b.y + b.h / 2 + 5)
    }
    return
  }
  if (b.kind === 'hard') {
    ctx.fillStyle = '#555'
    ctx.fillRect(b.x, b.y, b.w, b.h)
    return
  }
  ctx.fillStyle = COLORS.brick
  ctx.fillRect(b.x, b.y, b.w, b.h)
  ctx.strokeStyle = '#8b4513'
  ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2)
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin, t: number) {
  if (c.collected) return
  const wobble = Math.sin(t * 0.1 + c.spin) * 3
  ctx.fillStyle = COLORS.coin
  ctx.beginPath()
  ctx.ellipse(c.x + c.w / 2 + wobble, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  if (!e.alive) return
  if (e.shell) {
    ctx.fillStyle = '#2e7d32'
    ctx.fillRect(e.x, e.y + e.h * 0.5, e.w, e.h * 0.5)
    return
  }
  if (e.type === 'fly') {
    ctx.fillStyle = '#7b1fa2'
    ctx.fillRect(e.x, e.y, e.w, e.h)
    ctx.fillStyle = '#fff'
    ctx.fillRect(e.x + 4, e.y + 6, 6, 6)
    ctx.fillRect(e.x + e.w - 10, e.y + 6, 6, 6)
    return
  }
  if (e.type === 'koopa') {
    ctx.fillStyle = '#388e3c'
    ctx.fillRect(e.x, e.y + 8, e.w, e.h - 8)
    ctx.fillStyle = '#fdd835'
    ctx.beginPath()
    ctx.arc(e.x + e.w / 2, e.y + 10, 12, Math.PI, 0)
    ctx.fill()
    return
  }
  ctx.fillStyle = COLORS.goomba
  ctx.beginPath()
  ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + 2, e.w / 2, e.h / 2 - 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#000'
  ctx.fillRect(e.x + 5, e.y + 8, 4, 4)
  ctx.fillRect(e.x + e.w - 9, e.y + 8, 4, 4)
}

function drawPowerup(ctx: CanvasRenderingContext2D, p: Powerup) {
  if (p.collected) return
  const icons: Record<Powerup['type'], string> = {
    mushroom: '🍄',
    flower: '🌸',
    star: '⭐',
    '1up': '1UP',
  }
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(icons[p.type], p.x + p.w / 2, p.y + p.h / 2 + 6)
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, t: number) {
  if (p.dead) return
  const blink = p.invincible > 0 && Math.floor(t / 4) % 2 === 0
  if (blink) return
  const h = p.h
  ctx.fillStyle = COLORS.marioRed
  ctx.fillRect(p.x + 2, p.y + 8, p.w - 4, h - 14)
  ctx.fillStyle = COLORS.marioBlue
  ctx.fillRect(p.x + 2, p.y + h - 10, p.w - 4, 8)
  ctx.fillStyle = COLORS.marioSkin
  ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 10)
  if (p.big) {
    ctx.fillStyle = COLORS.marioRed
    ctx.fillRect(p.x, p.y, p.w, 12)
  }
  if (p.facing < 0) {
    ctx.fillStyle = '#000'
    ctx.fillRect(p.x + 4, p.y + 5, 3, 3)
  } else {
    ctx.fillStyle = '#000'
    ctx.fillRect(p.x + p.w - 7, p.y + 5, 3, 3)
  }
}

function drawFlag(ctx: CanvasRenderingContext2D, flagX: number, groundY: number) {
  ctx.fillStyle = '#888'
  ctx.fillRect(flagX, groundY - 200, 6, 200)
  ctx.fillStyle = COLORS.flag
  ctx.beginPath()
  ctx.moveTo(flagX + 6, groundY - 200)
  ctx.lineTo(flagX + 50, groundY - 185)
  ctx.lineTo(flagX + 6, groundY - 170)
  ctx.fill()
}

function drawHills(ctx: CanvasRenderingContext2D, cam: number, w: number, sky: string) {
  if (sky === '#000000' || sky === '#1a0a28') return
  ctx.fillStyle = COLORS.hill
  for (let i = -1; i < 8; i++) {
    const hx = i * 180 - (cam * 0.2) % 180
    ctx.beginPath()
    ctx.arc(hx, MARIO_CONFIG.VIEW_H - 80, 60, Math.PI, 0)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  for (let i = 0; i < 4; i++) {
    const cx = i * 220 - (cam * 0.1) % 220
    ctx.beginPath()
    ctx.arc(cx, 80 + (i % 2) * 30, 28, 0, Math.PI * 2)
    ctx.arc(cx + 35, 85 + (i % 2) * 30, 22, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  state: MarioGameState,
  level: LevelData,
  frame: number,
): void {
  const cam = state.cameraX
  const W = MARIO_CONFIG.VIEW_W
  const H = MARIO_CONFIG.VIEW_H
  const sky = level.theme.sky

  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  drawHills(ctx, cam, level.width, sky)

  ctx.save()
  ctx.translate(-cam, 0)

  for (const b of state.blocks) {
    if (b.x + b.w < cam - 20 || b.x > cam + W + 20) continue
    drawBlock(ctx, b, level.theme.underground)
  }
  for (const c of state.coinObjects) {
    if (c.x < cam - 20 || c.x > cam + W + 20) continue
    drawCoin(ctx, c, frame)
  }
  for (const p of state.powerups) drawPowerup(ctx, p)
  for (const e of state.enemies) drawEnemy(ctx, e)
  drawFlag(ctx, level.flagX, level.groundY)
  drawPlayer(ctx, state.player, frame)

  for (const p of state.particles) {
    ctx.globalAlpha = p.life / 30
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, p.size, p.size)
    ctx.globalAlpha = 1
  }
  for (const ft of state.floatTexts) {
    ctx.globalAlpha = ft.life / 40
    ctx.fillStyle = ft.color
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

export function drawHud(ctx: CanvasRenderingContext2D, state: MarioGameState, level: LevelData) {
  const pad = 8
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, MARIO_CONFIG.VIEW_W, 36)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`关卡 ${state.levelIndex + 1}/5`, pad, 22)
  ctx.fillText(`★ ${state.coins}`, pad + 90, 22)
  ctx.fillText(`命 ${state.lives}`, pad + 150, 22)
  ctx.textAlign = 'right'
  ctx.fillText(`时间 ${Math.ceil(state.timeLeft)}`, MARIO_CONFIG.VIEW_W - pad, 22)
  ctx.textAlign = 'center'
  ctx.font = '11px sans-serif'
  ctx.fillText(level.name, MARIO_CONFIG.VIEW_W / 2, 22)
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  sub: string,
  tapHint: boolean,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.fillRect(0, 0, MARIO_CONFIG.VIEW_W, MARIO_CONFIG.VIEW_H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(title, MARIO_CONFIG.VIEW_W / 2, MARIO_CONFIG.VIEW_H / 2 - 20)
  ctx.font = '16px sans-serif'
  ctx.fillText(sub, MARIO_CONFIG.VIEW_W / 2, MARIO_CONFIG.VIEW_H / 2 + 20)
  if (tapHint) {
    ctx.font = '14px sans-serif'
    ctx.fillText('点击屏幕继续', MARIO_CONFIG.VIEW_W / 2, MARIO_CONFIG.VIEW_H / 2 + 60)
  }
}