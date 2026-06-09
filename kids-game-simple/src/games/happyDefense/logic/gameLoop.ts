import {
  BUFF_OPTIONS,
  ENEMY_DEFS,
  GAME_CONFIG,
  TOWER_DEFS,
  WAVES,
  cellKindAt,
  gridToWorld,
} from '../config'
import type {
  BuffKind,
  EnemyKind,
  EnemyState,
  FloatText,
  GameState,
  PendingBuff,
  ProjectileState,
  RunRecords,
  TowerKind,
  TowerState,
  WavePhase,
} from '../types'
import { advancePathT, buildWorldPath, initPathMetrics, positionOnPath } from './path'
import { loadRecords, saveRecords } from './storage'

let nextId = 1
function uid(): number {
  return nextId++
}

export const worldPath = buildWorldPath()
initPathMetrics(worldPath)

export function createInitialState(): GameState {
  nextId = 1
  return {
    phase: 'prep',
    waveIndex: 0,
    totalWaves: GAME_CONFIG.totalWaves,
    gold: GAME_CONFIG.startGold,
    baseHp: GAME_CONFIG.baseHp,
    maxBaseHp: GAME_CONFIG.baseHp,
    score: 0,
    combo: 0,
    comboTimer: 0,
    spawnQueue: [],
    spawnTimer: 0,
    runStartTime: performance.now(),
    waveClearTime: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    floats: [],
    activeBuffs: [],
    pendingBuffChoices: [],
    damageBuffMul: 1,
    selectedTower: 'popcorn',
    selectedTowerId: null,
    records: loadRecords(),
    towersBuilt: 0,
  }
}

function waveHpMul(waveIndex: number): number {
  return 1 + waveIndex * 0.22
}

function buildSpawnQueue(waveIndex: number): EnemyKind[] {
  const spec = WAVES[waveIndex]
  if (!spec) return []
  const q: EnemyKind[] = []
  for (const g of spec.groups) {
    for (let i = 0; i < g.count; i++) q.push(g.kind)
  }
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[q[i], q[j]] = [q[j]!, q[i]!]
  }
  return q
}

export function startNextWave(state: GameState): boolean {
  if (state.phase !== 'prep' && state.phase !== 'buffPick') return false
  if (state.waveIndex >= state.totalWaves) return false
  state.spawnQueue = buildSpawnQueue(state.waveIndex)
  state.spawnTimer = 0.2
  state.phase = 'spawning'
  return true
}

function spawnEnemy(state: GameState, kind: EnemyKind): void {
  if (state.enemies.filter(e => e.alive).length >= GAME_CONFIG.maxEnemies) return
  const def = ENEMY_DEFS[kind]
  const mul = waveHpMul(state.waveIndex)
  const hp = Math.round(def.hp * mul)
  state.enemies.push({
    id: uid(),
    kind,
    pathT: 0,
    hp,
    maxHp: hp,
    speed: def.speed,
    baseSpeed: def.speed,
    slowTimer: 0,
    freezeTimer: 0,
    reward: def.reward,
    scoreValue: def.score,
    alive: true,
  })
}

function towerAt(state: GameState, gx: number, gz: number): TowerState | undefined {
  return state.towers.find(t => t.gx === gx && t.gz === gz)
}

export function canBuildAt(state: GameState, gx: number, gz: number): boolean {
  if (cellKindAt(gx, gz) !== 'build') return false
  return !towerAt(state, gx, gz)
}

export function towerBuildCost(kind: TowerKind): number {
  return TOWER_DEFS[kind].cost
}

export function towerSellValue(tower: TowerState): number {
  const def = TOWER_DEFS[tower.kind]
  let spent = def.cost
  if (tower.level >= 2) spent += def.upgradeCost[0]
  if (tower.level >= 3) spent += def.upgradeCost[1]
  return Math.floor(spent * GAME_CONFIG.sellRefundRatio)
}

export function towerUpgradeCost(tower: TowerState): number | null {
  if (tower.level >= 3) return null
  const def = TOWER_DEFS[tower.kind]
  return def.upgradeCost[tower.level - 1] ?? null
}

export function tryPlaceTower(state: GameState, kind: TowerKind, gx: number, gz: number): boolean {
  if (state.phase === 'defeat' || state.phase === 'victory') return false
  if (!canBuildAt(state, gx, gz)) return false
  const cost = towerBuildCost(kind)
  if (state.gold < cost) return false
  state.gold -= cost
  state.towers.push({ id: uid(), kind, gx, gz, level: 1, cooldown: 0 })
  state.towersBuilt++
  const w = gridToWorld(gx, gz)
  addFloat(state, w.x, w.z, `-${cost}`, '#FFD700')
  return true
}

