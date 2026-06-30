import type { Tower, TowerType, Enemy } from './types'
import { CELL, HUD_H, TOWER_TYPES } from './config'

export function gridToPixel(gx: number, gy: number) {
  return { x: gx * CELL + CELL / 2, y: gy * CELL + HUD_H + CELL / 2 }
}

export function createTower(gx: number, gy: number, typeIndex: number, gold: number): { tower: Tower | null; newGold: number } {
  const typeTemplate = TOWER_TYPES[typeIndex]
  if (gold < typeTemplate.cost) {
    return { tower: null, newGold: gold }
  }

  const pos = gridToPixel(gx, gy)
  const towerType = { ...typeTemplate }

  const tower: Tower = {
    gx,
    gy,
    x: pos.x,
    y: pos.y,
    type: towerType,
    fireTimer: 0,
    angle: 0,
    level: 1,
    totalInvestment: typeTemplate.cost,
  }

  return { tower, newGold: gold - typeTemplate.cost }
}

export function upgradeTower(tower: Tower, gold: number): { success: boolean; newGold: number } {
  const upgradeCost = Math.floor(tower.type.cost * (0.4 + tower.level * 0.4))
  if (gold < upgradeCost) {
    return { success: false, newGold: gold }
  }

  tower.level++
  tower.totalInvestment += upgradeCost
  tower.type.damage *= 1.15
  tower.type.range *= 1.05
  tower.type.fireRate = Math.max(5, tower.type.fireRate * 0.92)

  return { success: true, newGold: gold - upgradeCost }
}

export function findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
  let bestEnemy: Enemy | null = null
  let bestProgress = -1
  const range = tower.type.range * CELL

  for (const e of enemies) {
    const distance = Math.hypot(tower.x - e.x, tower.y - e.y)
    if (distance <= range) {
      const progress = e.pathIdx * 1000 - Math.hypot(e.x - 0, e.y - 0)
      if (progress > bestProgress) {
        bestProgress = progress
        bestEnemy = e
      }
    }
  }

  return bestEnemy
}

export function getUpgradeCost(tower: Tower): number {
  return Math.floor(tower.type.cost * (0.4 + tower.level * 0.4))
}

export function isTowerAt(grid: number[][], gx: number, gy: number): boolean {
  return grid[gy]?.[gx] === 2
}
