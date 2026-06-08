export interface Position {
  x: number
  y: number
  z: number
}

export interface Size {
  width: number
  height: number
  depth: number
}

export interface Player {
  position: Position
  rotation: number
  size: Size
  level: number
  experience: number
  experienceToNextLevel: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  strength: number
  agility: number
  constitution: number
  perception: number
  attackSpeed: number
  moveSpeed: number
  equippedWeapon: Equipment | null
  equippedArmor: Equipment | null
  equippedAccessory: Equipment | null
  skills: Skill[]
  inventory: Equipment[]
  lastAttackTime: number
  isMoving: boolean
  isAttacking: boolean
  isDead: boolean
  invincibleTime: number
  gold: number
}

export interface Enemy {
  id: string
  position: Position
  rotation: number
  size: Size
  type: 'normal' | 'elite' | 'boss'
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  attackRange: number
  aggroRange: number
  behavior: 'patrol' | 'chase' | 'attack' | 'idle'
  lastAttackTime: number
  patrolPoints: Position[]
  currentPatrolIndex: number
  damage: number
  score: number
  lootTable: LootItem[]
  isBoss: boolean
  phase: number
  maxPhase: number
  attackPatterns: string[]
  currentPattern: number
}

export interface Equipment {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory'
  rarity: 'common' | 'uncommon' | 'rare'
  stats: EquipmentStats
  icon: string
  description: string
}

export interface EquipmentStats {
  strength?: number
  agility?: number
  constitution?: number
  perception?: number
  attack?: number
  defense?: number
  maxHp?: number
  maxMp?: number
  attackSpeed?: number
  moveSpeed?: number
}

export interface Skill {
  id: string
  name: string
  icon: string
  level: number
  maxLevel: number
  cooldown: number
  currentCooldown: number
  damage: number
  manaCost: number
  description: string
  unlocked: boolean
}

export interface LootItem {
  type: 'equipment' | 'gold' | 'potion' | 'experience'
  equipment?: Equipment
  goldAmount?: number
  experienceAmount?: number
  potionType?: 'health' | 'mana'
  potionAmount?: number
  chance: number
}

export interface DungeonTile {
  x: number
  y: number
  type: 'floor' | 'wall' | 'door' | 'trap' | 'chest' | 'switch' | 'stairs' | 'boss'
  explored: boolean
  visible: boolean
}

export interface DungeonRoom {
  x: number
  y: number
  width: number
  height: number
  center: Position
  connections: { x: number; y: number }[]
}

export interface Trap {
  id: string
  position: Position
  type: 'spike' | 'fire' | 'ice' | 'poison'
  active: boolean
  damage: number
  cooldown: number
  lastActivated: number
  triggered: boolean
}

export interface Chest {
  id: string
  position: Position
  opened: boolean
  loot: LootItem[]
  rarity: 'common' | 'rare'
}

export interface Switch {
  id: string
  position: Position
  activated: boolean
  targetDoorId: string
}

export interface Door {
  id: string
  position: Position
  opened: boolean
  locked: boolean
}

export interface DungeonLevel {
  level: number
  width: number
  height: number
  tiles: DungeonTile[][]
  rooms: DungeonRoom[]
  enemies: Enemy[]
  traps: Trap[]
  chests: Chest[]
  switches: Switch[]
  doors: Door[]
  boss: Enemy | null
  stairsPosition: Position
  playerStartPosition: Position
}

export interface GameState {
  currentLevel: number
  dungeon: DungeonLevel | null
  player: Player
  isPaused: boolean
  isGameOver: boolean
  isVictory: boolean
  score: number
  totalKills: number
  goldCollected: number
  stats: GameStats
}

export interface GameStats {
  monstersKilled: number
  damageDealt: number
  damageTaken: number
  healingDone: number
  potionsUsed: number
  chestsOpened: number
  trapsTriggered: number
  levelsCompleted: number
}

export interface DamageNumber {
  id: string
  position: Position
  value: number
  color: string
  life: number
  maxLife: number
  velocity: { x: number; y: number }
  isCritical: boolean
}

export interface ParticleEffect {
  id: string
  position: Position
  velocity: { x: number; y: number; z: number }
  color: string
  size: number
  life: number
  maxLife: number
  type: 'damage' | 'heal' | 'explosion' | 'loot' | 'skill'
}

export interface SaveData {
  player: Player
  currentLevel: number
  highestLevel: number
  totalScore: number
  totalKills: number
  totalGold: number
  collectedEquipment: Equipment[]
  lastPlayed: string
}

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attack: boolean
  skill: boolean
  interact: boolean
  reset: boolean
  zoomIn: boolean
  zoomOut: boolean
}

export interface CameraState {
  x: number
  y: number
  z: number
  zoom: number
  targetZoom: number
}

export interface UIState {
  showInventory: boolean
  showSkills: boolean
  showMap: boolean
  showLevelUp: boolean
  showVictory: boolean
  showGameOver: boolean
  notification: string | null
  notificationType: 'info' | 'success' | 'warning' | 'error'
}