export function tryUpgradeTower(state: GameState, towerId: number): boolean {
  const tower = state.towers.find(t => t.id === towerId)
  if (!tower) return false
  const cost = towerUpgradeCost(tower)
  if (cost == null || state.gold < cost) return false
  state.gold -= cost
  tower.level = (tower.level + 1) as 1 | 2 | 3
  const w = gridToWorld(tower.gx, tower.gz)
  addFloat(state, w.x, w.z, `升级 Lv${tower.level}`, '#7CFC00')
  return true
}

export function trySellTower(state: GameState, towerId: number): boolean {
  const idx = state.towers.findIndex(t => t.id === towerId)
  if (idx < 0) return false
  const tower = state.towers[idx]!
  const refund = towerSellValue(tower)
  state.gold += refund
  state.towers.splice(idx, 1)
  if (state.selectedTowerId === towerId) state.selectedTowerId = null
  const w = gridToWorld(tower.gx, tower.gz)
  addFloat(state, w.x, w.z, `+${refund}`, '#FFD700')
  return true
}

export function resetRun(state: GameState): void {
  const records = state.records
  Object.assign(state, createInitialState())
  state.records = records
}

function addFloat(state: GameState, x: number, z: number, text: string, color: string): void {
  if (state.floats.length >= GAME_CONFIG.maxFloats) state.floats.shift()
  state.floats.push({ id: uid(), x, z, text, life: 1.2, color })
}

function comboMul(state: GameState): number {
  const c = state.combo
  if (c < 3) return 1
  if (c < 8) return 1.5
  if (c < 15) return 2
  return GAME_CONFIG.comboScoreMulCap
}

function onEnemyKilled(state: GameState, enemy: EnemyState): void {
  state.gold += enemy.reward
  state.comboTimer = GAME_CONFIG.comboWindowSec
  state.combo++
  const pts = Math.round(enemy.scoreValue * comboMul(state))
  state.score += pts
  const pos = positionOnPath(worldPath, enemy.pathT)
  addFloat(state, pos.x, pos.z, `+${pts}`, '#FF69B4')
  addFloat(state, pos.x, pos.z - 0.3, `+${enemy.reward}金`, '#FFD700')
}

function damageEnemy(state: GameState, enemy: EnemyState, dmg: number): void {
  if (!enemy.alive) return
  enemy.hp -= dmg
  if (enemy.hp <= 0) {
    enemy.alive = false
    onEnemyKilled(state, enemy)
  }
}

function towerStats(tower: TowerState) {
  const def = TOWER_DEFS[tower.kind]
  const lvMul = 1 + (tower.level - 1) * 0.45
  return {
    range: def.range + (tower.level - 1) * 0.25,
    fireRate: def.fireRate * (1 - (tower.level - 1) * 0.08),
    damage: def.damage * lvMul,
    splashRadius: def.splashRadius * (1 + (tower.level - 1) * 0.2),
    slowDuration: def.slowDuration,
    freezeDuration: def.freezeDuration,
    chainCount: def.chainCount + (tower.level >= 3 ? 1 : 0),
    pierce: def.pierce + (tower.level >= 2 ? 1 : 0),
  }
}

function distXZ(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(ax - bx, az - bz)
}

function findTarget(state: GameState, tx: number, tz: number, range: number): EnemyState | null {
  let best: EnemyState | null = null
  let bestT = -1
  for (const e of state.enemies) {
    if (!e.alive) continue
    const p = positionOnPath(worldPath, e.pathT)
    const d = distXZ(tx, tz, p.x, p.z)
    if (d <= range && e.pathT > bestT) {
      bestT = e.pathT
      best = e
    }
  }
  return best
}

function fireFromTower(state: GameState, tower: TowerState, stats: ReturnType<typeof towerStats>): void {
  const w = gridToWorld(tower.gx, tower.gz)
  const target = findTarget(state, w.x, w.z, stats.range)
  if (!target) return
  if (state.projectiles.length >= GAME_CONFIG.maxProjectiles) return
  const tp = positionOnPath(worldPath, target.pathT)
  state.projectiles.push({
    id: uid(),
    kind: tower.kind,
    x: w.x,
    z: w.z,
    targetId: target.id,
    damage: stats.damage * state.damageBuffMul,
    speed: 9,
    pierceLeft: stats.pierce,
    chainLeft: stats.chainCount,
    splashRadius: stats.splashRadius,
    slowDuration: stats.slowDuration,
    freezeDuration: stats.freezeDuration,
    alive: true,
  })
  if (tower.kind === 'lightning') {
    applyLightningHit(state, target, stats.damage * state.damageBuffMul, stats.chainCount, new Set())
  }
}

