import {
  BUFF_DURATION,
  comboMultiplier,
  ENEMY_DEF,
  FIRE_CONFIG,
  GAME_CONFIG,
  METEOR,
  PICKUP_WEIGHTS,
} from '../config'
import { circleHit, clamp } from './collision'
import type {
  BulletState,
  EnemyState,
  GameRuntime,
  PickupKind,
  PickupState,
  PlayMode,
} from '../types'

let nextBulletId = 1
let nextPickupId = 1
let nextExplosionId = 1

export function resetCombatIds(): void {
  nextBulletId = 1
  nextPickupId = 1
  nextExplosionId = 1
}

function nowMs(): number {
  return performance.now()
}

function worldSlow(runtime: GameRuntime): number {
  return runtime.buffs.slowWorldUntil > nowMs() ? 0.62 : 1
}

export function createRuntime(mode: PlayMode): GameRuntime {
  const hx = GAME_CONFIG.worldHalfX
  const hz = GAME_CONFIG.worldHalfZ
  const t = nowMs()
  return {
    mode,
    paused: false,
    over: false,
    won: false,
    score: 0,
    combo: 0,
    comboTimer: 0,
    clearScreenReady: true,
    clearScreenCd: 0,
    player: {
      x: 0,
      z: hz - 4,
      hp: GAME_CONFIG.playerMaxHp,
      maxHp: GAME_CONFIG.playerMaxHp,
      shieldUntil: 0,
      invulnUntil: 0,
      bulletTier: 1,
      firepowerUntil: 0,
      fireCooldown: 0,
      damageTaken: 0,
    },
    bullets: [],
    enemies: [],
    pickups: [],
    explosions: [],
    buffs: { slowWorldUntil: 0 },
    wave: { index: 0, elapsed: 0, spawnQueue: 0, bossSpawned: false, cleared: false },
    stats: { startTime: t, endTime: 0, maxCombo: 0, bossKills: 0, noDamageWin: false },
    bounds: { minX: -hx, maxX: hx, minZ: -hz, maxZ: hz },
  }
}

export function movePlayer(runtime: GameRuntime, moveX: number, moveZ: number, dt: number): void {
  const p = runtime.player
  const len = Math.hypot(moveX, moveZ)
  const nx = len > 0.01 ? moveX / len : 0
  const nz = len > 0.01 ? moveZ / len : 0
  p.x = clamp(p.x + nx * GAME_CONFIG.playerSpeed * dt, runtime.bounds.minX + 0.5, runtime.bounds.maxX - 0.5)
  p.z = clamp(p.z + nz * GAME_CONFIG.playerSpeed * dt, runtime.bounds.minZ + 1, runtime.bounds.maxZ - 1)
}

function effectiveTier(runtime: GameRuntime): 1 | 2 | 3 | 4 {
  if (runtime.player.firepowerUntil > nowMs()) {
    return Math.min(4, runtime.player.bulletTier + 1) as 1 | 2 | 3 | 4
  }
  return runtime.player.bulletTier
}

export function tickPlayerFire(runtime: GameRuntime, dt: number): void {
  const p = runtime.player
  p.fireCooldown -= dt
  if (p.fireCooldown > 0) return
  if (runtime.bullets.length >= GAME_CONFIG.maxBullets) return

  const tier = effectiveTier(runtime)
  const cfg = FIRE_CONFIG[tier]
  p.fireCooldown = cfg.interval

  const baseAngle = -Math.PI / 2
  for (let i = 0; i < cfg.count; i++) {
    const spread =
      cfg.count === 1 ? 0 : cfg.spread * (i - (cfg.count - 1) / 2) / Math.max(1, cfg.count - 1)
    const a = baseAngle + spread
    const vx = Math.cos(a) * cfg.speed
    const vz = Math.sin(a) * cfg.speed
    runtime.bullets.push({
      id: nextBulletId++,
      x: p.x,
      z: p.z - 0.6,
      vx,
      vz,
      fromPlayer: true,
      damage: cfg.damage,
      pierceLeft: cfg.pierce,
      radius: tier >= 4 ? 0.35 : 0.18,
    })
  }
}

function pickPickupKind(): PickupKind {
  const total = PICKUP_WEIGHTS.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const entry of PICKUP_WEIGHTS) {
    r -= entry.w
    if (r <= 0) return entry.kind
  }
  return 'heal'
}

