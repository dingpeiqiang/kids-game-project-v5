import type { Bullet, Enemy } from './types'
import { CELL } from './config'

export function createBullet(tower: { x: number; y: number; angle: number; type: { damage: number; bulletColor: string; bulletSpeed: number; aoe?: number; slow?: number; slowDur?: number; piercing?: boolean } }, target: Enemy): Bullet {
  return {
    x: tower.x + Math.cos(tower.angle) * 16,
    y: tower.y + Math.sin(tower.angle) * 16,
    target,
    damage: tower.type.damage,
    color: tower.type.bulletColor,
    speed: tower.type.bulletSpeed,
    aoe: tower.type.aoe,
    slow: tower.type.slow,
    slowDur: tower.type.slowDur,
    piercing: tower.type.piercing,
  }
}

export function updateBullet(bullet: Bullet): { hit: boolean; target: Enemy | null } {
  if (!bullet.target) {
    return { hit: false, target: null }
  }

  const dx = bullet.target.x - bullet.x
  const dy = bullet.target.y - bullet.y
  const distance = Math.hypot(dx, dy)

  if (distance < bullet.speed + bullet.target.size) {
    return { hit: true, target: bullet.target }
  }

  const moveX = (dx / distance) * bullet.speed
  const moveY = (dy / distance) * bullet.speed
  bullet.x += moveX
  bullet.y += moveY

  return { hit: false, target: null }
}

export function getAoeEnemies(bullet: Bullet, enemies: Enemy[]): Enemy[] {
  if (!bullet.aoe) return []
  
  return enemies.filter(e => {
    const distance = Math.hypot(bullet.x - e.x, bullet.y - e.y)
    return distance < bullet.aoe!
  })
}
