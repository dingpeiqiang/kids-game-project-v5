import type { BiomeId, BlockType } from '../types'
import { GAME_CONFIG } from '../config'
import { fbm } from './noise'
import type { VoxelGrid } from './voxelGrid'

export interface TerrainEgg {
  kind: 'floatingIsland' | 'glowCave' | 'miniRuin'
  cx: number
  cy: number
  cz: number
}

function surfaceHeight(biome: BiomeId, seed: number, x: number, z: number): number {
  const n = fbm(seed, x * 0.08, z * 0.08, 5)
  switch (biome) {
    case 'plains':
      return 4 + Math.floor(n * 3)
    case 'forest':
      return 5 + Math.floor(n * 5)
    case 'hills':
      return 6 + Math.floor(n * 10)
    case 'snow':
      return 5 + Math.floor(n * 4)
    default:
      return 5
  }
}

function columnBlocks(biome: BiomeId, surface: number): { top: BlockType; fill: BlockType; sub: BlockType } {
  if (biome === 'snow') {
    return { top: 'snow', fill: 'snow', sub: 'stone' }
  }
  if (biome === 'hills') {
    return { top: 'grass', fill: 'dirt', sub: 'rock' }
  }
  if (biome === 'forest') {
    return { top: 'grass', fill: 'dirt', sub: 'stone' }
  }
  return { top: 'grass', fill: 'dirt', sub: 'stone' }
}

export function generateTerrain(grid: VoxelGrid, biome: BiomeId, seed: number): TerrainEgg | null {
  grid.clear()
  const { worldSizeX, worldSizeZ } = GAME_CONFIG
  const cols = columnBlocks(biome, 0)

  for (let x = 0; x < worldSizeX; x++) {
    for (let z = 0; z < worldSizeZ; z++) {
      const h = surfaceHeight(biome, seed, x, z)
      for (let y = 0; y <= h; y++) {
        let type: BlockType = cols.sub
        if (y === h) type = cols.top
        else if (y >= h - 2) type = cols.fill
        grid.set(x, y, z, type)
      }
      if (biome === 'forest' && hashTree(seed, x, z) > 0.92 && h < 20) {
        placeTree(grid, x, h + 1, z)
      }
      if (biome === 'plains' && hashTree(seed + 9, x, z) > 0.96) {
        grid.set(x, h + 1, z, 'flower')
      }
    }
  }

  const wx = Math.floor(worldSizeX * 0.35)
  const wz = Math.floor(worldSizeZ * 0.6)
  const wh = surfaceHeight(biome, seed, wx, wz)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      grid.set(wx + dx, wh, wz + dz, 'water')
      grid.set(wx + dx, wh - 1, wz + dz, 'sand')
    }
  }

  return placeWorldEgg(grid, biome, seed)
}

function hashTree(seed: number, x: number, z: number): number {
  const h = (seed ^ x * 928371 ^ z * 123457) >>> 0
  return (h % 1000) / 1000
}

function placeTree(grid: VoxelGrid, x: number, y: number, z: number): void {
  for (let i = 0; i < 4; i++) grid.set(x, y + i, z, 'wood')
  for (let lx = -1; lx <= 1; lx++) {
    for (let lz = -1; lz <= 1; lz++) {
      for (let ly = 3; ly <= 5; ly++) {
        if (lx === 0 && lz === 0 && ly < 4) continue
        grid.set(x + lx, y + ly, z + lz, 'leaf')
      }
    }
  }
}

function placeWorldEgg(grid: VoxelGrid, biome: BiomeId, seed: number): TerrainEgg | null {
  const roll = (seed % 3) as 0 | 1 | 2
  const cx = 10 + (seed % 20)
  const cz = 10 + ((seed >> 4) % 20)
  const base = surfaceHeight(biome, seed, cx, cz)

  if (roll === 0) {
    const cy = base + 14
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 3) continue
        grid.set(cx + dx, cy, cz + dz, 'grass')
        if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
          grid.set(cx + dx, cy + 1, cz + dz, 'glow')
        }
      }
    }
    return { kind: 'floatingIsland', cx, cy, cz }
  }

  if (roll === 1) {
    const cy = Math.max(2, base - 4)
    for (let y = cy; y <= cy + 3; y++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          grid.remove(cx + dx, y, cz + dz)
        }
      }
    }
    grid.set(cx, cy, cz, 'glow')
    grid.set(cx + 1, cy + 1, cz, 'glow')
    grid.set(cx - 1, cy, cz + 1, 'water')
    return { kind: 'glowCave', cx, cy, cz }
  }

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      grid.set(cx + dx, base + 1, cz + dz, 'stone')
    }
  }
  grid.set(cx, base + 2, cz, 'wood')
  grid.set(cx, base + 3, cz, 'leaf')
  return { kind: 'miniRuin', cx, cy: base + 2, cz }
}

export function groundHeightAt(grid: VoxelGrid, x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  for (let y = GAME_CONFIG.chunkHeight - 1; y >= 0; y--) {
    if (grid.hasSolid(ix, y, iz)) return y
  }
  return 0
}