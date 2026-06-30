import { GAME_CONFIG } from '../config'
import type { Enemy, Player, Minion, Tower, Particle, FloatText } from '../types'
import { addHitParticles, addFloatText, rectCollision } from './combat'

/**
 * 更新敌方 AI 行为
 */
export function updateEnemy(
  enemy: Enemy,
  player: Player,
  minions: Minion[],
  towers: Tower[],
  particles: Particle[],
  floatTexts: FloatText[],
  deltaMs: number,
  worldWidth: number,
  worldHeight: number,
  now: number,
): void {
  if (enemy.isDead) {
    enemy.isMoving = false
    return
  }

  const prevX = enemy.x
  const prevY = enemy.y

  if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= deltaMs
  if (enemy.attackCooldown > 0) enemy.attackCooldown -= deltaMs
  for (let i = 0; i < enemy.skillCooldowns.length; i++) {
    if (enemy.skillCooldowns[i] > 0) {
      enemy.skillCooldowns[i] = Math.max(0, enemy.skillCooldowns[i] - deltaMs)
    }
  }

  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const distToPlayer = Math.sqrt(dx * dx + dy * dy)

  const nearestMinion = findNearestEnemyMinion(enemy, minions)

  // 如果敌方英雄在基地附近，优先对线
  if (enemy.aiState === 'lane') {
    updateLane(enemy, player, nearestMinion, distToPlayer, deltaMs, worldWidth, worldHeight)
    updateEnemyMoveState(enemy, prevX, prevY)
    return
  }

  switch (enemy.aiState) {
    case 'patrol':
      updatePatrol(enemy, player, nearestMinion, distToPlayer, worldWidth, worldHeight, deltaMs)
      break
    case 'chase':
      updateChase(enemy, player, nearestMinion, distToPlayer, deltaMs, worldWidth, worldHeight)
      break
    case 'attack':
      updateAttack(enemy, player, nearestMinion, distToPlayer, particles, floatTexts, deltaMs)
      break
    case 'retreat':
      updateRetreat(enemy, player, distToPlayer, deltaMs, worldWidth, worldHeight)
      break
  }

  updateEnemyMoveState(enemy, prevX, prevY)
}

/**
 * 寻找最近的敌方小兵
 */
function findNearestEnemyMinion(enemy: Enemy, minions: Minion[]): Minion | null {
  let nearest: Minion | null = null
  let nearestDist = GAME_CONFIG.ENEMY_CHASE_RANGE

  for (const m of minions) {
    if (m.isDead || m.team !== 'player') continue
    const dx = m.x + m.width / 2 - (enemy.x + enemy.width / 2)
    const dy = m.y + m.height / 2 - (enemy.y + enemy.height / 2)
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < nearestDist) {
      nearestDist = d
      nearest = m
    }
  }

  return nearest
}

/**
 * 巡逻状态
 */
function updatePatrol(
  enemy: Enemy,
  player: Player,
  nearestMinion: Minion | null,
  distToPlayer: number,
  worldWidth: number,
  worldHeight: number,
  deltaMs: number,
): void {
  // 检测到玩家进入追击范围
  if (!player.isDead && distToPlayer < GAME_CONFIG.ENEMY_CHASE_RANGE) {
    enemy.aiState = 'chase'
    return
  }

  // 检测到敌方小兵
  if (nearestMinion) {
    enemy.aiState = 'chase'
    return
  }

  // 巡逻移动
  enemy.patrolTimer -= deltaMs
  if (enemy.patrolTimer <= 0) {
    enemy.patrolDirX = (Math.random() - 0.5) * 2
    enemy.patrolDirY = (Math.random() - 0.5) * 2
    enemy.patrolTimer = 1500 + Math.random() * 1500
  }

  const speed = GAME_CONFIG.ENEMY_SPEED * 0.6
  enemy.x += enemy.patrolDirX * speed
  enemy.y += enemy.patrolDirY * speed

  clampPosition(enemy, worldWidth, worldHeight)
}

/**
 * 追击状态
 */
