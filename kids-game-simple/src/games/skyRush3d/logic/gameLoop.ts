import { BULLET_TIER_CONFIG, GAME_CONFIG, getWavesForMode } from '../config'
import type { GameState, InputSnapshot } from '../types'
import { clampArena } from './collision'
import {
  clearScreenKill,
  enemyShoot,
  firePlayerBullets,
  resolveBodyHits,
  resolveBulletHits,
  applyPowerUp,
} from './combat'
import { currentWaveDuration } from './state'
import { getWaveSpec, spawnEnemy } from './waves'

export interface LoopEvents {
  onScore?: (points: number) => void
  onWave?: (wave: number, label: string) => void
  onGameOver?: (won: boolean) => void
}

let spawnAcc = 0

export function resetLoopTimers(): void {
  spawnAcc = 0
}

export function tickGame(state: GameState, input: InputSnapshot, dt: number, events: LoopEvents): void {
  if (state.phase !== 'playing') return

  const slow = state.player.slowMo > 0 ? 0.55 : 1
  const enemyDt = dt * slow

  state.elapsedMs += dt * 1000
  state.clearScreenCd = Math.max(0, state.clearScreenCd - dt)

  if (input.clearScreen && state.clearScreenCd <= 0) {
    clearScreenKill(state)
    state.clearScreenCd = GAME_CONFIG.clearScreenCooldown
  }

  state.player.invuln = Math.max(0, state.player.invuln - dt)
  state.player.slowMo = Math.max(0, state.player.slowMo - dt)
  state.comboTimer -= dt
  if (state.comboTimer <= 0 && state.combo > 0) state.combo = 0

  const moveSpeed = GAME_CONFIG.playerSpeed * dt
  let mx = input.moveX
  let mz = input.moveZ
  if (input.pointerActive) {
    mx = input.pointerX
    mz = input.pointerY
  }
  const len = Math.hypot(mx, mz)
  if (len > 0.15) {
    const nx = mx / len
    const nz = mz / len
    const clamped = clampArena(
      state.player.pos.x + nx * moveSpeed,
      state.player.pos.z + nz * moveSpeed,
      GAME_CONFIG.arenaHalfW,
      GAME_CONFIG.arenaHalfZ,
    )
    state.player.pos.x = clamped.x
    state.player.pos.z = clamped.z
  }

  state.player.fireCooldown -= dt
  const tierCfg = BULLET_TIER_CONFIG[state.player.bulletTier]
  state.player.fireInterval = tierCfg.interval
  if (state.player.fireCooldown <= 0) {
    firePlayerBullets(state)
    state.player.fireCooldown = state.player.fireInterval
  }

  const spec = getWaveSpec(state)
  const waves = getWavesForMode(state.mode)
  const isLastWave = state.wave >= waves.length

  if (!state.bossDefeated || !isLastWave) {
    state.waveTimer += dt
    spawnAcc += dt
    const interval = spec.spawnInterval * (state.mode === 'compete' ? 0.88 : 1)
    while (spawnAcc >= interval) {
      spawnAcc -= interval
      if (state.wave < 6 || !state.bossSpawned || !state.bossDefeated) spawnEnemy(state)
    }
  }

  if (state.wave < waves.length && state.waveTimer >= currentWaveDuration(state)) {
    state.wave++
    state.waveTimer = 0
    spawnAcc = 0
    const next = getWaveSpec(state)
    events.onWave?.(state.wave, next.label)
  }

  for (const e of state.enemies) {
    e.wobble += dt * 3
    if (e.kind === 'dart') {
      e.x += e.vx * enemyDt
      if (Math.abs(e.x) > GAME_CONFIG.arenaHalfW - 0.5) e.vx *= -1
    } else if (e.kind === 'boss') {
      e.x += Math.sin(state.elapsedMs * 0.001) * 2.5 * dt
      e.x = Math.max(-8, Math.min(8, e.x))
    } else {
      e.x += e.vx * enemyDt * 0.3
    }
    e.z += e.vz * enemyDt
    if (e.kind !== 'boss' && e.z < -GAME_CONFIG.arenaHalfZ - 2) {
      e.z = GAME_CONFIG.arenaHalfZ
      e.x = (Math.random() * 2 - 1) * (GAME_CONFIG.arenaHalfW - 1)
    }
    if (e.kind === 'tank' || e.kind === 'boss') {
      e.fireCooldown -= enemyDt
      if (e.fireCooldown <= 0) {
        enemyShoot(state, e)
        const def = e.kind === 'boss' ? 0.55 : 2.4
        e.fireCooldown = def * (0.8 + Math.random() * 0.4)
      }
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt
    b.z += b.vz * dt
  }
  state.bullets = state.bullets.filter(
    b =>
      Math.abs(b.x) < GAME_CONFIG.arenaHalfW + 3 &&
      Math.abs(b.z) < GAME_CONFIG.arenaHalfZ + 4,
  )

  for (const p of state.powerUps) {
    p.z += p.vz * dt
  }
  state.powerUps = state.powerUps.filter(p => p.z > -GAME_CONFIG.arenaHalfZ)

  for (const pu of state.powerUps) {
    if (
      Math.hypot(pu.x - state.player.pos.x, pu.z - state.player.pos.z) <
      GAME_CONFIG.playerRadius + 0.5
    ) {
      applyPowerUp(state, pu)
      state.powerUps = state.powerUps.filter(x => x.id !== pu.id)
      break
    }
  }

  state.particles.forEach(p => {
    p.life -= dt
  })
  state.particles = state.particles.filter(p => p.life > 0)

  resolveBulletHits(state)
  resolveBodyHits(state)

  if (state.player.hp <= 0) {
    state.phase = 'ended'
    state.won = false
    events.onGameOver?.(false)
    return
  }

  if (isLastWave && state.bossDefeated && state.enemies.filter(e => e.kind === 'boss').length === 0) {
    state.phase = 'ended'
    state.won = true
    events.onGameOver?.(true)
  }
}