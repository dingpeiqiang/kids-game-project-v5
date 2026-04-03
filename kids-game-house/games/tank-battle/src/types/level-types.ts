// ============================================================================
// 🎮 坦克大战 - 关卡系统类型定义
// ============================================================================
// 
// 📌 说明:
//   定义坦克大战关卡系统的标准类型（简化版，后续从 frame-factory 导入）
// ============================================================================

/**
 * ⭐ 关卡基础信息接口
 */
export interface ILevelInfo {
  /** 关卡唯一标识符 */
  id: string
  
  /** 关卡显示名称 */
  name: string
  
  /** 关卡描述 */
  description?: string
  
  /** 难度等级 */
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  
  /** 推荐玩家等级 */
  recommendedLevel?: number
  
  /** 前置关卡 ID 列表 */
  prerequisites?: string[]
  
  /** 缩略图 URL */
  thumbnailUrl?: string
}

/**
 * ⭐ 目标奖励接口
 */
export interface IObjectiveReward {
  /** 分数奖励 */
  score?: number
  
  /** 金币/货币奖励 */
  currency?: number
  
  /** 道具奖励 ID 列表 */
  items?: string[]
  
  /** 解锁内容 ID 列表 */
  unlocks?: string[]
}

/**
 * ⭐ 关卡目标接口
 */
export interface ILevelObjective {
  /** 目标唯一标识符 */
  id: string
  
  /** 目标类型 */
  type: string
  
  /** 目标描述文本 */
  description: string
  
  /** 目标数值 */
  targetValue: number
  
  /** 当前进度（运行时使用） */
  currentProgress?: number
  
  /** 是否已完成（运行时使用） */
  completed?: boolean
  
  /** 目标权重 */
  weight?: number
  
  /** 完成奖励 */
  reward?: IObjectiveReward
}

/**
 * ⭐ 胜利条件接口
 */
export interface IVictoryCondition {
  /** 胜利条件类型 */
  type: 'all_objectives' | 'any_objective' | 'score_threshold' | 'custom'
  
  /** 条件描述 */
  description?: string
  
  /** 阈值 */
  threshold?: number
}

/**
 * ⭐ 失败条件接口
 */
export interface IFailureCondition {
  /** 失败条件类型 */
  type: 'no_lives' | 'time_up' | 'base_destroyed' | 'custom'
  
  /** 条件描述 */
  description?: string
}

/**
 * ⭐ 星级评价标准接口
 */
export interface IStarCriterion {
  /** 星级（1-3） */
  stars: 1 | 2 | 3
  
  /** 所需分数阈值 */
  scoreThreshold?: number
  
  /** 所需完成度（0-1） */
  completionThreshold?: number
  
  /** 时间奖励阈值（秒） */
  timeBonusThreshold?: number
}

/**
 * ⭐ 资源配置接口
 */
export interface ILevelResources {
  /** 背景图片资源 ID 列表 */
  backgrounds?: string[]
  
  /** 角色/敌人精灵 ID 列表 */
  sprites?: string[]
  
  /** 音效资源 ID 列表 */
  soundEffects?: string[]
  
  /** 背景音乐 ID 列表 */
  musicTracks?: string[]
  
  /** 其他资源 */
  others?: string[]
  
  /** 资源加载策略 */
  loadStrategy?: {
    /** 预加载策略 */
    preload: 'immediate' | 'on_demand' | 'lazy'
    /** 资源优先级 */
    priority?: 'critical' | 'high' | 'normal' | 'low'
    /** 内存缓存策略 */
    cache?: boolean
    /** 加载失败重试次数 */
    retry?: number
  }
}

/**
 * ⭐ 通用关卡配置接口
 */
export interface ILevelConfig<T = any> {
  /** 关卡基本信息 */
  info: ILevelInfo
  
  /** 关卡目标列表 */
  objectives: ILevelObjective[]
  
  /** 关卡参数配置 - 游戏特定 */
  params: T
  
  /** 初始游戏状态 */
  initialState?: any
  
  /** 胜利条件 */
  victoryCondition: IVictoryCondition
  
  /** 失败条件列表 */
  failureConditions?: IFailureCondition[]
  
  /** 时间限制（秒） */
  timeLimit?: number
  
