import { BASE_MAP_TEMPLATE, GRID_COLS, GRID_ROWS, WAVES, type CellCode } from './config'
import type { WallCell } from './types'

export function cloneBaseMap(): CellCode[][] {
  return BASE_MAP_TEMPLATE.map(row => [...row])
}

/** 波次额外砖墙：随机空地 */
export function applyExtraWalls(map: CellCode[][], count: number): void {
  const empties: { c: number; r: number }[] = []
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (map[r][c] === 0) empties.push({ c, r })
    }
  }
  for (let i = 0; i < count && empties.length > 0; i++) {
    const idx = Math.floor(Math.random() * empties.length)
    const { c, r } = empties.splice(idx, 1)[0]
    map[r][c] = 1
  }
}

export function buildWallsFromMap(map: CellCode[][], brickHp: number): WallCell[] {
  const walls: WallCell[] = []
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (map[r][c] === 1) {
        walls.push({ col: c, row: r, hp: brickHp, maxHp: brickHp })
      }
    }
  }
  return walls
}

export function findSpawn(map: CellCode[][], code: 2 | 3): { col: number; row: number } | null {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (map[r][c] === code) return { col: c, row: r }
    }
  }
  return null
}

export function enemySpawnCells(map: CellCode[][]): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (map[r][c] === 0) cells.push({ col: c, row: r })
    }
  }
  return cells
}

export function getWaveConfig(levelIndex: number) {
  const idx = Math.min(levelIndex, WAVES.length - 1)
  return WAVES[idx]
}

export function cellCenter(
  col: number,
  row: number,
  cellSize: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  return {
    x: offsetX + col * cellSize + cellSize / 2,
    y: offsetY + row * cellSize + cellSize / 2,
  }
}