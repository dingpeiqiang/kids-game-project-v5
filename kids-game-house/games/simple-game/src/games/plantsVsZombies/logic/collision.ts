import type { Plant, Zombie, Projectile, Sun } from '../types'
import { GAME_CONFIG } from '../config'

export function checkPlantZombieCollision(plant: Plant, zombie: Zombie): boolean {
  const plantX = plant.gridPos.col * GAME_CONFIG.CELL_WIDTH + GAME_CONFIG.CELL_WIDTH / 2
  const plantY = plant.gridPos.row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.HUD_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2
  
  const dx = zombie.position.x - plantX
  const dy = zombie.position.y - plantY
  
  return Math.abs(dx) < GAME_CONFIG.CELL_WIDTH / 2 + 20 &&
         Math.abs(dy) < GAME_CONFIG.CELL_HEIGHT / 2 + 20
}

export function checkProjectileZombieCollision(projectile: Projectile, zombie: Zombie): boolean {
  const dx = zombie.position.x - projectile.x
  const dy = zombie.position.y - projectile.y
  
  return Math.abs(dx) < 30 && Math.abs(dy) < 40
}

export function checkSunCollection(sun: Sun, mouseX: number, mouseY: number): boolean {
  const dx = mouseX - sun.x
  const dy = mouseY - sun.y
  return Math.sqrt(dx * dx + dy * dy) < 30
}

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