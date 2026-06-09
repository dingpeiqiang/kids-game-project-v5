import { GAME_CONFIG, POWERUP_CONFIG } from '../config'
import type { Bullet, Enemy, Particle, Powerup, Player, Shockwave, FloatText } from '../types'

export function updateBullets(bullets: Bullet[], cameraX: number) {
  if (bullets.length > GAME_CONFIG.BULLET_MAX) {
    bullets.splice(0, bullets.length - GAME_CONFIG.BULLET_MAX)
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i]

    if (bullet.spawnDelayFrames != null) {
      if (bullet.currentDelay! < bullet.spawnDelayFrames) {
        bullet.currentDelay!++
        continue
      }
    }

    bullet.x += bullet.vx
    bullet.y += bullet.vy

    if (
      bullet.x < cameraX - 50 ||
      bullet.x > cameraX + GAME_CONFIG.CANVAS_WIDTH + 50 ||
      bullet.y < -50 ||
      bullet.y > GAME_CONFIG.CANVAS_HEIGHT + 50
    ) {
      bullets.splice(i, 1)
    }
  }
}

export function updatePowerups(powerups: Powerup[]) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i]
    
    if (powerup.y < GAME_CONFIG.CANVAS_HEIGHT - 50) {
      powerup.y += powerup.vy
    }

    if (powerup.y > GAME_CONFIG.CANVAS_HEIGHT + 50) {
      powerups.splice(i, 1)
    }
  }
}

export function updateParticles(particles: Particle[]) {
  if (particles.length > GAME_CONFIG.PARTICLE_MAX) {
    particles.splice(0, particles.length - GAME_CONFIG.PARTICLE_MAX)
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vy += 0.1
    particle.life -= 0.02

    if (particle.life <= 0) {
      particles.splice(i, 1)
    }
  }
}

export function rectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function addHitParticles(x: number, y: number, color: string, particles: Particle[]) {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 0.5
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1, color, size: Math.random() * 2 + 1,
    })
  }
}

export function addExplosionParticles(x: number, y: number, color: string, particles: Particle[]) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3 + 1
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1, maxLife: 1, color, size: Math.random() * 3 + 1,
    })
  }
}

export function addShockwave(x: number, y: number, maxRadius: number, color: string, shockwaves: Shockwave[]) {
  shockwaves.push({
    x, y,
    radius: 5,
    maxRadius,
    life: 1,
    color,
  })
}

export function addFloatText(text: string, x: number, y: number, size: number, color: string, floatTexts: FloatText[]) {
  floatTexts.push({
    text, x, y,
    life: 1.2,
    maxLife: 1.2,
    color,
    size,
    vy: -2,
  })
}

export function updateShockwaves(shockwaves: Shockwave[]) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    sw.radius += (sw.maxRadius - sw.radius) * 0.12
    sw.life -= 0.035
    if (sw.life <= 0) {
      shockwaves.splice(i, 1)
    }
  }
}

export function updateFloatTexts(floatTexts: FloatText[]) {
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i]
    ft.y += ft.vy
    ft.life -= 0.02
    if (ft.life <= 0) {
      floatTexts.splice(i, 1)
    }
  }
}

export function tryDropPowerup(x: number, y: number, powerups: Powerup[], isBossSpawned: boolean = false) {
  // Boss召唤的敌人有更高的掉落概率和更好的道具
  if (isBossSpawned) {
    // 高概率掉落（60%）+ 更优质的道具
    if (Math.random() > 0.4) {
      const bossSpawnedTypes: Powerup['type'][] = ['hp', 'maxHp', 'rapid', 'spread', 'shield']
      const weights = [0.25, 0.20, 0.25, 0.15, 0.15] // 调整权重，更多攻击力提升道具
      
      let rand = Math.random()
      let cumulative = 0
      for (let i = 0; i < bossSpawnedTypes.length; i++) {
        if (rand < (cumulative += weights[i])) {
          spawnPowerup(x, y, bossSpawnedTypes[i], powerups)
          return
        }
      }
    }
    return
  }

  if (Math.random() > 0.12) return

  const rand = Math.random()
  let cumulative = 0

  const configs: { type: Powerup['type']; chance: number }[] = [
    { type: 'hp', chance: 0.35 },
    { type: 'maxHp', chance: 0.12 },
    { type: 'rapid', chance: 0.18 },
    { type: 'spread', chance: 0.13 },
    { type: 'shield', chance: 0.10 },
    { type: 'transform', chance: 0.12 },
  ]

  for (const cfg of configs) {
    if (rand < (cumulative += cfg.chance)) {
      spawnPowerup(x, y, cfg.type, powerups)
      return
    }
  }
}

