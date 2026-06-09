export type PlayMode = 'casual' | 'compete'

export type TrackTheme = 'meadow' | 'cloud' | 'ice' | 'star'

export type PowerUpKind = 'shield' | 'speed' | 'guide'

export type GamePhase = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'fallen' | 'levelComplete' | 'ended'

export interface Vec2 {
  x: number
  z: number
}

export interface BallState {
  x: number
  y: number
  z: number
  vx: number
  vz: number
  vy: number
  onGround: boolean
  shieldT: number
  speedBoostT: number
  guideT: number
}

export interface StarPickup {
  id: number
  x: number
  z: number
  collected: boolean
  hidden: boolean
}

export interface PowerUpPickup {
  id: number
  kind: PowerUpKind
  x: number
  z: number
  collected: boolean
}

export interface MovingBarrier {
  id: number
  x: number
  z: number
  halfW: number
  halfD: number
  axis: 'x' | 'z'
  amp: number
  speed: number
  phase: number
}

export interface SlowZone {
  id: number
  x: number
  z: number
  halfW: number
  halfD: number
}

export interface BouncePad {
  id: number
  x: number
  z: number
  halfW: number
  halfD: number
  impulse: number
}

export interface TrackSegment {
  x: number
  z: number
  halfW: number
  halfD: number
  y: number
  ice?: boolean
}

export interface LevelDef {
  id: number
  name: string
  theme: TrackTheme
  segments: TrackSegment[]
  finish: { x: number; z: number; halfW: number; halfD: number }
  stars: Omit<StarPickup, 'id' | 'collected'>[]
  powerUps: Omit<PowerUpPickup, 'id' | 'collected'>[]
  barriers: Omit<MovingBarrier, 'id'>[]
  slowZones: Omit<SlowZone, 'id'>[]
  bouncePads: Omit<BouncePad, 'id'>[]
  spawn: { x: number; z: number }
}

export interface LevelRuntime {
  stars: StarPickup[]
  powerUps: PowerUpPickup[]
  barriers: MovingBarrier[]
  slowZones: SlowZone[]
  bouncePads: BouncePad[]
  finish: LevelDef['finish']
  segments: TrackSegment[]
  theme: TrackTheme
}

export interface RunStats {
  bestTotalStars: number
  levelBestMs: Record<number, number>
  perfectClears: number
  totalClears: number
  unlockedSkin: number
}

export interface InputSnapshot {
  moveX: number
  moveZ: number
  jump: boolean
  pause: boolean
  reset: boolean
}

export interface GameState {
  phase: GamePhase
  mode: PlayMode
  levelIndex: number
  level: LevelRuntime
  ball: BallState
  elapsedMs: number
  falls: number
  sessionScore: number
  levelStarsCollected: number
  levelStarTotal: number
  flawlessRun: boolean
  guideRoute: Vec2[]
}