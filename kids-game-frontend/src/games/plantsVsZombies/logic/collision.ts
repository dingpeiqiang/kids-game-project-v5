import type { Plant } from '../types'
import { GAME_CONFIG } from '../config'

export function isPointInGrid(x: number, y: number): boolean {
  return x >= 0 &&
         x < GAME_CONFIG.CANVAS_WIDTH &&
         y >= GAME_CONFIG.HUD_HEIGHT &&
         y < GAME_CONFIG.CANVAS_HEIGHT
}

export function isPointInCardArea(x: number, y: number): boolean {
  return y < GAME_CONFIG.HUD_HEIGHT && y >= 20
}

export function getCardIndexAt(x: number): number | null {
  const cardWidth = GAME_CONFIG.CARD_WIDTH + 10
  const startX = 20
  const index = Math.floor((x - startX) / cardWidth)
  
  if (index >= 0 && index < 8) {
    return index
  }
  return null
}

export function isPlantAtGrid(plants: Plant[], row: number, col: number): boolean {
  return plants.some(p => p.gridPos.row === row && p.gridPos.col === col)
}