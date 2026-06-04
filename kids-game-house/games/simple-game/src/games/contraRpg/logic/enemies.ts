import { GAME_CONFIG, ENEMY_CONFIG } from '../config'
import type { Enemy, Bullet } from '../types'

export function updateEnemies(
  enemies: Enemy[],
  bullets: Bullet[],
  playerX: number,
  playerY: number,
  shakeAmt: { value: number },
  cameraX: number,
  levelManager?: any,
) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]

    if (enemy.recentlyHit > 0) {
      enemy.recentlyHit -= 16
    }

    if (enemy.type === 'boss') {
      updateBoss(enemy, bullets, enemies, playerX, playerY, shakeAmt)
      continue
    }

    // 敌人从右侧进入屏幕，统一向左移动
    if (enemy.behavior === 'stationary') {
      enemy.vx = 0
      enemy.vy = 0
    } else if (enemy.behavior === 'fly') {
      // 飞行敌人在空中巡逻
      enemy.vx = enemy.type === 'melee' ? -1.2 : (enemy.type === 'elite' ? -1 : -0.8)
      // 飞行高度保持
      const targetY = GAME_CONFIG.CANVAS_HEIGHT - (enemy.flyHeight || 100) - enemy.height
      enemy.y += (targetY - enemy.y) * 0.1
      // 左右巡逻摆动
      if (!enemy.patrolDir) enemy.patrolDir = 1
      if (!enemy.patrolStartX) enemy.patrolStartX = enemy.x
      const patrolRange = enemy.patrolRange || 100
      if (enemy.x < enemy.patrolStartX - patrolRange || enemy.x > enemy.patrolStartX + patrolRange) {
        enemy.patrolDir *= -1
      }
      enemy.x += enemy.patrolDir * 0.3
    } else {
      enemy.vx = enemy.type === 'melee' ? -2 : (enemy.type === 'elite' ? -1.5 : -1)
    }
    enemy.x += enemy.vx
    enemy.y += enemy.vy || 0

    // 近战敌人不射击
    if (enemy.type !== 'melee') {
      enemy.shootTimer -= 16
      if (enemy.shootTimer <= 0) {
        enemyShoot(enemy, bullets, playerX, playerY)
        enemy.shootTimer = enemy.shootInterval
      }
    }

    // 敌人走出屏幕左边 -> 标记为离屏，可重新生成
    if (enemy.x < cameraX - 100) {
      if (levelManager) {
        levelManager.markEnemyDespawned(enemy.id)
      }
      enemies.splice(i, 1)
    } else if (enemy.x > cameraX + GAME_CONFIG.CANVAS_WIDTH + 500) {
      // 敌人走出屏幕右边 -> 直接删除
      enemies.splice(i, 1)
    }
  }
}

function updateBoss(
  boss: Enemy,
  bullets: Bullet[],
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  shakeAmt: { value: number },
) {
  // Boss 入场动画：从顶部降下
  if (boss.enteringArena) {
    const targetY = GAME_CONFIG.CANVAS_HEIGHT - boss.height - 60
    boss.y += 3
    if (boss.y >= targetY) {
      boss.y = targetY
      boss.enteringArena = false
      boss.patternTimer = 2000 // 入场后 2 秒开始攻击
      boss.patternIndex = 0
    }
    return
  }

  // 使用配置的攻击模式
  if (!boss.attackPatterns || boss.attackPatterns.length === 0) return

  boss.patternTimer! -= 16
  if (boss.patternTimer! > 0) return

  // 选择当前攻击模式
  const pattern = boss.attackPatterns[boss.patternIndex! % boss.attackPatterns.length]

  // 根据攻击类型执行
  switch (pattern.type) {
    case 'spread':
    case 'missile':
    case 'sandball':
      bossSpreadAttack(boss, bullets, shakeAmt, pattern.damage)
      break
    case 'laser':
    case 'laser-beam':
      bossLaserAttack(boss, bullets, shakeAmt, pattern.damage)
      break
    case 'aoe':
    case 'quake':
      bossAoeAttack(boss, bullets, playerX, playerY, pattern.damage)
      break
    case 'homing':
      bossHomingAttack(boss, bullets, playerX, playerY, pattern.damage)
      break
    case 'summon':
    case 'summon-minions':
      bossSummon(boss, enemies, playerX, playerY, pattern.damage)
      break
    case 'sandstorm':
    case 'nuclear-strike':
    case 'energy-shield':
      // 特殊效果 - 简化为散射
      bossSpreadAttack(boss, bullets, shakeAmt, pattern.damage)
      break
    default:
      bossSpreadAttack(boss, bullets, shakeAmt, pattern.damage)
      break
  }

  // 切换到下一个模式
  boss.patternIndex = (boss.patternIndex! + 1) % boss.attackPatterns.length
  boss.patternTimer = boss.attackPatterns[boss.patternIndex! % boss.attackPatterns.length].cooldown
}

