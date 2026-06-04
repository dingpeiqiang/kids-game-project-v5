// ============================================================================
// 🎮 关卡系统统一类型定义
// ============================================================================
// 
// 📌 说明:
//   所有游戏类型的关卡都必须遵循的统一规范
//   支持通过泛型实现游戏特定的扩展
// ============================================================================

/**
 * ⭐ 关卡基础信息接口
 */
export interface ILevelInfo {
  /** 关卡唯一标识符（如：snake_level_1） */
  id: string
  
  /** 关卡显示名称（如：森林入口） */
  name: string
  
  /** 关卡描述（可选） */
  description?: string
  
  /** 难度等级 */
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  
  /** 推荐玩家等级（可选） */
  recommendedLevel?: number
  
  /** 前置关卡 ID 列表（可选） */
  prerequisites?: string[]
  
  /** 缩略图 URL（可选） */
  thumbnailUrl?: string
}

/**
 * ⭐ 关卡目标接口
 */
export interface ILevelObjective {
  /** 目标唯一标识符 */
  id: string
  
  /** 目标类型（由具体游戏扩展） */
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
 * ⭐ 胜利条件接口
 */
export interface IVictoryCondition {
  /** 胜利条件类型 */
  type: 'all_objectives' | 'any_objective' | 'score_threshold' | 'custom'
  
  /** 条件描述 */
  description?: string
  
  /** 阈值（用于 score_threshold） */
  threshold?: number
  
  /** 自定义检查函数（运行时注入） */
  customCheck?: (gameState: any) => boolean
}

/**
 * ⭐ 失败条件接口
 */
export interface IFailureCondition {
  /** 失败条件类型 */
  type: 'no_lives' | 'time_up' | 'custom'
  
  /** 条件描述 */
  description?: string
  
  /** 自定义检查函数 */
  customCheck?: (gameState: any) => boolean
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
 * ⭐ GTRS资源映射接口
 */
export interface IGTRSResourceMapping {
  /** GTRS资源路径映射表：关卡资源ID -> GTRS路径 */
  [resourceId: string]: string
}

/**
 * ⭐ 关卡主题关联信息
 */
export interface ILevelThemeInfo {
  /** 主题ID */
  themeId: string
  
  /** 主题版本要求 */
  minThemeVersion?: string
  
  /** 主题作者 */
  themeAuthor?: string
  
  /** 主题兼容性检查结果 */
  compatibilityCheck?: {
    isValid: boolean
    missingResources: string[]
    resourceConflicts?: Array<{
      resourceId: string
      expectedPath: string
      actualPath: string
    }>
  }
}

/**
 * ⭐ 关卡资源配置接口（增强版）
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
  
  /** [新增] GTRS资源映射表 */
  gtrsResourceMapping?: IGTRSResourceMapping
  
  /** [新增] 资源加载策略 */
  loadStrategy?: {
    /** 预加载策略：immediate|on_demand|lazy */
    preload: 'immediate' | 'on_demand' | 'lazy'
    /** 资源优先级 */
    priority?: 'critical' | 'high' | 'normal' | 'low'
    /** 内存缓存策略 */
    cache?: boolean
    /** 加载失败重试次数 */
    retry?: number
  }
  
  /** [新增] 主题资源依赖 */
  themeDependencies?: string[]
}

/**
 * ⭐ GTRS版本兼容性信息
 */
export interface IGTRSCompatibility {
  /** 兼容的最小GTRS版本 */
  minGTRSVersion?: string
  
  /** 推荐使用的GTRS版本 */
  recommendedGTRSVersion?: string
  
  /** GTRS规范合规性检查结果 */
  gtrsCompliance?: {
    /** 是否通过GTRS规范检查 */
    passed: boolean
    /** 检查错误信息 */
    errors?: Array<{
      resourceId: string
      errorType: 'MISSING_PATH' | 'INVALID_PATH' | 'RESOURCE_NOT_FOUND' | 'VERSION_MISMATCH'
      message: string
    }>
    /** 警告信息 */
    warnings?: Array<{
      resourceId: string
      warningType: 'DEPRECATED_PATH' | 'LOW_QUALITY' | 'LARGE_SIZE'
      message: string
    }>
  }
}

/**
 * ⭐ 通用关卡配置接口（核心接口 - 增强版）
 * 
 * @typeParam T - 游戏特定参数类型
 */
export interface ILevelConfig<T = any> {
  /** 关卡基本信息 */
  info: ILevelInfo
  
  /** 关卡目标列表 */
  objectives: ILevelObjective[]
  
  /** 关卡参数配置 - 游戏特定 */
  params: T
  
  /** 初始游戏状态（可选） */
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
  
  /** 资源配置（每个关卡可以不同） */
  resources?: ILevelResources
  
  /** 主题 ID（用于加载对应主题资源） */
  themeId?: string
  
  /** [新增] GTRS规范兼容性信息 */
  gtrsCompatibility?: IGTRSCompatibility
  
  /** [新增] 关卡资源总览 */
  resourceOverview?: {
    /** 总资源数量 */
    totalResources: number
    /** 按类型统计资源数量 */
    byType: Record<string, number>
    /** 预计加载大小（KB） */
    estimatedSizeKB: number
    /** 加载时间预估（ms） */
    estimatedLoadTimeMS: number
  }
  
  /** [新增] 主题信息 */
  themeInfo?: ILevelThemeInfo
  
  /** [新增] 关卡资源校验信息 */
  resourceValidation?: {
    /** 最后校验时间戳 */
    lastValidated: number
    /** 校验状态 */
    status: 'VALID' | 'INVALID' | 'PENDING'
    /** 校验信息 */
    message?: string
    /** 校验器版本 */
    validatorVersion: string
  }
}

/**
 * ⭐ 关卡状态接口（运行时）
 */
export interface ILevelState {
  /** 当前关卡 ID */
  levelId: string
  
  /** 关卡是否正在进行 */
  isActive: boolean
  
  /** 关卡开始时间戳 */
  startTime: number
  
  /** 已用时间（秒） */
  elapsedTime: number
  
  /** 当前分数 */
  score: number
  
  /** 目标进度 Map */
  objectiveProgress: Map<string, number>
  
  /** 剩余生命/次数 */
  lives?: number
  
  /** 游戏运行时数据 */
  gameData: Record<string, any>
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
