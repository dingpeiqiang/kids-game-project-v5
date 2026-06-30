import { MARIO_CONFIG } from './config'
import type { Block, Enemy, Player, Rect } from './types'

export function aabb(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function resolvePlayerBlocks(player: Player, blocks: Block[]): void {
  if (player.vy > MARIO_CONFIG.MAX_FALL) player.vy = MARIO_CONFIG.MAX_FALL

  player.x += player.vx
  for (const b of blocks) {
    if (!aabb(player, b)) continue
    if (player.vx > 0) player.x = b.x - player.w
    else if (player.vx < 0) player.x = b.x + b.w
    player.vx = 0
  }

  player.y += player.vy
  player.onGround = false
  for (const b of blocks) {
    if (b.kind === 'pipe') continue
    if (!aabb(player, b)) continue
    if (player.vy > 0) {
      player.y = b.y - player.h
      player.vy = 0
      player.onGround = true
    } else if (player.vy < 0) {
      player.y = b.y + b.h
      player.vy = 0
      if (b.kind === 'brick' || b.kind === 'question') {
        b.hit = true
        if (b.kind === 'brick' && !player.big) {
          // small mario cannot break — bump only
        }
      }
    }
  }
}

export function resolveEnemyBlocks(enemy: Enemy, blocks: Block[]): void {
  enemy.vy = (enemy.vy ?? 0) + MARIO_CONFIG.GRAVITY * 0.8
  if (enemy.vy > MARIO_CONFIG.MAX_FALL) enemy.vy = MARIO_CONFIG.MAX_FALL

  enemy.x += enemy.vx
  let hitWall = false
  for (const b of blocks) {
    if (!aabb(enemy, b)) continue
    if (enemy.vx > 0) {
      enemy.x = b.x - enemy.w
      hitWall = true
    } else if (enemy.vx < 0) {
      enemy.x = b.x + enemy.w
      hitWall = true
    }
  }
  if (hitWall) enemy.vx *= -1

  enemy.y += enemy.vy
  for (const b of blocks) {
    if (!aabb(enemy, b)) continue
    if (enemy.vy > 0) {
      enemy.y = b.y - enemy.h
      enemy.vy = 0
    }
  }

  if (enemy.x < enemy.patrolMin) {
    enemy.x = enemy.patrolMin
    enemy.vx = Math.abs(enemy.vx)
  }
  if (enemy.x + enemy.w > enemy.patrolMax) {
    enemy.x = enemy.patrolMax - enemy.w
    enemy.vx = -Math.abs(enemy.vx)
  }
}

export function stompTest(player: Player, enemy: Enemy): boolean {
  if (!enemy.alive) return false
  const falling = player.vy > 0
  const overlap = aabb(player, enemy)
  if (!overlap) return false
  const playerBottom = player.y + player.h
  const enemyMid = enemy.y + enemy.h * 0.4
  return falling && playerBottom <= enemyMid + 8
}