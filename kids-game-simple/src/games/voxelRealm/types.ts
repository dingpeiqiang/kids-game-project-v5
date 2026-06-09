export type PlayMode = 'casual' | 'compete'

export type BiomeId = 'plains' | 'forest' | 'hills' | 'snow'

export type CompeteKind = 'themeBuild' | 'terrainRace'

export type BlockType =
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'sand'
  | 'snow'
  | 'wood'
  | 'leaf'
  | 'flower'
  | 'glow'
  | 'candyPink'
  | 'candyMint'
  | 'candyLemon'
  | 'rock'
  | 'water'

export interface BlockDef {
  id: BlockType
  label: string
  category: 'terrain' | 'plant' | 'glow' | 'candy' | 'build'
  emissive?: boolean
}

export interface WorldPos {
  x: number
  y: number
  z: number
}

export interface PlayerState {
  x: number
  y: number
  z: number
  vy: number
  onGround: boolean
}

export interface CreatureState {
  id: number
  kind: 'deer' | 'bunny' | 'bird' | 'fish'
  x: number
  y: number
  z: number
  dir: number
  timer: number
}

export interface WorldMeta {
  seed: number
  biome: BiomeId
  dayPhase: number
  isNight: boolean
}

export interface CompeteState {
  kind: CompeteKind
  themeId: string
  timeLeft: number
  running: boolean
  placedCount: number
  digCount: number
  raceStartTime: number
  raceDone: boolean
  raceElapsed: number
}

export interface PersistedSave {
  version: number
  seed: number
  biome: BiomeId
  blocks: Array<[number, number, number, BlockType]>
  bestBuild: number
  bestRaceMs: number
}

export interface GameState {
  mode: PlayMode
  meta: WorldMeta
  player: PlayerState
  selectedBlock: BlockType
  hotbar: BlockType[]
  hotbarIndex: number
  creatures: CreatureState[]
  compete: CompeteState
  sessionScore: number
  blocksPlaced: number
  blocksBroken: number
  eggFound: boolean
  worldReady: boolean
}

export interface InputSnapshot {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
  breakBlock: boolean
  placeBlock: boolean
  hotbarNext: boolean
  hotbarPrev: boolean
  pointerLocked: boolean
}