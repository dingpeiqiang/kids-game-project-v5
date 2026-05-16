import type { Enemy, EnemyType, WaveConfig } from './types'
import { PATH_POINTS, INFINITE_WAVE_CONFIG } from './config'

export function getWaveConfig(wave: number): WaveConfig {
  const enemyCount = Math.min(
    INFINITE_WAVE_CONFIG.baseEnemyCount + wave * INFINITE_WAVE_CONFIG.enemyGrowthRate,
    INFINITE_WAVE_CONFIG.maxEnemyCount
  )
  const hpMul = Math.pow(1 + INFINITE_WAVE_CONFIG.hpGrowthRate, wave)
  const spdMul = Math.min(
    1 + wave * INFINITE_WAVE_CONFIG.speedGrowthRate,
    INFINITE_WAVE_CONFIG.maxSpeedMultiplier
  )

  return { count: Math.floor(enemyCount), hpMul, spdMul }
}

export function getEnemyType(waveNum: number): EnemyType {
  if (waveNum >= INFINITE_WAVE_CONFIG.eliteEnemyUnlock && Math.random() < 0.15) {
    return 'elite'
  }
  if (waveNum >= INFINITE_WAVE_CONFIG.specialEnemyUnlock && Math.random() < 0.2) {
    return Math.random() < 0.5 ? 'fast' : 'tank'
  }
  return 'normal'
}

export function createEnemy(wave: number, enemiesToSpawn: number): Enemy | null {
  const cfg = getWaveConfig(wave)
  const isBoss = wave > 0 && wave % INFINITE_WAVE_CONFIG.bossInterval === 0 && enemiesToSpawn === 1
  const enemyType = isBoss ? 'normal' : getEnemyType(wave)

  let hpBase = INFINITE_WAVE_CONFIG.baseHp
  let speedBase = INFINITE_WAVE_CONFIG.baseSpeed + Math.random() * 0.15
  let rewardBase = 5 + wave * 0.6
  let size = 10
  let color = `hsl(${wave * 30 + Math.random() * 60}, 70%, 55%)`

  switch (enemyType) {
    case 'fast':
      speedBase *= 1.6
      hpBase *= 0.7
      rewardBase *= 1.3
      color = '#00E5FF'
      break
    case 'tank':
      speedBase *= 0.6
      hpBase *= 2.0
      rewardBase *= 1.5
      size = 13
      color = '#9C27B0'
      break
    case 'elite':
      speedBase *= 1.2
      hpBase *= 1.8
      rewardBase *= 2.5
      size = 12
      color = '#FFD700'
      break
  }

  if (isBoss) {
    hpBase = 35 * cfg.hpMul
    speedBase = INFINITE_WAVE_CONFIG.baseSpeed * 0.8 * cfg.spdMul
    rewardBase = 25 + wave * 2
    size = 16
    color = '#FF4757'
  } else {
    hpBase *= cfg.hpMul
    speedBase *= cfg.spdMul
  }

  const pathPixels = PATH_POINTS.map(p => ({
    x: p.gx * 40 + 40 / 2,
    y: p.gy * 40 + 60 + 40 / 2
  }))

  return {
    x: pathPixels[0].x - 20,
    y: pathPixels[0].y,
    hp: hpBase,
    maxHp: hpBase,
    speed: speedBase,
    pathIdx: 0,
    pathProgress: 0,
    slowTimer: 0,
    reward: Math.floor(rewardBase),
    color,
    size,
    isBoss,
  }
}

export function updateEnemyPosition(enemy: Enemy, pathPixels: { x: number; y: number }[]): { reachedEnd: boolean; newHp: number } {
  if (enemy.pathIdx >= pathPixels.length - 1) {
    return { reachedEnd: true, newHp: enemy.hp }
  }

  const target = pathPixels[enemy.pathIdx + 1]
  const speed = enemy.slowTimer > 0 ? enemy.speed * 0.4 : enemy.speed
  if (enemy.slowTimer > 0) enemy.slowTimer--

  const dx = target.x - enemy.x
  const dy = target.y - enemy.y
  const d = Math.hypot(dx, dy)

  if (d < speed) {
    enemy.x = target.x
    enemy.y = target.y
    enemy.pathIdx++
  } else {
    enemy.x += (dx / d) * speed
    enemy.y += (dy / d) * speed
  }

  return { reachedEnd: false, newHp: enemy.hp }
}

export function damageEnemy(enemy: Enemy, damage: number): { killed: boolean; reward: number } {
  enemy.hp -= damage
  if (enemy.hp <= 0) {
    return { killed: true, reward: enemy.reward }
  }
  return { killed: false, reward: 0 }
}

export function slowEnemy(enemy: Enemy, slowDuration: number): void {
  enemy.slowTimer = slowDuration
}
