import {
  BASE_W,
  GAME_CONFIG,
  LEVELS,
  PLANT_DEFS,
  ZOMBIE_DEFS,
  canPlacePlantAt,
  starsForHouseHp,
} from '../config'
import {
  PlantKind,
  type GameState,
  type LevelRecords,
  type PeaProjectile,
  type PlantState,
  type SunPickup,
  type ZombieKind,
  type ZombieState,
} from '../types'
import {
  gridCenterPx,
  plantMouthX,
  rowCenterY,
  zombieHouseX,
  zombieSpawnX,
} from './coords'
import type { Pzd2dSfx } from './events'
import { loadRecords, saveRecords } from './storage'

let nextId = 1
function uid(): number {
  return nextId++
}

let sunFallTimer = GAME_CONFIG.sunFallInterval

export function createInitialState(levelIndex: number): GameState {
  nextId = 1
  sunFallTimer = GAME_CONFIG.sunFallInterval
  const level = LEVELS[levelIndex - 1] ?? LEVELS[0]!
  const maxHouse = Math.round(GAME_CONFIG.houseBaseHp * (1 + level.houseHpBonus))
  return {
    phase: 'ui',
    levelIndex,
    waveIndex: 0,
    totalWaves: level.waves.length,
    sun: level.startSun,
    houseHp: maxHouse,
    maxHouseHp: maxHouse,
    score: 0,
    spawnQueue: [],
    spawnTimer: 0,
    prepTimer: GAME_CONFIG.prepAutoStartSec,
    plants: [],
    zombies: [],
    peas: [],
    suns: [],
    floats: [],
    particles: [],
    pendingSfx: [],
    selectedPlant: PlantKind.sunflower,
    selectedPlantId: null,
    records: loadRecords(),
    runStartTime: performance.now(),
    difficultyMul: level.difficultyMul,
    plantCooldownMul: level.plantCooldownMul,
    resultReady: false,
  }
}

function currentLevel(state: GameState) {
  return LEVELS[state.levelIndex - 1] ?? LEVELS[0]!
}

function buildSpawnQueue(state: GameState): ZombieKind[] {
  const wave = currentLevel(state).waves[state.waveIndex]
  if (!wave) return []
  const q: ZombieKind[] = []
  for (const g of wave.groups) {
    for (let i = 0; i < g.count; i++) q.push(g.kind)
  }
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[q[i], q[j]] = [q[j]!, q[i]!]
  }
  return q
}

export function startNextWave(state: GameState): boolean {
  if (state.phase !== 'prep') return false
  if (state.waveIndex >= state.totalWaves) return false
  state.spawnQueue = buildSpawnQueue(state)
  state.spawnTimer = 0.5
  state.phase = 'wave'
  state.prepTimer = 0
  return true
}

function plantAt(state: GameState, gx: number, gz: number): PlantState | undefined {
  return state.plants.find(p => p.alive && p.gx === gx && p.gz === gz)
}

export function canBuildAt(state: GameState, gx: number, gz: number): boolean {
  if (!canPlacePlantAt(gx, gz)) return false
  return !plantAt(state, gx, gz)
}

export function plantBuildCost(kind: PlantKind): number {
  return PLANT_DEFS[kind].cost
}

export function plantSellRefund(kind: PlantKind): number {
  return Math.floor(PLANT_DEFS[kind].cost * GAME_CONFIG.sellRefundRatio)
}

function queueSfx(state: GameState, kind: Pzd2dSfx): void {
  state.pendingSfx.push(kind)
}

function burstParticles(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    if (state.particles.length >= GAME_CONFIG.maxParticles) state.particles.shift()
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const sp = 40 + Math.random() * 90
    state.particles.push({
      id: uid(),
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 20,
      life: 0.35 + Math.random() * 0.35,
      color,
      size: 3 + Math.random() * 4,
    })
  }
}

function addFloat(state: GameState, x: number, y: number, text: string, color: string): void {
  if (state.floats.length >= GAME_CONFIG.maxFloats) state.floats.shift()
  state.floats.push({ id: uid(), x, y, text, life: 1.2, color })
}

/** 关卡选择后进入 prep */
export function startLevelFromUi(state: GameState, levelIndex: number): boolean {
  if (state.phase !== 'ui') return false
  const li = Math.max(1, Math.min(levelIndex, GAME_CONFIG.totalLevels))
  if (li > state.records.unlockedLevel) return false
  const next = createInitialState(li)
  next.records = state.records
  next.phase = 'prep'
  next.prepTimer = GAME_CONFIG.prepAutoStartSec
  Object.assign(state, next)
  return true
}

