import {
  ALLY_CRYSTAL,
  BASE_H,
  BASE_W,
  BUSHES,
  CRYSTAL,
  ENEMY_CRYSTAL,
  ENEMY_HERO_SPAWN,
  ENEMY_XIAOBING,
  ENEMY_YUJI,
  HERO_LIUBEI,
  ITEM_SHIELD,
  LEVELS,
  MATCH,
  MINION_LANES,
  PLAYER_SPAWN,
  WAVE_SPAWN_INTERVAL,
} from '../config'
import type { GameState } from '../types'
import { circlesOverlap, dist } from './collision'
import { calcStars } from './state'

function addFloat(state: GameState, x: number, y: number, text: string, color: string) {
  state.floatTexts.push({ x, y, text, life: 0.9, color, vy: -42 })
}

function addParticles(state: GameState, x: number, y: number, color: string, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4
    const sp = 60 + Math.random() * 80
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color,
      size: 4 + Math.random() * 4,
    })
  }
}

function inBush(x: number, y: number): boolean {
  for (const b of BUSHES) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true
  }
  return false
}

function spawnWaveMinions(state: GameState) {
  const level = LEVELS[state.levelIndex]
  const perLane = 2 + Math.floor(state.waveIndex / 2)
  for (const lane of MINION_LANES) {
    for (let i = 0; i < perLane; i++) {
      const offset = i * 55
      state.minions.push({
        id: state.nextMinionId++,
        x: BASE_W - 120 - offset,
        y: lane.y,
        hp: ENEMY_XIAOBING.maxHp,
        maxHp: ENEMY_XIAOBING.maxHp,
        friendly: false,
        laneY: lane.y,
        wobble: Math.random() * Math.PI,
      })
    }
    if (state.waveIndex >= 2) {
      state.minions.push({
        id: state.nextMinionId++,
        x: 120,
        y: lane.y,
        hp: ENEMY_XIAOBING.maxHp,
        maxHp: ENEMY_XIAOBING.maxHp,
        friendly: true,
        laneY: lane.y,
        wobble: Math.random() * Math.PI,
      })
    }
  }
  void level
}

function damageHero(state: GameState, amount: number) {
  const h = state.hero
  if (h.dead) return
  let dmg = amount
  if (h.shield > 0) {
    const absorbed = Math.min(h.shield, dmg)
    h.shield -= absorbed
    dmg -= absorbed
  }
  if (dmg > 0) h.hp -= dmg
  h.wobble = 1
  if (h.hp <= 0) {
    h.hp = 0
    h.dead = true
    h.respawnTimer = MATCH.respawnSec
  }
}

function damageEnemyHero(state: GameState, amount: number) {
  const e = state.enemyHero
  if (!e.active || e.hp <= 0) return
  e.hp -= amount
  e.wobble = 1
  if (e.hp <= 0) {
    e.hp = 0
    state.gold += ENEMY_YUJI.gold
    state.score += ENEMY_YUJI.score
    state.kills += 1
    addFloat(state, e.x, e.y - 30, `+${ENEMY_YUJI.gold}🪙`, '#F8BBD0')
    addParticles(state, e.x, e.y, '#F8BBD0', 14)
    e.active = false
  }
}

function killMinion(state: GameState, idx: number) {
  const m = state.minions[idx]
  if (!m.friendly) {
    state.gold += ENEMY_XIAOBING.gold
    state.score += ENEMY_XIAOBING.score
    state.kills += 1
    state.combo += 1
    state.comboTimer = 2.5
    addFloat(state, m.x, m.y - 20, `+${ENEMY_XIAOBING.gold}`, '#81C784')
  }
  addParticles(state, m.x, m.y, m.friendly ? '#73C0F4' : '#FF8A80', 6)
  state.minions.splice(idx, 1)
}

function tryDropShield(state: GameState, x: number, y: number) {
  const level = LEVELS[state.levelIndex]
  if (!level.shieldDrop) return
  if (Math.random() > 0.22) return
  state.pickups.push({
    id: state.nextPickupId++,
    x,
    y,
    kind: 'item_shield',
    life: 25,
  })
}