function spawnPickup(runtime: GameRuntime, x: number, z: number): void {
  if (runtime.pickups.length >= GAME_CONFIG.maxPickups) return
  if (Math.random() > 0.28) return
  runtime.pickups.push({
    id: nextPickupId++,
    kind: pickPickupKind(),
    x,
    z,
    vy: 2,
    life: GAME_CONFIG.pickupLife,
  })
}

function addExplosion(runtime: GameRuntime, x: number, z: number, scale: number): void {
  if (runtime.explosions.length >= GAME_CONFIG.maxExplosions) return
  runtime.explosions.push({ id: nextExplosionId++, x, z, scale, life: 0.45 })
}

function registerKill(runtime: GameRuntime, baseScore: number, engineAddScore: (n: number) => void): void {
  runtime.combo += 1
  runtime.comboTimer = GAME_CONFIG.comboDecaySec
  runtime.stats.maxCombo = Math.max(runtime.stats.maxCombo, runtime.combo)
  const mult = comboMultiplier(runtime.combo, runtime.mode)
  const pts = Math.round(baseScore * mult)
  runtime.score += pts
  engineAddScore(pts)
}

function damagePlayer(runtime: GameRuntime, amount: number): void {
  const p = runtime.player
  if (p.invulnUntil > nowMs()) return
  if (p.shieldUntil > nowMs()) return
  p.hp -= amount
  p.damageTaken += amount
  p.invulnUntil = nowMs() + GAME_CONFIG.invulnAfterHit * 1000
  runtime.combo = 0
  runtime.comboTimer = 0
  if (p.hp <= 0) {
    p.hp = 0
    runtime.over = true
  }
}

export function updateEnemies(runtime: GameRuntime, dt: number): void {
  const slow = worldSlow(runtime)
  const dtS = dt * slow
  const p = runtime.player

  for (const e of runtime.enemies) {
    e.wobblePhase += dtS * 3
    if (e.kind === 'skimmer') {
      e.x += e.vx * dtS
      if (e.x < runtime.bounds.minX + 1 || e.x > runtime.bounds.maxX - 1) e.vx *= -1
    }
    if (e.kind === 'boss') {
      e.x += Math.sin(e.wobblePhase) * 4 * dtS
      e.x = clamp(e.x, runtime.bounds.minX + 2, runtime.bounds.maxX - 2)
    }
    e.z += e.vz * dtS

    const def = e.kind === 'meteor' ? null : ENEMY_DEF[e.kind]
    if (def && def.fireInterval > 0) {
      e.fireCooldown -= dtS
      if (e.fireCooldown <= 0 && e.z < p.z + 8) {
        e.fireCooldown = def.fireInterval * (e.kind === 'boss' ? 0.85 : 1)
        const dx = p.x - e.x
        const dz = p.z - e.z
        const len = Math.hypot(dx, dz) || 1
        const shots = e.kind === 'boss' ? 6 : 1
        for (let i = 0; i < shots; i++) {
          const ang = Math.atan2(dz, dx) + (i - (shots - 1) / 2) * 0.22
          runtime.bullets.push({
            id: nextBulletId++,
            x: e.x,
            z: e.z,
            vx: Math.cos(ang) * def.bulletSpeed,
            vz: Math.sin(ang) * def.bulletSpeed,
            fromPlayer: false,
            damage: e.kind === 'boss' ? 1 : 1,
            pierceLeft: 0,
            radius: 0.2,
          })
        }
      }
    }
  }

  runtime.enemies = runtime.enemies.filter(e => e.z < runtime.bounds.maxZ + 4)
}

export function updateBullets(runtime: GameRuntime, dt: number): void {
  const slow = worldSlow(runtime)
  for (const b of runtime.bullets) {
    b.x += b.vx * dt * slow
    b.z += b.vz * dt * slow
  }
  runtime.bullets = runtime.bullets.filter(
    b =>
      b.x >= runtime.bounds.minX - 2 &&
      b.x <= runtime.bounds.maxX + 2 &&
      b.z >= runtime.bounds.minZ - 4 &&
      b.z <= runtime.bounds.maxZ + 2,
  )
}

