import type { Bullet, Enemy, Tower } from '../types'
import { GAME_CONFIG } from '../config'

let bulletIdCounter = 0

export function createBullet(tower: Tower, target: Enemy): Bullet {
  return {
    id: `bullet_${++bulletIdCounter}`,
    x: tower.x,
    y: GAME_CONFIG.BULLET_HEIGHT,
    z: tower.z,
    targetId: target.id,
    damage: tower.type.damage * tower.level,
    color: tower.type.bulletColor,
    speed: 8,
    slowFactor: tower.type.slowFactor,
    slowDuration: tower.type.slowDuration,
    armorPenetration: tower.type.armorPenetration
  }
}

export function updateBullet(bullet: Bullet, enemies: Enemy[]): { hit: boolean; target: Enemy | null; distance: number } {
  const target = enemies.find(e => e.id === bullet.targetId)
  
  if (!target) {
    return { hit: false, target: null, distance: 0 }
  }
  
  const dx = target.x - bullet.x
  const dz = target.y - bullet.z
  const distance = Math.sqrt(dx * dx + dz * dz)
  
  if (distance < 0.3) {
    return { hit: true, target, distance }
  }
  
  const moveSpeed = bullet.speed * 0.02
  const vx = (dx / distance) * moveSpeed
  const vz = (dz / distance) * moveSpeed
  
  bullet.x += vx
  bullet.z += vz
  
  return { hit: false, target, distance }
}