export function castSkill1(state: GameState): boolean {
  const h = state.hero
  if (state.phase !== 'playing' || h.dead || h.skill1Cd > 0) return false
  h.skill1Cd = HERO_LIUBEI.skill1Cd
  state.skillFx.push({
    x: h.x + h.facing * 40,
    y: h.y,
    radius: HERO_LIUBEI.skill1Radius,
    life: 0.35,
    maxLife: 0.35,
    kind: 'skill1',
  })
  for (let i = state.minions.length - 1; i >= 0; i--) {
    const m = state.minions[i]
    if (m.friendly) continue
    if (dist(h.x, h.y, m.x, m.y) <= HERO_LIUBEI.skill1Radius) {
      m.hp -= HERO_LIUBEI.skill1Damage
      if (m.hp <= 0) {
        tryDropShield(state, m.x, m.y)
        killMinion(state, i)
      } else addFloat(state, m.x, m.y - 16, String(HERO_LIUBEI.skill1Damage), '#73C0F4')
    }
  }
  if (state.enemyHero.active && dist(h.x, h.y, state.enemyHero.x, state.enemyHero.y) <= HERO_LIUBEI.skill1Radius) {
    damageEnemyHero(state, HERO_LIUBEI.skill1Damage)
    addFloat(state, state.enemyHero.x, state.enemyHero.y - 20, String(HERO_LIUBEI.skill1Damage), '#73C0F4')
  }
  return true
}

export function castUlt(state: GameState): boolean {
  const h = state.hero
  if (state.phase !== 'playing' || h.dead || h.ultCd > 0) return false
  h.ultCd = HERO_LIUBEI.ultCd
  state.skillFx.push({
    x: BASE_W / 2,
    y: BASE_H / 2,
    radius: Math.max(BASE_W, BASE_H) * 0.55,
    life: 0.5,
    maxLife: 0.5,
    kind: 'ult',
  })
  for (let i = state.minions.length - 1; i >= 0; i--) {
    const m = state.minions[i]
    if (!m.friendly) {
      tryDropShield(state, m.x, m.y)
      killMinion(state, i)
    }
  }
  if (state.enemyHero.active) {
    damageEnemyHero(state, HERO_LIUBEI.ultDamage)
  }
  return true
}

function heroAutoAttack(state: GameState) {
  const h = state.hero
  if (h.dead || h.atkCooldown > 0) return
  let target: { x: number; y: number; kind: 'minion' | 'hero'; idx?: number } | null = null
  let bestD = HERO_LIUBEI.atkRange
  state.minions.forEach((m, idx) => {
    if (m.friendly) return
    const d = dist(h.x, h.y, m.x, m.y)
    if (d < bestD) {
      bestD = d
      target = { x: m.x, y: m.y, kind: 'minion', idx }
    }
  })
  if (state.enemyHero.active && state.enemyHero.hp > 0) {
    const d = dist(h.x, h.y, state.enemyHero.x, state.enemyHero.y)
    if (d < bestD) target = { x: state.enemyHero.x, y: state.enemyHero.y, kind: 'hero' }
  }
  if (!target) return
  h.atkCooldown = HERO_LIUBEI.atkInterval
  const tgt = target as { x: number; y: number; kind: 'minion' | 'hero'; idx?: number }
  if (tgt.kind === 'minion' && tgt.idx != null) {
    const m = state.minions[tgt.idx]
    if (!m) return
    m.hp -= HERO_LIUBEI.atkDamage
    m.wobble = 1
    addFloat(state, m.x, m.y - 14, String(HERO_LIUBEI.atkDamage), '#B3E5FC')
    if (m.hp <= 0) {
      tryDropShield(state, m.x, m.y)
      killMinion(state, tgt.idx)
    }
  } else if (tgt.kind === 'hero') {
    damageEnemyHero(state, HERO_LIUBEI.atkDamage)
    addFloat(state, state.enemyHero.x, state.enemyHero.y - 14, String(HERO_LIUBEI.atkDamage), '#B3E5FC')
  }
}

function updateMinions(state: GameState, dt: number, aiMult: number) {
  const r = ENEMY_XIAOBING.radius
  const cr = CRYSTAL.radius
  for (const m of state.minions) {
    m.wobble += dt * 6
    const dir = m.friendly ? 1 : -1
    m.x += dir * ENEMY_XIAOBING.moveSpeed * dt
    if (!m.friendly && circlesOverlap(m.x, m.y, r, ALLY_CRYSTAL.x, ALLY_CRYSTAL.y, cr)) {
      state.allyCrystal.hp -= ENEMY_XIAOBING.damage * dt * 2.5
      if (state.allyCrystal.hp < 0) state.allyCrystal.hp = 0
    }
    if (m.friendly && circlesOverlap(m.x, m.y, r, ENEMY_CRYSTAL.x, ENEMY_CRYSTAL.y, cr)) {
      state.enemyCrystal.hp -= ENEMY_XIAOBING.damage * dt * 2.5
      if (state.enemyCrystal.hp < 0) state.enemyCrystal.hp = 0
    }
    if (!m.friendly && !state.hero.dead && dist(m.x, m.y, state.hero.x, state.hero.y) < 36) {
      damageHero(state, ENEMY_XIAOBING.damage * dt * aiMult)
    }
  }
  state.minions = state.minions.filter(m => m.x > -40 && m.x < BASE_W + 40)
}

