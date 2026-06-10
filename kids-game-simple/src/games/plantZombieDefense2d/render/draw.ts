import {
  BASE_H,
  BASE_W,
  COLORS,
  GAME_CONFIG,
  PLANT_CARD_ORDER,
  PLANT_DEFS,
  ZOMBIE_DEFS,
  cellTypeAt,
} from '../config'
import { GridCellType } from '../types'
import type { GameState } from '../types'
import { computeStars } from '../logic/gameLoop'
import { gridCenterPx } from '../logic/coords'
import type { Pzd2dAssets } from './assets'
import { computeViewport, type Viewport } from './layout'

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

function applyTransform(ctx: CanvasRenderingContext2D, vp: Viewport) {
  ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.offsetX, vp.offsetY)
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  w: number,
  h: number,
) {
  if (!img) return false
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  return true
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  state: GameState,
  assets: Pzd2dAssets,
) {
  const vp = computeViewport(canvasW, canvasH)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#1a2e1a'
  ctx.fillRect(0, 0, canvasW, canvasH)

  applyTransform(ctx, vp)
  if (assets.lawnBg) {
    ctx.drawImage(assets.lawnBg, 0, 0, BASE_W, BASE_H)
  } else {
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, BASE_W, BASE_H)
  }

  if (state.phase === 'ui') {
    drawLevelSelect(ctx, state)
    return
  }

  drawGrid(ctx, vp, assets)
  drawPlants(ctx, state, assets)
  drawZombies(ctx, state, assets)
  drawPeas(ctx, state, assets)
  drawSuns(ctx, state, assets)
  drawFloats(ctx, state)
  drawParticles(ctx, state)
  drawHud(ctx, state, assets)

  if (state.phase === 'prep' && state.prepTimer > 0 && state.waveIndex > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, BASE_W, BASE_H - GAME_CONFIG.cardBarH)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`下一波 ${Math.ceil(state.prepTimer)}s`, BASE_W / 2, 40)
  }

  if (state.phase === 'victory' || state.phase === 'defeat') {
    drawResult(ctx, state)
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, assets: Pzd2dAssets) {
  const { cellPx } = GAME_CONFIG
  const houseImg = assets.images.house ?? null
  for (let gz = 0; gz < GAME_CONFIG.gridH; gz++) {
    for (let gx = 0; gx < GAME_CONFIG.gridW; gx++) {
      const t = cellTypeAt(gx, gz)
      const x = vp.gridLeft + gx * cellPx
      const y = vp.gridTop + gz * cellPx
      if (t === GridCellType.empty) {
        ctx.fillStyle = (gx + gz) % 2 === 0 ? COLORS.lawnLight : COLORS.lawnDark
        ctx.globalAlpha = assets.lawnBg ? 0.35 : 1
        ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2)
        ctx.globalAlpha = 1
      } else if (t === GridCellType.path) {
        ctx.fillStyle = '#7A9E6A'
        ctx.globalAlpha = assets.lawnBg ? 0.45 : 1
        ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2)
        ctx.globalAlpha = 1
      } else if (t === GridCellType.base) {
        const cx = x + cellPx / 2
        const cy = y + cellPx / 2
        if (!drawSprite(ctx, houseImg, cx, cy, cellPx - 6, cellPx - 6)) {
          ctx.fillStyle = COLORS.house
          roundRect(ctx, x + 2, y + 4, cellPx - 4, cellPx - 8, 8)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('\u5c4b', cx, cy + 6)
        }
      }
    }
  }
}

