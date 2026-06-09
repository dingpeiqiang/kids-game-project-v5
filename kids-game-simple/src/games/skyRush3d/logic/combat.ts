import {
  BULLET_TIER_CONFIG,
  ENEMY_DEF,
  GAME_CONFIG,
  METEOR_DEF,
  MODE_MULTIPLIER,
  POWERUP_WEIGHTS,
} from '../config'
import type { BulletState, EnemyState, GameState, PowerUpKind, PowerUpState } from '../types'
import { circleHit } from './collision'
import { allocId } from './state'

function pickPowerUp(): PowerUpKind {
  const entries = Object.entries(POWERUP_WEIGHTS) as [PowerUpKind, number][]
  let total = 0
  for (const [, w] of entries) total += w
  let r = Math.random() * total
  for (const [kind, w] of entries) {
    r -= w
    if (r <= 0) return kind
  }
  return 'firepower'
}

export function spawnBurst(state: GameState, x: number, z: number, color: string): void {
  while (state.particles.length >= GAME_CONFIG.particleCap) state.particles.shift()
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      id: allocId(state),
      x: x + (Math.random() - 0.5) * 0.8,
      z: z + (Math.random() - 0.5) * 0.8,
      life: 0.35 + Math.random() * 0.25,
      color,
    })
  }
}

export function tryDropPowerUp(state: GameState, x: number, z: number): void {
  if (Math.random() > 0.28) return
  const kind = pickPowerUp()
  const pu: PowerUpState = {
    id: allocId(state),
    kind,
    x,
    z,
    vz: -2.5,
  }
  state.powerUps.push(pu)
}

export function firePlayerBullets(state: GameState): void {
  const tier = state.player.bulletTier
  const cfg = BULLET_TIER_CONFIG[tier]
  if (state.bullets.length >= GAME_CONFIG.bulletCap) return

  const px = state.player.pos.x
  const pz = state.player.pos.z
  const baseAngle = -Math.PI / 2

  for (let i = 0; i < cfg.count; i++) {
    const spread =
      cfg.count === 1 ? 0 : (i / (cfg.count - 1) - 0.5) * 2 * cfg.spread
    const ang = baseAngle + spread
    const vx = Math.cos(ang) * cfg.speed
    const vz = Math.sin(ang) * cfg.speed
    const b: BulletState = {
      id: allocId(state),
      x: px,
      z: pz - 0.3,
      vx,
      vz,
      friendly: true,
      damage: cfg.damage,
      pierceLeft: cfg.pierce,
      radius: tier >= 4 ? 0.22 : 0.12,
    }
    state.bullets.push(b)
  }
}

export function enemyShoot(state: GameState, enemy: EnemyState): void {
  if (state.bullets.length >= GAME_CONFIG.bulletCap) return
  const dx = state.player.pos.x - enemy.x
  const dz = state.player.pos.z - enemy.z
  const len = Math.hypot(dx, dz) || 1
  const speed = enemy.kind === 'boss' ? 14 : 9
  state.bullets.push({
    id: allocId(state),
    x: enemy.x,
    z: enemy.z,
    vx: (dx / len) * speed,
    vz: (dz / len) * speed,
    friendly: false,
    damage: enemy.kind === 'boss' ? 1 : 1,
    pierceLeft: 0,
    radius: enemy.kind === 'boss' ? 0.18 : 0.14,
  })
  if (enemy.kind === 'boss' && Math.random() < 0.6) {
    for (let k = -1; k <= 1; k++) {
      const ang = Math.atan2(dz, dx) + k * 0.35
      state.bullets.push({
        id: allocId(state),
        x: enemy.x,
        z: enemy.z,
        vx: Math.cos(ang) * speed * 0.85,
        vz: Math.sin(ang) * speed * 0.85,
        friendly: false,
        damage: 1,
        pierceLeft: 0,
        radius: 0.14,
      })
    }
  }
}

function enemyRadius(kind: EnemyState['kind']): number {
  if (kind === 'meteor') return METEOR_DEF.radius
  return ENEMY_DEF[kind].radius
}

