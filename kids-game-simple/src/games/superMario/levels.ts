import { MARIO_CONFIG } from './config'
import type { LevelData, Block, Coin, Pipe } from './types'

const GY = MARIO_CONFIG.VIEW_H - 80

function groundSegments(width: number, groundY: number): Block[] {
  const blocks: Block[] = []
  const tw = MARIO_CONFIG.TILE
  for (let x = 0; x < width; x += tw) {
    blocks.push({
      x,
      y: groundY,
      w: tw,
      h: tw * 2,
      kind: 'ground',
    })
  }
  return blocks
}

function rowBricks(x: number, y: number, count: number, spawn?: Block['spawn']): Block[] {
  const tw = MARIO_CONFIG.TILE
  const qi = spawn != null ? Math.floor(count / 2) : -1
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * tw,
    y,
    w: tw,
    h: tw,
    kind: i === qi ? 'question' : 'brick',
    spawn: i === qi ? spawn : undefined,
  }))
}

function buildLevel1(): LevelData {
  const width = 3200
  const blocks: Block[] = [...groundSegments(width, GY)]
  blocks.push(...rowBricks(280, GY - 80, 3, 'coin'))
  blocks.push(...rowBricks(520, GY - 100, 1, 'mushroom'))
  blocks.push({ x: 640, y: GY - 60, w: 40, h: 60, kind: 'brick' })
  blocks.push({ x: 900, y: GY - 40, w: 80, h: 80, kind: 'pipe' })
  const pipes: Pipe[] = [{ x: 900, y: GY - 40, w: 80, h: 80 }]
  const coins: Coin[] = []
  for (let i = 0; i < 8; i++) {
    coins.push({ x: 1100 + i * 28, y: GY - 120, w: 16, h: 16, collected: false, spin: i })
  }
  blocks.push(...rowBricks(1500, GY - 90, 4))
  blocks.push({ x: 2000, y: GY - 40, w: 80, h: 80, kind: 'pipe' })
  pipes.push({ x: 2000, y: GY - 40, w: 80, h: 80 })
  return {
    id: 1,
    name: '1-1 青青草原',
    theme: { sky: '#5c94fc', underground: false, name: 'grass' },
    width,
    groundY: GY,
    blocks,
    pipes,
    coins,
    enemies: [
      { x: 450, y: GY - 22, w: 22, h: 22, vx: -1.2, type: 'goomba', patrolMin: 400, patrolMax: 600 },
      { x: 750, y: GY - 22, w: 22, h: 22, vx: -1.2, type: 'goomba', patrolMin: 700, patrolMax: 880 },
      { x: 1300, y: GY - 22, w: 22, h: 22, vx: -1.3, type: 'goomba', patrolMin: 1200, patrolMax: 1450 },
      { x: 1700, y: GY - 22, w: 22, h: 22, vx: -1.2, type: 'goomba', patrolMin: 1650, patrolMax: 1900 },
    ],
    flagX: width - 120,
    spawnX: 60,
    spawnY: GY - MARIO_CONFIG.PLAYER_H,
    timeLimit: 300,
  }
}

function buildLevel2(): LevelData {
  const width = 3800
  const blocks: Block[] = [...groundSegments(width, GY)]
  for (let i = 0; i < 5; i++) {
    blocks.push({ x: 400 + i * 120, y: GY - 50 - (i % 2) * 40, w: 80, h: 20, kind: 'brick' })
  }
  blocks.push(...rowBricks(900, GY - 110, 3, 'coin'))
  blocks.push({ x: 1200, y: GY - 40, w: 80, h: 80, kind: 'pipe' })
  blocks.push({ x: 1280, y: GY - 100, w: 80, h: 40, kind: 'pipe' })
  const pipes: Pipe[] = [
    { x: 1200, y: GY - 40, w: 80, h: 80 },
    { x: 1280, y: GY - 100, w: 80, h: 40 },
  ]
  const coins: Coin[] = []
  for (let i = 0; i < 6; i++) coins.push({ x: 1600 + i * 32, y: GY - 140, w: 16, h: 16, collected: false, spin: i })
  blocks.push(...rowBricks(2200, GY - 85, 5, 'flower'))
  return {
    id: 2,
    name: '1-2 管道峡谷',
    theme: { sky: '#5c94fc', underground: false, name: 'pipe' },
    width,
    groundY: GY,
    blocks,
    pipes,
    coins,
    enemies: [
      { x: 550, y: GY - 22, w: 22, h: 22, vx: -1.4, type: 'goomba', patrolMin: 500, patrolMax: 750 },
      { x: 1000, y: GY - 22, w: 22, h: 22, vx: -1.3, type: 'koopa', patrolMin: 950, patrolMax: 1150 },
      { x: 1450, y: GY - 22, w: 22, h: 22, vx: -1.4, type: 'goomba', patrolMin: 1400, patrolMax: 1750 },
      { x: 1900, y: GY - 22, w: 22, h: 22, vx: -1.5, type: 'koopa', patrolMin: 1850, patrolMax: 2100 },
      { x: 2500, y: GY - 22, w: 22, h: 22, vx: -1.4, type: 'goomba', patrolMin: 2450, patrolMax: 2700 },
    ],
    flagX: width - 120,
    spawnX: 60,
    spawnY: GY - MARIO_CONFIG.PLAYER_H,
    timeLimit: 280,
  }
}

