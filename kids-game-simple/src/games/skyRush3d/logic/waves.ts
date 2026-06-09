import { ENEMY_DEF, GAME_CONFIG, getWavesForMode, METEOR_DEF, MODE_MULTIPLIER, type WaveSpec } from '../config'
import type { EnemyKind, EnemyState, GameState } from '../types'
import { allocId } from './state'

function pickKind(weights: WaveSpec['weights']): EnemyKind {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [EnemyKind, number][]
  if (entries.length === 0) return 'grunt'
  let total = 0
  for (const [, w] of entries) total += w
  let r = Math.random() * total
  for (const [kind, w] of entries) {
    r -= w
    if (r <= 0) return kind
  }
  return entries[entries.length - 1]![0]
}

export function spawnEnemy(state: GameState): void {
  if (state.enemies.length >= GAME_CONFIG.enemyCap) return
  const waves = getWavesForMode(state.mode)
  const spec = waves[Math.min(state.wave - 1, waves.length - 1)]!
  const kind = Math.random() < spec.meteorChance ? 'meteor' : pickKind(spec.weights)

  const x = (Math.random() * 2 - 1) * (GAME_CONFIG.arenaHalfW - 1)
  const z = GAME_CONFIG.arenaHalfZ - 1

  if (kind === 'meteor') {
    state.enemies.push({
      id: allocId(state),
      kind: 'meteor',
      x,
      z,
      vx: (Math.random() - 0.5) * 2,
      vz: -METEOR_DEF.speed * MODE_MULTIPLIER[state.mode].enemySpeed,
      hp: METEOR_DEF.hp,
      maxHp: METEOR_DEF.hp,
      fireCooldown: 99,
      wobble: Math.random() * Math.PI * 2,
    })
    return
  }

  if (kind === 'boss') {
    if (state.bossSpawned) return
    state.bossSpawned = true
    const def = ENEMY_DEF.boss
    state.enemies.push({
      id: allocId(state),
      kind: 'boss',
      x: 0,
      z: GAME_CONFIG.arenaHalfZ - 3,
      vx: 0,
      vz: 0,
      hp: def.hp,
      maxHp: def.hp,
      fireCooldown: 0.5,
      wobble: 0,
    })
    return
  }

  const def = ENEMY_DEF[kind]
  const speed = def.speed * MODE_MULTIPLIER[state.mode].enemySpeed
  state.enemies.push({
    id: allocId(state),
    kind,
    x,
    z,
    vx: kind === 'dart' ? (Math.random() < 0.5 ? -1 : 1) * speed * 0.6 : (Math.random() - 0.5) * 1.5,
    vz: -speed,
    hp: def.hp,
    maxHp: def.hp,
    fireCooldown: def.canShoot ? def.fireInterval * (0.7 + Math.random() * 0.5) : 99,
    wobble: Math.random() * Math.PI * 2,
  })
}

export function getWaveSpec(state: GameState): WaveSpec {
  const waves = getWavesForMode(state.mode)
  return waves[Math.min(state.wave - 1, waves.length - 1)]!
}