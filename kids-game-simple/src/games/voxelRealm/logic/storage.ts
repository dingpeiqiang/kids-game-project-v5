import { GAME_CONFIG } from '../config'
import type { BiomeId, BlockType, PersistedSave } from '../types'
import type { VoxelGrid } from './voxelGrid'

export function loadSave(): PersistedSave | null {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.storageKey)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedSave
    if (data.version !== 1) return null
    return data
  } catch {
    return null
  }
}

export function writeSave(
  grid: VoxelGrid,
  seed: number,
  biome: BiomeId,
  bestBuild: number,
  bestRaceMs: number,
): void {
  const payload: PersistedSave = {
    version: 1,
    seed,
    biome,
    blocks: grid.exportTuples(),
    bestBuild,
    bestRaceMs,
  }
  localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(payload))
}

export function restoreGrid(grid: VoxelGrid, blocks: Array<[number, number, number, BlockType]>): void {
  grid.importTuples(blocks)
}