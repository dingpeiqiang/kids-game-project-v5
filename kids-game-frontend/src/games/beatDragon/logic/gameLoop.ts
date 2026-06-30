import {
  BASE_W,
  BULLET_ENEMY,
  BULLET_PLAYER,
  DRAGON_FIRE,
  DRAGON_NORMAL,
  HERO,
  WAVES,
  type BuffId,
} from '../config'
import type { GameState } from '../types'
import { circleHit } from './collision'
import {
  applyBuff,
  computeStars,
  rollBuffChoices,
  spawnWaveDragon,
} from './state'

function spawnParticles(state: GameState, x: number, y: number, color: string, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3
    const sp = 1.5 + Math.random() * 2.5
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color,
      size: 3 + Math.random() * 4,
    })
  }
}

function addFloat(state: GameState, x: number, y: number, text: string, color: string) {
  state.floatTexts.push({ x, y, text, color, life: 0.9, vy: -1.2 })
}

function firePlayer(state: GameState) {
  const p = state.player
  const count = p.multiShot
  const spread = count === 1 ? 0 : 0.22
  const mid = (count - 1) / 2
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i - mid) * spread
    state.bullets.push({
      x: p.x,
      y: p.y - HERO.radius,
      vx: Math.cos(angle) * BULLET_PLAYER.speed,
      vy: Math.sin(angle) * BULLET_PLAYER.speed,
      damage: p.damage,
      pierce: p.pierce,
      friendly: true,
      life: 3,
    })
  }
}

function fireDragon(state: GameState) {
  const dragon = state.dragon
  if (!dragon || dragon.dead) return
  const head = dragon.segments.find(s => s.hp > 0) ?? dragon.segments[0]
  if (!head || head.hp <= 0) return
  const px = state.player.x
  const py = state.player.y
  const dx = px - head.x
  const dy = py - head.y
  const len = Math.hypot(dx, dy) || 1
  state.bullets.push({
    x: head.x,
    y: head.y + 20,
    vx: (dx / len) * BULLET_ENEMY.speed,
    vy: (dy / len) * BULLET_ENEMY.speed,
    damage: BULLET_ENEMY.damage,
    pierce: 0,
    friendly: false,
    life: 5,
  })
}

function allSegmentsDead(dragon: NonNullable<GameState['dragon']>): boolean {
  return dragon.segments.every(s => s.hp <= 0)
}

export function startBuffPick(state: GameState) {
  state.phase = 'buffPick'
  state.buffChoices = rollBuffChoices()
}

function advanceWave(state: GameState) {
  const clearedIndex = state.waveIndex
  const next = clearedIndex + 1

  if (!state.endless && clearedIndex >= WAVES.length - 1) {
    state.phase = 'victory'
    state.stars = computeStars(state.player.hp, state.player.maxHp)
    state.waveClearTimer = 0
    return
  }

  state.waveIndex = next
  if (next >= WAVES.length) state.endless = true
  state.dragon = spawnWaveDragon(state.waveIndex, state.endless)
  state.bullets = []
  state.phase = 'playing'
  state.waveClearTimer = 0
}

export function updateSimulation(state: GameState, dt: number): void {
  if (state.phase === 'victory' || state.phase === 'defeat') {
    updateFx(state, dt)
    return
  }

  if (state.phase === 'buffPick') {
    updateFx(state, dt)
    return
  }

  if (state.phase === 'waveClear') {
    state.waveClearTimer -= dt
    updateFx(state, dt)
    if (state.waveClearTimer <= 0) advanceWave(state)
    return
  }

  state.time += dt
  const p = state.player
  p.fireCooldown -= dt
  if (p.fireCooldown <= 0) {
    firePlayer(state)
    p.fireCooldown = 1 / p.fireRate
  }

  const dragon = state.dragon
  if (dragon && !dragon.dead) {
    const def = dragon.kind === 'dragon_fire' ? DRAGON_FIRE : DRAGON_NORMAL
    dragon.fireTimer -= dt
    if (dragon.fireTimer <= 0) {
      fireDragon(state)
      dragon.fireTimer = def.bulletInterval
    }
    for (const s of dragon.segments) {
      s.wobble += dt * 3
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx * 60 * dt
    b.y += b.vy * 60 * dt
    b.life -= dt
  }
  state.bullets = state.bullets.filter(
    b => b.life > 0 && b.y > -40 && b.y < 640 && b.x > -40 && b.x < BASE_W + 40,
  )

  if (dragon && !dragon.dead) {
    const segDef = dragon.kind === 'dragon_fire' ? DRAGON_FIRE : DRAGON_NORMAL
    for (const b of state.bullets) {
      if (!b.friendly || b.life <= 0) continue
      for (const seg of dragon.segments) {
        if (seg.hp <= 0) continue
        const hw = segDef.segmentWidth * 0.45
        const hh = segDef.segmentHeight * 0.45
        if (
          b.x > seg.x - hw &&
          b.x < seg.x + hw &&
          b.y > seg.y - hh &&
          b.y < seg.y + hh
        ) {
          const crit = Math.random() < 0.12
          const dmg = crit ? Math.floor(b.damage * 1.8) : b.damage
          seg.hp -= dmg
          addFloat(state, seg.x, seg.y - 10, crit ? `${dmg}!` : String(dmg), crit ? '#FFB86C' : '#fff')
          spawnParticles(state, seg.x, seg.y, dragon.kind === 'dragon_fire' ? '#EF5350' : '#7E57C2', 5)
          state.score += dmg
          if (seg.hp <= 0) {
            state.score += 50
            if (seg.isBox && !seg.boxOpened) {
              seg.boxOpened = true
              startBuffPick(state)
            }
          }
          if (b.pierce > 0) b.pierce -= 1
          else b.life = 0
          break
        }
      }
    }
  }

  for (const b of state.bullets) {
    if (b.friendly) continue
    if (circleHit(b.x, b.y, BULLET_ENEMY.radius, p.x, p.y, HERO.radius)) {
      b.life = 0
      p.hp -= b.damage
      spawnParticles(state, p.x, p.y, '#F87171', 6)
      if (p.hp <= 0) {
        state.phase = 'defeat'
        state.stars = 0
      }
    }
  }

  if (dragon && !dragon.dead && allSegmentsDead(dragon)) {
    dragon.dead = true
    state.phase = 'waveClear'
    state.waveClearTimer = 1.1
    state.score += 200
  }

  updateFx(state, dt)
}

function updateFx(state: GameState, dt: number) {
  for (const pt of state.particles) {
    pt.x += pt.vx
    pt.y += pt.vy
    pt.vy += 0.08
    pt.life -= dt
  }
  state.particles = state.particles.filter(p => p.life > 0)

  for (const t of state.floatTexts) {
    t.y += t.vy
    t.life -= dt
  }
  state.floatTexts = state.floatTexts.filter(t => t.life > 0)
}

export function pickBuff(state: GameState, buff: BuffId) {
  applyBuff(state, buff)
}