function drawPlants(ctx: CanvasRenderingContext2D, state: GameState, assets: Pzd2dAssets) {
  const r = GAME_CONFIG.cellPx * 0.32
  const spr = GAME_CONFIG.cellPx * 0.88
  for (const p of state.plants) {
    if (!p.alive) continue
    const def = PLANT_DEFS[p.kind]
    const c = gridCenterPx(p.gx, p.gz)
    const img = assets.plants[p.kind]
    if (!drawSprite(ctx, img, c.x, c.y, spr, spr)) {
      ctx.fillStyle = def.color
      ctx.beginPath()
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.font = `${Math.floor(r * 1.4)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(def.emoji, c.x, c.y)
    }
    if (p.maxHp < 400 && p.hp < p.maxHp) {
      const w = GAME_CONFIG.cellPx * 0.55
      ctx.fillStyle = '#333'
      ctx.fillRect(c.x - w / 2, c.y - r - 8, w, 5)
      ctx.fillStyle = COLORS.success
      ctx.fillRect(c.x - w / 2, c.y - r - 8, w * (p.hp / p.maxHp), 5)
    }
  }
}

function drawZombies(ctx: CanvasRenderingContext2D, state: GameState, assets: Pzd2dAssets) {
  const w = GAME_CONFIG.cellPx * 0.38
  const h = GAME_CONFIG.cellPx * 0.55
  const zw = GAME_CONFIG.cellPx * 0.72
  const zh = GAME_CONFIG.cellPx * 0.9
  for (const z of state.zombies) {
    if (!z.alive) continue
    const def = ZOMBIE_DEFS[z.kind]
    const y = gridCenterPx(0, z.gz).y
    const img = assets.zombies[z.kind]
    if (!drawSprite(ctx, img, z.x, y, zw, zh)) {
      ctx.fillStyle = def.color
      roundRect(ctx, z.x - w / 2, y - h / 2, w, h, 10)
      ctx.fill()
      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(def.emoji, z.x, y)
    }
    if (z.hp < z.maxHp) {
      const barW = w
      ctx.fillStyle = '#333'
      ctx.fillRect(z.x - barW / 2, y - h / 2 - 8, barW, 4)
      ctx.fillStyle = COLORS.danger
      ctx.fillRect(z.x - barW / 2, y - h / 2 - 8, barW * (z.hp / z.maxHp), 4)
    }
  }
}

function drawPeas(ctx: CanvasRenderingContext2D, state: GameState, assets: Pzd2dAssets) {
  const r = 7
  const peaImg = assets.pea
  for (const pea of state.peas) {
    if (!pea.alive) continue
    if (!drawSprite(ctx, peaImg, pea.x, pea.y, 18, 18)) {
      ctx.fillStyle = COLORS.pea
      ctx.beginPath()
      ctx.arc(pea.x, pea.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawSuns(ctx: CanvasRenderingContext2D, state: GameState, assets: Pzd2dAssets) {
  const sunImg = assets.iconSun
  for (const s of state.suns) {
    if (!s.alive) continue
    if (!drawSprite(ctx, sunImg, s.x, s.y, 40, 40)) {
      ctx.font = '32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('\u2600\uFE0F', s.x, s.y)
    }
  }
}

function drawFloats(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const f of state.floats) {
    ctx.globalAlpha = Math.min(1, f.life)
    ctx.fillStyle = f.color
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y - (1.2 - f.life) * 30)
    ctx.globalAlpha = 1
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 2)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function drawLevelSelect(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = COLORS.hudBar
  ctx.fillRect(0, 0, BASE_W, 56)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('选择关卡', BASE_W / 2, 38)

  const cols = 5
  const cell = 72
  const gap = 10
  const gridW = cols * cell + (cols - 1) * gap
  const startX = (BASE_W - gridW) / 2
  const startY = 88

  for (let i = 0; i < GAME_CONFIG.totalLevels; i++) {
    const level = i + 1
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * (cell + gap)
    const y = startY + row * (cell + gap)
    const unlocked = level <= state.records.unlockedLevel
    const stars = state.records.starsByLevel[level] ?? 0

    ctx.fillStyle = unlocked ? COLORS.primary : '#4a5568'
    roundRect(ctx, x, y, cell, cell, 10)
    ctx.fill()
    if (!unlocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      roundRect(ctx, x, y, cell, cell, 10)
      ctx.fill()
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ccc'
      ctx.fillText('\u9501', x + cell / 2, y + cell / 2 + 6)
      continue
    }
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(level), x + cell / 2, y + cell / 2 - 4)
    ctx.font = '14px sans-serif'
    ctx.fillStyle = COLORS.accent
    ctx.fillText(
      '\u2605'.repeat(stars) + (stars < 3 ? '\u2606'.repeat(3 - stars) : ''),
      x + cell / 2,
      y + cell - 10,
    )
  }

  ctx.fillStyle = '#ddd'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('返回大厅', 24, BASE_H - 24)
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState, assets: Pzd2dAssets) {
  ctx.fillStyle = COLORS.hudBar
  ctx.fillRect(0, 0, BASE_W, 48)
  if (assets.iconSun) {
    ctx.drawImage(assets.iconSun, 12, 10, 32, 32)
    ctx.fillStyle = COLORS.accent
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(String(state.sun), 50, 34)
  } else {
    ctx.fillStyle = COLORS.accent
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`\u2600\uFE0F ${state.sun}`, 16, 34)
  }
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(
    `\u7b2c${state.levelIndex}\u5173  \u6ce2 ${Math.min(state.waveIndex + 1, state.totalWaves)}/${state.totalWaves}`,
    BASE_W / 2,
    34,
  )
  const barX = BASE_W - 200
  ctx.fillStyle = '#333'
  roundRect(ctx, barX, 14, 180, 20, 6)
  ctx.fill()
  ctx.fillStyle = state.houseHp / state.maxHouseHp < 0.3 ? COLORS.danger : COLORS.success
  roundRect(ctx, barX, 14, 180 * (state.houseHp / state.maxHouseHp), 20, 6)
  ctx.fill()
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'right'
  ctx.fillText(`\u5c0f\u5c4b ${state.houseHp}/${state.maxHouseHp}`, BASE_W - 12, 30)

  const barY = BASE_H - GAME_CONFIG.cardBarH
  ctx.fillStyle = 'rgba(45,90,61,0.95)'
  ctx.fillRect(0, barY, BASE_W, GAME_CONFIG.cardBarH)
  const pad = 12
  const cardW = 88
  const gap = 10
  const totalW = PLANT_CARD_ORDER.length * cardW + (PLANT_CARD_ORDER.length - 1) * gap
  let x = (BASE_W - totalW) / 2
  for (const kind of PLANT_CARD_ORDER) {
    const def = PLANT_DEFS[kind]
    const selected = state.selectedPlant === kind
    const afford = state.sun >= def.cost
    ctx.fillStyle = selected ? COLORS.primary : '#4a6b52'
    roundRect(ctx, x, barY + pad, cardW, GAME_CONFIG.cardBarH - pad * 2, 10)
    ctx.fill()
    if (!afford) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      roundRect(ctx, x, barY + pad, cardW, GAME_CONFIG.cardBarH - pad * 2, 10)
      ctx.fill()
    }
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(def.emoji, x + cardW / 2, barY + pad + 36)
    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = COLORS.accent
    ctx.fillText(`${def.cost}`, x + cardW / 2, barY + GAME_CONFIG.cardBarH - pad - 8)
    x += cardW + gap
  }
}

function drawResult(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, BASE_W, BASE_H)
  const win = state.phase === 'victory'
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(win ? '\u5b88\u62a4\u6210\u529f\uff01' : '\u5c0f\u5c4b\u88ab\u653b\u7834', BASE_W / 2, BASE_H / 2 - 40)
  if (win) {
    const stars = computeStars(state)
    ctx.font = '40px sans-serif'
    ctx.fillText('\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars), BASE_W / 2, BASE_H / 2 + 10)
    ctx.font = '20px sans-serif'
    ctx.fillText(`\u5f97\u5206 ${state.score}`, BASE_W / 2, BASE_H / 2 + 50)
  } else {
    ctx.font = '18px sans-serif'
    ctx.fillText('\u591a\u79cd\u70b9\u5c04\u624b\u548c\u575a\u679c\u54e6', BASE_W / 2, BASE_H / 2 + 20)
  }

  const cx = BASE_W / 2
  const cy = BASE_H / 2 + 80
  const bw = 120
  const bh = 44
  const gap = 12
  ctx.font = 'bold 18px sans-serif'
  ctx.fillStyle = COLORS.primary
  roundRect(ctx, cx - bw - gap, cy, bw, bh, 10)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText('\u518d\u6765', cx - gap - bw / 2, cy + 28)

  if (win && state.levelIndex < GAME_CONFIG.totalLevels) {
    const nextUnlocked = state.levelIndex + 1 <= state.records.unlockedLevel
    ctx.fillStyle = nextUnlocked ? COLORS.accent : '#888'
    roundRect(ctx, cx + gap, cy, bw, bh, 10)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.fillText('\u4e0b\u4e00\u5173', cx + gap + bw / 2, cy + 28)
  }

  ctx.fillStyle = '#4a6b52'
  roundRect(ctx, cx - bw / 2, cy + bh + 14, bw, bh, 10)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText('\u9009\u5173', cx, cy + bh + 14 + 28)

  ctx.fillStyle = '#aaa'
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('\u8fd4\u56de\u5927\u5385', BASE_W - 16, BASE_H - 24)
}