function bossSpreadAttack(boss: Enemy, bullets: Bullet[], shakeAmt: { value: number }, damage: number) {
  const bulletCount = 5
  for (let i = 0; i < bulletCount; i++) {
    const angle = ((i - (bulletCount - 1) / 2) * Math.PI) / 8 + Math.PI / 2
    bullets.push({
      x: boss.x + boss.width / 2 - 6,
      y: boss.y + boss.height / 2,
      vx: Math.cos(angle) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.8,
      vy: Math.sin(angle) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.8,
      width: 10,
      height: 10,
      damage,
      isPlayerBullet: false,
      color: '#FF4444',
    })
  }
  shakeAmt.value = Math.max(shakeAmt.value, 3)
}

function bossLaserAttack(boss: Enemy, bullets: Bullet[], shakeAmt: { value: number }, damage: number) {
  for (let i = 0; i < 3; i++) {
    bullets.push({
      x: boss.x + boss.width / 2 - 5,
      y: boss.y + boss.height / 2,
      vx: (i - 1) * 1.5,
      vy: 8 + i * 2,
      width: 10,
      height: 40,
      damage,
      isPlayerBullet: false,
      color: '#FF00FF',
      spawnDelayFrames: i * 15,
      currentDelay: 0,
    })
  }
  shakeAmt.value = Math.max(shakeAmt.value, 4)
}

function bossAoeAttack(boss: Enemy, bullets: Bullet[], playerX: number, playerY: number, damage: number) {
  // 向玩家位置发射大范围弹幕
  for (let i = -2; i <= 2; i++) {
    const dx = playerX - boss.x
    const dy = playerY - boss.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const baseAngle = Math.atan2(dy, dist)
    const angle = baseAngle + (i * Math.PI) / 10

    bullets.push({
      x: boss.x + boss.width / 2 - 8,
      y: boss.y + boss.height / 2,
      vx: Math.cos(angle) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.7,
      vy: Math.sin(angle) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.7,
      width: 16,
      height: 16,
      damage,
      isPlayerBullet: false,
      color: '#FF8800',
    })
  }
}

function bossHomingAttack(boss: Enemy, bullets: Bullet[], playerX: number, playerY: number, damage: number) {
  const dx = playerX - boss.x
  const dy = playerY - boss.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  bullets.push({
    x: boss.x + boss.width / 2 - 5,
    y: boss.y + boss.height / 2,
    vx: (dx / dist) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.6,
    vy: (dy / dist) * GAME_CONFIG.ENEMY_BULLET_SPEED * 0.6,
    width: 12,
    height: 12,
    damage,
    isPlayerBullet: false,
    color: '#FF2222',
  })
}

function bossSummon(boss: Enemy, enemies: Enemy[], playerX: number, playerY: number, damage: number) {
  // 根据Boss类型召唤不同类型的敌人
  const summonCount = boss.name === 'mech-core' ? 3 : 2
  
  for (let i = 0; i < summonCount; i++) {
    // 随机选择敌人类型
    const rand = Math.random()
    let config = ENEMY_CONFIG.NORMAL
    let enemyType: 'normal' | 'melee' = 'normal'
    
    if (rand > 0.7) {
      config = {
        width: 32,
        height: 36,
        hp: 1,
        speed: 3.5,
        score: 50,
        color: '#cc3300',
        shootInterval: Infinity,
      }
      enemyType = 'melee'
    }
    
    const side = i % 2 === 0 ? -1 : 1
    const offsetX = side * (80 + (Math.floor(i / 2) * 60))
    
    enemies.push({
      id: Date.now() + i + Math.random(),
      x: boss.x + offsetX,
      y: boss.y + boss.height - 30,
      width: config.width,
      height: config.height,
      hp: Math.max(1, Math.floor(damage)) || 2,
      maxHp: Math.max(1, Math.floor(damage)) || 2,
      type: enemyType,
      speed: config.speed,
      vx: side * config.speed * 0.8,
      vy: -4 - Math.random() * 2,
      shootTimer: enemyType === 'melee' ? Infinity : 1000,
      shootInterval: config.shootInterval,
      behavior: enemyType === 'melee' ? 'walk' : 'walk',
      score: config.score,
      color: config.color,
      recentlyHit: 0,
      isBossSpawned: true, // 标记为Boss召唤的敌人
    })
  }
}

export function enemyShoot(enemy: Enemy, bullets: Bullet[], playerX: number, playerY: number) {
  const dx = playerX - enemy.x
  const dy = playerY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 400) {
    const speed = GAME_CONFIG.ENEMY_BULLET_SPEED
    bullets.push({
      x: enemy.x + enemy.width / 2 - 7,
      y: enemy.y + enemy.height / 2,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      width: 14,
      height: 14,
      damage: 1,
      isPlayerBullet: false,
      color: '#FF2222',
    })
  }
}