// === 太空射击类型定义 ===

/** 变身形态类型 */
export type TransformType = 'super' | 'fire' | 'ice' | 'lightning' | 'dark'

/** 变身状态 */
export interface TransformState {
  type: TransformType
  duration: number      // 剩余持续时间(ms)
  maxDuration: number   // 最大持续时间(ms)
  level: number         // 变身等级（影响效果）
}

/** 子弹 */
export interface Bullet {
  x: number; y: number; vx: number; vy: number; pierce: number; originX?: number
}

/** 敌方子弹 */
export interface EnemyBullet {
  x: number; y: number; vx: number; vy: number; color: string
}

/** 敌人行为类型 */
export type EnemyBehavior = 'straight' | 'zigzag' | 'sine' | 'split' | 'shield'

/** 敌人 */
export interface Enemy {
  x: number; y: number; w: number; h: number
  hp: number; maxHp: number; score: number
  color: string; shape: string; speed: number; shootTimer: number
  behavior?: EnemyBehavior
  phaseX?: number       // 横向相位（sine/zigzag 用）
  shieldHP?: number     // 护盾剩余次数
  /** 关卡 Boss 的唯一 ID（Lv1~9），用于个性化行为和渲染 */
  bossId?: number
  /** Boss 阶段（用于多阶段血量变化），0 = 满血阶段 */
  bossPhase?: number
  /** Boss 计时器（用于特殊移动/攻击节奏） */
  bossTimer?: number
  /** Boss 移动方向 */
  bossDir?: number
  /** Boss 技能状态 */
  bossShieldTimer?: number  // 护盾冷却计时器(ms)
  bossHasShield?: boolean   // 是否正在护盾中
  bossBurstTimer?: number   // 爆发状态计时器(ms)
}

/** 粒子 */
export interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; color: string; size: number
}

/** 冲击波 */
export interface Shockwave {
  x: number; y: number; radius: number; maxRadius: number; life: number; color: string
}

/** 浮动文字 */
export interface FloatText {
  text: string; x: number; y: number; life: number
  color: string; size: number; vy: number; scale: number
}

/** 道具 */
export interface Powerup {
  x: number; y: number; vx: number; vy: number; type: string; life: number
}

/** 炮台类型 */
export type TurretType = 'normal' | 'wide' | 'sniper' | 'burst'

/** 自动炮台 */
export interface Turret {
  x: number; y: number
  life: number        // 剩余存活时间(ms)
  shootTimer: number  // 射击计时器
  radius: number      // 范围伤害半径
  damage: number      // 每次伤害
  type: TurretType    // 炮台类型
  lastAttackTime: number // 上次攻击时间(用于burst类型)
}

/** 导弹 */
export interface Missile {
  x: number; y: number
  vx: number; vy: number
  targetX: number; targetY: number
  damage: number
  radius: number      // 爆炸半径
}

/** 闪电球 */
export interface LightningBall {
  x: number; y: number
  vx: number; vy: number
  damage: number
  life: number        // 剩余存活时间(ms)
  size: number        // 闪电球大小
  color: string       // 颜色
}

/** 星星 */
export interface Star {
  x: number; y: number; speed: number; size: number; bright: number
}

/** 敌人类型模板 */
export interface EnemyType {
  w: number; h: number; hp: number; score: number
  color: string; shape: string; speed: number; behavior: EnemyBehavior
}

/** 关卡配置 */
export interface LevelCfg {
  spawnMs: number
  weights: [number, number, number, number, number, number, number, number]
  hpBonus: number
  spdMul: number
  bossRate: number
  label: string
  desc: string
}

/** 渲染器需要的场景状态（renderer 通过此接口访问，不依赖 Scene 类） */
export interface SceneState {
  ctx: CanvasRenderingContext2D
  /** 移动端降画质：减少 shadowBlur 等 */
  renderQuality?: 'high' | 'low'
  gameEnded: boolean; gameWon: boolean; gameStarted: boolean
  isDying: boolean
  shakeAmt: number; screenFlash: number; damageFlash: number
  difficulty: number; combo: number; totalKills: number
  playerX: number; playerY: number
  playerHP: number; maxHP: number; invincible: number; shieldTimer: number; respawnsLeft: number
  stars: Star[]; enemies: Enemy[]; bullets: Bullet[]
  enemyBullets: EnemyBullet[]; particles: Particle[]
  shockwaves: Shockwave[]; floatTexts: FloatText[]; powerups: Powerup[]; turrets: Turret[]
  tripleShot: number; tripleStacks: number
  spreadShot: number; spreadStacks: number
  rapidShot: number; rapidStacks: number
  laserShot: number; laserStacks: number
  pierceShot: number; pierceStacks: number
  lightningShot: number; lightningStacks: number; lightningTimer: number
  
  // 变身系统
  transform: TransformState | null
  transformCooldown: number  // 变身冷却时间(ms)
  
  getPlayerLevel: () => number
  getPowerupLevel: () => number
  getScore: () => number
  isVictory: () => boolean
}