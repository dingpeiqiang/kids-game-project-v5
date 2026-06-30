// ============ 角色基类 ============
export type ClassType = 'swordsman' | 'fighter' | 'archer' | 'mage' | 'gunner'

export interface Player {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  level: number
  exp: number
  expToNext: number
  attackPower: number
  attackSpeed: number
  moveSpeed: number
  facingRight: boolean
  invincible: number

  // 攻击状态
  attacking: boolean
  attackStep: number
  attackTimer: number
  lastAttackTime: number

  // 技能状态
  skills: SkillInstance[]
  skill1Cooldown: number
  skill2Cooldown: number
  skill3Cooldown: number
  skill4Cooldown: number
  usingSkill1: boolean
  usingSkill2: boolean
  usingSkill3: boolean
  usingSkill4: boolean
  skillTimer: number

  // 受击状态
  hitStun: number
  knockedDown: boolean
  knockdownTimer: number

  // 移动状态
  dashing: boolean
  dashTimer: number
  dashCooldown: number
  walkFrame: number  // 走路动画帧计数

  classType: ClassType

  // 生命值（复活次数）
  lives: number
}

// ============ 技能系统 ============
export interface SkillInstance {
  id: string
  name: string
  level: number
  maxLevel: number
  cooldown: number
  currentCooldown: number
  mpCost: number
  damage: number
  range: number
  knockback: number
  launchHeight: number
  aoeRadius: number
  duration: number
  spCost: number
  description: string
  icon: string
  unlockLevel: number
}

export interface SkillDef {
  id: string
  name: string
  icon: string
  unlockLevel: number
  maxLevel: number
  baseCooldown: number
  baseMpCost: number
  baseDamage: number
  baseRange: number
  baseKnockback: number
  launchHeight: number
  aoeRadius: number
  duration: number
  spCost: number
  description: string
  // 每级成长
  damagePerLevel: number
  rangePerLevel: number
  cooldownPerLevel: number
}

export interface ClassConfig {
  id: ClassType
  name: string
  description: string
  baseAtk: number
  baseSpeed: number
  baseAttackSpeed: number
  baseMp: number
  baseHp: number
  skills: SkillDef[]
  color: string
  accentColor: string
  icon: string
}

// ============ 敌人系统 ============
export interface Enemy {
  id: number
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  mp: number
  speed: number
  attackPower: number
  type: 'normal' | 'elite' | 'boss' | 'ranged'
  name: string
  isGrounded: boolean

  // AI
  behavior: 'idle' | 'walk' | 'chase' | 'attack' | 'hit' | 'die' | 'skill'
  behaviorTimer: number
  attackTimer: number
  attackRange: number
  shootTimer: number
  shootInterval: number

  // 受击
  hitStun: number
  invincible: number
  knockedDown: boolean
  knockdownTimer: number
  airborn: boolean
  airbornVy: number
  recentlyHit: number
  chargeTimer: number

  // 精英/Boss
  color: string
  score: number
  phase: number
  maxPhase: number
  patterns: AttackPattern[]

  // 技能
  skills: EnemySkill[]
  skillCooldowns: number[]

  // 掉落
  dropTable: DropEntry[]
  // 移动能力
  canFly: boolean
  canJump: boolean
  canShoot: boolean
}

export interface EnemySkill {
  id: string
  name: string
  type: 'melee' | 'spread' | 'charge' | 'summon' | 'laser' | 'teleport'
  cooldown: number
  damage: number
  range: number
  duration: number
  phaseRequired: number
}

export interface AttackPattern {
  type: 'melee' | 'spread' | 'charge' | 'summon' | 'laser' | 'teleport'
  cooldown: number
  damage: number
  range: number
  duration?: number
}

export interface DropEntry {
  type: 'gold' | 'hpPotion' | 'mpPotion' | 'equipment'
  chance: number
  quantity?: number
  quality?: EquipmentQuality
}

// ============ 装备系统 ============
export type EquipmentQuality = 'white' | 'blue' | 'purple' | 'pink' | 'epic'
export const EQUIP_QUALITY_NAMES: Record<EquipmentQuality, string> = {
  white: '普通', blue: '高级', purple: '稀有', pink: '神器', epic: '史诗',
}
export const EQUIP_QUALITY_COLORS: Record<EquipmentQuality, string> = {
  white: '#CCCCCC', blue: '#4D96FF', purple: '#9B59B6', pink: '#FF69B4', epic: '#FFD700',
}

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory'

export interface Equipment {
  id: string
  name: string
  quality: EquipmentQuality
  slot: EquipmentSlot
  attackBonus: number
  defenseBonus: number
  speedBonus: number
  mpBonus: number
  hpBonus: number
  icon: string
  level: number // 装备等级
  enhanceLevel: number // 强化等级
  setBonus?: string // 套装效果
  description: string
}

export interface DropItem {
  id: number
  x: number
  y: number
  width: number
  height: number
  vy: number
  type: 'gold' | 'hpPotion' | 'mpPotion' | 'equipment'
  value?: number
  equipment?: Equipment
  life: number
}

// ============ 关卡/房间 ============
export type RoomType = 'normal' | 'boss' | 'treasure' | 'rest' | 'secret' | 'entry'

