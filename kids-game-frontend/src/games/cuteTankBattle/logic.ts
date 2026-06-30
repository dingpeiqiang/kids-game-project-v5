import {
  ENTITY,
  GRID_COLS,
  GRID_ROWS,
  starsFromBaseRatio,
} from './config'
import {
  aabbOverlap,
  baseAabb,
  bulletAabb,
  resolveTankWall,
  tankAabb,
  tankBlocksCell,
  wallAabb,
} from './collision'
import {
  applyExtraWalls,
  buildWallsFromMap,
  cellCenter,
  cloneBaseMap,
  enemySpawnCells,
  findSpawn,
  getWaveConfig,
} from './map'
import type { Dir, GameState, TankEntity, BulletEntity } from './types'

const DIRS: Dir[] = ['up', 'down', 'left', 'right']

function dirVector(d: Dir): { dx: number; dy: number } {
  switch (d) {
    case 'up':
      return { dx: 0, dy: -1 }
    case 'down':
      return { dx: 0, dy: 1 }
    case 'left':
      return { dx: -1, dy: 0 }
    case 'right':
      return { dx: 1, dy: 0 }
  }
}

function nextId(state: GameState): number {
  state.nextId += 1
  return state.nextId
}

export function createLayout(cellSize: number, mapOffsetX: number, mapOffsetY: number) {
  return {
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    cellSize,
    mapOffsetX,
    mapOffsetY,
    mapW: GRID_COLS * cellSize,
    mapH: GRID_ROWS * cellSize,
  }
}

export function createInitialState(layout: ReturnType<typeof createLayout>): GameState {
  return {
    phase: 'playing',
    levelIndex: 0,
    score: 0,
    player: null,
    baseHp: ENTITY.homeBase.hp,
    baseMaxHp: ENTITY.homeBase.hp,
    baseCol: 0,
    baseRow: 0,
    walls: [],
    enemies: [],
    bullets: [],
    particles: [],
    floatTexts: [],
    enemiesRemaining: 0,
    nextId: 0,
    levelMessageTimer: 0,
    ...layout,
  }
}

function spawnTank(
  state: GameState,
  opts: {
    isPlayer: boolean
    col: number
    row: number
    speedMult?: number
  },
): TankEntity {
  const { x, y } = cellCenter(opts.col, opts.row, state.cellSize, state.mapOffsetX, state.mapOffsetY)
  const cfg = opts.isPlayer ? ENTITY.playerTank : ENTITY.enemyTank1
  const speed = ENTITY.enemyTank1.moveSpeed * (opts.speedMult ?? 1)
  return {
    id: nextId(state),
    isPlayer: opts.isPlayer,
    x,
    y,
    w: cfg.size,
    h: cfg.size,
    hp: cfg.hp,
    maxHp: cfg.hp,
    dir: opts.isPlayer ? 'up' : 'down',
    moveSpeed: opts.isPlayer ? ENTITY.playerTank.moveSpeed : speed,
    fireCooldown: 0,
    fireInterval: opts.isPlayer ? ENTITY.playerTank.fireIntervalSec : ENTITY.enemyTank1.fireIntervalSec,
    bulletDamage: cfg.bulletDamage,
    aiTimer: 0,
    aiDir: 'down',
  }
}

export function startLevel(state: GameState, levelIndex: number): void {
  const wave = getWaveConfig(levelIndex)
  const map = cloneBaseMap()
  applyExtraWalls(map, wave.extraWalls)

  const playerSpawn = findSpawn(map, 2)!
  const baseSpawn = findSpawn(map, 3)!
  state.baseCol = baseSpawn.col
  state.baseRow = baseSpawn.row
  state.baseHp = ENTITY.homeBase.hp
  state.baseMaxHp = ENTITY.homeBase.hp
  state.walls = buildWallsFromMap(map, ENTITY.wallBrick.hp)
  state.bullets = []
  state.particles = []
  state.enemies = []
  state.player = spawnTank(state, { isPlayer: true, col: playerSpawn.col, row: playerSpawn.row })
  state.levelIndex = levelIndex
  state.phase = 'playing'
  state.levelMessageTimer = 1.8
  state.enemiesRemaining = wave.enemyCount

  const spawns = enemySpawnCells(map)
  for (let i = 0; i < wave.enemyCount && spawns.length > 0; i++) {
    const idx = Math.floor(Math.random() * spawns.length)
    const { col, row } = spawns.splice(idx, 1)[0]
    state.enemies.push(
      spawnTank(state, {
        isPlayer: false,
        col,
        row,
        speedMult: wave.enemySpeedMult,
      }),
    )
  }
}

