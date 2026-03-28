// ============================================================================
// 🎮 游戏状态类型定义
// ============================================================================
// 
// 📌 说明:
//   定义游戏生命周期中的各种状态
//   用于游戏流程管理和状态切换
// ============================================================================

/**
 * ⭐ 游戏状态枚举
 * 
 * @remarks
 * 定义游戏的所有可能状态
 * 状态机模式的核心组成部分
 * 
 * @example
 * ```typescript
 * // 状态流转
 * GameState.INITIAL → GameState.LOADING → GameState.READY
 *                 → GameState.STARTING → GameState.PLAYING
 *                                     → GameState.PAUSED
 *                                     → GameState.GAME_OVER
 * ```
 */
export enum GameState {
  /** 初始状态 - 游戏刚创建 */
  INITIAL = 'initial',
  /** 加载中 - 正在加载资源 */
  LOADING = 'loading',
  /** 准备就绪 - 资源加载完成，等待开始 */
  READY = 'ready',
  /** 即将开始 - 倒计时或准备动画 */
  STARTING = 'starting',
  /** 游戏中 - 玩家正在游戏 */
  PLAYING = 'playing',
  /** 暂停中 - 游戏暂停 */
  PAUSED = 'paused',
  /** 游戏结束 - 玩家失败或通关 */
  GAME_OVER = 'game_over',
  /** 结算界面 - 显示分数和统计 */
  SETTLEMENT = 'settlement'
}

/**
 * ⭐ 游戏状态信息接口
 * 
 * @remarks
 * 包含当前游戏状态的详细信息
 */
export interface GameStateInfo {
  /** 当前状态 */
  currentState: GameState
  /** 上一状态 */
  previousState?: GameState
  /** 状态持续时间（毫秒） */
  stateDuration?: number
  /** 进入状态的时间戳 */
  enteredAt?: number
  /** 状态切换原因 */
  reason?: string
}

/**
 * ⭐ 游戏结束原因枚举
 * 
 * @remarks
 * 详细说明游戏结束的具体原因
 */
export enum GameOverReason {
  /** 撞墙 - 撞到边界 */
  COLLISION_WALL = 'collision_wall',
  /** 撞自己 - 撞到自身 */
  COLLISION_SELF = 'collision_self',
  /** 撞障碍物 - 撞到障碍物 */
  COLLISION_OBSTACLE = 'collision_obstacle',
  /** 时间到 - 超时 */
  TIME_UP = 'time_up',
  /** 生命耗尽 - 没有剩余生命 */
  NO_LIVES_LEFT = 'no_lives_left',
  /** 玩家主动退出 */
  PLAYER_QUIT = 'player_quit',
  /** 通关 - 完成所有关卡 */
  VICTORY = 'victory',
  /** 其他原因 */
  OTHER = 'other'
}

/**
 * ⭐ 游戏结果接口
 * 
 * @remarks
 * 游戏结束时的详细结果信息
 * 
 * @example
 * ```typescript
 * const result: GameResult = {
 *   finalScore: 1500,
 *   reason: GameOverReason.COLLISION_WALL,
 *   playTime: 180,
 *   itemsCollected: 45,
 *   comboAchieved: 12,
 *   isNewHighScore: true
 * }
 * ```
 */
export interface GameResult {
  /** 最终得分 */
  finalScore: number
  /** 游戏结束原因 */
  reason: GameOverReason
  /** 游戏时长（秒） */
  playTime: number
  /** 收集的物品数量 */
  itemsCollected?: number
  /** 最大连击数 */
  maxCombo?: number
  /** 是否刷新最高分 */
  isNewHighScore?: boolean
  /** 之前的最高分 */
  previousHighScore?: number
  /** 额外统计数据（由具体游戏定义） */
  extraStats?: Record<string, any>
}

/**
 * ⭐ 暂停配置接口
 * 
 * @remarks
 * 游戏暂停时的行为配置
 */
export interface PauseConfig {
  /** 暂停时是否停止背景音乐 */
  pauseMusic: boolean
  /** 暂停时是否停止音效 */
  pauseSFX: boolean
  /** 暂停时是否显示暂停菜单 */
  showPauseMenu: boolean
  /** 暂停菜单的透明度 (0-1) */
  menuOpacity?: number
  /** 是否允许在暂停时调整设置 */
  allowSettingsAdjustment?: boolean
}

/**
 * ⭐ 状态变更事件数据
 * 
 * @remarks
 * 当游戏状态改变时触发的事件数据
 */
export interface StateChangeEvent {
  /** 原状态 */
  fromState: GameState
  /** 新状态 */
  toState: GameState
  /** 切换原因 */
  reason?: string
  /** 附加数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
}
