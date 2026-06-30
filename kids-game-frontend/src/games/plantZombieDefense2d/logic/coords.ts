import { BASE_W, GAME_CONFIG } from '../config'

export const GRID_LEFT = (BASE_W - GAME_CONFIG.gridW * GAME_CONFIG.cellPx) / 2
export const GRID_TOP = 56

export function gridCenterPx(gx: number, gz: number): { x: number; y: number } {
  const { cellPx } = GAME_CONFIG
  return {
    x: GRID_LEFT + (gx + 0.5) * cellPx,
    y: GRID_TOP + (gz + 0.5) * cellPx,
  }
}

export function colToX(col: number): number {
  return GRID_LEFT + col * GAME_CONFIG.cellPx
}

export function rowCenterY(gz: number): number {
  return GRID_TOP + (gz + 0.5) * GAME_CONFIG.cellPx
}

export function zombieSpawnX(): number {
  return colToX(GAME_CONFIG.zombieSpawnCol)
}

export function zombieHouseX(): number {
  return colToX(GAME_CONFIG.zombieReachCol)
}

export function plantMouthX(gx: number): number {
  return GRID_LEFT + (gx + 0.85) * GAME_CONFIG.cellPx
}