function applyLightningHit(
  state: GameState,
  enemy: EnemyState,
  dmg: number,
  chainLeft: number,
  hit: Set<number>,
): void {
  if (!enemy.alive || hit.has(enemy.id)) return
  hit.add(enemy.id)
  damageEnemy(state, enemy, dmg)
  if (chainLeft <= 0) return
  const p = positionOnPath(worldPath, enemy.pathT)
  let next: EnemyState | null = null
  let bestD = 2.5
  for (const e of state.enemies) {
    if (!e.alive || hit.has(e.id)) continue
    const ep = positionOnPath(worldPath, e.pathT)
    const d = distXZ(p.x, p.z, ep.x, ep.z)
    if (d < bestD) {
      bestD = d
      next = e
    }
  }
  if (next) applyLightningHit(state, next, dmg * 0.85, chainLeft - 1, hit)
}

function resolveProjectileHit(state: GameState, proj: ProjectileState, enemy: EnemyState): void {
  if (proj.kind === 'bubble') {
    damageEnemy(state, enemy, proj.damage)
    enemy.slowTimer = Math.max(enemy.slowTimer, proj.slowDuration)
    enemy.freezeTimer = Math.max(enemy.freezeTimer, proj.freezeDuration)
    proj.alive = false
    return
  }
  if (proj.splashRadius > 0) {
    const p = positionOnPath(worldPath, enemy.pathT)
    for (const e of state.enemies) {
      if (!e.alive) continue
      const ep = positionOnPath(worldPath, e.pathT)
      if (distXZ(p.x, p.z, ep.x, ep.z) <= proj.splashRadius) damageEnemy(state, e, proj.damage)
    }
    proj.alive = false
    return
  }
  damageEnemy(state, enemy, proj.damage)
  if (proj.pierceLeft > 0) {
    proj.pierceLeft--
    proj.targetId = -1
  } else {
    proj.alive = false
  }
}

function updateProjectiles(state: GameState, dt: number): void {
  for (const proj of state.projectiles) {
    if (!proj.alive) continue
    if (proj.kind === 'lightning') {
      proj.alive = false
      continue
    }
    let target = state.enemies.find(e => e.id === proj.targetId && e.alive)
    if (!target && proj.pierceLeft > 0) {
      target =
        state.enemies
          .filter(e => e.alive)
          .sort((a, b) => b.pathT - a.pathT)[0] ?? undefined
    }
    if (!target) {
      proj.alive = false
      continue
    }
    const tp = positionOnPath(worldPath, target.pathT)
    const dx = tp.x - proj.x
    const dz = tp.z - proj.z
    const d = Math.hypot(dx, dz)
    if (d < 0.35) {
      resolveProjectileHit(state, proj, target)
      continue
    }
    const step = proj.speed * dt
    proj.x += (dx / d) * step
    proj.z += (dz / d) * step
  }
  state.projectiles = state.projectiles.filter(p => p.alive)
}

function updateTowers(state: GameState, dt: number): void {
  for (const tower of state.towers) {
    tower.cooldown -= dt
    const stats = towerStats(tower)
    if (tower.cooldown <= 0) {
      const w = gridToWorld(tower.gx, tower.gz)
      if (findTarget(state, w.x, w.z, stats.range)) {
        fireFromTower(state, tower, stats)
        tower.cooldown = stats.fireRate
      }
    }
  }
}

function updateEnemies(state: GameState, dt: number): void {
  for (const e of state.enemies) {
    if (!e.alive) continue
    if (e.freezeTimer > 0) {
      e.freezeTimer -= dt
      continue
    }
    let speed = e.baseSpeed
    if (e.slowTimer > 0) {
      e.slowTimer -= dt
      speed *= 0.45
    }
    const globalSlow = state.activeBuffs.some(b => b.kind === 'slowAll')
    if (globalSlow) speed *= 0.35
    e.pathT = advancePathT(worldPath, e.pathT, speed, dt)
    if (e.pathT >= 1) {
      e.alive = false
      const def = ENEMY_DEFS[e.kind]
      state.baseHp -= def.leakDamage
      addFloat(state, gridToWorld(11, 7).x, gridToWorld(11, 7).z, `-${def.leakDamage}血`, '#FF6B6B')
    }
  }
  state.enemies = state.enemies.filter(e => e.alive)
}

