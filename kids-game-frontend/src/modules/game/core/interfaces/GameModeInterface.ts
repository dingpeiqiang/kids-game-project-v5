/**
 * 玩家信息接口（内联定义，避免循环引用）
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
  /** 队伍ID（组队模式用） */
  teamId?: string;
}

/**
 * 玩法模式类型枚举
 */
export enum GameModeType {
  /** 单机模式 */
  SINGLE_PLAYER = 'single_player',
  /** 本地对抗模式 */
  LOCAL_BATTLE = 'local_battle',
  /** 组队模式 */
  TEAM = 'team',
  /** 网络对抗模式 */
  ONLINE_BATTLE = 'online_battle',
  /** 闯关模式（扩展示例） */
  CAMPAIGN = 'campaign',
  /** 天梯模式（扩展示例） */
  RANKED = 'ranked',
}

/**
 * 玩法模式配置接口
 */
export interface GameModeConfig {
  /** 模式类型 */
  modeType: GameModeType;
  /** 模式名称 */
  modeName: string;
  /** 最大玩家数 */
  maxPlayers: number;
  /** 是否支持AI */
  supportAI: boolean;
  /** 时间限制（秒，0表示无限制） */
  timeLimit?: number;
  /** 房间ID（网络模式用） */
  roomId?: string;
  /** 服务器地址（网络模式用） */
  serverUrl?: string;
  /** 队伍数量（组队模式用） */
  teamCount?: number;
  /** 模式特定配置 */
  customConfig?: Record<string, any>;
}

/**
 * AI难度等级
 */
export enum AIDifficulty {
  /** 简单 */
  EASY = 'easy',
  /** 普通 */
  MEDIUM = 'medium',
  /** 困难 */
  HARD = 'hard',
  /** 专家 */
  EXPERT = 'expert',
}

/**
 * AI配置接口
 */
export interface AIConfig {
  /** AI难度 */
  difficulty: AIDifficulty;
  /** AI响应延迟（毫秒） */
  responseDelay: number;
  /** AI错误率（0-1） */
  errorRate: number;
}

/**
 * 队伍信息接口
 */
export interface Team {
  /** 队伍ID */
  id: string;
  /** 队伍名称 */
  name: string;
  /** 队伍玩家列表 */
  players: string[];
  /** 队伍分数 */
  score: number;
}

/**
 * 网络消息类型
 */
export enum NetworkMessageType {
  /** 准备就绪 */
  READY = 'ready',
  /** 玩家移动/操作 */
  MOVE = 'move',
  /** 分数更新 */
  SCORE = 'score',
  /** 生命值更新 */
  LIVES = 'lives',
  /** 游戏结束 */
  GAME_OVER = 'game_over',
  /** 状态同步 */
  STATE_SYNC = 'state_sync',
  /** 聊天消息 */
  CHAT = 'chat',
  /** 错误消息 */
  ERROR = 'error',
}

/**
 * 网络消息接口
 */
export interface NetworkMessage {
  /** 消息类型 */
  type: NetworkMessageType;
  /** 发送者玩家ID */
  playerId: string;
  /** 消息数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 玩法模式接口
 * 所有玩法模式必须实现此接口
 */
export interface IGameMode {
  /**
   * 初始化模式
   * @param config 模式配置
   */
  initialize(config: GameModeConfig): Promise<void>;

  /**
   * 启动模式
   */
  start(): void;

  /**
   * 停止模式
   */
  stop(): void;

  /**
   * 暂停模式
   */
  pause(): void;

  /**
   * 恢复模式
   */
  resume(): void;

  /**
   * 添加玩家
   * @param player 玩家信息
   * @returns 是否添加成功
   */
  addPlayer(player: Player): boolean;

  /**
   * 移除玩家
   * @param playerId 玩家ID
   * @returns 是否移除成功
   */
  removePlayer(playerId: string): boolean;

  /**
   * 获取所有玩家
   * @returns 玩家列表
   */
  getPlayers(): Player[];

  /**
   * 获取玩家信息
   * @param playerId 玩家ID
   * @returns 玩家信息，如果不存在则返回null
   */
  getPlayer(playerId: string): Player | null;

  /**
   * 更新玩家信息
   * @param player 玩家信息
   * @returns 是否更新成功
   */
  updatePlayer(player: Player): boolean;

  /**
   * 处理玩家操作
   * @param playerId 玩家ID
   * @param action 操作数据
   * @returns 是否处理成功
   */
  handlePlayerAction(playerId: string, action: any): boolean;

  /**
   * 广播事件到所有玩家
   * @param event 游戏事件
   */
  broadcastEvent(event: GameEvent): void;

  /**
   * 发送消息到指定玩家
   * @param playerId 玩家ID
   * @param message 消息内容
   */
  sendMessageToPlayer(playerId: string, message: any): void;

  /**
   * 获取当前模式类型
   * @returns 模式类型
   */
  getModeType(): GameModeType;

  /**
   * 获取模式配置
   * @returns 模式配置
   */
  getModeConfig(): GameModeConfig;

  /**
   * 验证玩家操作是否有效
   * @param playerId 玩家ID
   * @param action 操作数据
   * @returns 是否有效
   */
  validateAction(playerId: string, action: any): boolean;

  /**
   * 获取当前回合玩家ID
   * @returns 玩家ID，如果不是回合制游戏则返回null
   */
  getCurrentTurnPlayerId(): string | null;

  /**
   * 切换到下一个回合
   * @returns 下一个回合的玩家ID
   */
  nextTurn(): string | null;

  /**
   * 检查是否可以开始游戏
   * @returns 是否可以开始
   */
  canStartGame(): boolean;

  /**
   * 获取模式统计信息
   * @returns 统计信息
   */
  getStatistics(): Record<string, any>;

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  on(eventType: string, callback: (data: any) => void): void;

  /**
   * 取消订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  off(eventType: string, callback: (data: any) => void): void;

  /**
   * 触发事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  emit(eventType: string, data: any): void;
}