function buildLevel3(): LevelData {
  const width = 4200
  const blocks: Block[] = []
  for (let x = 0; x < width; x += MARIO_CONFIG.TILE) {
    if (x > 800 && x < 950) continue
    if (x > 2100 && x < 2280) continue
    blocks.push({ x, y: GY, w: MARIO_CONFIG.TILE, h: MARIO_CONFIG.TILE * 2, kind: 'ground' })
  }
  blocks.push(...rowBricks(600, GY - 100, 4))
  blocks.push(...rowBricks(1100, GY - 130, 3, 'star'))
  blocks.push({ x: 1600, y: GY - 60, w: 100, h: 20, kind: 'brick' })
  blocks.push({ x: 2400, y: GY - 90, w: 120, h: 20, kind: 'brick' })
  blocks.push(...rowBricks(3000, GY - 100, 3, '1up'))
  const pipes: Pipe[] = []
  const coins: Coin[] = []
  for (let i = 0; i < 10; i++) coins.push({ x: 700 + i * 24, y: GY - 160, w: 16, h: 16, collected: false, spin: i })
  return {
    id: 3,
    name: '1-3 高空跳跃',
    theme: { sky: '#5c94fc', underground: false, name: 'sky' },
    width,
    groundY: GY,
    blocks,
    pipes,
    coins,
    enemies: [
      { x: 400, y: GY - 22, w: 22, h: 22, vx: -1.5, type: 'goomba', patrolMin: 350, patrolMax: 550 },
      { x: 1000, y: GY - 80, w: 22, h: 22, vx: -1.2, type: 'fly', patrolMin: 950, patrolMax: 1250, flyPhase: 0 },
      { x: 1800, y: GY - 22, w: 22, h: 22, vx: -1.5, type: 'koopa', patrolMin: 1750, patrolMax: 2050 },
      { x: 2600, y: GY - 100, w: 22, h: 22, vx: -1.3, type: 'fly', patrolMin: 2550, patrolMax: 2850, flyPhase: 1 },
      { x: 3200, y: GY - 22, w: 22, h: 22, vx: -1.6, type: 'goomba', patrolMin: 3150, patrolMax: 3450 },
    ],
    flagX: width - 120,
    spawnX: 60,
    spawnY: GY - MARIO_CONFIG.PLAYER_H,
    timeLimit: 260,
  }
}

function buildLevel4(): LevelData {
  const width = 4500
  const blocks: Block[] = [...groundSegments(width, GY)]
  for (let s = 0; s < 6; s++) {
    blocks.push({ x: 500 + s * 200, y: GY - 70 - (s % 3) * 25, w: 60, h: 20, kind: 'brick' })
  }
  blocks.push(...rowBricks(1800, GY - 120, 6))
  blocks.push({ x: 2400, y: GY - 40, w: 80, h: 80, kind: 'pipe' })
  blocks.push({ x: 2480, y: GY - 120, w: 80, h: 80, kind: 'pipe' })
  const pipes: Pipe[] = [
    { x: 2400, y: GY - 40, w: 80, h: 80 },
    { x: 2480, y: GY - 120, w: 80, h: 80 },
  ]
  const coins: Coin[] = []
  blocks.push(...rowBricks(3400, GY - 95, 4, 'mushroom'))
  return {
    id: 4,
    name: '1-4 地下暗道',
    theme: { sky: '#000000', underground: true, name: 'underground' },
    width,
    groundY: GY,
    blocks,
    pipes,
    coins,
    enemies: [
      { x: 450, y: GY - 22, w: 22, h: 22, vx: -1.6, type: 'goomba', patrolMin: 400, patrolMax: 650 },
      { x: 900, y: GY - 22, w: 22, h: 22, vx: -1.6, type: 'koopa', patrolMin: 850, patrolMax: 1100 },
      { x: 1400, y: GY - 22, w: 22, h: 22, vx: -1.7, type: 'goomba', patrolMin: 1350, patrolMax: 1650 },
      { x: 2000, y: GY - 22, w: 22, h: 22, vx: -1.6, type: 'koopa', patrolMin: 1950, patrolMax: 2300 },
      { x: 2800, y: GY - 90, w: 22, h: 22, vx: -1.4, type: 'fly', patrolMin: 2750, patrolMax: 3100, flyPhase: 0 },
      { x: 3600, y: GY - 22, w: 22, h: 22, vx: -1.8, type: 'goomba', patrolMin: 3550, patrolMax: 3900 },
    ],
    flagX: width - 120,
    spawnX: 60,
    spawnY: GY - MARIO_CONFIG.PLAYER_H,
    timeLimit: 240,
  }
}

