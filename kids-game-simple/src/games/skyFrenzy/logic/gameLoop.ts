import {
  BULLET_TIER_DEFS,
  ENEMY_DEFS,
  GAME_CONFIG,
  clampArena,
  modeComboMul,
  modeSpawnMul,
  pickRandomPickup,
  wavesForMode,
} from '../config'
import type { InputSnapshot } from '../input'
import type {
  EnemyKind,
  EnemyState,
  GamePhase,
  GameState,
  PickupKind,
  PlayMode,
  PlayerBullet,
} from '../types'
import { circleHit, segmentArenaExit } from './collision'
import { loadRecords, mergeRecords } from './storage'

let nextId = 1
function uid(): number {
  return nextId++
}

function emptyPlayer(mode: PlayMode): GameState['player'] {
  return {
    x: 0,
    z: GAME_CONFIG.arenaHalfD - 3,
    hp: GAME_CONFIG.playerMaxHp,
    maxHp: GAME_CONFIG.playerMaxHp,
    shield: 0,
    fireCooldown: 0,
    bulletTier: 1,
    fireTierTimer: 0,
    invuln: 0,
    damageTaken: 0,
  }
}

function buildSpawnQueue(mode: PlayMode, waveIndex: number): EnemyKind[] {
  const waves = wavesForMode(mode)
  const spec = waves[waveIndex]
  if (!spec) return []
  const mul = modeSpawnMul(mode)
  const q: EnemyKind[] = []
  for (const g of spec.groups) {
    const count = Math.max(1, Math.round(g.count * mul))
    for (let i = 0; i < count; i++) q.push(g.kind)
  }
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[q[i], q[j]] = [q[j]!, q[i]!]
  }
  return q
}

export function createInitialState(mode: PlayMode): GameState {
  nextId = 1
  return {
    mode,
    phase: 'playing',
    waveIndex: 0,
    totalWaves: GAME_CONFIG.totalWaves,
    waveTimer: 0,
    spawnQueue: buildSpawnQueue(mode, 0),
    spawnTimer: 0.8,
    bossSpawned: false,
    player: emptyPlayer(mode),
    playerBullets: [],
    enemyBullets: [],
    enemies: [],
    pickups: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    clearScreenCd: 0,
    slowMoTimer: 0,
    runStartTime: performance.now(),
    elapsedSec: 0,
    flawless: true,
    records: loadRecords(),
    clearScreenFlash: 0,
    bossKilledThisRun: false,
  }
}

export function resetRun(state: GameState): void {
  const mode = state.mode
  Object.assign(state, createInitialState(mode))
}

export function setPlayMode(state: GameState, mode: PlayMode): void {
  state.mode = mode
  resetRun(state)
}

export function togglePause(state: GameState): void {
  if (state.phase === 'playing') state.phase = 'paused'
  else if (state.phase === 'paused') state.phase = 'playing'
}

export function tryClearScreen(state: GameState): boolean {
  if (state.phase !== 'playing') return false
  if (state.clearScreenCd > 0) return false
  state.clearScreenCd = GAME_CONFIG.clearScreenCooldown
  state.clearScreenFlash = GAME_CONFIG.clearScreenDuration
  for (const e of state.enemies) {
    if (!e.alive) continue
    killEnemy(state, e, false)
  }
  state.enemyBullets = []
  return true
}

function comboMul(state: GameState): number {
  const base = 1 + Math.min(state.combo, 20) * 0.08
  return Math.min(GAME_CONFIG.comboMulCap, base * modeComboMul(state.mode))
}

function addScore(state: GameState, base: number): void {
  state.score += Math.round(base * comboMul(state))
}

function registerKillCombo(state: GameState): void {
  state.combo += 1
  state.comboTimer = GAME_CONFIG.comboWindowSec
}

function breakCombo(state: GameState): void {
  state.combo = 0
  state.comboTimer = 0
}

