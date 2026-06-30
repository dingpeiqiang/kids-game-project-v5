import type { BlockType } from '../types'
import { BLOCK_COLORS } from '../config'
import type { VoxelGrid } from './voxelGrid'

const FACES: Array<{ dx: number; dy: number; dz: number; nx: number; ny: number; nz: number }> = [
  { dx: 0, dy: 1, dz: 0, nx: 0, ny: 1, nz: 0 },
  { dx: 0, dy: -1, dz: 0, nx: 0, ny: -1, nz: 0 },
  { dx: 1, dy: 0, dz: 0, nx: 1, ny: 0, nz: 0 },
  { dx: -1, dy: 0, dz: 0, nx: -1, ny: 0, nz: 0 },
  { dx: 0, dy: 0, dz: 1, nx: 0, ny: 0, nz: 1 },
  { dx: 0, dy: 0, dz: -1, nx: 0, ny: 0, nz: -1 },
]

export interface BlockMeshBuffers {
  positions: number[]
  indices: number[]
  colors: number[]
}

export function buildExposedMesh(grid: VoxelGrid): BlockMeshBuffers {
  const positions: number[] = []
  const indices: number[] = []
  const colors: number[] = []
  let vert = 0

  const addFace = (x: number, y: number, z: number, face: (typeof FACES)[0], col: { r: number; g: number; b: number }) => {
    const { nx, ny, nz } = face
    const ax = x
    const ay = y
    const az = z
    const pushV = (px: number, py: number, pz: number) => {
      positions.push(px, py, pz)
      colors.push(col.r, col.g, col.b, 1)
    }
    if (ny === 1) {
      pushV(ax, ay + 1, az)
      pushV(ax + 1, ay + 1, az)
      pushV(ax + 1, ay + 1, az + 1)
      pushV(ax, ay + 1, az + 1)
    } else if (ny === -1) {
      pushV(ax, ay, az + 1)
      pushV(ax + 1, ay, az + 1)
      pushV(ax + 1, ay, az)
      pushV(ax, ay, az)
    } else if (nx === 1) {
      pushV(ax + 1, ay, az)
      pushV(ax + 1, ay + 1, az)
      pushV(ax + 1, ay + 1, az + 1)
      pushV(ax + 1, ay, az + 1)
    } else if (nx === -1) {
      pushV(ax, ay, az + 1)
      pushV(ax, ay + 1, az + 1)
      pushV(ax, ay + 1, az)
      pushV(ax, ay, az)
    } else if (nz === 1) {
      pushV(ax + 1, ay, az + 1)
      pushV(ax + 1, ay + 1, az + 1)
      pushV(ax, ay + 1, az + 1)
      pushV(ax, ay, az + 1)
    } else {
      pushV(ax, ay, az)
      pushV(ax, ay + 1, az)
      pushV(ax + 1, ay + 1, az)
      pushV(ax + 1, ay, az)
    }
    indices.push(vert, vert + 1, vert + 2, vert, vert + 2, vert + 3)
    vert += 4
  }

  grid.forEach((x, y, z, type) => {
    const col = BLOCK_COLORS[type]
    for (const face of FACES) {
      const nx = x + face.dx
      const ny = y + face.dy
      const nz = z + face.dz
      if (!grid.get(nx, ny, nz)) addFace(x, y, z, face, col)
    }
  })

  return { positions, indices, colors }
}