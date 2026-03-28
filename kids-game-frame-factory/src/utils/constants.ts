// ============================================================================
// 🎮 框架常量定义
// ============================================================================
// 
// 📌 说明:
//   定义框架中使用的各种常量
//   便于统一管理和维护
// ============================================================================

/**
 * ⭐ 框架版本信息
 */
export const FRAMEWORK_VERSION = '1.1.0'

/**
 * ⭐ 框架名称
 */
export const FRAMEWORK_NAME = 'kids-game-frame-factory'

/**
 * ⭐ 默认配置
 */
export const DEFAULT_CONFIG = {
  /** 默认网格列数 */
  GRID_COLS: 32,
  /** 默认网格行数 */
  GRID_ROWS: 18,
  /** 默认单元格大小（像素） */
  CELL_SIZE: 40,
  /** 默认难度级别 */
  DEFAULT_DIFFICULTY: 'normal',
  /** 默认帧率 */
  TARGET_FPS: 60,
  /** 默认音量（0-1） */
  DEFAULT_VOLUME: 0.5
} as const

/**
 * ⭐ 游戏状态相关常量
 */
export const GAME_STATE = {
  /** 初始状态 */
  INITIAL: 'initial',
  /** 加载中 */
  LOADING: 'loading',
  /** 准备就绪 */
  READY: 'ready',
  /** 即将开始 */
  STARTING: 'starting',
  /** 游戏中 */
  PLAYING: 'playing',
  /** 暂停中 */
  PAUSED: 'paused',
  /** 游戏结束 */
  GAME_OVER: 'game_over',
  /** 结算界面 */
  SETTLEMENT: 'settlement'
} as const

/**
 * ⭐ 难度级别常量
 */
export const DIFFICULTY = {
  /** 简单 */
  EASY: 'easy',
  /** 普通 */
  NORMAL: 'normal',
  /** 困难 */
  HARD: 'hard',
  /** 自定义 */
  CUSTOM: 'custom'
} as const

/**
 * ⭐ 方向常量
 */
export const DIRECTION = {
  /** 上 */
  UP: 'up',
  /** 下 */
  DOWN: 'down',
  /** 左 */
  LEFT: 'left',
  /** 右 */
  RIGHT: 'right'
} as const

/**
 * ⭐ 碰撞体类型常量
 */
export const COLLIDER_TYPE = {
  /** 圆形 */
  CIRCLE: 'circle',
  /** 矩形 */
  RECTANGLE: 'rectangle',
  /** 多边形 */
  POLYGON: 'polygon',
  /** 点 */
  POINT: 'point'
} as const

/**
 * ⭐ 组件生命周期常量
 */
export const COMPONENT_LIFECYCLE = {
  /** 初始化方法名 */
  INIT: 'init',
  /** 更新方法名 */
  UPDATE: 'update',
  /** 销毁方法名 */
  DESTROY: 'destroy',
  /** 事件处理方法名 */
  HANDLE_EVENT: 'handleEvent'
} as const

/**
 * ⭐ 性能相关常量
 */
export const PERFORMANCE = {
  /** 最大帧时间（毫秒）- 用于检测卡顿 */
  MAX_FRAME_TIME: 100,
  /** 最小帧率 - 低于此值需要优化 */
  MIN_FPS: 30,
  /** 内存警告阈值（MB） */
  MEMORY_WARNING_THRESHOLD: 512,
  /** 内存严重阈值（MB） */
  MEMORY_CRITICAL_THRESHOLD: 1024
} as const

/**
 * ⭐ 日志级别常量
 */
export const LOG_LEVEL = {
  /** 调试 */
  DEBUG: 0,
  /** 信息 */
  INFO: 1,
  /** 警告 */
  WARN: 2,
  /** 错误 */
  ERROR: 3,
  /** 无 */
  NONE: 4
} as const

/**
 * ⭐ 默认日志级别
 */
export const DEFAULT_LOG_LEVEL = LOG_LEVEL.INFO

/**
 * ⭐ 颜色常量（十六进制）
 */
export const COLORS = {
  /** 红色 */
  RED: '#ff0000',
  /** 绿色 */
  GREEN: '#00ff00',
  /** 蓝色 */
  BLUE: '#0000ff',
  /** 白色 */
  WHITE: '#ffffff',
  /** 黑色 */
  BLACK: '#000000',
  /** 黄色 */
  YELLOW: '#ffff00',
  /** 青色 */
  CYAN: '#00ffff',
  /** 紫色 */
  MAGENTA: '#ff00ff',
  /** 灰色 */
  GRAY: '#808080',
  /** 橙色 */
  ORANGE: '#ffa500',
  /** 粉色 */
  PINK: '#ffc0cb'
} as const

/**
 * ⭐ 得分相关常量
 */
export const SCORE = {
  /** 普通物品基础分 */
  NORMAL_ITEM: 10,
  /** 奖励物品基础分 */
  BONUS_ITEM: 50,
  /** 特殊物品基础分 */
  SPECIAL_ITEM: 100,
  /** 连击倍率基数 */
  COMBO_MULTIPLIER_BASE: 1.0,
  /** 连击倍率增量 */
  COMBO_MULTIPLIER_INCREMENT: 0.1,
  /** 最大连击倍率 */
  MAX_COMBO_MULTIPLIER: 3.0
} as const

/**
 * ⭐ 时间相关常量
 */
export const TIME = {
  /** 1 秒（毫秒） */
  ONE_SECOND: 1000,
  /** 1 分钟（毫秒） */
  ONE_MINUTE: 60000,
  /** 1 小时（毫秒） */
  ONE_HOUR: 3600000,
  /** 默认倒计时时长（秒） */
  DEFAULT_COUNTDOWN: 3,
  /** 默认暂停超时时间（毫秒） */
  PAUSE_TIMEOUT: 300000
} as const

/**
 * ⭐ 存储键名常量
 */
export const STORAGE_KEYS = {
  /** 最高分 */
  HIGH_SCORE: 'high_score',
  /** 游戏设置 */
  GAME_SETTINGS: 'game_settings',
  /** 玩家数据 */
  PLAYER_DATA: 'player_data',
  /** 解锁内容 */
  UNLOCKED_CONTENT: 'unlocked_content'
} as const

/**
 * ⭐ 本地存储前缀
 */
export const STORAGE_PREFIX = 'kgf_'

/**
 * ⭐ 事件命名空间
 */
export const EVENT_NAMESPACE = 'kgf'

/**
 * ⭐ 错误代码
 */
export const ERROR_CODES = {
  /** 通用错误 */
  GENERIC_ERROR: 1000,
  /** 初始化失败 */
  INIT_FAILED: 1001,
  /** 资源加载失败 */
  RESOURCE_LOAD_FAILED: 1002,
  /** 组件未找到 */
  COMPONENT_NOT_FOUND: 1003,
  /** 无效的参数 */
  INVALID_ARGUMENT: 1004,
  /** 状态错误 */
  INVALID_STATE: 1005,
  /** 超时错误 */
  TIMEOUT: 1006,
  /** 网络错误 */
  NETWORK_ERROR: 1007
} as const

/**
 * ⭐ 调试模式标志（默认 false，在构建时会被替换）
 */
export const DEBUG_MODE = false

/**
 * ⭐ 生产环境标志（默认 true）
 */
export const PRODUCTION_MODE = true
