import { IGameCore, GameConfig, GameState, GameEvent, GameEventType } from './interfaces';
import {
  IGameMode,
  ScoringService,
  StorageService,
  PlayerStateService,
  EventBusService,
} from './services';

/**
 * 游戏核心适配器
 * 提供游戏核心接口的默认实现，作为游戏开发的基类
 */
export abstract class GameCoreAdapter implements IGameCore {
  protected config: GameConfig;
  protected gameMode: IGameMode;
  protected scoringService: ScoringService;
  protected storageService: StorageService;
  protected playerStateService: PlayerStateService;
  protected eventBusService: EventBusService;
  protected gameState: GameState;
  protected isInitialized: boolean = false;

  constructor(config: GameConfig) {
    this.config = config;
    this.gameState = {
      isRunning: false,
      isPaused: false,
      players: [],
      customData: {},
    };

    // 初始化服务
    this.eventBusService = new EventBusService({ enableLogging: false });
    this.scoringService = new ScoringService();
    this.storageService = new StorageService();
    this.playerStateService = new PlayerStateService();

    // 默认模式（后续会被替换）
    this.gameMode = null as any;
  }

  /**
   * 初始化游戏
   */
  async initialize(config: GameConfig, gameMode: IGameMode): Promise<void> {
    this.config = config;
    this.gameMode = gameMode;

    // 初始化服务
    this.eventBusService.initialize({ enableLogging: false });
    this.scoringService.initialize({
      initialScore: 0,
      scorePerAction: 10,
      scorePenalty: 5,
      enableMultiplier: false,
      multiplierRules: [],
    });
    this.storageService.initialize({
      storageType: 'local',
      keyPrefix: `game_${this.config.gameId}_`,
      autoSave: false,
      autoSaveInterval: 30000,
    });
    this.playerStateService.initialize({
      maxLives: 3,
      initialLives: 3,
      allowNegativeLives: false,
    });

    this.isInitialized = true;
    console.log(`[GameCoreAdapter] Initialized game: ${this.config.gameName}`);
  }

  /**
   * 启动游戏
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('Game must be initialized before starting');
    }

    this.gameState.isRunning = true;
    this.gameState.isPaused = false;

    // 启动模式
    this.gameMode.start();

    this.emit({
      type: GameEventType.GAME_START,
      data: { gameId: this.config.gameId },
      timestamp: Date.now(),
    });

    console.log(`[GameCoreAdapter] Started game: ${this.config.gameName}`);
  }

  /**
   * 停止游戏
   */
  stop(): void {
    this.gameState.isRunning = false;
    this.gameState.isPaused = false;

    // 停止模式
    this.gameMode.stop();

    this.emit({
      type: GameEventType.GAME_END,
      data: { gameId: this.config.gameId },
      timestamp: Date.now(),
    });

    console.log(`[GameCoreAdapter] Stopped game: ${this.config.gameName}`);
  }

  /**
   * 暂停游戏
   */
  pause(): void {
    this.gameState.isPaused = true;
    this.gameMode.pause();

    this.emit({
      type: GameEventType.GAME_PAUSE,
      data: {},
      timestamp: Date.now(),
    });
  }

  /**
   * 恢复游戏
   */
  resume(): void {
    this.gameState.isPaused = false;
    this.gameMode.resume();

    this.emit({
      type: GameEventType.GAME_RESUME,
      data: {},
      timestamp: Date.now(),
    });
  }

  /**
   * 重启游戏
   */
  restart(): void {
    this.stop();
    this.reset();
    this.start();
  }

  /**
   * 游戏更新（每帧调用）
   */
  update(delta: number): void {
    if (!this.gameState.isRunning || this.gameState.isPaused) {
      return;
    }

    // 子类实现具体更新逻辑
    this.onUpdate(delta);
  }

  /**
   * 渲染游戏（每帧调用）
   */
  render(): void {
    // 子类实现具体渲染逻辑
    this.onRender();
  }

  /**
   * 处理游戏输入
   */
  handleInput(input: any): void {
    if (!this.gameState.isRunning || this.gameState.isPaused) {
      return;
    }

    // 子类实现具体输入处理逻辑
    this.onHandleInput(input);
  }

  /**
   * 执行游戏规则
   */
  executeRule(action: any): boolean {
    // 子类实现具体规则执行逻辑
    return this.onExecuteRule(action);
  }

  /**
   * 检查游戏结束条件
   */
  checkWinCondition(): boolean {
    // 子类实现具体胜利条件检查
    return this.onCheckWinCondition();
  }

