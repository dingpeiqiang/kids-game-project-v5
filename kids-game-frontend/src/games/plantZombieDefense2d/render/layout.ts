import { BASE_H, BASE_W, GAME_CONFIG } from '../config'

export interface Viewport {
  scale: number
  offsetX: number
  offsetY: number
  gridLeft: number
  gridTop: number
  gridW: number
  gridH: number
  cellPx: number
}

export function computeViewport(canvasW: number, canvasH: number): Viewport {
  const scale = Math.min(canvasW / BASE_W, canvasH / BASE_H)
  const offsetX = (canvasW - BASE_W * scale) / 2
  const offsetY = (canvasH - BASE_H * scale) / 2
  const cellPx = GAME_CONFIG.cellPx
  const gridW = GAME_CONFIG.gridW * cellPx
  const gridH = GAME_CONFIG.gridH * cellPx
  const gridLeft = (BASE_W - gridW) / 2
  const gridTop = 56
  return { scale, offsetX, offsetY, gridLeft, gridTop, gridW, gridH, cellPx }
}

export function gridToPixel(vp: Viewport, gx: number, gz: number): { x: number; y: number } {
  return {
    x: vp.gridLeft + (gx + 0.5) * vp.cellPx,
    y: vp.gridTop + (gz + 0.5) * vp.cellPx,
  }
}

export function colToPixelX(vp: Viewport, col: number): number {
  return vp.gridLeft + col * vp.cellPx
}

export function screenToLogical(
  vp: Viewport,
  sx: number,
  sy: number,
): { x: number; y: number } {
  return {
    x: (sx - vp.offsetX) / vp.scale,
    y: (sy - vp.offsetY) / vp.scale,
  }
}

export function pixelToGrid(
  vp: Viewport,
  lx: number,
  ly: number,
): { gx: number; gz: number } | null {
  const gx = Math.floor((lx - vp.gridLeft) / vp.cellPx)
  const gz = Math.floor((ly - vp.gridTop) / vp.cellPx)
  if (gx < 0 || gz < 0 || gx >= GAME_CONFIG.gridW || gz >= GAME_CONFIG.gridH) return null
  return { gx, gz }
}

export function zombieSpawnX(vp: Viewport): number {
  return colToPixelX(vp, GAME_CONFIG.zombieSpawnCol)
}

export function zombieHouseX(vp: Viewport): number {
  return colToPixelX(vp, GAME_CONFIG.zombieReachCol)
}

export function plantShootX(vp: Viewport, gx: number): number {
  return vp.gridLeft + (gx + 0.85) * vp.cellPx
}