/**
 * 玩家信息接口
 */
export interface Player {
  /** 玩家唯一标识 */
  id: string;
  /** 玩家名称 */
  name: string;
  /** 玩家分数 */
  score: number;
  /** 玩家生命值 */
  lives: number;
  /** 玩家是否准备就绪 */
  isReady: boolean;
  /** 玩家额外属性（扩展用） */
  properties?: Record<string, any>;
}

/**
 * 游戏事件类型
 */
export enum GameEventType {
  /** 游戏开始 */
  GAME_START = 'game_start',
  /** 游戏结束 */
  GAME_END = 'game_end',
  /** 游戏暂停 */
  GAME_PAUSE = 'game_pause',
  /** 游戏恢复 */
  GAME_RESUME = 'game_resume',
  /** 玩家操作 */
  PLAYER_ACTION = 'player_action',
  /** 回合切换 */
  TURN_CHANGE = 'turn_change',
  /** 分数变化 */
  SCORE_CHANGE = 'score_change',
  /** 生命值变化 */
  LIVES_CHANGE = 'lives_change',
  /** 状态同步 */
  STATE_SYNC = 'state_sync',
  /** 错误发生 */
  ERROR = 'error',
}

/**
 * 游戏事件接口
 */
export interface GameEvent {
  /** 事件类型 */
  type: GameEventType;
  /** 事件数据 */
  data: any;
  /** 事件时间戳 */
  timestamp: number;
  /** 来源玩家ID（如果有） */
  playerId?: string;
}

/**
 * 游戏状态接口
 */
export interface GameState {
  /** 游戏是否正在运行 */
  isRunning: boolean;
  /** 游戏是否暂停 */
  isPaused: boolean;
  /** 当前玩家列表 */
  players: Player[];
  /** 游戏自定义状态数据 */
  customData?: Record<string, any>;
}

/**
 * 游戏配置接口
 */
export interface GameConfig {
  /** 游戏唯一标识 */
  gameId: string;
  /** 游戏名称 */
  gameName: string;
  /** 游戏版本 */
  version: string;
  /** 最大玩家数 */
  maxPlayers: number;
  /** 最小玩家数 */
  minPlayers: number;
  /** 是否支持AI */
  supportAI: boolean;
  /** 游戏自定义配置 */
  customConfig?: Record<string, any>;
}
