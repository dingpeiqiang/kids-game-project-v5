export type BlockKind = 'ground' | 'brick' | 'question' | 'used' | 'pipe' | 'hard'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Block extends Rect {
  kind: BlockKind
  hit?: boolean
  spawn?: 'coin' | 'mushroom' | 'flower' | 'star' | '1up'
}

export interface Pipe extends Rect {
  enterable?: boolean
}

export interface Coin extends Rect {
  collected: boolean
  spin: number
}

export interface Enemy {
  id: number
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy?: number
  type: 'goomba' | 'koopa' | 'fly'
  alive: boolean
  shell: boolean
  shellMoving: boolean
  patrolMin: number
  patrolMax: number
  flyPhase?: number
}

export interface Powerup {
  id: number
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  type: 'mushroom' | 'flower' | 'star' | '1up'
  collected: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export interface FloatText {
  x: number
  y: number
  text: string
  life: number
  color: string
}

export interface Player {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  onGround: boolean
  facing: 1 | -1
  big: boolean
  fire: boolean
  invincible: number
  jumpHeld: boolean
  coyote: number
  jumpBuffer: number
  anim: number
  dead: boolean
  win: boolean
}

export interface LevelTheme {
  sky: string
  underground: boolean
  name: string
}

export interface LevelData {
  id: number
  name: string
  theme: LevelTheme
  width: number
  groundY: number
  blocks: Block[]
  pipes: Pipe[]
  coins: Coin[]
  enemies: Omit<Enemy, 'id' | 'alive' | 'shell' | 'shellMoving'>[]
  flagX: number
  spawnX: number
  spawnY: number
  timeLimit: number
}

export type GamePhase =
  | 'playing'
  | 'paused'
  | 'levelComplete'
  | 'gameOver'
  | 'victory'
  | 'timeUp'

export interface MarioGameState {
  levelIndex: number
  lives: number
  score: number
  coins: number
  timeLeft: number
  cameraX: number
  player: Player
  blocks: Block[]
  pipes: Pipe[]
  coinObjects: Coin[]
  enemies: Enemy[]
  powerups: Powerup[]
  particles: Particle[]
  floatTexts: FloatText[]
  phase: GamePhase
  levelCompleteTimer: number
  message: string
}