function clampTankToMap(tank: TankEntity, state: GameState): void {
  const minX = state.mapOffsetX + tank.w / 2
  const maxX = state.mapOffsetX + state.mapW - tank.w / 2
  const minY = state.mapOffsetY + tank.h / 2
  const maxY = state.mapOffsetY + state.mapH - tank.h / 2
  tank.x = Math.max(minX, Math.min(maxX, tank.x))
  tank.y = Math.max(minY, Math.min(maxY, tank.y))
}

function tryMoveTank(tank: TankEntity, dir: Dir, dt: number, state: GameState): void {
  const { dx, dy } = dirVector(dir)
  tank.dir = dir
  tank.x += dx * tank.moveSpeed * dt * 60
  tank.y += dy * tank.moveSpeed * dt * 60
  clampTankToMap(tank, state)
  resolveTankWall(tank, state.walls, state.cellSize, state.mapOffsetX, state.mapOffsetY)
  clampTankToMap(tank, state)
}

function fireFromTank(state: GameState, tank: TankEntity): void {
  if (tank.fireCooldown > 0 || tank.hp <= 0) return
  const { dx, dy } = dirVector(tank.dir)
  const offset = tank.w * 0.55
  const bw = ENTITY.bulletNormal.size
  const bh = ENTITY.bulletNormal.size
  const speed = ENTITY.bulletNormal.speed
  const bullet: BulletEntity = {
    id: nextId(state),
    x: tank.x + dx * offset,
    y: tank.y + dy * offset,
    w: bw,
    h: bh,
    vx: dx * speed,
    vy: dy * speed,
    damage: tank.bulletDamage,
    fromPlayer: tank.isPlayer,
  }
  state.bullets.push(bullet)
  tank.fireCooldown = tank.fireInterval
}

function spawnBurst(state: GameState, x: number, y: number, color: string, n = 12): void {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.3
    const sp = 2 + Math.random() * 4
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      color,
      size: 3 + Math.random() * 4,
    })
  }
}

function addFloat(state: GameState, x: number, y: number, text: string, color: string): void {
  state.floatTexts.push({ x, y, text, color, life: 1 })
}

function updateBullets(state: GameState, dt: number, onScore: (n: number, x: number, y: number) => void): void {
  const keep: BulletEntity[] = []
  for (const b of state.bullets) {
    b.x += b.vx * dt * 60
    b.y += b.vy * dt * 60
    const bb = bulletAabb(b)
    if (
      b.x < state.mapOffsetX - 20 ||
      b.x > state.mapOffsetX + state.mapW + 20 ||
      b.y < state.mapOffsetY - 20 ||
      b.y > state.mapOffsetY + state.mapH + 20
    ) {
      continue
    }

    let hit = false
    for (const w of state.walls) {
      if (w.hp <= 0) continue
      if (aabbOverlap(bb, wallAabb(w, state.cellSize, state.mapOffsetX, state.mapOffsetY))) {
        w.hp -= b.damage
        if (w.hp <= 0) spawnBurst(state, bb.x, bb.y, ENTITY.wallBrick.color, 8)
        hit = true
        break
      }
    }
    if (hit) continue

    const baseBox = baseAabb(state.baseCol, state.baseRow, state.cellSize, state.mapOffsetX, state.mapOffsetY)
    if (!b.fromPlayer && aabbOverlap(bb, baseBox)) {
      state.baseHp = Math.max(0, state.baseHp - b.damage)
      spawnBurst(state, bb.x, bb.y, ENTITY.homeBase.color, 10)
      if (state.baseHp <= 0) state.phase = 'defeat'
      continue
    }

    const tanks = [state.player, ...state.enemies].filter(Boolean) as TankEntity[]
    for (const t of tanks) {
      if (t.hp <= 0) continue
      if (b.fromPlayer === t.isPlayer) continue
      if (aabbOverlap(bb, tankAabb(t))) {
        t.hp -= b.damage
        spawnBurst(state, t.x, t.y, t.isPlayer ? ENTITY.playerTank.color : ENTITY.enemyTank1.color)
        if (!t.isPlayer && t.hp <= 0) {
          const pts = 100
          onScore(pts, t.x, t.y)
          addFloat(state, t.x, t.y, `+${pts}`, '#FFD970')
        }
        if (t.isPlayer && t.hp <= 0) state.phase = 'defeat'
        hit = true
        break
      }
    }
    if (!hit) keep.push(b)
  }
  state.bullets = keep
}