function addSunPickup(state: GameState, gx: number, gz: number, value: number): void {
  if (state.suns.length >= GAME_CONFIG.maxSuns) state.suns.shift()
  const c = gridCenterPx(gx, gz)
  state.suns.push({
    id: uid(),
    x: c.x + (Math.random() - 0.5) * 24,
    y: c.y + (Math.random() - 0.5) * 24,
    value,
    life: 12,
    alive: true,
  })
}

export function tryCollectSun(state: GameState, sunId: number): boolean {
  const s = state.suns.find(x => x.id === sunId && x.alive)
  if (!s) return false
  s.alive = false
  state.sun += s.value
  addFloat(state, s.x, s.y, `+${s.value}`, '#FFD23F')
  queueSfx(state, 'sun_collect')
  return true
}

export function tryPlacePlant(state: GameState, kind: PlantKind, gx: number, gz: number): boolean {
  if (state.phase === 'ui' || state.phase === 'defeat' || state.phase === 'victory') return false
  if (!canBuildAt(state, gx, gz)) return false
  const cost = plantBuildCost(kind)
  if (state.sun < cost) return false
  const def = PLANT_DEFS[kind]
  state.sun -= cost
  state.plants.push({
    id: uid(),
    kind,
    gx,
    gz,
    hp: def.maxHp,
    maxHp: def.maxHp,
    cooldown: 0,
    sunTimer: def.sunInterval > 0 ? def.sunInterval * 0.5 : 0,
    mineArmed: kind === PlantKind.potatoMine ? false : true,
    alive: true,
  })
  const c = gridCenterPx(gx, gz)
  addFloat(state, c.x, c.y, `-${cost}`, '#F27052')
  queueSfx(state, 'plant_place')
  return true
}

export function tryRemovePlant(state: GameState, plantId: number): boolean {
  const idx = state.plants.findIndex(p => p.id === plantId && p.alive)
  if (idx < 0) return false
  const p = state.plants[idx]!
  const refund = plantSellRefund(p.kind)
  state.sun += refund
  p.alive = false
  state.plants.splice(idx, 1)
  if (state.selectedPlantId === plantId) state.selectedPlantId = null
  const c = gridCenterPx(p.gx, p.gz)
  addFloat(state, c.x, c.y, `+${refund}`, '#FFD23F')
  return true
}

export function resetRun(state: GameState, levelIndex?: number): void {
  const records = state.records
  const li = levelIndex ?? state.levelIndex
  Object.assign(state, createInitialState(li))
  state.records = records
  state.phase = 'prep'
  state.prepTimer = GAME_CONFIG.prepAutoStartSec
}

/** 结算后返回关卡选择 */
export function returnToLevelSelect(state: GameState): void {
  const records = state.records
  Object.assign(state, createInitialState(1))
  state.records = records
  state.phase = 'ui'
}

function spawnZombie(state: GameState, kind: ZombieKind): void {
  if (state.zombies.filter(z => z.alive).length >= GAME_CONFIG.maxZombies) return
  const def = ZOMBIE_DEFS[kind]
  const hp = Math.round(def.hp * state.difficultyMul)
  const gz = Math.floor(Math.random() * GAME_CONFIG.gridH)
  state.zombies.push({
    id: uid(),
    kind,
    gz,
    x: zombieSpawnX(),
    hp,
    maxHp: hp,
    speed: def.speed,
    baseSpeed: def.speed,
    slowMul: 1,
    slowTimer: 0,
    attackTimer: 0,
    eatingPlantId: null,
    alive: true,
  })
}

function zombiesInRow(state: GameState, gz: number): ZombieState[] {
  return state.zombies.filter(z => z.alive && z.gz === gz)
}

function frontZombieInRow(state: GameState, gz: number, maxX: number): ZombieState | null {
  let best: ZombieState | null = null
  for (const z of zombiesInRow(state, gz)) {
    if (z.x <= maxX && (!best || z.x < best.x)) best = z
  }
  return best
}

function firePea(
  state: GameState,
  plant: PlantState,
  damage: number,
  slowMul: number,
  slowDuration: number,
): void {
  if (state.peas.length >= GAME_CONFIG.maxPeas) return
  const y = rowCenterY(plant.gz)
  state.peas.push({
    id: uid(),
    x: plantMouthX(plant.gx),
    y,
    gz: plant.gz,
    damage,
    slowMul,
    slowDuration,
    alive: true,
  })
}

