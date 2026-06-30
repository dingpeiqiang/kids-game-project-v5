import type { BuffId } from './config'

export type Phase = 'playing' | 'buffPick' | 'waveClear' | 'victory' | 'defeat'

export type DragonKind = 'dragon_normal' | 'dragon_fire'

export interface Player {
  x: number
  y: number
  hp: number
  maxHp: number
  fireCooldown: number
  damage: number
  fireRate: number
  pierce: number
  multiShot: number
}

export interface DragonSegment {
  index: number
  hp: number
  maxHp: number
  x: number
  y: number
  isBox: boolean
  boxOpened: boolean
  wobble: number
}

export interface Dragon {
  kind: DragonKind
  segments: DragonSegment[]
  fireTimer: number
  dead: boolean
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  pierce: number
  friendly: boolean
  life: number
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
  life: number
  color: string
  vy: number
}

export interface GameState {
  waveIndex: number
  endless: boolean
  phase: Phase
  score: number
  stars: number
  player: Player
  dragon: Dragon | null
  bullets: Bullet[]
  particles: Particle[]
  floatTexts: FloatText[]
  buffChoices: BuffId[]
  waveHpAtStart: number
  time: number
  waveClearTimer: number
  showedWave1Guide: boolean
}