function updateEnemyAi(state: GameState, dt: number): void {
  const player = state.player
  if (!player || player.hp <= 0) return

  for (const e of state.enemies) {
    if (e.hp <= 0) continue
    e.aiTimer -= dt
    if (e.aiTimer <= 0) {
      e.aiTimer = 0.8 + Math.random() * 1.2
      if (Math.random() < 0.35) {
        e.aiDir = DIRS[Math.floor(Math.random() * DIRS.length)]
      } else {
        const dx = player.x - e.x
        const dy = player.y - e.y
        if (Math.abs(dx) > Math.abs(dy)) e.aiDir = dx > 0 ? 'right' : 'left'
        else e.aiDir = dy > 0 ? 'down' : 'up'
      }
    }
    tryMoveTank(e, e.aiDir, dt, state)
    if (Math.random() < 0.02) fireFromTank(state, e)
  }
}

export function updateSimulation(
  state: GameState,
  input: { moveDir: Dir | null; firePressed: boolean },
  dt: number,
  onScore: (n: number, x: number, y: number) => void,
): void {
  if (state.phase !== 'playing') return

  if (state.levelMessageTimer > 0) state.levelMessageTimer -= dt

  const player = state.player
  if (player && player.hp > 0) {
    if (input.moveDir) tryMoveTank(player, input.moveDir, dt, state)
    if (player.fireCooldown > 0) player.fireCooldown -= dt
    if (input.firePressed) fireFromTank(state, player)
  }

  for (const e of state.enemies) {
    if (e.fireCooldown > 0) e.fireCooldown -= dt
  }

  updateEnemyAi(state, dt)
  updateBullets(state, dt, onScore)

  state.enemies = state.enemies.filter(e => e.hp > 0)

  for (const p of state.particles) {
    p.x += p.vx
    p.y += p.vy
    p.life -= dt
  }
  state.particles = state.particles.filter(p => p.life > 0)

  for (const f of state.floatTexts) f.life -= dt
  state.floatTexts = state.floatTexts.filter(f => f.life > 0)

  if (state.phase === 'playing' && state.enemies.length === 0 && state.baseHp > 0 && player && player.hp > 0) {
    if (state.levelIndex >= 2) {
      state.phase = 'victory'
    } else {
      state.phase = 'levelClear'
    }
  }
}

export function advanceAfterLevelClear(state: GameState): void {
  startLevel(state, state.levelIndex + 1)
}

export function getResultStars(state: GameState): 1 | 2 | 3 {
  const ratio = state.baseMaxHp > 0 ? state.baseHp / state.baseMaxHp : 0
  return starsFromBaseRatio(ratio)
}

export function isCellBlocked(state: GameState, col: number, row: number, ignorePlayer?: TankEntity): boolean {
  if (col < 0 || row < 0 || col >= state.gridCols || row >= state.gridRows) return true
  for (const w of state.walls) {
    if (w.col === col && w.row === row && w.hp > 0) return true
  }
  if (col === state.baseCol && row === state.baseRow) return true
  const tanks = [state.player, ...state.enemies].filter(Boolean) as TankEntity[]
  for (const t of tanks) {
    if (t === ignorePlayer || t.hp <= 0) continue
    if (tankBlocksCell(t, col, row, state.cellSize, state.mapOffsetX, state.mapOffsetY)) return true
  }
  return false
}