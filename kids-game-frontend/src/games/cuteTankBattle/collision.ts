import type { BulletEntity, TankEntity, WallCell } from './types'

export interface AABB {
  x: number
  y: number
  w: number
  h: number
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

export function tankAabb(t: TankEntity): AABB {
  return { x: t.x - t.w / 2, y: t.y - t.h / 2, w: t.w, h: t.h }
}

export function bulletAabb(b: BulletEntity): AABB {
  return { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h }
}

export function wallAabb(w: WallCell, cellSize: number, ox: number, oy: number): AABB {
  return {
    x: ox + w.col * cellSize,
    y: oy + w.row * cellSize,
    w: cellSize,
    h: cellSize,
  }
}

export function baseAabb(col: number, row: number, cellSize: number, ox: number, oy: number): AABB {
  return {
    x: ox + col * cellSize,
    y: oy + row * cellSize,
    w: cellSize,
    h: cellSize,
  }
}

export function resolveTankWall(
  tank: TankEntity,
  walls: WallCell[],
  cellSize: number,
  ox: number,
  oy: number,
): void {
  const box = tankAabb(tank)
  for (const w of walls) {
    if (w.hp <= 0) continue
    const wb = wallAabb(w, cellSize, ox, oy)
    if (!aabbOverlap(box, wb)) continue
    const overlapL = box.x + box.w - wb.x
    const overlapR = wb.x + wb.w - box.x
    const overlapT = box.y + box.h - wb.y
    const overlapB = wb.y + wb.h - box.y
    const minX = Math.min(overlapL, overlapR)
    const minY = Math.min(overlapT, overlapB)
    if (minX < minY) {
      if (overlapL < overlapR) tank.x -= overlapL
      else tank.x += overlapR
    } else {
      if (overlapT < overlapB) tank.y -= overlapT
      else tank.y += overlapB
    }
    box.x = tank.x - tank.w / 2
    box.y = tank.y - tank.h / 2
  }
}

export function tankBlocksCell(
  tank: TankEntity,
  col: number,
  row: number,
  cellSize: number,
  ox: number,
  oy: number,
): boolean {
  const cx = ox + col * cellSize + cellSize / 2
  const cy = oy + row * cellSize + cellSize / 2
  const half = cellSize / 2
  const box: AABB = { x: cx - half, y: cy - half, w: cellSize, h: cellSize }
  return aabbOverlap(tankAabb(tank), box)
}