import {
  GAME_CONFIG,
  LEVELS,
  PLANT_DEFS,
  ZOMBIE_DEFS,
  canPlacePlantAt,
  gridToWorld,
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
    phase: 'prep',
    levelIndex,
    waveIndex: 0,
    totalWaves: level.waves.length,
    sun: level.startSun,
    houseHp: maxHouse,
    maxHouseHp: maxHouse,
    score: 0,
    spawnQueue: [],
    spawnTimer: 0,
    plants: [],
    zombies: [],
    peas: [],
    suns: [],
    floats: [],
    selectedPlant: PlantKind.peashooter,
    selectedPlantId: null,
    records: loadRecords(),
    runStartTime: performance.now(),
    difficultyMul: level.difficultyMul,
    plantCooldownMul: level.plantCooldownMul,
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

function addFloat(state: GameState, x: number, z: number, text: string, color: string): void {
  if (state.floats.length >= GAME_CONFIG.maxFloats) state.floats.shift()
  state.floats.push({ id: uid(), x, z, text, life: 1.2, color })
}

function addSunPickup(state: GameState, gx: number, gz: number, value: number): void {
  if (state.suns.length >= GAME_CONFIG.maxSuns) state.suns.shift()
  const w = gridToWorld(gx, gz)
  state.suns.push({
    id: uid(),
    x: w.x + (Math.random() - 0.5) * 0.3,
    z: w.z + (Math.random() - 0.5) * 0.3,
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
  addFloat(state, s.x, s.z, `+${s.value}`, '#FFD23F')
  return true
}

export function tryPlacePlant(state: GameState, kind: PlantKind, gx: number, gz: number): boolean {
  if (state.phase === 'defeat' || state.phase === 'victory') return false
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
  const w = gridToWorld(gx, gz)
  addFloat(state, w.x, w.z, `-${cost}`, '#F27052')
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
  const w = gridToWorld(p.gx, p.gz)
  addFloat(state, w.x, w.z, `+${refund}`, '#FFD23F')
  return true
}

export function resetRun(state: GameState, levelIndex?: number): void {
  const records = state.records
  const li = levelIndex ?? state.levelIndex
  Object.assign(state, createInitialState(li))
  state.records = records
}

function spawnZombie(state: GameState, kind: ZombieKind): void {
  if (state.zombies.filter(z => z.alive).length >= GAME_CONFIG.maxZombies) return
  const def = ZOMBIE_DEFS[kind]
  const hp = Math.round(def.hp * state.difficultyMul)
  const gz = Math.floor(Math.random() * GAME_CONFIG.gridH)
  const w = gridToWorld(0, gz)
  state.zombies.push({
    id: uid(),
    kind,
    gz,
    x: GAME_CONFIG.zombieStartX,
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
  void w
}

function zombieWorldZ(gz: number): number {
  return gridToWorld(0, gz).z
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
  const w = gridToWorld(plant.gx, plant.gz)
  state.peas.push({
    id: uid(),
    x: w.x + 0.35,
    z: w.z,
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
        const target = frontZombieInRow(state, p.gz, GAME_CONFIG.zombieStartX)
        if (target && target.x > gridToWorld(p.gx, p.gz).x) {
          firePea(state, p, def.damage, def.slowMul, def.slowDuration)
          p.cooldown = def.fireRate
        }
      }
    }

    if (p.kind === PlantKind.potatoMine && p.mineArmed) {
      for (const z of zombiesInRow(state, p.gz)) {
        const w = gridToWorld(p.gx, p.gz)
        if (Math.abs(z.x - w.x) < 0.45) {
          applyDamageToZombie(state, z, def.mineDamage)
          p.alive = false
          addFloat(state, w.x, w.z, '轰!', '#F27052')
          break
        }
      }
    }
  }
  state.plants = state.plants.filter(p => p.alive)
}

function onZombieDefeated(state: GameState, z: ZombieState): void {
  state.score += 15
  addFloat(state, z.x, zombieWorldZ(z.gz), '+15', '#57B8FF')
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
  const peaSpeed = 6.5
  for (const pea of state.peas) {
    if (!pea.alive) continue
    pea.x += peaSpeed * dt
    for (const z of state.zombies) {
      if (!z.alive || z.gz !== pea.gz) continue
      if (Math.abs(z.x - pea.x) < 0.35 && Math.abs(zombieWorldZ(z.gz) - pea.z) < 0.4) {
        applyDamageToZombie(state, z, pea.damage)
        if (pea.slowDuration > 0 && pea.slowMul < 1) {
          z.slowTimer = Math.max(z.slowTimer, pea.slowDuration)
          z.slowMul = Math.min(z.slowMul, pea.slowMul)
        }
        pea.alive = false
        break
      }
    }
    if (pea.x > GAME_CONFIG.zombieStartX + 1) pea.alive = false
  }
  state.peas = state.peas.filter(p => p.alive)
}

function zombieBlocked(state: GameState, z: ZombieState): PlantState | null {
  const def = ZOMBIE_DEFS[z.kind]
  for (const p of state.plants) {
    if (!p.alive || p.gz !== z.gz) continue
    const px = gridToWorld(p.gx, p.gz).x
    if (Math.abs(z.x - px) < 0.42) {
      if (def.canJumpNut && p.kind === PlantKind.wallnut) {
        p.alive = false
        z.x -= 0.2
        return null
      }
      return p
    }
  }
  return null
}

function updateZombies(state: GameState, dt: number): void {
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
    const move = (z.baseSpeed * z.slowMul * GAME_CONFIG.cellSize * dt) / 2
    z.x -= move

    if (z.x <= GAME_CONFIG.zombieReachHouseX) {
      z.alive = false
      state.houseHp -= 8
      addFloat(state, z.x, zombieWorldZ(z.gz), '-8', '#F27052')
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
      const gx = Math.floor(Math.random() * (GAME_CONFIG.gridW - 2))
      const gz = Math.floor(Math.random() * GAME_CONFIG.gridH)
      addSunPickup(state, gx, gz, GAME_CONFIG.sunFallValue)
    }
  }
}

function checkWaveEnd(state: GameState): void {
  if (state.phase !== 'wave') return
  if (state.spawnQueue.length > 0) return
  if (state.zombies.some(z => z.alive)) return

  state.waveIndex++
  if (state.waveIndex >= state.totalWaves) {
    state.phase = 'victory'
    persistRecords(state)
    return
  }
  state.phase = 'prep'
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

export function updateSimulation(state: GameState, dt: number): void {
  if (state.phase === 'defeat' || state.phase === 'victory') return

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

  if (state.houseHp <= 0) {
    state.houseHp = 0
    state.phase = 'defeat'
  }

  checkWaveEnd(state)
}

export function zombieWorldPos(z: ZombieState): { x: number; y: number; z: number } {
  return { x: z.x, y: 0.35, z: zombieWorldZ(z.gz) }
}

export function pickSunAt(state: GameState, x: number, z: number): number | null {
  let best: SunPickup | null = null
  let bestD = 0.55
  for (const s of state.suns) {
    if (!s.alive) continue
    const d = Math.hypot(s.x - x, s.z - z)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return best?.id ?? null
}