function updatePlants(state: GameState, dt: number): void {
  for (const p of state.plants) {
    if (!p.alive) continue
    const def = PLANT_DEFS[p.kind]

    if (p.kind === PlantKind.potatoMine && !p.mineArmed) {
      p.cooldown += dt
      if (p.cooldown >= def.mineDelay) p.mineArmed = true
      continue
    }

    if (def.sunInterval > 0 && def.sunProduce > 0) {
      p.sunTimer -= dt
      if (p.sunTimer <= 0) {
        p.sunTimer = def.sunInterval
        addSunPickup(state, p.gx, p.gz, def.sunProduce)
      }
    }

    if (def.damage > 0 && def.fireRate > 0) {
      p.cooldown -= dt * state.plantCooldownMul
      if (p.cooldown <= 0) {
        const target = frontZombieInRow(state, p.gz, zombieSpawnX())
        const px = plantMouthX(p.gx)
        if (target && target.x > px) {
          firePea(state, p, def.damage, def.slowMul, def.slowDuration)
          p.cooldown = def.fireRate
        }
      }
    }

    if (p.kind === PlantKind.potatoMine && p.mineArmed) {
      const cx = gridCenterPx(p.gx, p.gz).x
      for (const z of zombiesInRow(state, p.gz)) {
        if (Math.abs(z.x - cx) < GAME_CONFIG.cellPx * 0.45) {
          applyDamageToZombie(state, z, def.mineDamage)
          p.alive = false
          addFloat(state, cx, rowCenterY(p.gz), '轰!', '#F27052')
          break
        }
      }
    }
  }
  state.plants = state.plants.filter(p => p.alive)
}

function onZombieDefeated(state: GameState, z: ZombieState): void {
  state.score += 15
  addFloat(state, z.x, rowCenterY(z.gz), '+15', '#57B8FF')
  queueSfx(state, 'zombie_kill')
  burstParticles(state, z.x, rowCenterY(z.gz), '#94B49F', 12)
}

function applyDamageToZombie(state: GameState, z: ZombieState, rawDmg: number): void {
  const def = ZOMBIE_DEFS[z.kind]
  const dmg = rawDmg * def.armorMul
  z.hp -= dmg
  if (z.hp <= 0) {
    z.alive = false
    onZombieDefeated(state, z)
  }
}

function updatePeas(state: GameState, dt: number): void {
  const peaSpeed = GAME_CONFIG.peaSpeed
  const hitR = GAME_CONFIG.cellPx * 0.28
  for (const pea of state.peas) {
    if (!pea.alive) continue
    pea.x += peaSpeed * dt
    for (const z of state.zombies) {
      if (!z.alive || z.gz !== pea.gz) continue
      if (Math.abs(z.x - pea.x) < hitR) {
        applyDamageToZombie(state, z, pea.damage)
        if (pea.slowDuration > 0 && pea.slowMul < 1) {
          z.slowTimer = Math.max(z.slowTimer, pea.slowDuration)
          z.slowMul = Math.min(z.slowMul, pea.slowMul)
        }
        queueSfx(state, 'pea_hit')
        pea.alive = false
        break
      }
    }
    if (pea.x > zombieSpawnX() + GAME_CONFIG.cellPx) pea.alive = false
  }
  state.peas = state.peas.filter(p => p.alive)
}

function zombieBlocked(state: GameState, z: ZombieState): PlantState | null {
  const def = ZOMBIE_DEFS[z.kind]
  for (const p of state.plants) {
    if (!p.alive || p.gz !== z.gz) continue
    const px = gridCenterPx(p.gx, p.gz).x
    if (Math.abs(z.x - px) < GAME_CONFIG.cellPx * 0.42) {
      if (def.canJumpNut && p.kind === PlantKind.wallnut) {
        p.alive = false
        z.x -= GAME_CONFIG.cellPx * 0.25
        return null
      }
      return p
    }
  }
  return null
}

function updateZombies(state: GameState, dt: number): void {
  const houseX = zombieHouseX()
  for (const z of state.zombies) {
    if (!z.alive) continue
    if (z.slowTimer > 0) {
      z.slowTimer -= dt
      if (z.slowTimer <= 0) z.slowMul = 1
    }

    const blocker = zombieBlocked(state, z)
    if (blocker) {
      z.eatingPlantId = blocker.id
      z.attackTimer += dt
      const dps = ZOMBIE_DEFS[z.kind].attackDps
      if (dps > 0 && z.attackTimer >= 0.2) {
        blocker.hp -= dps * z.attackTimer
        z.attackTimer = 0
        if (blocker.hp <= 0) {
          blocker.alive = false
          z.eatingPlantId = null
        }
      }
      continue
    }
    z.eatingPlantId = null
    z.attackTimer = 0
    z.x -= z.baseSpeed * z.slowMul * dt

    if (z.x <= houseX) {
      z.alive = false
      state.houseHp -= GAME_CONFIG.leakDamage
      addFloat(state, houseX, rowCenterY(z.gz), `-${GAME_CONFIG.leakDamage}`, '#F27052')
      queueSfx(state, 'house_hurt')
    }
  }
  state.plants = state.plants.filter(p => p.alive)
  state.zombies = state.zombies.filter(z => z.alive)
}