  /** 星级评价标准 */
  starCriteria?: IStarCriterion[]
  
  /** 基础奖励配置 */
  baseRewards?: IObjectiveReward
  
  /** 资源配置 */
  resources?: ILevelResources
}

/**
 * ⭐ 关卡结果接口
 */
export interface ILevelResult {
  /** 是否成功 */
  success: boolean
  
  /** 完成度（0-1） */
  completion: number
  
  /** 获得分数 */
  score: number
  
  /** 获得星级（0-3） */
  stars: 0 | 1 | 2 | 3
  
  /** 获得奖励 */
  rewards: IObjectiveReward
  
  /** 用时（秒） */
  timeUsed: number
  
  /** 统计数据 */
  statistics: Record<string, any>
}

/**
 * ⭐ 坦克大战关卡特定参数
 */
export interface ITankLevelParams {
  /** 敌人总数 */
  enemyCount: number

  /** 敌人生成间隔（毫秒） */
  spawnInterval: number

  /** 敌人类型列表 */
  enemyTypes: Array<'light' | 'medium' | 'heavy' | 'boss'>

  /** 时间限制（秒） */
  timeLimit: number

  /** 玩家生命数 */
  playerLives: number

  /** 玩家速度 */
  playerSpeed: number

  /** 子弹基础伤害 */
  bulletDamage: number

  /** 地图布局类型 */
  mapLayout: 'training' | 'forest' | 'steel' | 'desert' | 'final'

  /** 墙壁密度（0-1） */
  wallDensity: number

  /** 道具生成率（0-1） */
  powerUpRate: number

  /** 是否为 Boss 关卡 */
  hasBoss?: boolean

  /** Boss 出现时间（秒） */
  bossSpawnTime?: number

  /** Boss 生命值 */
  bossHealth?: number

  /** Boss 伤害值 */
  bossDamage?: number

  /** 钢铁墙壁比例（0-1） */
  steelWallRatio?: number

  /** 是否启用多出生点 */
  multiSpawnPoints?: boolean

  /** 出生点数量 */
  spawnPointCount?: number
}

/**
 * ⭐ 坦克大战关卡配置
 */
export type ITankLevelConfig = ILevelConfig<ITankLevelParams>

/**
 * ⭐ 坦克大战解析后的关卡数据
 */
export interface ITankLevelData {
  /** 敌人配置列表 */
  enemies: Array<{
    type: 'light' | 'medium' | 'heavy'
    count: number
    spawnPoints: { x: number, y: number }[]
  }>
  
  /** 墙壁配置列表 */
  walls: Array<{
    x: number
    y: number
    type: 'brick' | 'steel'
  }>
  
  /** 道具配置列表 */
  powerUps: Array<{
    x: number
    y: number
    type: 'gun' | 'shield' | 'life' | 'clock' | 'star'
  }>
  
  /** 基地位置 */
  base: {
    x: number
    y: number
  }
  
  /** 关卡参数配置 */
  config: ITankLevelParams
}

/**
 * ⭐ 坦克大战关卡阶段（扩展标准阶段）
 */
export enum TankLevelPhase {
  // 标准阶段（复用 frame-factory）
  NOT_STARTED = 'not_started',
  UNLOCK_VALIDATING = 'unlock_validating',
  RESOURCES_LOADING = 'resources_loading',
  CONFIG_PARSING = 'config_parsing',
  LEVEL_SPAWNING = 'level_spawning',
  RUNNING = 'running',
  SETTLING = 'settling',
  COMPLETED = 'completed',
  
  // 坦克大战特定阶段
  ENEMY_SPAWNING = 'enemy_spawning',  // 敌人生成中
  BASE_DEFENDING = 'base_defending',   // 基地防御中
}

/**
 * ⭐ 坦克大战关卡事件
 */
export interface ITankLevelEvent {
  /** 当前阶段 */
  phase: TankLevelPhase | string
  
  /** 进度（0-1） */
  progress: number
  
  /** 消息文本 */
  message: string
  
  /** 附加数据 */
  data?: any
}

/**
 * ⭐ 坦克大战关卡结果（扩展标准结果）
 */
export interface ITankLevelResult extends ILevelResult {
  /** 击毁敌人数量 */
  enemiesDestroyed: number