function rollBuffChoices(): PendingBuff[] {
  const pool = [...BUFF_OPTIONS]
  const picks: PendingBuff[] = []
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    const opt = pool.splice(idx, 1)[0]!
    picks.push({ kind: opt.kind, label: opt.label })
  }
  return picks
}

export function applyBuffChoice(state: GameState, kind: BuffKind): void {
  const opt = BUFF_OPTIONS.find(b => b.kind === kind)
  if (!opt) return
  if (kind === 'clearScreen') {
    for (const e of state.enemies) {
      if (!e.alive) continue
      onEnemyKilled(state, e)
      e.alive = false
    }
    state.enemies = []
  } else if (kind === 'goldRain') {
    state.gold += 150 + state.waveIndex * 40
    addFloat(state, 0, 0, '金币雨 +', '#FFD700')
  } else if (opt.duration > 0) {
    state.activeBuffs.push({ kind, timeLeft: opt.duration })
    if (kind === 'doubleDamage') state.damageBuffMul = 2
  }
  state.pendingBuffChoices = []
  state.phase = 'prep'
}

export function skipBuffPick(state: GameState): void {
  state.pendingBuffChoices = []
  state.phase = 'prep'
}

function updateBuffs(state: GameState, dt: number): void {
  for (const b of state.activeBuffs) {
    b.timeLeft -= dt
  }
  const hadDouble = state.activeBuffs.some(b => b.kind === 'doubleDamage')
  state.activeBuffs = state.activeBuffs.filter(b => b.timeLeft > 0)
  if (hadDouble && !state.activeBuffs.some(b => b.kind === 'doubleDamage')) {
    state.damageBuffMul = 1
  }
}

function checkWaveEnd(state: GameState): void {
  if (state.phase !== 'spawning' && state.phase !== 'fighting') return
  if (state.spawnQueue.length > 0 || state.enemies.some(e => e.alive)) {
    if (state.spawnQueue.length === 0 && state.enemies.length > 0) state.phase = 'fighting'
    return
  }
  state.waveIndex++
  if (state.waveIndex >= state.totalWaves) {
    state.phase = 'victory'
    state.waveClearTime = (performance.now() - state.runStartTime) / 1000
    return
  }
  state.pendingBuffChoices = rollBuffChoices()
  state.phase = 'buffPick'
}

export function computeGrade(state: GameState): 'S' | 'A' | 'B' | 'C' {
  if (state.phase !== 'victory') return 'C'
  const hpRatio = state.baseHp / state.maxBaseHp
  const time = state.waveClearTime
  if (hpRatio >= 0.85 && time < 180) return 'S'
  if (hpRatio >= 0.6 && time < 240) return 'A'
  if (hpRatio >= 0.35) return 'B'
  return 'C'
}

export function persistRecords(state: GameState): RunRecords {
  const r = { ...state.records }
  if (state.score > r.bestScore) r.bestScore = state.score
  if (state.phase === 'victory') {
    const t = state.waveClearTime
    if (r.fastestClearSec === 0 || t < r.fastestClearSec) r.fastestClearSec = t
    if (computeGrade(state) === 'S') r.perfectClears++
  }
  state.records = r
  saveRecords(r)
  return r
}

export function updateSimulation(state: GameState, dt: number): void {
  if (state.phase === 'defeat' || state.phase === 'victory') return

  state.comboTimer -= dt
  if (state.comboTimer <= 0) state.combo = 0

  updateBuffs(state, dt)

  const wave = WAVES[state.waveIndex]
  if ((state.phase === 'spawning' || state.phase === 'fighting') && wave) {
    state.spawnTimer -= dt
    while (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
      spawnEnemy(state, state.spawnQueue.shift()!)
      state.spawnTimer += wave.spawnInterval
    }
    if (state.spawnQueue.length === 0 && state.enemies.length > 0) state.phase = 'fighting'
  }

  updateEnemies(state, dt)
  updateTowers(state, dt)
  updateProjectiles(state, dt)

  for (const f of state.floats) f.life -= dt
  state.floats = state.floats.filter(f => f.life > 0)

  if (state.baseHp <= 0) {
    state.baseHp = 0
    state.phase = 'defeat'
  }

  checkWaveEnd(state)
}

export function enemyWorldPos(enemy: EnemyState): { x: number; z: number; y: number } {
  const p = positionOnPath(worldPath, enemy.pathT)
  const fly = enemy.kind === 'flyer' || enemy.kind === 'boss' ? 0.55 : 0.25
  return { x: p.x, z: p.z, y: fly }
}