import { ENTITY, PALETTE } from './config'
import type { Dir, GameAssets, GameState } from './types'

function drawRoundedRect(
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

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, assets: GameAssets) {
  if (assets.bg) {
    ctx.drawImage(assets.bg, 0, 0, W, H)
    return
  }
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, PALETTE.bg)
  g.addColorStop(0.55, '#D8F0E8')
  g.addColorStop(1, '#B8E6C8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawTank(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: Dir,
  color: string,
  emoji: string,
  img: HTMLImageElement | null,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(dirAngle(dir))
  if (img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
  } else {
    ctx.fillStyle = color
    drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.font = `${Math.floor(w * 0.45)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, 0, 2)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(-w * 0.12, -h * 0.42, w * 0.24, h * 0.55)
  }
  ctx.restore()
}

function dirAngle(d: Dir): number {
  switch (d) {
    case 'up':
      return 0
    case 'right':
      return Math.PI / 2
    case 'down':
      return Math.PI
    case 'left':
      return -Math.PI / 2
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: GameState,
  assets: GameAssets,
  hudTop: number,
) {
  drawBackground(ctx, W, H, assets)

  const { mapOffsetX, mapOffsetY, cellSize } = state
  ctx.fillStyle = 'rgba(72, 201, 144, 0.12)'
  ctx.fillRect(mapOffsetX, mapOffsetY, state.mapW, state.mapH)
  ctx.strokeStyle = 'rgba(107, 152, 232, 0.35)'
  ctx.lineWidth = 4
  ctx.strokeRect(mapOffsetX, mapOffsetY, state.mapW, state.mapH)

  for (const w of state.walls) {
    if (w.hp <= 0) continue
    const x = mapOffsetX + w.col * cellSize
    const y = mapOffsetY + w.row * cellSize
    if (assets.wallBrick) {
      ctx.drawImage(assets.wallBrick, x, y, cellSize, cellSize)
    } else {
      ctx.fillStyle = ENTITY.wallBrick.color
      drawRoundedRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 8)
      ctx.fill()
    }
  }

  const bx = mapOffsetX + state.baseCol * cellSize
  const by = mapOffsetY + state.baseRow * cellSize
  ctx.fillStyle = ENTITY.homeBase.color
  drawRoundedRect(ctx, bx + 4, by + 4, cellSize - 8, cellSize - 8, 12)
  ctx.fill()
  ctx.font = `${cellSize * 0.45}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ENTITY.homeBase.emoji, bx + cellSize / 2, by + cellSize / 2)

  for (const b of state.bullets) {
    ctx.save()
    ctx.fillStyle = ENTITY.bulletNormal.color
    ctx.shadowColor = ENTITY.bulletNormal.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  for (const e of state.enemies) {
    if (e.hp <= 0) continue
    drawTank(ctx, e.x, e.y, e.w, e.h, e.dir, ENTITY.enemyTank1.color, ENTITY.enemyTank1.emoji, assets.tankEnemy)
  }

  const p = state.player
  if (p && p.hp > 0) {
    drawTank(ctx, p.x, p.y, p.w, p.h, p.dir, ENTITY.playerTank.color, ENTITY.playerTank.emoji, assets.tankPlayer)
  }

  for (const part of state.particles) {
    ctx.globalAlpha = Math.max(0, part.life / part.maxLife)
    ctx.fillStyle = part.color
    ctx.beginPath()
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const f of state.floatTexts) {
    ctx.globalAlpha = Math.max(0, f.life)
    ctx.fillStyle = f.color
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y - (1 - f.life) * 40)
    ctx.globalAlpha = 1
  }

  drawHud(ctx, W, hudTop, state)

  if (state.levelMessageTimer > 0 && state.phase === 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, H * 0.42, W, 48)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`第 ${state.levelIndex + 1} 关`, W / 2, H * 0.42 + 32)
  }

  if (state.phase === 'levelClear') {
    drawOverlay(ctx, W, H, '关卡完成！', '点击继续下一关', PALETTE.success)
  } else if (state.phase === 'victory') {
    const stars = '★'.repeat(3)
    drawOverlay(ctx, W, H, '胜利！', `${stars} 守护基地成功`, PALETTE.primary)
  } else if (state.phase === 'defeat') {
    drawOverlay(ctx, W, H, '再试一次', '基地或坦克被击毁啦', PALETTE.danger)
  }
}

function drawHud(ctx: CanvasRenderingContext2D, W: number, top: number, state: GameState) {
  ctx.fillStyle = 'rgba(255,255, 255, 0.92)'
  drawRoundedRect(ctx, 16, top, W - 32, 72, 16)
  ctx.fill()

  ctx.fillStyle = PALETTE.primary
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`关卡 ${state.levelIndex + 1}/3`, 28, top + 28)
  ctx.fillStyle = '#333'
  ctx.font = '16px sans-serif'
  ctx.fillText(`得分 ${state.score}`, 28, top + 54)

  const p = state.player
  if (p) {
    ctx.textAlign = 'right'
    ctx.fillStyle = PALETTE.danger
    ctx.fillText(`坦克 ♥${p.hp}`, W - 28, top + 28)
    ctx.fillStyle = PALETTE.base
    ctx.fillText(`基地 ♥${state.baseHp}`, W - 28, top + 54)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = PALETTE.accent
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(`敌方 ${state.enemies.length}`, W / 2, top + 42)
}

function drawOverlay(ctx: CanvasRenderingContext2D, W: number, H: number, title: string, sub: string, color: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, W, H)
  const pw = W * 0.78
  const ph = 200
  const px = (W - pw) / 2
  const py = H * 0.38
  ctx.fillStyle = '#fff'
  drawRoundedRect(ctx, px, py, pw, ph, 20)
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, py + 56)
  ctx.fillStyle = '#555'
  ctx.font = '18px sans-serif'
  ctx.fillText(sub, W / 2, py + 100)
  ctx.fillStyle = PALETTE.primary
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('点击屏幕继续', W / 2, py + 150)
}