function updateSuns(state: GameState, dt: number): void {
  for (const s of state.suns) {
    if (!s.alive) continue
    s.life -= dt
    if (s.life <= 0) s.alive = false
  }
  state.suns = state.suns.filter(s => s.alive)

  if (state.phase === 'wave' || state.phase === 'prep') {
    sunFallTimer -= dt
    if (sunFallTimer <= 0) {
      sunFallTimer = GAME_CONFIG.sunFallInterval
      const gx = Math.floor(Math.random() * 5)
      const gz = Math.floor(Math.random() * GAME_CONFIG.gridH)
      addSunPickup(state, gx, gz, GAME_CONFIG.sunFallValue)
    }
  }
}

function checkWaveEnd(state: GameState): void {
  if (state.phase !== 'wave') return
  if (state.spawnQueue.length > 0) return
  if (state.zombies.some(z => z.alive)) return

  queueSfx(state, 'wave_clear')
  burstParticles(state, BASE_W * 0.5, 120, '#FFD23F', 20)

  state.waveIndex++
  if (state.waveIndex >= state.totalWaves) {
    state.phase = 'victory'
    state.resultReady = true
    queueSfx(state, 'win')
    persistRecords(state)
    return
  }
  state.phase = 'prep'
  state.prepTimer = GAME_CONFIG.prepAutoStartSec
}

export function computeStars(state: GameState): 0 | 1 | 2 | 3 {
  if (state.phase !== 'victory') return 0
  return starsForHouseHp(state.houseHp / state.maxHouseHp)
}

export function persistRecords(state: GameState): LevelRecords {
  const r = { ...state.records, starsByLevel: { ...state.records.starsByLevel } }
  if (state.score > r.bestScore) r.bestScore = state.score
  if (state.phase === 'victory') {
    const stars = computeStars(state)
    const prev = r.starsByLevel[state.levelIndex] ?? 0
    if (stars > prev) r.starsByLevel[state.levelIndex] = stars
    if (state.levelIndex >= r.unlockedLevel && state.levelIndex < GAME_CONFIG.totalLevels) {
      r.unlockedLevel = Math.max(r.unlockedLevel, state.levelIndex + 1)
    }
  }
  state.records = r
  saveRecords(r)
  return r
}

function updateParticles(state: GameState, dt: number): void {
  for (const p of state.particles) {
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 120 * dt
  }
  state.particles = state.particles.filter(p => p.life > 0)
}

export function updateSimulation(state: GameState, dt: number): void {
  if (state.phase === 'ui' || state.phase === 'defeat' || state.phase === 'victory') return

  if (state.phase === 'prep') {
    state.prepTimer -= dt
    if (state.prepTimer <= 0) startNextWave(state)
  }

  const wave = currentLevel(state).waves[state.waveIndex]
  if (state.phase === 'wave' && wave) {
    state.spawnTimer -= dt
    while (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
      spawnZombie(state, state.spawnQueue.shift()!)
      state.spawnTimer += wave.spawnInterval
    }
  }

  updateSuns(state, dt)
  updatePlants(state, dt)
  updatePeas(state, dt)
  updateZombies(state, dt)

  for (const f of state.floats) f.life -= dt
  state.floats = state.floats.filter(f => f.life > 0)
  updateParticles(state, dt)

  if (state.houseHp <= 0) {
    state.houseHp = 0
    state.phase = 'defeat'
    state.resultReady = true
    queueSfx(state, 'lose')
    persistRecords(state)
  }

  checkWaveEnd(state)
}

export function pickSunAt(state: GameState, lx: number, ly: number): number | null {
  let best: SunPickup | null = null
  let bestD = 44
  for (const s of state.suns) {
    if (!s.alive) continue
    const d = Math.hypot(s.x - lx, s.y - ly)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return best?.id ?? null
}

export function plantAtScreen(state: GameState, gx: number, gz: number): PlantState | undefined {
  return plantAt(state, gx, gz)
}