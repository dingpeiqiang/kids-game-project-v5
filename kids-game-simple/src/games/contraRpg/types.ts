export interface Player {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  lives: number
  speed: number
  jumpForce: number
  vy: number
  vx: number
  isGrounded: boolean
  canDoubleJump: boolean
  facingRight: boolean
  invincible: number
  attackLevel: number
  shootCooldown: number
  lastShot: number
  isSliding: boolean
  slideTimer: number
  isCrouching: boolean
  consecutiveShots: number
  lastShotKeyUp: number
}

export interface Enemy {
  id: number
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  type: 'normal' | 'elite' | 'boss' | 'melee'
  name?: string // Boss 类型名称，用于差异化渲染
  speed: number
  vx: number
  vy: number
  shootTimer: number
  shootInterval: number
  behavior: 'walk' | 'jump' | 'shoot' | 'fly' | 'stationary'
  score: number
  color: string
  recentlyHit: number
  // Boss 专属字段
  attackPatterns?: { type: string; cooldown: number; damage: number; range: number; duration?: number }[]
  patternIndex?: number
  patternTimer?: number
  enteringArena?: boolean // boss 是否正在进入战斗区域
  isBossSpawned?: boolean // 是否是Boss召唤出来的敌人
  // 飞行敌人专属字段
  flyHeight?: number // 飞行高度
  patrolRange?: number // 巡逻范围
  patrolDir?: number // 巡逻方向
  patrolStartX?: number // 巡逻起始X坐标
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  isPlayerBullet: boolean
  color: string
  spawnDelayFrames?: number
  currentDelay?: number
}

export interface Powerup {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'hp' | 'maxHp' | 'rapid' | 'spread' | 'shield' | 'transform'
  vy: number
  icon: string
  color: string
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

export interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  color: string
}

export interface FloatText {
  text: string
  x: number
  y: number
  life: number
  maxLife: number
  color: string
  size: number
  vy: number
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'normal' | 'moving' | 'breakable'
}

export interface Trap {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'spike' | 'laser' | 'fire' | 'electric'
  active: boolean
  cooldown: number
  lastActivated: number
  damage: number
}

export interface LevelExit {
  x: number
  y: number
  width: number
  height: number
}

export interface Level {
  id: number
  name: string
  bgColor: string
  platforms: Platform[]
  enemySpawns: { type: 'normal' | 'elite'; x: number; delay: number }[]
  traps: { type: Trap['type']; x: number; y: number; width?: number; height?: number; cooldown?: number; damage?: number }[]
  hasBoss: boolean
  bossConfig?: BossConfig
  exit?: LevelExit
}

export interface BossConfig {
  hp: number
  width: number
  height: number
  attackPatterns: ('spread' | 'laser' | 'summon' | 'charge')[]
}

export interface GameState {
  currentLevel: number
  score: number
  player: Player
  enemies: Enemy[]
  bullets: Bullet[]
  powerups: Powerup[]
  particles: Particle[]
  shockwaves: Shockwave[]
  floatTexts: FloatText[]
  platforms: Platform[]
  traps: Trap[]
  cameraX: number
  isScrolling: boolean
  scrollSpeed: number
  gameStarted: boolean
  gamePaused: boolean
  gameOver: boolean
  victory: boolean
}
