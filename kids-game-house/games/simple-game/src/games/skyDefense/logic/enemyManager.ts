import type { Enemy, EnemyType, WaveConfig } from '../types'
import { GAME_CONFIG, ENEMY_TYPES, PATH_POINTS } from '../config'

let enemyIdCounter = 0

export function createEnemy(type: EnemyType, waveConfig: WaveConfig): Enemy {
  const startPoint = PATH_POINTS[0]
  const hp = Math.floor(type.baseHp * waveConfig.hpMultiplier)
  const speed = type.baseSpeed * waveConfig.speedMultiplier
  const reward = Math.floor(type.reward * waveConfig.rewardMultiplier)
  
  return {
    id: `enemy_${++enemyIdCounter}`,
    x: startPoint.x,
    y: GAME_CONFIG.ENEMY_HEIGHT,
    z: startPoint.y,
    hp,
    maxHp: hp,
    speed,
    baseSpeed: speed,
    pathIndex: 0,
    pathProgress: 0,
    slowTimer: 0,
    reward,
    type,
    color: type.color,
    size: type.size
  }
}

export function updateEnemy(enemy: Enemy, deltaTime: number): { reachedEnd: boolean } {
  if (enemy.slowTimer > 0) {
    enemy.slowTimer -= deltaTime
  }
  
  const currentSpeed = enemy.slowTimer > 0 ? enemy.baseSpeed * 0.4 : enemy.baseSpeed
  
  const pathLength = getPathLength()
  const moveDistance = currentSpeed * (deltaTime / 1000)
  
  enemy.pathProgress += moveDistance / pathLength
  
  if (enemy.pathProgress >= 1) {
    return { reachedEnd: true }
  }
  
  updateEnemyPosition(enemy)
  
  return { reachedEnd: false }
}

function updateEnemyPosition(enemy: Enemy): void {
  const pathLength = getPathLength()
  const targetDistance = enemy.pathProgress * pathLength
  
  let accumulatedLength = 0
  
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const p1 = PATH_POINTS[i]
    const p2 = PATH_POINTS[i + 1]
    const segmentLength = getDistance(p1.x, p1.y, p2.x, p2.y)
    
    if (accumulatedLength + segmentLength >= targetDistance) {
      const segmentProgress = (targetDistance - accumulatedLength) / segmentLength
      enemy.x = p1.x + (p2.x - p1.x) * segmentProgress
      enemy.z = p1.y + (p2.y - p1.y) * segmentProgress
      enemy.pathIndex = i
      return
    }
    
    accumulatedLength += segmentLength
  }
  
  const lastPoint = PATH_POINTS[PATH_POINTS.length - 1]
  enemy.x = lastPoint.x
  enemy.z = lastPoint.y
}

function getPathLength(): number {
  let length = 0
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const p1 = PATH_POINTS[i]
    const p2 = PATH_POINTS[i + 1]
    length += getDistance(p1.x, p1.y, p2.x, p2.y)
  }
  return length
}

function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function applyDamage(enemy: Enemy, damage: number, slowFactor?: number, slowDuration?: number): { killed: boolean } {
  enemy.hp -= damage
  
  if (slowFactor && slowDuration) {
    enemy.slowTimer = slowDuration
  }
  
  if (enemy.hp <= 0) {
    return { killed: true }
  }
  
  return { killed: false }
}

export function getEnemyTypeById(id: string): EnemyType | undefined {
  return ENEMY_TYPES.find(e => e.id === id)
}

export function generateWaveEnemies(waveConfig: WaveConfig): EnemyType[] {
  const enemies: EnemyType[] = []
  
  for (let i = 0; i < waveConfig.enemyCount; i++) {
    const typeIndex = Math.floor(Math.random() * waveConfig.enemyTypes.length)
    const typeId = waveConfig.enemyTypes[typeIndex]
    const enemyType = getEnemyTypeById(typeId)
    if (enemyType) {
      enemies.push(enemyType)
    }
  }
  
  return enemies
}