function spawnPowerup(x: number, y: number, type: Powerup['type'], powerups: Powerup[]) {
  const typeConfig = {
    hp: { icon: POWERUP_CONFIG.HP.icon, color: POWERUP_CONFIG.HP.color },
    maxHp: { icon: POWERUP_CONFIG.MAX_HP.icon, color: POWERUP_CONFIG.MAX_HP.color },
    rapid: { icon: POWERUP_CONFIG.RAPID.icon, color: POWERUP_CONFIG.RAPID.color },
    spread: { icon: POWERUP_CONFIG.SPREAD.icon, color: POWERUP_CONFIG.SPREAD.color },
    shield: { icon: POWERUP_CONFIG.SHIELD.icon, color: POWERUP_CONFIG.SHIELD.color },
    transform: { icon: POWERUP_CONFIG.TRANSFORM.icon, color: POWERUP_CONFIG.TRANSFORM.color },
  }[type]

  powerups.push({
    id: Date.now(),
    x: x - 15,
    y,
    width: 30,
    height: 30,
    type,
    vy: 0.5,
    icon: typeConfig.icon,
    color: typeConfig.color,
  })
}

export function collectPowerup(
  powerup: Powerup,
  player: Player,
  timers: { rapidFireTimer: number; spreadShotTimer: number; shieldTimer: number; transformTimer: number },
) {
  switch (powerup.type) {
    case 'hp':
      player.hp = Math.min(player.hp + 1, player.maxHp)
      break
    case 'maxHp':
      player.maxHp++
      player.hp++
      break
    case 'rapid':
      timers.rapidFireTimer = GAME_CONFIG.RAPID_FIRE_DURATION
      break
    case 'spread':
      timers.spreadShotTimer = GAME_CONFIG.SPREAD_SHOT_DURATION
      break
    case 'shield':
      timers.shieldTimer = GAME_CONFIG.SHIELD_DURATION
      break
    case 'transform':
      timers.transformTimer = GAME_CONFIG.TRANSFORM_DURATION
      break
  }
}

export interface CollisionResult {
  gameOver: boolean
  victory: boolean
  bossDefeated: boolean
  score: number
  comboCount: number
  lastComboTime: number
  shakeAmt: number
  damageFlash: number
  screenFlash: number
  playerHitTriggered: boolean
  timers: { rapidFireTimer: number; spreadShotTimer: number; shieldTimer: number; transformTimer: number }
}

function getXPartition(x: number, cellSize: number): number {
  return Math.floor(x / cellSize)
}