function spawnEnemy(state: GameState, kind: EnemyKind): void {
  if (state.enemies.filter(e => e.alive).length >= GAME_CONFIG.maxEnemies) return
  const def = ENEMY_DEFS[kind]
  const waveMul = 1 + state.waveIndex * 0.12
  const x = (Math.random() * 2 - 1) * (GAME_CONFIG.arenaHalfW - 1)
  const z = -GAME_CONFIG.arenaHalfD + 1.5
  state.enemies.push({
    id: uid(),
    kind,
    x,
    z,
    vx: kind === 'dart' ? (Math.random() > 0.5 ? 1 : -1) * def.speed * 0.6 : 0,
    vz: def.speed,
    hp: Math.round(def.hp * waveMul),
    maxHp: Math.round(def.hp * waveMul),
    shootCd: def.shootInterval * (0.5 + Math.random() * 0.5),
    wobble: Math.random() * Math.PI * 2,
    alive: true,
  })
}

function spawnBoss(state: GameState): void {
  if (state.bossSpawned) return
  state.bossSpawned = true
  spawnEnemy(state, 'boss')
}

function maybeDropPickup(state: GameState, x: number, z: number): void {
  if (state.pickups.filter(p => p.alive).length >= GAME_CONFIG.maxPickups) return
  if (Math.random() > 0.28) return
  const kind = pickRandomPickup()
  state.pickups.push({
    id: uid(),
    kind,
    x,
    z,
    life: 14,
    alive: true,
  })
}

function applyPickup(state: GameState, kind: PickupKind): void {
  const p = state.player
  switch (kind) {
    case 'fireUp':
      p.bulletTier = Math.min(4, (p.bulletTier + 1) as typeof p.bulletTier) as typeof p.bulletTier
      p.fireTierTimer = GAME_CONFIG.fireTierDuration
      break
    case 'shield':
      p.shield = GAME_CONFIG.shieldDuration
      break
    case 'heal':
      p.hp = Math.min(p.maxHp, p.hp + 3)
      break
    case 'slowMo':
      state.slowMoTimer = GAME_CONFIG.slowMoDuration
      break
    default:
      break
  }
}

function killEnemy(state: GameState, e: EnemyState, countCombo: boolean): void {
  if (!e.alive) return
  e.alive = false
  if (countCombo) registerKillCombo(state)
  addScore(state, ENEMY_DEFS[e.kind].score)
  if (e.kind === 'boss') state.bossKilledThisRun = true
  maybeDropPickup(state, e.x, e.z)
}

function firePlayer(state: GameState): void {
  if (state.playerBullets.filter(b => b.alive).length >= GAME_CONFIG.maxPlayerBullets) return
  const tier = state.player.bulletTier
  const def = BULLET_TIER_DEFS[tier]
  const px = state.player.x
  const pz = state.player.z
  const baseAngle = -Math.PI / 2
  const count = tier === 2 ? 2 : tier === 3 ? 5 : 1
  for (let i = 0; i < count; i++) {
    let ang = baseAngle
    if (count > 1) {
      const t = i / (count - 1) - 0.5
      ang += t * def.spread
    }
    const vx = Math.cos(ang) * def.speed
    const vz = Math.sin(ang) * def.speed
    state.playerBullets.push({
      id: uid(),
      x: px,
      z: pz - 0.4,
      vx,
      vz,
      damage: def.damage,
      pierce: def.pierce,
      alive: true,
    })
  }
}

function enemyShoot(state: GameState, e: EnemyState): void {
  if (state.enemyBullets.filter(b => b.alive).length >= GAME_CONFIG.maxEnemyBullets) return
  const def = ENEMY_DEFS[e.kind]
  if (def.shootInterval <= 0) return
  const dx = state.player.x - e.x
  const dz = state.player.z - e.z
  const len = Math.hypot(dx, dz) || 1
  const bs = def.bulletSpeed
  state.enemyBullets.push({
    id: uid(),
    x: e.x,
    z: e.z,
    vx: (dx / len) * bs,
    vz: (dz / len) * bs,
    alive: true,
  })
  if (e.kind === 'boss') {
    for (let a = -2; a <= 2; a++) {
      const ang = Math.atan2(dz, dx) + a * 0.22
      state.enemyBullets.push({
        id: uid(),
        x: e.x,
        z: e.z,
        vx: Math.cos(ang) * bs * 0.95,
        vz: Math.sin(ang) * bs * 0.95,
        alive: true,
      })
    }
  }
}