function updateChase(
  enemy: Enemy,
  player: Player,
  nearestMinion: Minion | null,
  distToPlayer: number,
  deltaMs: number,
  worldWidth: number,
  worldHeight: number,
): void {
  // 血量低时撤退
  if (enemy.hp < enemy.maxHp * 0.3 && distToPlayer > GAME_CONFIG.ENEMY_ATTACK_RANGE * 2) {
    enemy.aiState = 'retreat'
    return
  }

  // 玩家死亡或远离，恢复巡逻
  if (player.isDead || distToPlayer > GAME_CONFIG.ENEMY_CHASE_RANGE * 1.5) {
    if (!nearestMinion) {
      enemy.aiState = 'patrol'
      return
    }
  }

  // 优先攻击玩家，其次攻击小兵
  let targetX: number, targetY: number

  if (!player.isDead && distToPlayer < GAME_CONFIG.ENEMY_CHASE_RANGE) {
    targetX = player.x
    targetY = player.y
    // 进入攻击范围，转为攻击
    if (distToPlayer < GAME_CONFIG.ENEMY_ATTACK_RANGE) {
      enemy.aiState = 'attack'
      return
    }
  } else if (nearestMinion) {
    targetX = nearestMinion.x
    targetY = nearestMinion.y
    const dx = targetX - enemy.x
    const dy = targetY - enemy.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < GAME_CONFIG.ENEMY_ATTACK_RANGE) {
      enemy.aiState = 'attack'
      return
    }
  } else {
    enemy.aiState = 'patrol'
    return
  }

  // 朝目标移动
  const dx = targetX - enemy.x
  const dy = targetY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > 0) {
    const speed = GAME_CONFIG.ENEMY_SPEED * (deltaMs / 16)
    enemy.x += (dx / dist) * speed
    enemy.y += (dy / dist) * speed
  }

  clampPosition(enemy, worldWidth, worldHeight)
}

/**
 * 攻击状态
 */
function updateAttack(
  enemy: Enemy,
  player: Player,
  nearestMinion: Minion | null,
  distToPlayer: number,
  particles: Particle[],
  floatTexts: FloatText[],
  deltaMs: number,
): void {
  // 血量低时撤退
  if (enemy.hp < enemy.maxHp * 0.2) {
    enemy.aiState = 'retreat'
    return
  }

  // 确定攻击目标
  let target: { x: number; y: number; width: number; height: number; hp: number; isDead: boolean; hitFlashTimer: number } | null = null

  if (!player.isDead && distToPlayer < GAME_CONFIG.ENEMY_ATTACK_RANGE * 1.2) {
    target = player
  } else if (nearestMinion) {
    const dx = nearestMinion.x - enemy.x
    const dy = nearestMinion.y - enemy.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < GAME_CONFIG.ENEMY_ATTACK_RANGE * 1.2) {
      target = nearestMinion
    }
  }

  if (!target) {
    enemy.aiState = 'chase'
    return
  }

  // 攻击冷却中微调位置
  if (enemy.attackCooldown > 0) {
    const dx = target.x - enemy.x
    const dy = target.y - enemy.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > GAME_CONFIG.ENEMY_ATTACK_RANGE * 0.7 && dist > 0) {
      const speed = GAME_CONFIG.ENEMY_SPEED * 0.5 * (deltaMs / 16)
      enemy.x += (dx / dist) * speed
      enemy.y += (dy / dist) * speed
    }
    return
  }

  // 执行攻击
  enemy.attackCooldown = GAME_CONFIG.ENEMY_ATTACK_INTERVAL
  enemy.attackAnimTimer = 300

  if (!target.isDead) {
    const damage = GAME_CONFIG.ENEMY_ATTACK_DAMAGE
    target.hp -= damage
    target.hitFlashTimer = GAME_CONFIG.HIT_FLASH_DURATION
    addHitParticles(
      target.x + target.width / 2,
      target.y + target.height / 2,
      '#ff3a3a',
      particles,
    )
    addFloatText(
      target.x + target.width / 2,
      target.y - 10,
      `-${damage}`,
      '#ff3a3a',
      floatTexts,
    )
  }
}

/**
 * 撤退状态
 */