export function checkCollisions(
  bullets: Bullet[],
  enemies: Enemy[],
  player: Player,
  powerups: Powerup[],
  particles: Particle[],
  shockwaves: Shockwave[],
  floatTexts: FloatText[],
  timers: { rapidFireTimer: number; spreadShotTimer: number; shieldTimer: number; transformTimer: number },
  comboCount: number,
  lastComboTime: number,
  shakeAmt: number,
  damageFlash: number,
  screenFlash: number,
  meleeTriggered: boolean,
  addScore: (score: number, x: number, y: number) => void,
  audioClick: () => void,
  audioWin: () => void,
  audioPop: () => void,
  levelManager?: any,
): CollisionResult {
  let gameOver = false
  let victory = false
  let bossDefeated = false
  let totalScore = 0
  let newComboCount = comboCount
  let newLastComboTime = lastComboTime
  let newShakeAmt = shakeAmt
  let newDamageFlash = damageFlash
  let newScreenFlash = screenFlash
  let playerHitTriggered = false

  const CELL_SIZE = 100
  const enemyPartitions = new Map<number, Enemy[]>()

  for (const enemy of enemies) {
    const partition = getXPartition(enemy.x, CELL_SIZE)
    if (!enemyPartitions.has(partition)) {
      enemyPartitions.set(partition, [])
    }
    enemyPartitions.get(partition)!.push(enemy)
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i]
    if (!bullet.isPlayerBullet) continue

    const bulletPartition = getXPartition(bullet.x, CELL_SIZE)
    const possiblePartitions = [bulletPartition - 1, bulletPartition, bulletPartition + 1]

    let hitEnemy = false
    for (const partition of possiblePartitions) {
      const enemiesInPartition = enemyPartitions.get(partition)
      if (!enemiesInPartition) continue

      for (let j = enemiesInPartition.length - 1; j >= 0; j--) {
        const enemy = enemiesInPartition[j]
        if (!rectCollision(bullet.x, bullet.y, bullet.width, bullet.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
          continue
        }

        bullets.splice(i, 1)
        enemy.hp -= bullet.damage
        enemy.recentlyHit = 40

        addHitParticles(bullet.x, bullet.y, '#FFFF00', particles)

        if (enemy.hp <= 0) {
          totalScore += enemy.score
          addScore(enemy.score, bullet.x, bullet.y)

          const cx = enemy.x + enemy.width / 2
          const cy = enemy.y + enemy.height / 2

          addExplosionParticles(cx, cy, enemy.color, particles)

          const shockwaveColor = enemy.type === 'elite' ? '#FFD700' : '#FF6B6B'
          const shockwaveSize = enemy.type === 'elite' ? 60 : 40
          addShockwave(cx, cy, shockwaveSize, shockwaveColor, shockwaves)

          const scoreText = `+${enemy.score}`
          const textColor = enemy.type === 'elite' ? '#FFD700' : '#FFFFFF'
          const textSize = enemy.type === 'elite' ? 18 : 14
          addFloatText(scoreText, cx, cy - 10, textSize, textColor, floatTexts)

          if (enemy.type === 'elite') {
            newScreenFlash = 0.3
            newShakeAmt = Math.max(newShakeAmt, 4)
          }

          // Boss召唤的敌人有更高的道具掉落概率
          const isBossSpawned = enemy.isBossSpawned || false
          tryDropPowerup(cx, cy, powerups, isBossSpawned)

          const now = Date.now()
          if (now - newLastComboTime < 2000) {
            newComboCount++
            if (newComboCount % 5 === 0) {
              totalScore += enemy.score * 2
              addFloatText(`COMBO x${newComboCount}!`, cx, cy - 30, 20, '#FFD700', floatTexts)
              addShockwave(cx, cy, 50, '#FFD700', shockwaves)
            }
          } else {
            newComboCount = 1
          }
          newLastComboTime = now

          const enemyIndex = enemies.indexOf(enemy)
          if (enemyIndex !== -1) {
            enemies.splice(enemyIndex, 1)
          }
          if (levelManager && enemy.type !== 'boss') {
            levelManager.markEnemyDead(enemy.id)
          }
          audioWin()

          if (enemy.type === 'boss') {
            bossDefeated = true
            addShockwave(cx, cy, 100, '#FF4444', shockwaves)
            newScreenFlash = 0.5
            newShakeAmt = 10
          }
        } else {
          addHitParticles(bullet.x, bullet.y, '#FF8800', particles)
          audioClick()
        }
        hitEnemy = true
        break
      }
      if (hitEnemy) break
    }
  }

  if (player.invincible <= 0 && timers.shieldTimer <= 0 && timers.transformTimer <= 0) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      if (bullet.isPlayerBullet) continue

      if (rectCollision(bullet.x, bullet.y, bullet.width, bullet.height, player.x, player.y, player.width, player.height)) {
        bullets.splice(i, 1)
        const result = applyPlayerHit(player, particles, audioPop)
        gameOver = result.gameOver
        playerHitTriggered = true
        newShakeAmt = 8
        newDamageFlash = 1
        break
      }
    }
  }

  if (player.invincible <= 0 && timers.shieldTimer <= 0 && timers.transformTimer <= 0) {
    const playerPartition = getXPartition(player.x, CELL_SIZE)
    const possiblePartitions = [playerPartition - 1, playerPartition, playerPartition + 1]

    for (const partition of possiblePartitions) {
      const enemiesInPartition = enemyPartitions.get(partition)
      if (!enemiesInPartition) continue

      for (const enemy of enemiesInPartition) {
        if (rectCollision(player.x, player.y, player.width, player.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
          const result = applyPlayerHit(player, particles, audioPop)
          gameOver = result.gameOver
          playerHitTriggered = true
          newShakeAmt = 8
          newDamageFlash = 1
          break
        }
      }
      if (gameOver || playerHitTriggered) break
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i]
    if (rectCollision(player.x, player.y, player.width, player.height, powerup.x, powerup.y, powerup.width, powerup.height)) {
      collectPowerup(powerup, player, timers)
      powerups.splice(i, 1)
      addFloatText(powerup.icon, powerup.x + powerup.width / 2, powerup.y, 18, powerup.color, floatTexts)
      addShockwave(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 30, powerup.color, shockwaves)
      audioWin()
    }
  }

  return {
    gameOver,
    victory,
    bossDefeated,
    score: totalScore,
    comboCount: newComboCount,
    lastComboTime: newLastComboTime,
    shakeAmt: newShakeAmt,
    damageFlash: newDamageFlash,
    screenFlash: newScreenFlash,
    playerHitTriggered,
    timers,
  }
}

function applyPlayerHit(player: Player, particles: Particle[], audioPop: () => void): { gameOver: boolean } {
  player.hp--
  player.invincible = GAME_CONFIG.INVINCIBLE_DURATION
  
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 1
    particles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color: '#FF4444',
      size: Math.random() * 3 + 1,
    })
  }
  
  audioPop()

  return { gameOver: player.hp <= 0 }
}