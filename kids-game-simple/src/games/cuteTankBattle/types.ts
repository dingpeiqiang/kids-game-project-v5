import type { ENTITY } from './config'

export type Dir = 'up' | 'down' | 'left' | 'right'

export type Phase = 'playing' | 'levelClear' | 'victory' | 'defeat'

export interface Vec2 {
  x: number
  y: number
}

export interface WallCell {
  col: number
  row: number
  hp: number
  maxHp: number
}

export interface TankEntity {
  id: number
  isPlayer: boolean
  x: number
  y: number
  w: number
  h: number
  hp: number
  maxHp: number
  dir: Dir
  moveSpeed: number
  fireCooldown: number
  fireInterval: number
  bulletDamage: number
  aiTimer: number
  aiDir: Dir
}

export interface BulletEntity {
  id: number
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  damage: number
  fromPlayer: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
}

export interface GameAssets {
  tankPlayer: HTMLImageElement | null
  tankEnemy: HTMLImageElement | null
  wallBrick: HTMLImageElement | null
  bg: HTMLImageElement | null
}

export interface GameState {
  phase: Phase
  levelIndex: number
  score: number
  player: TankEntity | null
  baseHp: number
  baseMaxHp: number
  baseCol: number
  baseRow: number
  walls: WallCell[]
  enemies: TankEntity[]
  bullets: BulletEntity[]
  particles: Particle[]
  floatTexts: FloatText[]
  enemiesRemaining: number
  gridCols: number
  gridRows: number
  cellSize: number
  mapOffsetX: number
  mapOffsetY: number
  mapW: number
  mapH: number
  nextId: number
  levelMessageTimer: number
}

export type PlayerConfig = typeof ENTITY.playerTank
export type EnemyConfig = typeof ENTITY.enemyTank1