  /**
   * 检查游戏失败条件
   */
  checkLoseCondition(): boolean {
    // 子类实现具体失败条件检查
    return this.onCheckLoseCondition();
  }

  /**
   * 获取游戏状态
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * 获取游戏配置
   */
  getGameConfig(): GameConfig {
    return { ...this.config };
  }

  /**
   * 获取玩法模式
   */
  getGameMode(): IGameMode {
    return this.gameMode;
  }

  /**
   * 设置玩法模式
   */
  setGameMode(gameMode: IGameMode): void {
    this.gameMode = gameMode;
    console.log(`[GameCoreAdapter] Set game mode: ${gameMode.getModeType()}`);
  }

  /**
   * 获取计分服务
   */
  getScoringService(): ScoringService {
    return this.scoringService;
  }

  /**
   * 获取存储服务
   */
  getStorageService(): StorageService {
    return this.storageService;
  }

  /**
   * 获取网络服务
   */
  getNetworkService(): any {
    // 从模式中获取网络服务（如果是网络模式）
    return (this.gameMode as any).networkService;
  }

  /**
   * 获取玩家状态服务
   */
  getPlayerStateService(): PlayerStateService {
    return this.playerStateService;
  }

  /**
   * 获取事件总线服务
   */
  getEventBusService(): EventBusService {
    return this.eventBusService;
  }

  /**
   * 保存游戏
   */
  async saveGame(): Promise<boolean> {
    try {
      const gameState = this.getGameState();
      this.storageService.save('gameState', gameState);
      this.storageService.save('gameConfig', this.config);
      console.log(`[GameCoreAdapter] Saved game: ${this.config.gameId}`);
      return true;
    } catch (error) {
      console.error(`[GameCoreAdapter] Failed to save game:`, error);
      return false;
    }
  }

  /**
   * 加载游戏
   */
  async loadGame(): Promise<boolean> {
    try {
      const gameState = this.storageService.load<any>('gameState');
      const gameConfig = this.storageService.load<GameConfig>('gameConfig');

      if (gameState && gameConfig) {
        this.gameState = gameState;
        this.config = gameConfig;
        console.log(`[GameCoreAdapter] Loaded game: ${this.config.gameId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[GameCoreAdapter] Failed to load game:`, error);
      return false;
    }
  }

  /**
   * 订阅游戏事件
   */
  on(eventType: string, callback: (data: any) => void): void {
    this.eventBusService.on(eventType, callback);
  }

  /**
   * 取消订阅游戏事件
   */
  off(eventType: string, callback: (data: any) => void): void {
    this.eventBusService.off(eventType, callback);
  }

  /**
   * 触发游戏事件
   */
  emit(event: GameEvent): void {
    this.eventBusService.emit(event.type, event);
  }

  /**
   * 获取游戏统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      gameId: this.config.gameId,
      gameName: this.config.gameName,
      version: this.config.version,
      gameState: this.gameState,
      modeStatistics: this.gameMode.getStatistics(),
      scoringStatistics: this.scoringService.getStatistics(),
      playerStateStatistics: this.playerStateService.getStatistics(),
    };
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.gameState = {
      isRunning: false,
      isPaused: false,
      players: [],
      customData: {},
    };

    this.playerStateService.resetAllPlayers();
    this.scoringService.clear();

    // 子类实现具体重置逻辑
    this.onReset();

    console.log(`[GameCoreAdapter] Reset game: ${this.config.gameName}`);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stop();
    this.gameMode.cleanup();
    this.eventBusService.clear();
    this.storageService.clear();

    // 子类实现具体清理逻辑
    this.onCleanup();

    console.log(`[GameCoreAdapter] Cleaned up game: ${this.config.gameName}`);
  }

  // ===== 抽象方法 - 子类必须实现 =====

  /**
   * 游戏更新回调
   */
  protected abstract onUpdate(delta: number): void;

  /**
   * 游戏渲染回调
   */
  protected abstract onRender(): void;

  /**
   * 处理输入回调
   */
  protected abstract onHandleInput(input: any): void;

  /**
   * 执行规则回调
   */
  protected abstract onExecuteRule(action: any): boolean;

  /**
   * 检查胜利条件回调
   */
  protected abstract onCheckWinCondition(): boolean;

  /**
   * 检查失败条件回调
   */
  protected abstract onCheckLoseCondition(): boolean;

  /**
   * 重置游戏回调
   */
  protected abstract onReset(): void;

  /**
   * 清理资源回调
   */
  protected abstract onCleanup(): void;
}