function scoreForKill(state: GameState, enemy: EnemyState): number {
  let base =
    enemy.kind === 'meteor'
      ? METEOR_DEF.score
      : ENEMY_DEF[enemy.kind].score
  base = Math.round(base * MODE_MULTIPLIER[state.mode].score)
  state.combo++
  state.comboTimer = GAME_CONFIG.comboDecaySec
  if (state.combo > state.maxCombo) state.maxCombo = state.combo
  let mult = 1
  if (state.combo >= 20) mult = 1.5
  else if (state.combo >= 15) mult = 1.3
  else if (state.combo >= 10) mult = 1.2
  else if (state.combo >= 5) mult = 1.1
  return Math.round(base * mult)
}

export function killEnemy(state: GameState, enemy: EnemyState, index: number): number {
  const pts = scoreForKill(state, enemy)
  state.score += pts
  spawnBurst(state, enemy.x, enemy.z, enemy.kind === 'boss' ? '#ffaa44' : '#88ccff')
  if (enemy.kind !== 'meteor') tryDropPowerUp(state, enemy.x, enemy.z)
  if (enemy.kind === 'boss') state.bossDefeated = true
  state.enemies.splice(index, 1)
  return pts
}

export function applyPowerUp(state: GameState, pu: PowerUpState): void {
  switch (pu.kind) {
    case 'firepower':
      state.player.bulletTier = Math.min(4, (state.player.bulletTier + 1) as 1 | 2 | 3 | 4)
      state.player.fireInterval = BULLET_TIER_CONFIG[state.player.bulletTier].interval
      break
    case 'shield':
      state.player.shield = Math.min(3, state.player.shield + 2)
      break
    case 'heal':
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2)
      break
    case 'slowMo':
      state.player.slowMo = 5
      break
  }
}

export function damagePlayer(state: GameState, amount: number): void {
  if (state.player.invuln > 0) return
  if (state.player.shield > 0) {
    state.player.shield--
    state.player.invuln = 0.4
    return
  }
  state.player.hp -= amount
  state.damageTaken += amount
  state.player.invuln = GAME_CONFIG.invulnAfterHit
  if (state.combo >= 5) state.combo = 0
}

export function resolveBulletHits(state: GameState): void {
  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi]!
    if (b.friendly) {
      for (let ei = state.enemies.length - 1; ei >= 0; ei--) {
        const e = state.enemies[ei]!
        if (circleHit(b.x, b.z, b.radius, e.x, e.z, enemyRadius(e.kind))) {
          e.hp -= b.damage
          if (b.pierceLeft > 0) b.pierceLeft--
          else {
            state.bullets.splice(bi, 1)
            bi--
          }
          if (e.hp <= 0) killEnemy(state, e, ei)
          break
        }
      }
    } else {
      if (
        circleHit(
          b.x,
          b.z,
          b.radius,
          state.player.pos.x,
          state.player.pos.z,
          GAME_CONFIG.playerRadius,
        )
      ) {
        damagePlayer(state, b.damage)
        state.bullets.splice(bi, 1)
      }
    }
  }
}

export function resolveBodyHits(state: GameState): void {
  const px = state.player.pos.x
  const pz = state.player.pos.z
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i]!
    if (circleHit(px, pz, GAME_CONFIG.playerRadius, e.x, e.z, enemyRadius(e.kind))) {
      damagePlayer(state, e.kind === 'boss' ? 3 : e.kind === 'tank' ? 2 : 1)
      if (e.kind !== 'boss') {
        killEnemy(state, e, i)
      }
    }
  }
}

export function clearScreenKill(state: GameState): void {
  let chain = 0
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i]!
    if (e.kind === 'boss') continue
    state.score += scoreForKill(state, e)
    spawnBurst(state, e.x, e.z, '#ffee88')
    state.enemies.splice(i, 1)
    chain++
  }
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    if (!state.bullets[i]!.friendly) state.bullets.splice(i, 1)
  }
  if (chain >= 3) spawnBurst(state, 0, 0, '#ffffff')
}