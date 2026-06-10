import type { LEVELS } from './config'

export type Phase = 'playing' | 'victory' | 'defeat' | 'paused'

export interface Vec2 {
  x: number
  y: number
}

export interface Hero {
  x: number
  y: number
  hp: number
  maxHp: number
  shield: number
  shieldTimer: number
  atkCooldown: number
  skill1Cd: number
  ultCd: number
  dead: boolean
  respawnTimer: number
  wobble: number
  facing: 1 | -1
}

export interface Minion {
  id: number
  x: number
  y: number
  hp: number
  maxHp: number
  friendly: boolean
  laneY: number
  wobble: number
}

export interface EnemyHero {
  active: boolean
  x: number
  y: number
  hp: number
  maxHp: number
  atkCooldown: number
  skillCd: number
  wobble: number
}

export interface Crystal {
  hp: number
  maxHp: number
}

export interface Pickup {
  id: number
  x: number
  y: number
  kind: 'item_shield'
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

export interface SkillFx {
  x: number
  y: number
  radius: number
  life: number
  maxLife: number
  kind: 'skill1' | 'ult'
}

export type LevelDef = (typeof LEVELS)[number]

export interface GameState {
  phase: Phase
  levelIndex: number
  waveIndex: number
  wavesTotal: number
  waveTimer: number
  matchTime: number
  score: number
  gold: number
  kills: number
  combo: number
  comboTimer: number
  stars: number
  autoFight: boolean
  hero: Hero
  enemyHero: EnemyHero
  allyCrystal: Crystal
  enemyCrystal: Crystal
  minions: Minion[]
  pickups: Pickup[]
  particles: Particle[]
  floatTexts: FloatText[]
  skillFx: SkillFx[]
  nextMinionId: number
  nextPickupId: number
  showedResult: boolean
}