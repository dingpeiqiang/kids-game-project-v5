import { GAME_CONFIG } from '../config'
import type { Player, JoystickInput } from '../types'

/**
 * 更新玩家移动
 */
export function updatePlayer(
  player: Player,
  joystick: JoystickInput,
  worldWidth: number,
  worldHeight: number,
): void {
  if (player.isDead) {
    player.isMoving = false
    return
  }

  if (!joystick.active) {
    player.isMoving = false
    return
  }

  const dx = joystick.dirX * GAME_CONFIG.PLAYER_SPEED
  const dy = joystick.dirY * GAME_CONFIG.PLAYER_SPEED

  player.x += dx
  player.y += dy

  // 更新移动状态
  player.isMoving = dx !== 0 || dy !== 0

  // 更新朝向角度
  if (dx !== 0 || dy !== 0) {
    player.facingAngle = Math.atan2(dy, dx)
    player.facingDir = dx > 0 ? 1 : -1
  }

  // 边界限制
  if (player.x < 0) player.x = 0
  if (player.y < 0) player.y = 0
  if (player.x + player.width > worldWidth) player.x = worldWidth - player.width
  if (player.y + player.height > worldHeight) player.y = worldHeight - player.height
}

/**
 * 玩家受到伤害
 */
export function damagePlayer(player: Player, damage: number): boolean {
  if (player.isDead) return false
  player.hp -= damage
  player.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
  if (player.hp <= 0) {
    player.hp = 0
    player.isDead = true
    player.respawnTimer = GAME_CONFIG.RESPAWN_TIME
    return true
  }
  return false
}

/**
 * 更新玩家复活计时器
 */
export function updatePlayerRespawn(player: Player, now: number, deltaMs: number): void {
  if (!player.isDead) return
  player.respawnTimer -= deltaMs
  if (player.respawnTimer <= 0) {
    player.isDead = false
    player.hp = player.maxHp
    player.hitFlashTimer = 0
    player.x = 80
    player.y = 360
  }
}

/**
 * 重置玩家状态
 */
export function resetPlayer(player: Player, worldWidth: number, worldHeight: number): void {
  player.hp = player.maxHp
  player.isDead = false
  player.respawnTimer = 0
  player.hitFlashTimer = 0
  player.facingAngle = 0
  player.facingDir = 1
  player.x = 80
  player.y = 360
  player.level = 1
  player.exp = 0
  player.expToNext = GAME_CONFIG.EXP_BASE
  player.gold = 0
  player.attackAnimTimer = 0
  player.skillCooldowns = [0, 0, 0]
  player.animTimer = 0
  player.isMoving = false
  player.skillCastTimer = 0
  player.skillCastId = 0
  player.deathAnimTimer = 0
}

/**
 * 更新技能冷却
 */
export function updateSkillCooldowns(player: Player, deltaMs: number): void {
  for (let i = 0; i < player.skillCooldowns.length; i++) {
    if (player.skillCooldowns[i] > 0) {
      player.skillCooldowns[i] = Math.max(0, player.skillCooldowns[i] - deltaMs)
    }
  }
}