export interface DungeonRoom {
  id: number
  name: string
  width: number
  roomType: RoomType
  enemies: EnemySpawn[]
  hasBoss?: boolean
  bossConfig?: BossConfig
  bgColor: string
  groundColor: string
  decorations: Decoration[]
  platforms?: Platform[]
  obstacles?: Obstacle[]
  treasureRoom?: boolean
  /** 分支路径: 可前往的下一个房间ID列表（空数组表示终点房间） */
  branches?: number[]
  /** 进入该房间时的解锁条件（如需要钥匙） */
  entryCondition?: { type: 'key' | 'clear_all'; itemId?: string }
  /** 隐藏房间的发现条件 */
  secretCondition?: { type: 'hidden_wall' | 'clear_without_hit'; description: string }
  /** 宝箱房奖励 */
  reward?: { gold?: number; itemId?: string; exp?: number }
  /** 休息房效果 */
  restEffect?: { healPercent?: number; mpRestorePercent?: number }
}

export interface EnemySpawn {
  type: 'normal' | 'elite' | 'boss' | 'ranged'
  x: number
  y: number
  quantity: number
  spacing?: number
  behavior?: 'walk' | 'chase' | 'stationary'
  dropTable?: DropEntry[]
  specificEnemy?: string
}

export interface BossConfig {
  name: string
  hp: number
  mp: number
  width: number
  height: number
  attackPower: number
  speed: number
  color: string
  skills: EnemySkill[]
  patterns?: AttackPattern[]
  maxPhase: number
  dropTable: DropEntry[]
}

export interface Decoration {
  type: 'torch' | 'pillar' | 'chest' | 'barrel' | 'statue' | 'crystal' | 'bookshelf' | 'throne' | 'candle' | 'skull' | 'weapon_rack' | 'banner' | 'window'
  x: number
  y: number
  variant?: number
  state?: 'normal' | 'broken' | 'open'
}

// ============ 平台系统 ============
export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'stone' | 'wood' | 'ruin' | 'float' | 'magic'
}

export interface Obstacle {
  type: 'box' | 'barricade' | 'spikes' | 'breakable_wall' | 'hidden_wall' | 'crumbling_floor' | 'moving_block' | 'hidden_path'
  x: number
  y: number
  width: number
  height: number
  destructible: boolean
  hp?: number
  maxHp?: number
  state?: 'normal' | 'damaged' | 'broken' | 'hidden' | 'revealed'
  triggersSecret?: boolean
  secretReward?: string
}

export interface LevelConfig {
  id: number
  name: string
  description: string
  rooms: DungeonRoom[]
  minLevel: number
  rewardGold: number
}

// ============ 城镇系统 ============
export interface TownState {
  inTown: boolean
  npcs: Npc[]
  shopItems: Equipment[]
  selectedNpc: string | null
  enhanceTarget: Equipment | null
}

export interface Npc {
  id: string
  name: string
  type: 'shop' | 'enhance' | 'quest' | 'skill'
  x: number
  y: number
  icon: string
  dialogs: string[]
}

// ============ 战斗特效 ============
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
  pierce: boolean
  life: number
  maxLife: number
  trail: boolean
  owner: string
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
  shape: 'circle' | 'star' | 'spark' | 'text' | 'glow' | 'ring'
  text?: string
  rotation?: number
  rotationSpeed?: number
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
  type: 'damage' | 'heal' | 'combo' | 'exp' | 'gold' | 'system'
}

export interface ScreenShake {
  amount: number
  duration: number
}

// ============ 房间地图状态 ============
export type RoomNodeStatus = 'unknown' | 'current' | 'completed' | 'locked' | 'available'

export interface RoomGraphNode {
  roomId: number
  status: RoomNodeStatus
  /** 该节点连接到的子节点 roomId 列表 */
  children: number[]
}

export interface RoomGraph {
  /** 按房间ID索引的状态映射 */
  nodeMap: Map<number, RoomGraphNode>
  /** 入口房间ID */
  entryRoomId: number
  /** 当前房间ID */
  currentRoomId: number
}

// ============ 游戏状态 ============
export interface GameState {
  currentLevel: number
  currentRoom: number
  score: number
  gold: number
  player: Player
  enemies: Enemy[]
  drops: DropItem[]
  particles: Particle[]
  shockwaves: Shockwave[]
  floatTexts: FloatText[]
  bullets: Bullet[]
  inventory: Equipment[]
  equipped: {
    weapon: Equipment | null
    armor: Equipment | null
    accessory: Equipment | null
  }
  combo: number
  maxCombo: number
  lastHitTime: number
  shownComboMilestones: number[]
  currentDungeon: string

  // 战斗状态
  roomCleared: boolean
  roomClearTimer: number
  doorOpen: boolean
  bossActive: boolean
  bossPhase: number

  // 过渡
  levelTransition: boolean
  transitionTimer: number
  inTown: boolean
  townState: TownState | null

  // 旗帜
  inCharSelect: boolean
  selectedClass: ClassType | null
  gameOver: boolean
  victory: boolean
  paused: boolean
}

// ============ 输入 ============
export interface InputState {
  left: boolean
  right: boolean
  up: boolean      // 前进（在横版中通常与跳跃结合）
  down: boolean    // 下蹲/向后移动
  jump: boolean
  attack: boolean
  skill1: boolean
  skill2: boolean
  skill3: boolean
  skill4: boolean
  dash: boolean
  interact: boolean
  stickX: number
  stickY: number
}