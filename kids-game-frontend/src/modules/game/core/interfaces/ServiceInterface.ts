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
 * 计分配置接口
 */
export interface ScoringConfig {
  /** 初始分数 */
  initialScore: number;
  /** 单次操作加分 */
  scorePerAction: number;
  /** 单次操作扣分 */
  scorePenalty: number;
  /** 是否启用分数倍率 */
  enableMultiplier: boolean;
  /** 分数倍率规则 */
  multiplierRules: {
    /** 连续操作次数 */
    consecutiveCount: number;
    /** 倍率 */
    multiplier: number;
  }[];
}

/**
 * 计分服务接口
 */
export interface IScoringService {
  /**
   * 初始化计分系统
   * @param config 计分配置
   */
  initialize(config: ScoringConfig): void;

  /**
   * 获取玩家分数
   * @param playerId 玩家ID
   * @returns 分数
   */
  getPlayerScore(playerId: string): number;

  /**
   * 设置玩家分数
   * @param playerId 玩家ID
   * @param score 分数
   */
  setPlayerScore(playerId: string, score: number): void;

  /**
   * 增加玩家分数
   * @param playerId 玩家ID
   * @param points 加分
   */
  addScore(playerId: string, points: number): void;

  /**
   * 扣除玩家分数
   * @param playerId 玩家ID
   * @param points 扣分
   */
  deductScore(playerId: string, points: number): void;

  /**
   * 重置玩家分数
   * @param playerId 玩家ID
   */
  resetScore(playerId: string): void;

  /**
   * 获取所有玩家分数排名
   * @returns 排名后的玩家ID列表
   */
  getRanking(): string[];

  /**
   * 获取排行榜数据
   * @returns 排行榜数据
   */
  getLeaderboard(): Array<{ playerId: string; score: number; rank: number }>;

  /**
   * 记录得分历史
   * @param playerId 玩家ID
   * @param action 操作描述
   * @param points 分数变化
   */
  recordScoreHistory(playerId: string, action: string, points: number): void;

  /**
   * 获取玩家得分历史
   * @param playerId 玩家ID
   * @returns 得分历史
   */
  getScoreHistory(playerId: string): Array<{ action: string; points: number; timestamp: number }>;
}

/**
 * 存储配置接口
 */
export interface StorageConfig {
  /** 存储类型 */
  storageType: 'local' | 'session' | 'custom';
  /** 存储键前缀 */
  keyPrefix: string;
  /** 是否自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（毫秒） */
  autoSaveInterval: number;
}

/**
 * 存储项接口
 */
export interface StorageItem {
  /** 存储键 */
  key: string;
  /** 存储值 */
  value: any;
  /** 过期时间（毫秒时间戳，0表示永不过期） */
  expireTime: number;
  /** 创建时间 */
  createTime: number;
  /** 更新时间 */
  updateTime: number;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 初始化存储服务
   * @param config 存储配置
   */
  initialize(config: StorageConfig): void;

  /**
   * 保存数据
   * @param key 存储键
   * @param value 存储值
   * @param ttl 过期时间（秒，0表示永不过期）
   */
  save(key: string, value: any, ttl?: number): void;

  /**
   * 加载数据
   * @param key 存储键
   * @returns 存储值，不存在则返回null
   */
  load<T = any>(key: string): T | null;

  /**
   * 删除数据
   * @param key 存储键
   * @returns 是否删除成功
   */
  delete(key: string): boolean;

  /**
   * 清空所有数据
   */
  clear(): void;

  /**
   * 检查数据是否存在
   * @param key 存储键
   * @returns 是否存在
   */
  exists(key: string): boolean;

  /**
   * 获取所有键
   * @returns 存储键列表
   */
  keys(): string[];

  /**
   * 批量保存
   * @param items 存储项数组
   */
  saveBatch(items: Array<{ key: string; value: any; ttl?: number }>): void;

  /**
   * 批量加载
   * @param keys 存储键列表
   * @returns 存储值映射
   */
  loadBatch<T = any>(keys: string[]): Map<string, T>;

  /**
   * 清理过期数据
   */
  cleanExpired(): void;
}

/**
 * 网络连接状态
 */
export enum ConnectionState {
  /** 已断开 */
  DISCONNECTED = 'disconnected',
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 重连中 */
  RECONNECTING = 'reconnecting',
  /** 连接错误 */
  ERROR = 'error',
}

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  /** 服务器地址 */
  serverUrl: string;
  /** 重连次数 */
  maxReconnectAttempts: number;
  /** 重连间隔（毫秒） */
  reconnectInterval: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval: number;
  /** 消息超时（毫秒） */
  messageTimeout: number;
  /** 是否启用压缩 */
  enableCompression: boolean;
}

/**
 * 网络服务接口
 */
export interface INetworkService {
  /**
   * 初始化网络服务
   * @param config 网络配置
   */
  initialize(config: NetworkConfig): void;

