import type { Enemy, Player, Position, DungeonTile } from '../types'

function distance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

export function updateEnemy(
  enemy: Enemy,
  player: Player,
  tileMap: DungeonTile[][],
  deltaTime: number,
  currentTime: number
): { shouldAttack: boolean; attackTarget: Position | null } {
  const distToPlayer = distance(enemy.position, player.position)
  let shouldAttack = false
  let attackTarget: Position | null = null

  if (enemy.isDead) {
    return { shouldAttack, attackTarget }
  }

  switch (enemy.behavior) {
    case 'patrol':
      if (distToPlayer < enemy.aggroRange) {
        enemy.behavior = 'chase'
      } else {
        patrolMovement(enemy, deltaTime)
      }
      break

    case 'chase':
      if (distToPlayer > enemy.aggroRange * 1.5) {
        enemy.behavior = 'patrol'
      } else if (distToPlayer < enemy.attackRange) {
        enemy.behavior = 'attack'
      } else {
        chasePlayer(enemy, player, tileMap, deltaTime)
      }
      break

    case 'attack':
      if (distToPlayer > enemy.attackRange + 1) {
        enemy.behavior = 'chase'
      } else {
        if (currentTime - enemy.lastAttackTime > enemy.attackSpeed * 1000) {
          shouldAttack = true
          attackTarget = { ...player.position }
          enemy.lastAttackTime = currentTime
        }
      }
      break

    case 'idle':
      if (distToPlayer < enemy.aggroRange) {
        enemy.behavior = 'chase'
      }
      break
  }

  if (enemy.isBoss) {
    updateBossPhase(enemy)
  }

  return { shouldAttack, attackTarget }
}

function patrolMovement(enemy: Enemy, deltaTime: number): void {
  if (enemy.patrolPoints.length === 0) return

  const target = enemy.patrolPoints[enemy.currentPatrolIndex]
  const dist = distance(enemy.position, target)

  if (dist < 0.5) {
    enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length
  } else {
    const dx = target.x - enemy.position.x
    const dy = target.y - enemy.position.y
    const len = Math.sqrt(dx * dx + dy * dy)
    
    enemy.position.x += (dx / len) * enemy.speed * deltaTime * 60
    enemy.position.y += (dy / len) * enemy.speed * deltaTime * 60
    enemy.rotation = Math.atan2(dy, dx)
  }
}

function chasePlayer(
  enemy: Enemy,
  player: Player,
  tileMap: DungeonTile[][],
  deltaTime: number
): void {
  const dx = player.position.x - enemy.position.x
  const dy = player.position.y - enemy.position.y
  const len = Math.sqrt(dx * dx + dy * dy)

  if (len > 0.1) {
    const newX = enemy.position.x + (dx / len) * enemy.speed * deltaTime * 60
    const newY = enemy.position.y + (dy / len) * enemy.speed * deltaTime * 60

    if (isWalkable(tileMap, newX, enemy.position.y)) {
      enemy.position.x = newX
    }
    if (isWalkable(tileMap, enemy.position.x, newY)) {
      enemy.position.y = newY
    }

    enemy.rotation = Math.atan2(dy, dx)
  }
}

function isWalkable(tileMap: DungeonTile[][], x: number, y: number): boolean {
  if (x < 0 || x >= tileMap[0].length || y < 0 || y >= tileMap.length) {
    return false
  }
  const tile = tileMap[Math.floor(y)][Math.floor(x)]
  return tile.type === 'floor' || tile.type === 'door'
}

function updateBossPhase(enemy: Enemy): void {
  const healthPercent = enemy.hp / enemy.maxHp
  
  if (enemy.maxPhase >= 2 && healthPercent < 0.5 && enemy.phase === 1) {
    enemy.phase = 2
  }
  
  if (enemy.maxPhase >= 3 && healthPercent < 0.25 && enemy.phase === 2) {
    enemy.phase = 3
  }
}

export function dealDamageToEnemy(
  enemy: Enemy,
  damage: number,
  isCritical: boolean
): { killed: boolean; damageDealt: number } {
  const actualDamage = isCritical ? damage * 1.5 : damage
  enemy.hp -= actualDamage
  
  if (enemy.hp <= 0) {
    enemy.hp = 0
    enemy.isDead = true
    return { killed: true, damageDealt: actualDamage }
  }
  
  return { killed: false, damageDealt: actualDamage }
}

export function calculateEnemyDamage(enemy: Enemy): number {
  let damage = enemy.damage
  
  if (enemy.isBoss && enemy.phase > 1) {
    damage *= 1 + (enemy.phase - 1) * 0.3
  }
  
  return damage
}

export function checkEnemyCollision(
  enemy: Enemy,
  x: number,
  y: number,
  radius: number
): boolean {
  const dx = enemy.position.x - x
  const dy = enemy.position.y - y
  return Math.sqrt(dx * dx + dy * dy) < radius + enemy.size.width / 2
}