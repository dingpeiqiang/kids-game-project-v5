// RPG Shooter 塔防融合版 - 类型定义

// 资源系统
export interface Resources {
  crystals: number    // 能量水晶 - 建造炮台
  energy: number      // 能量值 - 释放技能
  score: number       // 分数
  kills: number       // 击杀数
}

// 炮台类型枚举
export type TurretType = 'laser' | 'missile' | 'frost' | 'lightning'

// 城墙类型
export type WallType = 'stone' | 'reinforced' | 'fortress'

// 炮台接口
export interface Turret {
  id: string
  type: TurretType
  level: number
  x: number
  y: number
  hp: number
  maxHp: number
  damage: number
  fireRate: number      // 毫秒
  range: number
  lastShot: number      // 上次射击时间戳
  target: Enemy | null
  angle: number         // 炮台朝向角度
}

// 城墙接口
export interface Wall {
  id: string
  type: WallType
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  level: number
  lastHit: number       // 上次被攻击时间
  flashTimer: number    // 受伤闪烁计时器
}

// 炮台配置
export interface TurretConfig {
  cost: number
  damage: number
  fireRate: number
  range: number
  hp: number
  targetPriority: 'nearest' | 'strongest' | 'weakest' | 'first'
  special?: string      // 特殊能力描述
  upgradePath: TurretUpgrade[]
}

// 炮台升级路径
export interface TurretUpgrade {
  level: number
  cost: number
  damage?: number
  fireRate?: number
  range?: number
  hp?: number
  special?: string
}

// 陷阱类型
export type TrapType = 'mine' | 'slowField' | 'spike'

// 陷阱接口
export interface Trap {
  id: string
  type: TrapType
  x: number
  y: number
  damage?: number       // 伤害值（地雷、地刺）
  radius?: number       // 影响半径
  duration?: number     // 持续时间（秒）
  triggered: boolean    // 是否已触发（一次性陷阱）
  triggerTimer: number  // 触发计时器
  slowFactor?: number   // 减速系数
}

// 敌人接口（增强版）
export interface Enemy {
  id: string
  type: EnemyType
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number     // 基础速度（用于减速恢复）
  damage: number        // 对炮台的伤害
  score: number
  crystals: number      // 掉落水晶数
  color: string
  shape: string
  frozen: boolean       // 是否被冻结
  frozenTimer: number   // 冻结剩余时间
  slowed: boolean       // 是否被减速
  slowTimer: number     // 减速剩余时间
  pathIndex: number     // 当前路径点索引
  targetTurret: Turret | null  // 自爆虫的目标炮台
  
  // 射击能力
  canShoot: boolean     // 是否可以射击
  shootCooldown: number // 射击冷却时间（毫秒）
  lastShot: number      // 上次射击时间
  shootRange: number    // 射击范围
}

// 敌人类型
export type EnemyType = 'basic' | 'fast' | 'tank' | 'exploder' | 'splitter' | 'flyer' | 'boss'

// 投射物（子弹/导弹等）
export interface Projectile {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  range: number         // 射程
  traveled: number      // 已飞行距离
  homing: boolean       // 是否追踪
  target: Enemy | null
  explosionRadius?: number  // 爆炸半径（导弹）
  chainCount?: number   // 连锁次数（闪电）
  chainRange?: number   // 连锁范围
  hitEnemies: Set<string>  // 已击中的敌人ID（防止重复伤害）
}

// 敌人子弹
export interface EnemyBullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  speed: number
  color: string
  size: number
  owner: string         // 发射者ID
  aoeRadius?: number    // 范围伤害半径（可选）
}

// 粒子特效
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

// 浮动文字
export interface FloatText {
  text: string
  x: number
  y: number
  life: number
  color: string
  size: number
  vy: number
}

// 波次信息
export interface WaveInfo {
  waveNumber: number
  duration: number      // 波次持续时间（秒）
  breakTime: number     // 休息时间（秒）
  enemies: WaveEnemyConfig[]
  boss?: boolean
}

// 波次敌人配置
export interface WaveEnemyConfig {
  type: EnemyType
  count: number
  spawnInterval: number  // 生成间隔（毫秒）
}

// 建造模式
export interface BuildMode {
  active: boolean       // 是否处于建造模式
  selectedTurret: TurretType | null  // 选中的炮台类型
  selectedTrap?: TrapType | null     // 选中的陷阱类型
  turretType: TurretType | null
  previewX: number
  previewY: number
  canPlace: boolean
  reason?: string       // 不能建造的原因
  buildTab: 'turret' | 'trap'  // 当前标签页（炮台/陷阱）
}

// 玩家角色
export interface Player {
  x: number
  y: number
  hp: number
  maxHp: number
  lives: number         // 剩余生命（复活次数）
  level: number
  exp: number
  expToLevel: number
  atk: number
  speed: number
  invincible: number    // 无敌时间
  hitLock: number       // 受伤锁定，防止同帧多次扣命
  shootAngle: number
  lastShot: number
}

// 游戏主状态
export interface GameState {
  // 基础信息
  wave: number
  waveInProgress: boolean
  breakTime: number     // 休息时间倒计时
  timeLeft: number      // 当前波次剩余时间
  resources: Resources

  // 角色
  player: Player

  // 塔防系统
  turrets: Turret[]
  traps: Trap[]
  walls: Wall[]  // 城墙数组
  projectiles: Projectile[]
  enemyBullets: EnemyBullet[]  // 敌人子弹

  // 敌人
  enemies: Enemy[]
  enemySpawnQueue: { type: EnemyType; delay: number }[]
  spawnTimer: number

  // 特效
  particles: Particle[]
  floatTexts: FloatText[]

  // 连击系统
  combo: {
    count: number       // 连击数
    timer: number       // 连击计时器
    maxCombo: number    // 最高连击记录
  }

  // 屏幕震动
  screenShake: {
    intensity: number   // 震动强度
    duration: number    // 持续时间
  }

  // UI状态
  buildMode: BuildMode
  selectedTurret: Turret | null

  // 游戏流程
  gameStarted: boolean
  gameEnded: boolean
  gameEndProcessed: boolean  // 游戏结束是否已处理（避免重复调用onEnd）
  elapsed: number       // 总游戏时间
  difficulty: number    // 难度系数

  // 屏幕特效
  shakeAmt: number
  screenFlash: number

  // 背景星星
  stars: { x: number; y: number; speed: number; size: number; bright: number }[]

  // === 新增：输入控制 ==
  keys: { [k: string]: boolean }  // 键盘按键状态
  joystick: {  // 虚拟摇杆状态
    active: boolean
    dx: number; dy: number
    baseX: number; baseY: number
    touchId: number | null
  }

  // == 新增：射击状态 ==
  lastShootTime: number  // 上次射击时间
}

// 炮台统计数据（用于UI显示）
export interface TurretStats {
  type: TurretType
  name: string
  icon: string
  description: string
  config: TurretConfig
}
