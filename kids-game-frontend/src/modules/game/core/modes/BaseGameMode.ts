import {
  IGameMode,
  GameModeConfig,
  GameModeType,
  Player,
  GameEvent,
} from '../interfaces';
import { EventBusService } from '../services';

/**
 * 玩法模式基类
 * 提供模式的基础实现，子类只需实现特定逻辑
 */
export abstract class BaseGameMode implements IGameMode {
  protected config: GameModeConfig;
  protected players: Map<string, Player> = new Map();
  protected eventBus: EventBusService;
  protected isInitialized: boolean = false;
  protected isRunning: boolean = false;
  protected isPaused: boolean = false;
  protected currentTurnPlayerId: string | null = null;
  protected turnOrder: string[] = [];

  constructor(config?: Partial<GameModeConfig>) {
    this.config = {
      modeType: GameModeType.SINGLE_PLAYER,
      modeName: 'Base Mode',
      maxPlayers: 1,
      supportAI: false,
      timeLimit: 0,
      ...config,
    };

    this.eventBus = new EventBusService({ enableLogging: false });
  }

  /**
   * 初始化模式
   */
  async initialize(config: GameModeConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    this.log(`Initialized mode: ${this.config.modeName}`);
  }

  /**
   * 启动模式
   */
  start(): void {
    if (!this.isInitialized) {
      throw new Error('Mode must be initialized before starting');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.log(`Started mode: ${this.config.modeName}`);

    // 触发游戏开始事件
    this.emit('game_start', { modeType: this.config.modeType });
  }

  /**
   * 停止模式
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.log(`Stopped mode: ${this.config.modeName}`);

    // 触发游戏结束事件
    this.emit('game_end', { modeType: this.config.modeType });
  }

  /**
   * 暂停模式
   */
  pause(): void {
    this.isPaused = true;
    this.log(`Paused mode: ${this.config.modeName}`);

    // 触发游戏暂停事件
    this.emit('game_pause', {});
  }

  /**
   * 恢复模式
   */
  resume(): void {
    this.isPaused = false;
    this.log(`Resumed mode: ${this.config.modeName}`);

    // 触发游戏恢复事件
    this.emit('game_resume', {});
  }

  /**
   * 添加玩家
   */
  addPlayer(player: Player): boolean {
    if (this.players.size >= this.config.maxPlayers) {
      this.log(`Cannot add player: max players reached (${this.config.maxPlayers})`);
      return false;
    }

    if (this.players.has(player.id)) {
      this.log(`Player ${player.id} already exists`);
      return false;
    }

    this.players.set(player.id, player);
    this.log(`Added player: ${player.id}`, { name: player.name });

    // 如果是第一个玩家，设置为当前回合玩家
    if (this.turnOrder.length === 0) {
      this.turnOrder.push(player.id);
      this.currentTurnPlayerId = player.id;
    } else {
      this.turnOrder.push(player.id);
    }

    return true;
  }

  /**
   * 移除玩家
   */
  removePlayer(playerId: string): boolean {
    const existed = this.players.delete(playerId);

    if (existed) {
      const index = this.turnOrder.indexOf(playerId);
      if (index !== -1) {
        this.turnOrder.splice(index, 1);
      }

      // 如果移除的是当前回合玩家，切换到下一个
      if (this.currentTurnPlayerId === playerId) {
        this.currentTurnPlayerId = this.turnOrder.length > 0 ? this.turnOrder[0] : null;
      }

      this.log(`Removed player: ${playerId}`);
    }

    return existed;
  }

  /**
   * 获取所有玩家
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * 获取玩家信息
   */
  getPlayer(playerId: string): Player | null {
    return this.players.get(playerId) ?? null;
  }

  /**
   * 更新玩家信息
   */
  updatePlayer(player: Player): boolean {
    if (!this.players.has(player.id)) {
      this.log(`Player ${player.id} not found`);
      return false;
    }

    this.players.set(player.id, player);
    this.log(`Updated player: ${player.id}`);
    return true;
  }

  /**
   * 处理玩家操作
   */
  handlePlayerAction(playerId: string, action: any): boolean {
    if (!this.isRunning || this.isPaused) {
      this.log(`Cannot handle action: mode is not running or is paused`);
      return false;
    }

    if (!this.validateAction(playerId, action)) {
      this.log(`Invalid action from player ${playerId}`);
      return false;
    }

    this.log(`Handled action from player ${playerId}`, { action });

    // 触发玩家操作事件
    this.emit('player_action', {
      playerId,
      action,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 广播事件到所有玩家
   */
  broadcastEvent(event: GameEvent): void {
    this.log(`Broadcasting event: ${event.type}`);
    this.emit(event.type, event);
  }

  /**
   * 发送消息到指定玩家
   */
  sendMessageToPlayer(playerId: string, message: any): void {
    this.log(`Sending message to player ${playerId}`, { message });
    this.emit(`message:${playerId}`, { playerId, message });
  }

  /**
   * 获取当前模式类型
   */
  getModeType(): GameModeType {
    return this.config.modeType;
  }

  /**
   * 获取模式配置
   */
  getModeConfig(): GameModeConfig {
    return this.config;
  }

  /**
   * 验证玩家操作是否有效
   */
  validateAction(playerId: string, action: any): boolean {
    // 检查玩家是否存在
    if (!this.players.has(playerId)) {
      return false;
    }

    // 检查模式是否运行
    if (!this.isRunning) {
      return false;
    }

    // 检查是否暂停
    if (this.isPaused) {
      return false;
    }

    // 检查是否是当前回合玩家（如果是回合制）
    if (this.currentTurnPlayerId && this.currentTurnPlayerId !== playerId) {
      return false;
    }

    return true;
  }

  /**
   * 获取当前回合玩家ID
   */
  getCurrentTurnPlayerId(): string | null {
    return this.currentTurnPlayerId;
  }

  /**
   * 切换到下一个回合
   */
  nextTurn(): string | null {
    if (this.turnOrder.length === 0) {
      return null;
    }

    const currentIndex = this.turnOrder.indexOf(this.currentTurnPlayerId!);
    const nextIndex = (currentIndex + 1) % this.turnOrder.length;
    this.currentTurnPlayerId = this.turnOrder[nextIndex];

    this.log(`Turn changed to player: ${this.currentTurnPlayerId}`);

    // 触发回合切换事件
    this.emit('turn_change', {
      currentPlayerId: this.currentTurnPlayerId,
      previousPlayerId: this.turnOrder[currentIndex],
      timestamp: Date.now(),
    });

    return this.currentTurnPlayerId;
  }

  /**
   * 检查是否可以开始游戏
   */
  canStartGame(): boolean {
    const readyPlayers = this.getPlayers().filter(p => p.isReady);
    const hasEnoughPlayers = this.players.size >= 1;
    const allReady = readyPlayers.length === this.players.size;

    return hasEnoughPlayers && allReady;
  }

  /**
   * 获取模式统计信息
   */
  getStatistics(): Record<string, any> {
    const players = this.getPlayers();
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const totalLives = players.reduce((sum, p) => sum + p.lives, 0);

    return {
      modeType: this.config.modeType,
      modeName: this.config.modeName,
      totalPlayers: players.length,
      maxPlayers: this.config.maxPlayers,
      totalScore,
      averageScore: players.length > 0 ? totalScore / players.length : 0,
      totalLives,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnOrder: [...this.turnOrder],
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 订阅事件
   */
  on(eventType: string, callback: (data: any) => void): void {
    this.eventBus.on(eventType, callback);
  }

  /**
   * 取消订阅事件
   */
  off(eventType: string, callback: (data: any) => void): void {
    this.eventBus.off(eventType, callback);
  }

  /**
   * 触发事件
   */
  emit(eventType: string, data: any): void {
    this.eventBus.emit(eventType, data);
  }

  /**
   * 记录日志
   */
  protected log(message: string, data?: any): void {
    console.log(`[${this.config.modeName}] ${message}`, data ? data : '');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stop();
    this.players.clear();
    this.turnOrder = [];
    this.eventBus.clear();
    this.log('Cleaned up resources');
  }
}