function buildLevel5(): LevelData {
  const width = 5000
  const blocks: Block[] = [...groundSegments(width, GY)]
  blocks.push({ x: 300, y: GY - 140, w: 200, h: 20, kind: 'hard' })
  blocks.push(...rowBricks(700, GY - 100, 5, 'flower'))
  blocks.push({ x: 1400, y: GY - 50, w: 40, h: 40, kind: 'brick' })
  blocks.push({ x: 1440, y: GY - 90, w: 40, h: 40, kind: 'brick' })
  blocks.push({ x: 1480, y: GY - 130, w: 40, h: 40, kind: 'brick' })
  blocks.push({ x: 2000, y: GY - 40, w: 80, h: 80, kind: 'pipe' })
  blocks.push({ x: 2800, y: GY - 110, w: 160, h: 20, kind: 'brick' })
  blocks.push(...rowBricks(3600, GY - 130, 4, 'star'))
  const pipes: Pipe[] = [{ x: 2000, y: GY - 40, w: 80, h: 80 }]
  const coins: Coin[] = []
  for (let i = 0; i < 15; i++) {
    coins.push({ x: 2200 + i * 30, y: GY - 100 - Math.sin(i) * 20, w: 16, h: 16, collected: false, spin: i })
  }
  return {
    id: 5,
    name: '1-5 城堡决战',
    theme: { sky: '#1a0a28', underground: false, name: 'castle' },
    width,
    groundY: GY,
    blocks,
    pipes,
    coins,
    enemies: [
      { x: 500, y: GY - 22, w: 22, h: 22, vx: -1.7, type: 'goomba', patrolMin: 450, patrolMax: 700 },
      { x: 850, y: GY - 22, w: 22, h: 22, vx: -1.8, type: 'koopa', patrolMin: 800, patrolMax: 1050 },
      { x: 1200, y: GY - 22, w: 22, h: 22, vx: -1.7, type: 'goomba', patrolMin: 1150, patrolMax: 1500 },
      { x: 1700, y: GY - 22, w: 22, h: 22, vx: -1.8, type: 'koopa', patrolMin: 1650, patrolMax: 1950 },
      { x: 2300, y: GY - 22, w: 22, h: 22, vx: -1.9, type: 'goomba', patrolMin: 2250, patrolMax: 2600 },
      { x: 2600, y: GY - 100, w: 22, h: 22, vx: -1.5, type: 'fly', patrolMin: 2550, patrolMax: 2950, flyPhase: 0 },
      { x: 3000, y: GY - 22, w: 22, h: 22, vx: -2, type: 'koopa', patrolMin: 2950, patrolMax: 3300 },
      { x: 3800, y: GY - 22, w: 22, h: 22, vx: -1.9, type: 'goomba', patrolMin: 3750, patrolMax: 4100 },
      { x: 4200, y: GY - 120, w: 28, h: 28, vx: -1.2, type: 'fly', patrolMin: 4150, patrolMax: 4500, flyPhase: 1 },
    ],
    flagX: width - 120,
    spawnX: 60,
    spawnY: GY - MARIO_CONFIG.PLAYER_H,
    timeLimit: 300,
  }
}

export const MARIO_LEVELS: LevelData[] = [
  buildLevel1(),
  buildLevel2(),
  buildLevel3(),
  buildLevel4(),
  buildLevel5(),
]

export function getLevel(index: number): LevelData {
  return MARIO_LEVELS[Math.max(0, Math.min(MARIO_LEVELS.length - 1, index))]
}