  /**
   * 连接服务器
   * @param roomId 房间ID
   */
  connect(roomId: string): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): void;

  /**
   * 发送消息
   * @param message 消息内容
   */
  send(message: any): void;

  /**
   * 批量发送消息
   * @param messages 消息列表
   */
  sendBatch(messages: any[]): void;

  /**
   * 订阅消息类型
   * @param messageType 消息类型
   * @param callback 回调函数
   */
  subscribe(messageType: string, callback: (message: any) => void): void;

  /**
   * 取消订阅
   * @param messageType 消息类型
   * @param callback 回调函数
   */
  unsubscribe(messageType: string, callback: (message: any) => void): void;

  /**
   * 获取连接状态
   * @returns 连接状态
   */
  getConnectionState(): ConnectionState;

  /**
   * 是否已连接
   * @returns 是否已连接
   */
  isConnected(): boolean;

  /**
   * 发起请求（请求-响应模式）
   * @param request 请求数据
   * @param timeout 超时时间（毫秒）
   * @returns 响应数据
   */
  request<T = any>(request: any, timeout?: number): Promise<T>;

  /**
   * 发送心跳
   */
  sendHeartbeat(): void;

  /**
   * 重连
   */
  reconnect(): Promise<void>;

  /**
   * 获取网络延迟（毫秒）
   * @returns 延迟时间
   */
  getLatency(): number;
}

/**
 * 玩家状态配置接口
 */
export interface PlayerStateConfig {
  /** 最大生命值 */
  maxLives: number;
  /** 初始生命值 */
  initialLives: number;
  /** 是否允许负生命值 */
  allowNegativeLives: boolean;
  /** 最大分数 */
  maxScore?: number;
  /** 最小分数 */
  minScore?: number;
}

/**
 * 玩家状态服务接口
 */
export interface IPlayerStateService {
  /**
   * 初始化玩家状态服务
   * @param config 玩家状态配置
   */
  initialize(config: PlayerStateConfig): void;

  /**
   * 添加玩家
   * @param player 玩家信息
   */
  addPlayer(player: Player): void;

  /**
   * 移除玩家
   * @param playerId 玩家ID
   * @returns 是否移除成功
   */
  removePlayer(playerId: string): boolean;

  /**
   * 获取玩家
   * @param playerId 玩家ID
   * @returns 玩家信息，不存在则返回null
   */
  getPlayer(playerId: string): Player | null;

  /**
   * 获取所有玩家
   * @returns 玩家列表
   */
  getAllPlayers(): Player[];

  /**
   * 更新玩家
   * @param player 玩家信息
   * @returns 是否更新成功
   */
  updatePlayer(player: Player): boolean;

  /**
   * 设置玩家生命值
   * @param playerId 玩家ID
   * @param lives 生命值
   */
  setPlayerLives(playerId: string, lives: number): void;

  /**
   * 增加玩家生命值
   * @param playerId 玩家ID
   * @param amount 增加量
   */
  addPlayerLives(playerId: string, amount: number): void;

  /**
   * 减少玩家生命值
   * @param playerId 玩家ID
   * @param amount 减少量
   */
  deductPlayerLives(playerId: string, amount: number): void;

  /**
   * 设置玩家准备状态
   * @param playerId 玩家ID
   * @param isReady 是否准备
   */
  setPlayerReady(playerId: string, isReady: boolean): void;

  /**
   * 获取准备就绪的玩家列表
   * @returns 准备就绪的玩家ID列表
   */
  getReadyPlayers(): string[];

  /**
   * 检查玩家是否存活
   * @param playerId 玩家ID
   * @returns 是否存活
   */
  isPlayerAlive(playerId: string): boolean;

  /**
   * 获取存活玩家列表
   * @returns 存活的玩家ID列表
   */
  getAlivePlayers(): string[];

  /**
   * 重置所有玩家状态
   */
  resetAllPlayers(): void;

  /**
   * 保存玩家快照
   * @param playerId 玩家ID
   * @returns 快照数据
   */
  savePlayerSnapshot(playerId: string): Player | null;

  /**
   * 恢复玩家快照
   * @param playerId 玩家ID
   * @param snapshot 快照数据
   * @returns 是否恢复成功
   */
  restorePlayerSnapshot(playerId: string, snapshot: Player): boolean;
}

/**
 * 事件总线配置接口
 */
export interface EventBusConfig {
  /** 是否启用事件日志 */
  enableLogging: boolean;
  /** 最大事件队列长度 */
  maxQueueSize: number;
  /** 是否启用优先级 */
  enablePriority: boolean;
}

/**
 * 事件监听器接口
 */
export interface IEventListener {
  /** 事件类型 */
  eventType: string;
  /** 回调函数 */
  callback: (data: any) => void;
  /** 是否一次性监听 */
  once: boolean;
  /** 优先级（数字越大优先级越高） */
  priority: number;
}

/**
 * 事件总线服务接口
 */
export interface IEventBusService {
  /**
   * 初始化事件总线
   * @param config 事件总线配置
   */
  initialize(config: EventBusConfig): void;

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  on(eventType: string, callback: (data: any) => void): void;

  /**
   * 订阅一次性事件
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  once(eventType: string, callback: (data: any) => void): void;

  /**
   * 取消订阅
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  off(eventType: string, callback: (data: any) => void): void;

  /**
   * 取消事件类型的所有订阅
   * @param eventType 事件类型
   */
  offAll(eventType: string): void;

  /**
   * 发送事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  emit(eventType: string, data: any): void;

  /**
   * 异步发送事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  emitAsync(eventType: string, data: any): Promise<void>;

  /**
   * 清空所有订阅
   */
  clear(): void;

  /**
   * 获取事件监听器数量
   * @param eventType 事件类型
   * @returns 监听器数量
   */
  listenerCount(eventType: string): number;

  /**
   * 获取所有事件类型
   * @returns 事件类型列表
   */
  eventTypes(): string[];
}
