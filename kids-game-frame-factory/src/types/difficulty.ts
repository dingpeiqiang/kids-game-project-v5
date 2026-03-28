// ============================================================================
// 🎮 难度系统类型定义
// ============================================================================
// 
// 📌 说明:
//   定义游戏难度相关的类型和接口
//   支持多难度级别和动态难度调整
// ============================================================================

/**
 * ⭐ 难度级别枚举
 * 
 * @remarks
 * 标准化的难度等级定义
 * 所有游戏应使用统一的难度标识
 */
export enum DifficultyLevel {
  /** 简单模式 - 适合新手 */
  EASY = 'easy',
  /** 普通模式 - 默认难度 */
  NORMAL = 'normal',
  /** 困难模式 - 适合高手 */
  HARD = 'hard',
  /** 自定义模式 - 用户自定义配置 */
  CUSTOM = 'custom'
}

/**
 * ⭐ 难度配置接口
 * 
 * @remarks
 * 定义每个难度级别的详细参数
 * 子类可以扩展此接口添加特定游戏的配置项
 * 
 * @example
 * ```typescript
 * const easyConfig: DifficultyConfig = {
 *   speed: 150,           // 较慢的速度
 *   initialLength: 3,     // 较短的初始长度
 *   normalScore: 10,      // 基础分数
 *   bonusScore: 50,       // 奖励分数
 *   specialScore: 100     // 特殊分数
 * }
 * ```
 */
export interface DifficultyConfig {
  /** 移动速度（像素/秒） */
  speed: number
  /** 初始长度（蛇的分节数或其他游戏的类似参数） */
  initialLength: number
  /** 普通物品得分 */
  normalScore?: number
  /** 奖励物品得分 */
  bonusScore?: number
  /** 特殊物品得分 */
  specialScore?: number
  
  // ========== 可扩展字段 ==========
  /** 生成概率（0-1），可选 */
  spawnRate?: number
  /** 障碍物数量，可选 */
  obstacleCount?: number
  /** AI 强度等级，可选 */
  aiLevel?: number
  /** 时间限制（秒），可选 */
  timeLimit?: number
  /** 生命值，可选 */
  lives?: number
  /** 其他游戏特定参数，可选 */
  [key: string]: any
}

/**
 * ⭐ 难度配置映射表
 * 
 * @remarks
 * 将所有难度级别映射到对应的配置
 */
export interface DifficultyConfigMap {
  [DifficultyLevel.EASY]: DifficultyConfig
  [DifficultyLevel.NORMAL]: DifficultyConfig
  [DifficultyLevel.HARD]: DifficultyConfig
  [DifficultyLevel.CUSTOM]?: DifficultyConfig
}

/**
 * ⭐ 动态难度调整配置
 * 
 * @remarks
 * 用于实现智能难度调节系统
 * 根据玩家表现自动调整游戏难度
 * 
 * @example
 * ```typescript
 * const dynamicConfig: DynamicDifficultyConfig = {
 *   enabled: true,              // 启用动态难度
 *   adjustmentInterval: 60,     // 每 60 秒调整一次
 *   performanceThresholds: {    // 表现阈值
 *     excellent: 0.8,           // 优秀：80% 成功率
 *     poor: 0.4                 // 较差：40% 成功率
 *   },
 *   maxAdjustment: 2            // 最大调整 2 个难度等级
 * }
 * ```
 */
export interface DynamicDifficultyConfig {
  /** 是否启用动态难度调整 */
  enabled: boolean
  /** 调整间隔（秒） */
  adjustmentInterval: number
  /** 表现评估阈值 */
  performanceThresholds: {
    /** 优秀阈值（高于此值提升难度） */
    excellent: number
    /** 较差阈值（低于此值降低难度） */
    poor: number
  }
  /** 最大单次调整幅度（难度等级数） */
  maxAdjustment: number
  /** 最小难度等级（防止过低） */
  minDifficulty?: DifficultyLevel
  /** 最大难度等级（防止过高） */
  maxDifficulty?: DifficultyLevel
}

/**
 * ⭐ 玩家表现统计
 * 
 * @remarks
 * 用于评估玩家当前表现的数据结构
 */
export interface PlayerPerformance {
  /** 当前得分 */
  score: number
  /** 游戏时长（秒） */
  playTime: number
  /** 成功率（0-1） */
  successRate: number
  /** 平均反应时间（毫秒） */
  avgReactionTime?: number
  /** 连击数 */
  combo?: number
  /** 死亡次数 */
  deaths?: number
  /** 收集物品数量 */
  itemsCollected?: number
}

/**
 * ⭐ 难度调整结果
 * 
 * @remarks
 * 动态难度调整后的结果信息
 */
export interface DifficultyAdjustmentResult {
  /** 原难度等级 */
  previousDifficulty: DifficultyLevel
  /** 新难度等级 */
  newDifficulty: DifficultyLevel
  /** 调整原因 */
  reason: string
  /** 玩家表现数据 */
  performance: PlayerPerformance
  /** 调整时间戳 */
  timestamp: number
}
