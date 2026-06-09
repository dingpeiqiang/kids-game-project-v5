import type { Tower, TowerType, GridCell, Enemy } from '../types'
import { GAME_CONFIG, TOWER_TYPES } from '../config'

const { UPGRADE_COST_MULTIPLIER, DAMAGE_UPGRADE_MULTIPLIER, RANGE_UPGRADE_MULTIPLIER, FIRERATE_UPGRADE_MULTIPLIER, MAX_TOWER_LEVEL } = GAME_CONFIG

let towerIdCounter = 0

export function createTower(type: TowerType, gx: number, gy: number, cellCenter: { x: number; y: number }): Tower {
  return {
    id: `tower_${++towerIdCounter}`,
    gx,
    gy,
    x: cellCenter.x,
    y: GAME_CONFIG.TOWER_HEIGHT,
    z: cellCenter.y,
    type,
    level: 1,
    fireTimer: 0,
    targetId: null,
    totalInvestment: type.cost
  }
}

export function calculateUpgradeCost(tower: Tower): number {
  return Math.floor(tower.type.cost * Math.pow(UPGRADE_COST_MULTIPLIER, tower.level))
}

export function canUpgrade(tower: Tower): boolean {
  return tower.level < MAX_TOWER_LEVEL
}

export function upgradeTower(tower: Tower): void {
  if (!canUpgrade(tower)) return
  
  tower.level++
  tower.totalInvestment += calculateUpgradeCost(tower)
}

export function getTowerDamage(tower: Tower): number {
  return tower.type.damage * Math.pow(DAMAGE_UPGRADE_MULTIPLIER, tower.level - 1)
}

export function getTowerRange(tower: Tower): number {
  return tower.type.range * Math.pow(RANGE_UPGRADE_MULTIPLIER, tower.level - 1)
}

export function getTowerFireRate(tower: Tower): number {
  return tower.type.fireRate * Math.pow(FIRERATE_UPGRADE_MULTIPLIER, tower.level - 1)
}

export function calculateSellValue(tower: Tower): number {
  return Math.floor(tower.totalInvestment * GAME_CONFIG.SELL_REFUND_RATIO)
}

export function findTarget(tower: Tower, enemies: Enemy[]): Enemy | null {
  const range = getTowerRange(tower)
  let closestEnemy: Enemy | null = null
  let closestDistance = Infinity
  
  for (const enemy of enemies) {
    const dx = enemy.x - tower.x
    const dz = enemy.y - tower.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    if (distance <= range && distance < closestDistance) {
      closestDistance = distance
      closestEnemy = enemy
    }
  }
  
  return closestEnemy
}

export function updateTower(tower: Tower, enemies: Enemy[], deltaTime: number): { shouldFire: boolean; target: Enemy | null } {
  tower.fireTimer += deltaTime
  
  const fireRate = getTowerFireRate(tower)
  
  if (tower.fireTimer >= fireRate) {
    tower.fireTimer = 0
    const target = findTarget(tower, enemies)
    tower.targetId = target?.id || null
    return { shouldFire: true, target }
  }
  
  return { shouldFire: false, target: null }
}

export function getTowerTypeById(id: string): TowerType | undefined {
  return TOWER_TYPES.find(t => t.id === id)
}