function damagePlayer(state: GameState, amount: number): void {
  const p = state.player
  if (p.invuln > 0) return
  if (p.shield > 0) {
    p.shield = Math.max(0, p.shield - 0.5)
    p.invuln = 0.35
    return
  }
  p.hp -= amount
  p.damageTaken += amount
  state.flawless = false
  p.invuln = 0.9
  breakCombo(state)
  if (p.hp <= 0) {
    p.hp = 0
    state.phase = 'defeat'
  }
}

function advanceWave(state: GameState): void {
  if (state.waveIndex >= state.totalWaves - 1) {
    if (state.enemies.every(e => !e.alive) && state.spawnQueue.length === 0) {
      state.phase = 'victory'
    }
    return
  }
  state.waveIndex += 1
  state.spawnQueue = buildSpawnQueue(state.mode, state.waveIndex)
  state.spawnTimer = 0.6
  if (state.waveIndex === state.totalWaves - 1) {
    state.spawnTimer = 1.2
  }
}

function updateWaves(state: GameState, dt: number): void {
  const waves = wavesForMode(state.mode)
  const spec = waves[state.waveIndex]
  if (!spec || state.phase !== 'playing') return

  state.spawnTimer -= dt
  while (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
    const kind = state.spawnQueue.shift()!
    spawnEnemy(state, kind)
    state.spawnTimer += spec.spawnInterval
  }

  if (state.waveIndex === state.totalWaves - 1 && state.spawnQueue.length === 0 && !state.bossSpawned) {
    state.waveTimer += dt
    if (state.waveTimer > 2.5) spawnBoss(state)
  }

  if (
    state.spawnQueue.length === 0 &&
    state.enemies.every(e => !e.alive) &&
    (state.waveIndex < state.totalWaves - 1 || state.bossSpawned)
  ) {
    state.waveTimer += dt
    if (state.waveTimer > 1.8) {
      state.waveTimer = 0
      if (state.waveIndex >= state.totalWaves - 1 && state.bossSpawned) {
        state.phase = 'victory'
      } else {
        advanceWave(state)
      }
    }
  }
}

function updatePlayer(state: GameState, input: InputSnapshot, dt: number): void {
  const p = state.player
  let mx = input.moveX
  let mz = input.moveY
  if (Math.hypot(mx, mz) > 1) {
    const len = Math.hypot(mx, mz)
    mx /= len
    mz /= len
  }
  const spd = GAME_CONFIG.playerSpeed * (input.dragging ? 1 : 1)
  p.x += mx * spd * dt
  p.z += mz * spd * dt
  const c = clampArena(p.x, p.z)
  p.x = c.x
  p.z = c.z

  if (p.fireTierTimer > 0) {
    p.fireTierTimer -= dt
    if (p.fireTierTimer <= 0) p.bulletTier = 1
  }
  if (p.shield > 0) p.shield -= dt
  if (p.invuln > 0) p.invuln -= dt

  p.fireCooldown -= dt
  const tierDef = BULLET_TIER_DEFS[p.bulletTier]
  if (p.fireCooldown <= 0 && state.phase === 'playing') {
    firePlayer(state)
    p.fireCooldown = tierDef.fireRate
  }
}

function updateBullets(state: GameState, dt: number): void {
  for (const b of state.playerBullets) {
    if (!b.alive) continue
    b.x += b.vx * dt
    b.z += b.vz * dt
    if (segmentArenaExit(b.x, b.z)) b.alive = false
  }

  for (const b of state.enemyBullets) {
    if (!b.alive) continue
    b.x += b.vx * dt
    b.z += b.vz * dt
    if (segmentArenaExit(b.x, b.z)) b.alive = false
    if (
      circleHit(b.x, b.z, GAME_CONFIG.bulletHitRadius, state.player.x, state.player.z, GAME_CONFIG.playerHitRadius)
    ) {
      b.alive = false
      damagePlayer(state, 1)
    }
  }

  for (const b of state.playerBullets) {
    if (!b.alive) continue
    for (const e of state.enemies) {
      if (!e.alive) continue
      const er = GAME_CONFIG.enemyHitRadius * ENEMY_DEFS[e.kind].scale
      if (circleHit(b.x, b.z, GAME_CONFIG.bulletHitRadius, e.x, e.z, er)) {
        e.hp -= b.damage
        if (b.pierce > 0) b.pierce -= 1
        else b.alive = false
        if (e.hp <= 0) killEnemy(state, e, true)
        if (!b.alive) break
      }
    }
  }

  state.playerBullets = state.playerBullets.filter(b => b.alive)
  state.enemyBullets = state.enemyBullets.filter(b => b.alive)
}

