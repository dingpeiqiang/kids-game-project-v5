import { BASE_H, BASE_W, GAME_CONFIG, PLANT_CARD_ORDER } from './config'
import { PlantKind } from './types'
import type { GameState } from './types'
import { pixelToGrid, screenToLogical, type Viewport } from './render/layout'
import {
  pickSunAt,
  plantAtScreen,
  plantBuildCost,
  startLevelFromUi,
  tryCollectSun,
  tryPlacePlant,
  tryRemovePlant,
} from './logic/gameLoop'

export interface TapResult {
  handled: boolean
  invalidSun?: boolean
  levelPick?: number
}

function hitPlantCard(vp: Viewport, lx: number, ly: number): PlantKind | null {
  const barY = BASE_H - GAME_CONFIG.cardBarH
  if (ly < barY || ly > BASE_H) return null
  const pad = 12
  const cardW = 88
  const gap = 10
  const totalW = PLANT_CARD_ORDER.length * cardW + (PLANT_CARD_ORDER.length - 1) * gap
  let x = (BASE_W - totalW) / 2
  for (const kind of PLANT_CARD_ORDER) {
    if (lx >= x && lx <= x + cardW && ly >= barY + pad && ly <= BASE_H - pad) return kind
    x += cardW + gap
  }
  return null
}

function hitLevelSelect(state: GameState, lx: number, ly: number): number | null {
  if (state.phase !== 'ui') return null
  const cols = 5
  const cell = 72
  const gap = 10
  const rows = Math.ceil(GAME_CONFIG.totalLevels / cols)
  const gridW = cols * cell + (cols - 1) * gap
  const gridH = rows * cell + (rows - 1) * gap
  const startX = (BASE_W - gridW) / 2
  const startY = 88
  for (let i = 0; i < GAME_CONFIG.totalLevels; i++) {
    const level = i + 1
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * (cell + gap)
    const y = startY + row * (cell + gap)
    if (lx >= x && lx <= x + cell && ly >= y && ly <= y + cell) {
      if (level > state.records.unlockedLevel) return null
      return level
    }
  }
  if (ly > BASE_H - 52 && lx < 160) return -1
  return null
}

function hitResultButton(
  state: GameState,
  lx: number,
  ly: number,
): 'retry' | 'next' | 'menu' | 'levels' | null {
  if (!state.resultReady) return null
  const cx = BASE_W / 2
  const cy = BASE_H / 2 + 80
  const bw = 120
  const bh = 44
  const gap = 12
  const retry = { x: cx - bw - gap, y: cy, w: bw, h: bh }
  const next = { x: cx + gap, y: cy, w: bw, h: bh }
  const levels = { x: cx - bw / 2, y: cy + bh + 14, w: bw, h: bh }
  const inRect = (r: { x: number; y: number; w: number; h: number }) =>
    lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h
  if (state.phase === 'victory' && inRect(next)) return 'next'
  if (inRect(retry)) return 'retry'
  if (inRect(levels)) return 'levels'
  if (ly > BASE_H - 60 && lx > BASE_W - 140) return 'menu'
  return null
}

export function handleTap(
  state: GameState,
  vp: Viewport,
  sx: number,
  sy: number,
): TapResult & { resultAction?: 'retry' | 'next' | 'menu' | 'levels' } {
  const { x: lx, y: ly } = screenToLogical(vp, sx, sy)

  if (state.phase === 'ui') {
    const pick = hitLevelSelect(state, lx, ly)
    if (pick === -1) return { handled: true, resultAction: 'menu' }
    if (pick != null && pick > 0) {
      if (startLevelFromUi(state, pick)) return { handled: true, levelPick: pick }
    }
    return { handled: pick != null }
  }

  if (state.phase === 'victory' || state.phase === 'defeat') {
    const action = hitResultButton(state, lx, ly)
    if (action) return { handled: true, resultAction: action }
    return { handled: false }
  }

  const card = hitPlantCard(vp, lx, ly)
  if (card) {
    state.selectedPlant = card
    state.selectedPlantId = null
    if (state.sun < plantBuildCost(card)) return { handled: true, invalidSun: true }
    return { handled: true }
  }

  const sunId = pickSunAt(state, lx, ly)
  if (sunId != null) {
    tryCollectSun(state, sunId)
    return { handled: true }
  }

  const grid = pixelToGrid(vp, lx, ly)
  if (grid) {
    const existing = plantAtScreen(state, grid.gx, grid.gz)
    if (existing) {
      tryRemovePlant(state, existing.id)
      return { handled: true }
    }
    const ok = tryPlacePlant(state, state.selectedPlant, grid.gx, grid.gz)
    if (!ok && state.sun < plantBuildCost(state.selectedPlant)) {
      return { handled: true, invalidSun: true }
    }
    return { handled: true }
  }

  return { handled: false }
}

export function bindPzd2dInput(
  canvas: HTMLCanvasElement,
  getVp: () => Viewport,
  getState: () => GameState,
  onTap: (result: ReturnType<typeof handleTap>) => void,
): () => void {
  const onPointerDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * canvas.width
    const sy = ((e.clientY - rect.top) / rect.height) * canvas.height
    const state = getState()
    const r = handleTap(state, getVp(), sx, sy)
    onTap(r)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  return () => canvas.removeEventListener('pointerdown', onPointerDown)
}

export function resizeCanvasToDisplay(canvas: HTMLCanvasElement): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  const w = Math.max(1, Math.floor(rect.width * dpr))
  const h = Math.max(1, Math.floor(rect.height * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
}