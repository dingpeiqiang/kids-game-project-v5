import type { VoxelGrid } from './voxelGrid'

export interface RayHit {
  x: number
  y: number
  z: number
  /** 方块外侧用于放置的相邻格 */
  placeX: number
  placeY: number
  placeZ: number
}

export function raycastBlocks(
  grid: VoxelGrid,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDist: number,
): RayHit | null {
  const len = Math.hypot(dx, dy, dz) || 1
  dx /= len
  dy /= len
  dz /= len

  let t = 0
  let x = Math.floor(ox)
  let y = Math.floor(oy)
  let z = Math.floor(oz)

  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity

  const frac = (v: number) => v - Math.floor(v)
  let tMaxX =
    stepX > 0 ? (1 - frac(ox)) * tDeltaX : stepX < 0 ? frac(ox) * tDeltaX : Infinity
  let tMaxY =
    stepY > 0 ? (1 - frac(oy)) * tDeltaY : stepY < 0 ? frac(oy) * tDeltaY : Infinity
  let tMaxZ =
    stepZ > 0 ? (1 - frac(oz)) * tDeltaZ : stepZ < 0 ? frac(oz) * tDeltaZ : Infinity

  const startX = x
  const startY = y
  const startZ = z

  while (t <= maxDist) {
    if (!(x === startX && y === startY && z === startZ) && grid.get(x, y, z)) {
      return {
        x,
        y,
        z,
        placeX: x - stepX,
        placeY: y - stepY,
        placeZ: z - stepZ,
      }
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX
        t = tMaxX
        tMaxX += tDeltaX
      } else {
        z += stepZ
        t = tMaxZ
        tMaxZ += tDeltaZ
      }
    } else {
      if (tMaxY < tMaxZ) {
        y += stepY
        t = tMaxY
        tMaxY += tDeltaY
      } else {
        z += stepZ
        t = tMaxZ
        tMaxZ += tDeltaZ
      }
    }
  }
  return null
}