function updateEnemies(state: GameState, dt: number): void {
  const slow = state.slowMoTimer > 0 ? 0.55 : 1
  if (state.slowMoTimer > 0) state.slowMoTimer -= dt

  for (const e of state.enemies) {
    if (!e.alive) continue
    const def = ENEMY_DEFS[e.kind]
    e.wobble += dt * 3
    if (e.kind === 'dart') {
      e.x += e.vx * dt * slow
      if (e.x < -GAME_CONFIG.arenaHalfW + 1 || e.x > GAME_CONFIG.arenaHalfW - 1) e.vx *= -1
    }
    e.z += e.vz * dt * slow
    if (e.z > GAME_CONFIG.arenaHalfD + 1) {
      e.alive = false
      breakCombo(state)
      continue
    }

    e.shootCd -= dt
    if (e.shootCd <= 0 && def.shootInterval > 0) {
      enemyShoot(state, e)
      e.shootCd = def.shootInterval * (e.kind === 'boss' ? 0.85 : 1)
    }

    const er = GAME_CONFIG.enemyHitRadius * def.scale
    if (circleHit(e.x, e.z, er, state.player.x, state.player.z, GAME_CONFIG.playerHitRadius)) {
      damagePlayer(state, e.kind === 'boss' ? 3 : e.kind === 'tank' ? 2 : 1)
      if (e.kind !== 'boss') killEnemy(state, e, false)
    }
  }

  state.enemies = state.enemies.filter(e => e.alive)
}

function updatePickups(state: GameState, dt: number): void {
  for (const pk of state.pickups) {
    if (!pk.alive) continue
    pk.life -= dt
    if (pk.life <= 0) pk.alive = false
    if (
      circleHit(pk.x, pk.z, GAME_CONFIG.pickupRadius, state.player.x, state.player.z, GAME_CONFIG.playerHitRadius)
    ) {
      pk.alive = false
      applyPickup(state, pk.kind)
    }
  }
  state.pickups = state.pickups.filter(p => p.alive)
}

export function updateSimulation(state: GameState, input: InputSnapshot, dt: number): void {
  if (state.phase !== 'playing') return

  const timeScale = state.slowMoTimer > 0 ? 0.65 : 1
  const simDt = dt * timeScale

  state.elapsedSec += dt
  if (state.comboTimer > 0) {
    state.comboTimer -= dt
    if (state.comboTimer <= 0) breakCombo(state)
  }
  if (state.clearScreenCd > 0) state.clearScreenCd -= dt
  if (state.clearScreenFlash > 0) state.clearScreenFlash -= dt

  updatePlayer(state, input, simDt)
  updateWaves(state, simDt)
  updateEnemies(state, simDt)
  updateBullets(state, simDt)
  updatePickups(state, simDt)
}

export function persistRecords(state: GameState): void {
  mergeRecords({
    score: state.score,
    combo: state.combo,
    records: state.records,
    flawless: state.flawless,
    phase: state.phase,
    elapsedSec: state.elapsedSec,
    bossKilledThisRun: state.bossKilledThisRun,
  })
}

export function gradeLabel(state: GameState): string {
  if (state.phase === 'defeat') return '再试一次'
  if (state.flawless) return 'S · 无伤'
  if (state.elapsedSec < 90) return 'A · 速通'
  if (state.score >= state.records.bestScore * 0.85) return 'A · 高分'
  return 'B · 通关'
}