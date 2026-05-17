import { W, H, HUD_H, GRID, CELL, TOWER_TYPES } from './config'
import type { Tower } from './types'

export function pixelToGrid(px: number, py: number) {
  return { gx: Math.floor(px / CELL), gy: Math.floor((py - HUD_H) / CELL) }
}

export function isInHUD(py: number): boolean {
  return py < HUD_H
}

export function isInGameArea(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID && gy >= 0 && gy < GRID
}

export function getTowerTypeAt(px: number): number | null {
  const startX = W - TOWER_TYPES.length * 55 - 10
  for (let i = 0; i < TOWER_TYPES.length; i++) {
    const bx = startX + i * 55
    if (px >= bx && px <= bx + 48) {
      return i
    }
  }
  return null
}

export function getTowerAt(towers: Tower[], gx: number, gy: number): Tower | undefined {
  return towers.find(t => t.gx === gx && t.gy === gy)
}

export function isOnPath(grid: number[][], gx: number, gy: number): boolean {
  return grid[gy]?.[gx] === 1
}

export function getSpecialSkillButtonBounds() {
  return {
    x: W - 60,
    y: HUD_H - 50,
    radius: 20,
  }
}
