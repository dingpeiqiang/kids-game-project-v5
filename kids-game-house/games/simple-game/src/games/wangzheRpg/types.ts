/** 技能配置 */
export interface SkillConfig {
  id: number
  damage: number
  radius: number
  duration: number
  cooldown: number
  color: string
  label: string
}

/** 玩家英雄 */
export interface Player {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  isDead: boolean
  respawnTimer: number
  hitFlashTimer: number
  facingAngle: number
  /** 简化朝向: 1=右, -1=左 */
  facingDir: number
  level: number
  exp: number
  expToNext: number
  attackAnimTimer: number
  skillCooldowns: number[]
  gold: number
  /** 动画计时器（每帧递增，用于驱动行走/待机动画） */
  animTimer: number
  /** 是否正在移动 */
  isMoving: boolean
  /** 技能释放动画计时器 */
  skillCastTimer: number
  /** 当前释放的技能ID */
  skillCastId: number
  /** 死亡动画计时器 */
  deathAnimTimer: number
}

/** 敌方AI */
export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  isDead: boolean
  respawnTimer: number
  hitFlashTimer: number
  aiState: 'patrol' | 'chase' | 'attack' | 'retreat' | 'lane'
  patrolDirX: number
  patrolDirY: number
  patrolTimer: number
  attackCooldown: number
  attackAnimTimer: number
  skillCooldowns: number[]
  level: number
  /** 当前所在分路 */
  currentLane: 'top' | 'mid' | 'bot'
  /** 简化朝向: 1=右, -1=左 */
  facingDir: number
  /** 动画计时器 */
  animTimer: number
  /** 是否正在移动 */
  isMoving: boolean
  /** 技能释放动画计时器 */
  skillCastTimer: number
  /** 死亡动画计时器 */
  deathAnimTimer: number
}

/** 分路类型 */
export type LaneType = 'top' | 'mid' | 'bot'

/** 小兵 */
export interface Minion {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  isDead: boolean
  team: 'player' | 'enemy'
  attackCooldown: number
  moveDir: number
  targetX: number
  targetY: number
  currentTarget: 'player' | 'enemy' | 'minion' | 'tower' | null
  targetIndex: number
  hitFlashTimer: number
  /** 所属分路 */
  lane: LaneType
}

/** 防御塔 */
export interface Tower {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  isDestroyed: boolean
  team: 'player' | 'enemy'
  attackCooldown: number
  attackRange: number
  attackDamage: number
  /** 层级: 1=外塔, 2=内塔, 3=高地塔, 4=基地 */
  tier: number
  /** 所在分路 */
  lane: LaneType | 'base'
}

/** 野怪 */
export interface NeutralCreep {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  isDead: boolean
  attackCooldown: number
  attackDamage: number
  respawnTimer: number
  type: 'small' | 'medium' | 'roshan'
  hitFlashTimer: number
}

/** 技能特效 */
export interface SkillEffect {
  x: number
  y: number
  radius: number
  maxRadius: number
  duration: number
  elapsed: number
  color: string
  skillId: number
}

/** 粒子 */
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

/** 浮动文字 */
export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  maxLife: number
}

/** 摇杆输入状态 */
export interface JoystickInput {
  active: boolean
  dirX: number
  dirY: number
}

/** 游戏状态 */
export interface GameState {
  worldWidth: number
  worldHeight: number
  player: Player
  enemy: Enemy
  minions: Minion[]
  towers: Tower[]
  neutralCreeps: NeutralCreep[]
  skillEffects: SkillEffect[]
  particles: Particle[]
  floatTexts: FloatText[]
  playerKills: number
  enemyKills: number
  gameStartTime: number
  remainingTime: number
  gameOver: boolean
  victory: boolean
  gameOverReason: string
  /** 小兵波次计时器 */
  minionWaveTimer: number
  /** 当前波次 */
  waveNumber: number
  /** 屏幕震动 */
  screenShake: number
}

/** 按钮状态 */
export interface ButtonState {
  attack: boolean
  skill1: boolean
  skill2: boolean
  skill3: boolean
}

/** 地图分路路径点 */
export interface LanePathPoint {
  x: number
  y: number
}