function updateRetreat(
  enemy: Enemy,
  player: Player,
  distToPlayer: number,
  deltaMs: number,
  worldWidth: number,
  worldHeight: number,
): void {
  // 血量恢复后重新巡逻
  if (enemy.hp > enemy.maxHp * 0.5) {
    enemy.aiState = 'patrol'
    return
  }

  // 远离玩家
  if (!player.isDead && distToPlayer < GAME_CONFIG.ENEMY_CHASE_RANGE) {
    const dx = enemy.x - player.x
    const dy = enemy.y - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      const speed = GAME_CONFIG.ENEMY_SPEED * 0.8 * (deltaMs / 16)
      enemy.x += (dx / dist) * speed
      enemy.y += (dy / dist) * speed
    }
  } else {
    enemy.aiState = 'patrol'
  }

  clampPosition(enemy, worldWidth, worldHeight)
}

/**
 * 限制位置在地图边界内
 */
function clampPosition(entity: { x: number; y: number; width: number; height: number }, worldWidth: number, worldHeight: number): void {
  if (entity.x < 0) entity.x = 0
  if (entity.y < 0) entity.y = 0
  if (entity.x + entity.width > worldWidth) entity.x = worldWidth - entity.width
  if (entity.y + entity.height > worldHeight) entity.y = worldHeight - entity.height
}

/**
 * 更新敌方移动状态（基于位置变化）
 */
function updateEnemyMoveState(enemy: Enemy, prevX: number, prevY: number): void {
  const movedX = enemy.x - prevX
  const movedY = enemy.y - prevY
  enemy.isMoving = Math.abs(movedX) > 0.1 || Math.abs(movedY) > 0.1
  if (enemy.isMoving) {
    enemy.facingDir = movedX > 0 ? 1 : -1
  }
}

/**
 * 对线状态：在分路上与玩家小兵/英雄作战
 */
function updateLane(
  enemy: Enemy,
  player: Player,
  nearestMinion: Minion | null,
  distToPlayer: number,
  deltaMs: number,
  worldWidth: number,
  worldHeight: number,
): void {
  // 血量低时撤退
  if (enemy.hp < enemy.maxHp * 0.25) {
    enemy.aiState = 'retreat'
    return
  }

  // 优先攻击玩家或小兵
  let target: { x: number; y: number } | null = null

  if (!player.isDead && distToPlayer < GAME_CONFIG.ENEMY_ATTACK_RANGE * 1.5) {
    target = player
    if (distToPlayer < GAME_CONFIG.ENEMY_ATTACK_RANGE) {
      enemy.aiState = 'attack'
      return
    }
  } else if (nearestMinion) {
    target = nearestMinion
    const dx = nearestMinion.x - enemy.x
    const dy = nearestMinion.y - enemy.y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < GAME_CONFIG.ENEMY_ATTACK_RANGE) {
      enemy.aiState = 'attack'
      return
    }
  } else {
    // 无目标，沿兵线巡逻
    const laneY = enemy.currentLane === 'top' ? 110 : enemy.currentLane === 'mid' ? 270 : 430
    const pathX = 700 + Math.random() * 200
    target = { x: pathX, y: laneY }
  }

  if (target) {
    const dx = target.x - enemy.x
    const dy = target.y - enemy.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      const speed = GAME_CONFIG.ENEMY_SPEED * 0.9 * (deltaMs / 16)
      enemy.x += (dx / dist) * speed
      enemy.y += (dy / dist) * speed
    }
  }

  clampPosition(enemy, worldWidth, worldHeight)
}

/**
 * 重置敌方状态
 */
export function resetEnemy(enemy: Enemy, worldWidth: number, worldHeight: number): void {
  enemy.hp = enemy.maxHp
  enemy.isDead = false
  enemy.respawnTimer = 0
  enemy.hitFlashTimer = 0
  enemy.aiState = 'lane'
  enemy.attackCooldown = 0
  enemy.attackAnimTimer = 0
  enemy.patrolTimer = 0
  enemy.patrolDirX = -1
  enemy.patrolDirY = 0
  enemy.x = worldWidth - 120
  enemy.y = 270
  enemy.level = 1
  enemy.skillCooldowns = [0, 0, 0]
  enemy.currentLane = 'mid'
}

/**
 * 更新敌方复活计时器
 */
export function updateEnemyRespawn(enemy: Enemy, deltaMs: number, worldWidth: number, worldHeight: number): void {
  if (!enemy.isDead) return
  enemy.respawnTimer -= deltaMs
  if (enemy.respawnTimer <= 0) {
    resetEnemy(enemy, worldWidth, worldHeight)
  }
}