function updateEnemyHero(state: GameState, dt: number, aiMult: number) {
  const e = state.enemyHero
  const level = LEVELS[state.levelIndex]
  if (!level.heroAi || !e.active || e.hp <= 0) return
  e.wobble += dt * 4
  const h = state.hero
  if (h.dead) {
    e.x += (ENEMY_HERO_SPAWN.x - e.x) * dt * 0.5
    return
  }
  const d = dist(e.x, e.y, h.x, h.y)
  const want = 160
  if (d > want) {
    const nx = (h.x - e.x) / d
    const ny = (h.y - e.y) / d
    e.x += nx * ENEMY_YUJI.moveSpeed * aiMult * dt
    e.y += ny * ENEMY_YUJI.moveSpeed * aiMult * dt
  }
  e.x = Math.max(BASE_W * 0.45, Math.min(BASE_W - 80, e.x))
  e.y = Math.max(80, Math.min(BASE_H - 80, e.y))
  if (e.skillCd <= 0 && d < 220) {
    e.skillCd = ENEMY_YUJI.skillCd / aiMult
    if (!inBush(h.x, h.y)) {
      damageHero(state, ENEMY_YUJI.skillDamage * (0.85 + 0.15 / aiMult))
      addFloat(state, h.x, h.y - 24, String(ENEMY_YUJI.skillDamage), '#FF8A80')
      addParticles(state, h.x, h.y, '#FF8A80', 6)
    }
  } else {
    e.skillCd -= dt
  }
  if (e.atkCooldown <= 0 && d < ENEMY_YUJI.atkRange) {
    e.atkCooldown = ENEMY_YUJI.atkInterval / aiMult
    if (!inBush(h.x, h.y)) {
      damageHero(state, ENEMY_YUJI.damage)
      addFloat(state, h.x, h.y - 20, String(ENEMY_YUJI.damage), '#FF8A80')
    }
  } else {
    e.atkCooldown -= dt
  }
}

function checkEnd(state: GameState) {
  if (state.enemyCrystal.hp <= 0) {
    state.phase = 'victory'
    state.stars = calcStars(state.matchTime, true)
    return
  }
  if (state.allyCrystal.hp <= 0 || state.matchTime >= MATCH.maxDurationSec) {
    state.phase = 'defeat'
    state.stars = 0
  }
}

export function updateSimulation(state: GameState, dt: number) {
  if (state.phase !== 'playing') return
  const level = LEVELS[state.levelIndex]
  const aiMult = level.aiMult

  state.matchTime += dt
  state.waveTimer -= dt
  if (state.comboTimer > 0) {
    state.comboTimer -= dt
    if (state.comboTimer <= 0) state.combo = 0
  }

  const h = state.hero
  if (h.shieldTimer > 0) {
    h.shieldTimer -= dt
    if (h.shieldTimer <= 0) h.shield = 0
  }
  if (h.dead) {
    h.respawnTimer -= dt
    if (h.respawnTimer <= 0) {
      h.dead = false
      h.hp = h.maxHp
      h.x = PLAYER_SPAWN.x
      h.y = PLAYER_SPAWN.y
    }
  } else {
    h.atkCooldown = Math.max(0, h.atkCooldown - dt)
    h.skill1Cd = Math.max(0, h.skill1Cd - dt)
    h.ultCd = Math.max(0, h.ultCd - dt)
    h.wobble = Math.max(0, h.wobble - dt * 3)
    heroAutoAttack(state)
  }

  if (state.waveTimer <= 0 && state.waveIndex < state.wavesTotal) {
    spawnWaveMinions(state)
    state.waveIndex += 1
    state.waveTimer = WAVE_SPAWN_INTERVAL
  }

  updateMinions(state, dt, aiMult)
  updateEnemyHero(state, dt, aiMult)

  for (const p of state.pickups) {
    p.life -= dt
    if (!h.dead && dist(p.x, p.y, h.x, h.y) < 40) {
      h.shield = ITEM_SHIELD.absorb
      h.shieldTimer = ITEM_SHIELD.duration
      p.life = 0
      addFloat(state, h.x, h.y - 30, '护盾!', '#81C784')
    }
  }
  state.pickups = state.pickups.filter(p => p.life > 0)

  state.particles.forEach(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
  })
  state.particles = state.particles.filter(p => p.life > 0)

  state.floatTexts.forEach(t => {
    t.y += t.vy * dt
    t.life -= dt
  })
  state.floatTexts = state.floatTexts.filter(t => t.life > 0)

  state.skillFx.forEach(f => {
    f.life -= dt
  })
  state.skillFx = state.skillFx.filter(f => f.life > 0)

  checkEnd(state)
}

export function toggleAutoFight(state: GameState) {
  state.autoFight = !state.autoFight
}