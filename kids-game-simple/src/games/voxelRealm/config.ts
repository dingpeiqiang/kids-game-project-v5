import type { BiomeId, BlockType, CompeteKind } from './types'

export const GAME_CONFIG = {
  worldSizeX: 48,
  worldSizeZ: 48,
  chunkHeight: 32,
  blockSize: 1,
  gravity: -22,
  jumpSpeed: 8.5,
  moveSpeed: 6.5,
  sprintMul: 1.45,
  reach: 6,
  dayCycleSec: 120,
  creatureCap: 24,
  competeBuildSec: 300,
  raceTargetDigs: 28,
  raceTargetFlats: 12,
  storageKey: 'voxelRealm_save_v1',
} as const

export const BLOCK_PALETTE: BlockType[] = [
  'grass',
  'dirt',
  'stone',
  'sand',
  'snow',
  'wood',
  'leaf',
  'flower',
  'glow',
  'candyPink',
  'candyMint',
  'candyLemon',
  'rock',
  'water',
]

export const BLOCK_COLORS: Record<BlockType, { r: number; g: number; b: number; emissive?: number }> = {
  grass: { r: 0.45, g: 0.78, b: 0.42 },
  dirt: { r: 0.55, g: 0.38, b: 0.24 },
  stone: { r: 0.55, g: 0.55, b: 0.58 },
  sand: { r: 0.92, g: 0.85, b: 0.62 },
  snow: { r: 0.95, g: 0.97, b: 1 },
  wood: { r: 0.55, g: 0.35, b: 0.2 },
  leaf: { r: 0.35, g: 0.72, b: 0.38 },
  flower: { r: 0.95, g: 0.45, b: 0.65 },
  glow: { r: 0.55, g: 0.85, b: 1, emissive: 0.85 },
  candyPink: { r: 1, g: 0.72, b: 0.82 },
  candyMint: { r: 0.65, g: 0.95, b: 0.85 },
  candyLemon: { r: 1, g: 0.92, b: 0.55 },
  rock: { r: 0.42, g: 0.4, b: 0.38 },
  water: { r: 0.25, g: 0.55, b: 0.95, emissive: 0.15 },
}

export const BIOME_LABELS: Record<BiomeId, string> = {
  plains: '平原萌新',
  forest: '林地生态',
  hills: '山地丘陵',
  snow: '雪原空灵',
}

export const BUILD_THEMES: Array<{ id: string; title: string; hint: string; blocks: BlockType[] }> = [
  {
    id: 'cottage',
    title: '田园小屋',
    hint: '用木、草、花搭一间治愈小屋',
    blocks: ['wood', 'grass', 'flower', 'leaf', 'candyPink'],
  },
  {
    id: 'skyCastle',
    title: '空中城堡',
    hint: '用发光块与糖果色搭高塔',
    blocks: ['glow', 'candyMint', 'candyLemon', 'stone', 'snow'],
  },
  {
    id: 'mountainYard',
    title: '山地庭院',
    hint: '岩石围合 + 植被点缀',
    blocks: ['rock', 'stone', 'leaf', 'dirt', 'wood'],
  },
]

export const COMPETE_KIND_LABEL: Record<CompeteKind, string> = {
  themeBuild: '限时主题建造',
  terrainRace: '地貌改造竞速',
}

export function pickRandomBiome(seed: number): BiomeId {
  const list: BiomeId[] = ['plains', 'forest', 'hills', 'snow']
  const i = Math.abs(seed) % list.length
  return list[i]!
}

export function pickRandomTheme(seed: number) {
  const i = Math.abs(seed >> 3) % BUILD_THEMES.length
  return BUILD_THEMES[i]!
}