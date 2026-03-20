/**
 * 游戏核心接口定义
 * 为了避免循环依赖,所有依赖的接口都在此文件中内联定义
 * 注意：GameModeType、GameModeConfig 等接口从 GameModeInterface 导入，避免重复定义
 */

import { GameModeType, GameModeConfig, Player, IGameMode } from './GameModeInterface';

/**
 * 游戏事件类型（内联定义，避免循环引用）
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
 * 游戏事件接口（内联定义，避免循环引用）
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
 * 游戏状态接口（内联定义，避免循环引用）
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
 * 游戏配置接口（内联定义，避免循环引用）
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

/**
 * 游戏核心接口
 * 所有游戏必须实现此接口
 */
export interface IGameCore {
  /**
   * 初始化游戏
   * @param config 游戏配置
   * @param gameMode 玩法模式实例
   */
  initialize(config: GameConfig, gameMode: IGameMode): Promise<void>;

  /**
   * 启动游戏
   */
  start(): void;

  /**
   * 停止游戏
   */
  stop(): void;

  /**
   * 暂停游戏
   */
  pause(): void;

  /**
   * 恢复游戏
   */
  resume(): void;

  /**
   * 重启游戏
   */
  restart(): void;

  /**
   * 游戏更新（每帧调用）
   * @param delta 时间增量（毫秒）
   */
  update(delta: number): void;

  /**
   * 渲染游戏（每帧调用）
   */
  render(): void;

  /**
   * 处理游戏输入
   * @param input 输入数据
   */
  handleInput(input: any): void;

  /**
   * 执行游戏规则
   * @param action 操作数据
   * @returns 是否执行成功
   */
  executeRule(action: any): boolean;

  /**
   * 检查游戏结束条件
   * @returns 游戏是否结束
   */
  checkWinCondition(): boolean;

  /**
   * 检查游戏失败条件
   * @returns 游戏是否失败
   */
  checkLoseCondition(): boolean;

  /**
   * 获取游戏状态
   * @returns 游戏状态
   */
  getGameState(): GameState;

  /**
   * 获取游戏配置
   * @returns 游戏配置
   */
  getGameConfig(): GameConfig;

  /**
   * 获取玩法模式
   * @returns 玩法模式实例
   */
  getGameMode(): IGameMode;

  /**
   * 设置玩法模式
   * @param gameMode 玩法模式实例
   */
  setGameMode(gameMode: IGameMode): void;

  // 注意:以下服务方法已移除,避免循环依赖。
  // 如需访问服务,请使用独立的导入方式。
  //
  // 原有方法(已移除):
  // - getScoringService(): IScoringService
  // - getStorageService(): IStorageService
  // - getNetworkService(): INetworkService
  // - getPlayerStateService(): IPlayerStateService
  // - getEventBusService(): IEventBusService

  /**
   * 保存游戏
   * @returns 是否保存成功
   */
  saveGame(): Promise<boolean>;

  /**
   * 加载游戏
   * @returns 是否加载成功
   */
  loadGame(): Promise<boolean>;

  /**
   * 订阅游戏事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  on(eventType: string, callback: (data: any) => void): void;

  /**
   * 取消订阅游戏事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  off(eventType: string, callback: (data: any) => void): void;

  /**
   * 触发游戏事件
   * @param event 游戏事件
   */
  emit(event: GameEvent): void;

  /**
   * 获取游戏统计信息
   * @returns 统计信息
   */
  getStatistics(): Record<string, any>;

  /**
   * 重置游戏
   */
  reset(): void;

  /**
   * 清理资源
   */
  cleanup(): void;
}