export function resolveCollisions(
  runtime: GameRuntime,
  engineAddScore: (n: number) => void,
): void {
  const p = runtime.player
  const pr = GAME_CONFIG.playerRadius

  const hitEnemyIds = new Set<number>()

  for (const b of runtime.bullets) {
    if (!b.fromPlayer) continue
    for (const e of runtime.enemies) {
      if (hitEnemyIds.has(e.id) && b.pierceLeft <= 0) continue
      const er = e.kind === 'meteor' ? METEOR.radius : ENEMY_DEF[e.kind as keyof typeof ENEMY_DEF]?.radius ?? 0.5
      if (!circleHit(b.x, b.z, b.radius, e.x, e.z, er)) continue
      e.hp -= b.damage
      if (b.pierceLeft > 0) b.pierceLeft -= 1
      else hitEnemyIds.add(b.id)
      if (e.hp <= 0) {
        registerKill(runtime, e.scoreValue, engineAddScore)
        addExplosion(runtime, e.x, e.z, e.kind === 'boss' ? 2.2 : 1)
        if (e.kind === 'boss') runtime.stats.bossKills += 1
        spawnPickup(runtime, e.x, e.z)
        e.hp = -999
      }
    }
  }

  runtime.enemies = runtime.enemies.filter(e => e.hp > 0)

  for (const b of runtime.bullets) {
    if (b.fromPlayer) continue
    if (circleHit(b.x, b.z, b.radius, p.x, p.z, pr)) {
      damagePlayer(runtime, b.damage)
      b.z = 9999
    }
  }
  runtime.bullets = runtime.bullets.filter(b => b.z < runtime.bounds.maxZ + 5)

  for (const e of runtime.enemies) {
    const er = e.kind === 'meteor' ? METEOR.radius : ENEMY_DEF[e.kind as keyof typeof ENEMY_DEF]?.radius ?? 0.5
    if (circleHit(p.x, p.z, pr, e.x, e.z, er)) {
      damagePlayer(runtime, e.kind === 'boss' ? 2 : 1)
      if (e.kind !== 'boss') {
        addExplosion(runtime, e.x, e.z, 0.8)
        e.hp = 0
      }
    }
  }
  runtime.enemies = runtime.enemies.filter(e => e.hp > 0)
}

export function updatePickups(runtime: GameRuntime, dt: number): void {
  const p = runtime.player
  const pr = GAME_CONFIG.playerRadius
  for (const pk of runtime.pickups) {
    pk.life -= dt
    pk.z += 0.5 * dt
    if (circleHit(p.x, p.z, pr, pk.x, pk.z, 0.45)) {
      applyPickup(runtime, pk.kind)
      pk.life = 0
    }
  }
  runtime.pickups = runtime.pickups.filter(pk => pk.life > 0)
}

function applyPickup(runtime: GameRuntime, kind: PickupKind): void {
  const p = runtime.player
  const t = nowMs()
  switch (kind) {
    case 'firepower':
      p.firepowerUntil = t + BUFF_DURATION.firepower * 1000
      p.bulletTier = Math.min(4, p.bulletTier + 1) as 1 | 2 | 3 | 4
      break
    case 'shield':
      p.shieldUntil = t + BUFF_DURATION.shield * 1000
      break
    case 'heal':
      p.hp = Math.min(p.maxHp, p.hp + BUFF_DURATION.healAmount)
      break
    case 'slowMo':
      runtime.buffs.slowWorldUntil = t + BUFF_DURATION.slowMo * 1000
      break
  }
}

export function updateExplosions(runtime: GameRuntime, dt: number): void {
  for (const ex of runtime.explosions) ex.life -= dt
  runtime.explosions = runtime.explosions.filter(ex => ex.life > 0)
}

export function tickCombo(runtime: GameRuntime, dt: number): void {
  if (runtime.combo <= 0) return
  runtime.comboTimer -= dt
  if (runtime.comboTimer <= 0) runtime.combo = 0
}

export function tickClearScreenCd(runtime: GameRuntime, dt: number): void {
  if (runtime.clearScreenCd > 0) runtime.clearScreenCd -= dt
  runtime.clearScreenReady = runtime.clearScreenCd <= 0
}

export function triggerClearScreen(
  runtime: GameRuntime,
  engineAddScore: (n: number) => void,
): boolean {
  if (!runtime.clearScreenReady || runtime.over) return false
  runtime.clearScreenCd = GAME_CONFIG.clearScreenCooldown
  runtime.clearScreenReady = false
  runtime.bullets = runtime.bullets.filter(b => !b.fromPlayer)
  for (const e of runtime.enemies) {
    registerKill(runtime, Math.floor(e.scoreValue * 0.6), engineAddScore)
    addExplosion(runtime, e.x, e.z, 1.2)
    if (e.kind === 'boss') runtime.stats.bossKills += 1
  }
  runtime.enemies = []
  return true
}

export function finishVictory(runtime: GameRuntime): void {
  if (runtime.over) return
  runtime.stats.endTime = nowMs()
  runtime.stats.noDamageWin = runtime.player.damageTaken === 0
  runtime.won = true
  runtime.over = true
}