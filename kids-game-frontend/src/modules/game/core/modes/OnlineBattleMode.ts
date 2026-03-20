import { BaseGameMode } from './BaseGameMode';
import { GameModeConfig, GameModeType, Player, NetworkMessage, NetworkMessageType } from '../interfaces';
import { NetworkService } from '../services';

/**
 * 网络对抗模式实现
 * 处理WebSocket/HTTP通信、网络状态同步、服务器交互、延迟补偿
 */
export class OnlineBattleMode extends BaseGameMode {
  private networkService: NetworkService;
  private localPlayerId: string | null = null;
  private opponentPlayerId: string | null = null;
  private syncInterval: number | null = null;
  private lastSyncTime: number = 0;

  constructor(config?: Partial<GameModeConfig>, networkService?: NetworkService) {
    super({
      ...config,
      modeType: GameModeType.ONLINE_BATTLE,
      modeName: 'Online Battle',
      maxPlayers: 2,
      supportAI: false,
    });

    this.networkService = networkService ?? new NetworkService();
  }

  /**
   * 初始化网络对抗模式
   */
  async initialize(config: GameModeConfig): Promise<void> {
    await super.initialize(config);

    // 初始化网络服务
    this.networkService.initialize({
      serverUrl: config.serverUrl || 'ws://localhost:8080',
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      messageTimeout: 5000,
      enableCompression: false,
    });

    // 订阅网络消息
    this.subscribeToNetworkMessages();

    this.log('OnlineBattleMode initialized', { roomId: config.roomId });
  }

  /**
   * 启动模式
   */
  async start(): Promise<void> {
    super.start();

    // 连接服务器
    if (this.config.roomId) {
      try {
        await this.networkService.connect(this.config.roomId);
        this.log('Connected to server', { roomId: this.config.roomId });

        // 启动状态同步
        this.startSync();
      } catch (error) {
        this.log('Failed to connect to server', { error });
        throw error;
      }
    }
  }

  /**
   * 停止模式
   */
  stop(): void {
    super.stop();
    this.stopSync();
    this.networkService.disconnect();
    this.localPlayerId = null;
    this.opponentPlayerId = null;
  }

  /**
   * 暂停模式
   */
  pause(): void {
    super.pause();
    this.stopSync();
  }

  /**
   * 恢复模式
   */
  resume(): void {
    super.resume();
    this.startSync();
  }

  /**
   * 设置本地玩家
   */
  setLocalPlayer(player: Player): void {
    this.localPlayerId = player.id;
    this.log('Set local player', { playerId: player.id });
  }

  /**
   * 获取本地玩家
   */
  getLocalPlayer(): Player | null {
    return this.localPlayerId ? this.getPlayer(this.localPlayerId) : null;
  }

  /**
   * 设置对手
   */
  setOpponent(player: Player): void {
    this.opponentPlayerId = player.id;
    this.log('Set opponent', { playerId: player.id });
  }

  /**
   * 获取对手
   */
  getOpponent(): Player | null {
    return this.opponentPlayerId ? this.getPlayer(this.opponentPlayerId) : null;
  }

  /**
   * 订阅网络消息
   */
  private subscribeToNetworkMessages(): void {
    this.networkService.subscribe(NetworkMessageType.MOVE, (message: NetworkMessage) => {
      this.handleNetworkMove(message);
    });

    this.networkService.subscribe(NetworkMessageType.SCORE, (message: NetworkMessage) => {
      this.handleNetworkScore(message);
    });

    this.networkService.subscribe(NetworkMessageType.LIVES, (message: NetworkMessage) => {
      this.handleNetworkLives(message);
    });

    this.networkService.subscribe(NetworkMessageType.GAME_OVER, (message: NetworkMessage) => {
      this.handleNetworkGameOver(message);
    });

    this.networkService.subscribe(NetworkMessageType.READY, (message: NetworkMessage) => {
      this.handleNetworkReady(message);
    });
  }

  /**
   * 处理网络移动消息
   */
  private handleNetworkMove(message: NetworkMessage): void {
    if (message.playerId === this.localPlayerId) return;

    this.log('Received move from opponent', { playerId: message.playerId });

    this.emit('opponent_move', {
      playerId: message.playerId,
      action: message.data,
      timestamp: message.timestamp,
    });
  }

  /**
   * 处理网络分数消息
   */
  private handleNetworkScore(message: NetworkMessage): void {
    if (message.playerId === this.localPlayerId) return;

    const player = this.getPlayer(message.playerId);
    if (player) {
      player.score = message.data.score;
      this.updatePlayer(player);

      this.emit('opponent_score_change', {
        playerId: message.playerId,
        score: player.score,
      });
    }
  }

  /**
   * 处理网络生命值消息
   */
  private handleNetworkLives(message: NetworkMessage): void {
    if (message.playerId === this.localPlayerId) return;

    const player = this.getPlayer(message.playerId);
    if (player) {
      player.lives = message.data.lives;
      this.updatePlayer(player);

      this.emit('opponent_lives_change', {
        playerId: message.playerId,
        lives: player.lives,
      });
    }
  }

  /**
   * 处理网络游戏结束消息
   */
  private handleNetworkGameOver(message: NetworkMessage): void {
    this.log('Received game over message', { message });

    this.emit('network_game_over', {
      winner: message.data.winner,
      player1Score: message.data.player1Score,
      player2Score: message.data.player2Score,
    });
  }

  /**
   * 处理网络准备消息
   */
  private handleNetworkReady(message: NetworkMessage): void {
    this.log('Received ready message', { playerId: message.playerId });

    const player = this.getPlayer(message.playerId);
    if (player) {
      player.isReady = message.data.ready;
      this.updatePlayer(player);

      this.emit('opponent_ready', {
        playerId: message.playerId,
        isReady: player.isReady,
      });
    }
  }

  /**
   * 发送网络消息
   */
  sendNetworkMessage(type: NetworkMessageType, data: any): void {
    if (!this.localPlayerId) {
      this.log('Local player not set, cannot send message');
      return;
    }

    const message: NetworkMessage = {
      type,
      playerId: this.localPlayerId,
      data,
      timestamp: Date.now(),
    };

    this.networkService.send(message);
    this.log('Sent network message', { type });
  }

  /**
   * 启动状态同步
   */
  private startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      this.syncState();
    }, 1000);

    this.log('Started state sync');
  }

  /**
   * 停止状态同步
   */
  private stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.log('Stopped state sync');
  }

  /**
   * 同步状态
   */
  private syncState(): void {
    const now = Date.now();
    const state = this.syncGameState();

    this.sendNetworkMessage(NetworkMessageType.STATE_SYNC, {
      state,
      timestamp: now,
    });

    this.lastSyncTime = now;
  }

  /**
   * 同步游戏状态
   */
  private syncGameState(): any {
    return {
      players: this.getPlayers().map(p => ({
        id: p.id,
        score: p.score,
        lives: p.lives,
        isReady: p.isReady,
      })),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTurnPlayerId: this.currentTurnPlayerId,
    };
  }

  /**
   * 获取网络延迟
   */
  getLatency(): number {
    return this.networkService.getLatency();
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): string {
    return this.networkService.getConnectionState();
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const baseStats = super.getStatistics();

    return {
      ...baseStats,
      localPlayerId: this.localPlayerId,
      opponentPlayerId: this.opponentPlayerId,
      latency: this.getLatency(),
      connectionState: this.getConnectionState(),
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopSync();
    this.networkService.clearSubscribers();
    super.cleanup();
  }
}
