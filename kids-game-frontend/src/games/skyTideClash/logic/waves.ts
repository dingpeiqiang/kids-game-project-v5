import { ENEMY_DEF, getWaves, METEOR } from '../config'
import type { EnemyKind, EnemyState, GameRuntime, PlayMode } from '../types'

let nextEnemyId = 1

export function resetIdCounters(): void {
  nextEnemyId = 1
}

function pickKind(weights: Partial<Record<EnemyKind, number>>): EnemyKind {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as Array<[EnemyKind, number]>
  if (entries.length === 0) return 'grunt'
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [k, w] of entries) {
    r -= w
    if (r <= 0) return k
  }
  return entries[entries.length - 1]![0]
}

function spawnEnemy(kind: EnemyKind, runtime: GameRuntime): EnemyState | null {
  if (kind === 'meteor') {
    const x = (Math.random() * 2 - 1) * runtime.bounds.maxX * 0.9
    return {
      id: nextEnemyId++,
      kind: 'meteor',
      x,
      z: runtime.bounds.minZ - 2,
      vx: (Math.random() - 0.5) * 2,
      vz: METEOR.speed,
      hp: METEOR.hp,
      maxHp: METEOR.hp,
      fireCooldown: 0,
      scoreValue: METEOR.score,
      wobblePhase: Math.random() * Math.PI * 2,
    }
  }

  const def = ENEMY_DEF[kind as keyof typeof ENEMY_DEF]
  if (!def) return null

  const x = (Math.random() * 2 - 1) * runtime.bounds.maxX * 0.85
  const enemy: EnemyState = {
    id: nextEnemyId++,
    kind,
    x,
    z: runtime.bounds.minZ - 1.5,
    vx: kind === 'skimmer' ? (Math.random() < 0.5 ? -1 : 1) * def.speed * 0.35 : 0,
    vz: def.speed,
    hp: def.hp,
    maxHp: def.hp,
    fireCooldown: def.fireInterval > 0 ? def.fireInterval * (0.5 + Math.random()) : 0,
    scoreValue: def.score,
    wobblePhase: Math.random() * Math.PI * 2,
  }
  return enemy
}

export function updateWaves(runtime: GameRuntime, dt: number, mode: PlayMode): void {
  const waves = getWaves(mode)
  const waveDef = waves[runtime.wave.index]
  if (!waveDef || runtime.wave.cleared) return

  runtime.wave.elapsed += dt

  const slow = runtime.buffs.slowWorldUntil > performance.now() ? 0.65 : 1
  const interval = waveDef.spawnInterval / slow

  const spawning = runtime.wave.elapsed < waveDef.duration
  runtime.wave.spawnQueue += dt
  while (spawning && runtime.wave.spawnQueue >= interval && runtime.enemies.length < 36) {
    runtime.wave.spawnQueue -= interval
    if (Math.random() < waveDef.meteorChance) {
      const m = spawnEnemy('meteor', runtime)
      if (m) runtime.enemies.push(m)
    } else {
      const kind = pickKind(waveDef.weights)
      const e = spawnEnemy(kind, runtime)
      if (e) runtime.enemies.push(e)
    }
  }

  if (waveDef.spawnBossAtEnd && !runtime.wave.bossSpawned && runtime.wave.elapsed >= waveDef.duration * 0.55) {
    runtime.wave.bossSpawned = true
    const boss = spawnEnemy('boss', runtime)
    if (boss) {
      boss.z = runtime.bounds.minZ - 3
      boss.x = 0
      runtime.enemies.push(boss)
    }
  }

  if (runtime.wave.elapsed >= waveDef.duration) {
    const living = runtime.enemies.filter(e => e.kind !== 'boss' || e.hp > 0)
    const bossAlive = living.some(e => e.kind === 'boss')
    if (!bossAlive && living.length === 0) {
      if (runtime.wave.index + 1 >= waves.length) {
        runtime.wave.cleared = true
        runtime.won = true
      } else {
        runtime.wave.index += 1
        runtime.wave.elapsed = 0
        runtime.wave.spawnQueue = 0
        runtime.wave.bossSpawned = false
      }
    }
  }
}

export function spawnBossOnly(runtime: GameRuntime): void {
  const boss = spawnEnemy('boss', runtime)
  if (boss) {
    boss.z = runtime.bounds.minZ - 2
    runtime.enemies.push(boss)
  }
}