  /** 基地是否存活 */
  baseAlive: boolean

  /** 剩余时间（秒） */
  timeRemaining: number

  /** 使用的道具数量 */
  powerUpsUsed: number

  /** 坦克大战特定统计 */
  statistics: {
    shotsFired: number
    accuracy: number
    damageTaken: number
    maxCombo: number
  }
}

// ============================================================================
// ⭐ 特殊事件系统类型
// ============================================================================

/**
 * ⭐ 特殊事件类型枚举
 */
export enum SpecialEventType {
  /** 空投道具 */
  AIRDROP = 'airdrop',
  /** 敌人增援 */
  REINFORCEMENT = 'reinforcement',
  /** 波次攻击 */
  WAVE_ATTACK = 'wave_attack',
  /** Boss 警告 */
  BOSS_WARNING = 'boss_warning',
  /** Boss 出现 */
  BOSS_SPAWN = 'boss_spawn',
  /** Boss 狂暴 */
  BOSS_ENRAGED = 'boss_enraged',
  /** 冰冻所有敌人 */
  FREEZE_ALL = 'freeze_all',
  /** 全屏炸弹 */
  SCREEN_BOMB = 'screen_bomb'
}

/**
 * ⭐ 特殊事件配置
 */
export interface ISpecialEventConfig {
  /** 事件唯一 ID */
  id: string
  /** 事件类型 */
  type: SpecialEventType
  /** 触发时间（秒） */
  triggerTime: number
  /** 事件描述 */
  description: string
  /** 事件奖励/效果 */
  reward: ISpecialEventReward
  /** 是否已触发 */
  triggered?: boolean
}

/**
 * ⭐ 特殊事件奖励/效果
 */
export interface ISpecialEventReward {
  /** 奖励类型 */
  type?: string
  /** 敌人类型 */
  enemyType?: 'light' | 'medium' | 'heavy' | 'boss'
  /** 敌人数量 */
  count?: number
  /** Boss 类型 */
  bossType?: string
  /** Boss 生命值 */
  health?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 速度倍率 */
  speedMultiplier?: number
  /** 伤害倍率 */
  damageMultiplier?: number
}

// ============================================================================
// ⭐ Boss 系统类型
// ============================================================================

/**
 * ⭐ Boss 类型
 */
export interface IBossConfig {
  /** Boss 类型 ID */
  type: string
  /** 生命值 */
  health: number
  /** 伤害值 */
  damage: number
  /** 移动速度 */
  speed: number
  /** 射击间隔 */
  shootInterval: number
  /** 纹理名称 */
  textures: {
    up: string
    down: string
    left: string
    right: string
  }
  /** 特殊技能列表 */
  specialSkills?: IBossSkill[]
}

/**
 * ⭐ Boss 技能
 */
export interface IBossSkill {
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 触发血量阈值（百分比） */
  triggerAtHealthPercent: number
  /** 冷却时间（秒） */
  cooldown: number
  /** 效果类型 */
  effectType: 'spread_shot' | 'dash' | 'summon' | 'shield' | 'enrage'
  /** 效果参数 */
  effectParams?: Record<string, any>
}

// ============================================================================
// ⭐ 星级评价系统类型
// ============================================================================

/**
 * ⭐ 星级评价结果
 */
export interface IStarRatingResult {
  /** 获得星级（0-3） */
  stars: 0 | 1 | 2 | 3
  /** 是否达成特殊条件 */
  specialConditionMet: boolean
  /** 评价详情 */
  details: {
    scoreAchieved: number
    scoreThreshold: number
    completionRate: number
    timeBonus: number
  }
}

// ============================================================================
// ⭐ 关卡进度系统类型
// ============================================================================

/**
 * ⭐ 关卡进度记录
 */
export interface ILevelProgress {
  /** 关卡 ID */
  levelId: string
  /** 是否已解锁 */
  unlocked: boolean
  /** 是否已完成 */
  completed: boolean
  /** 最高星级 */
  bestStars: 0 | 1 | 2 | 3
  /** 最高分数 */
  bestScore: number
  /** 最快通关时间（秒） */
  bestTime: number
  /** 完成次数 */
  completedCount: number
}


