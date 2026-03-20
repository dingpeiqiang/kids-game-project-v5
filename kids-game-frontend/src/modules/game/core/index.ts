/**
 * 游戏核心模块
 * 
 * 统一的游戏模式架构 - 分阶段实现
 * 阶段1: 单人模式基础架构
 */

// 接口定义
export * from './interfaces';

// 组件（状态面板等）
export * from './components';

// 服务实现
export * from './services';

// 模式实现
export * from './modes';

// 管理器
export * from './manager';

// 适配器
export * from './GameCoreAdapter';

// 重新导出常用类型
export {
  // 游戏核心接口
  IGameCore,
  Player,
  GameEvent,
  GameEventType,
  GameState,
  GameConfig,

  // 玩法模式接口
  IGameMode,
  GameModeType,
  GameModeConfig,
  AIConfig,
  AIDifficulty,
  Team,
  NetworkMessage,
  NetworkMessageType,

  // 服务接口
  IScoringService,
  IStorageService,
  INetworkService,
  IPlayerStateService,
  IEventBusService,
} from './interfaces';

// 重新导出常用类（阶段1）
export {
  // 服务类
  EventBusService,
  ScoringService,
  StorageService,
  PlayerStateService,
  NetworkService,

  // 模式类（阶段1暂不使用，使用UnifiedModeManager）
  BaseGameMode,
  SinglePlayerMode,
  LocalBattleMode,
  TeamMode,
  OnlineBattleMode,

  // 管理器
  ModeManager,
  UnifiedModeManager,
  
  // 组件
  GameStatePanel,
} from './index';
