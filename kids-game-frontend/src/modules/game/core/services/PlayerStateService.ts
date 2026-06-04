import {
  IPlayerStateService,
  PlayerStateConfig,
  Player,
} from '../interfaces/ServiceInterface';

/**
 * 玩家状态服务实现
 * 管理玩家的生命周期、状态变化
 */
export class PlayerStateService implements IPlayerStateService {
  private config: PlayerStateConfig;
  private players: Map<string, Player> = new Map();
  private snapshots: Map<string, Player> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<PlayerStateConfig>) {
    this.config = {
      maxLives: 3,
      initialLives: 3,
      allowNegativeLives: false,
      maxScore: undefined,
      minScore: undefined,
      ...config,
    };
  }

  /**
   * 初始化玩家状态服务
   */
  initialize(config: PlayerStateConfig): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    this.log('PlayerStateService initialized', config);
  }

  /**
   * 添加玩家
   */
  addPlayer(player: Player): void {
    if (this.players.has(player.id)) {
      this.log(`Player ${player.id} already exists, updating...`);
      this.updatePlayer(player);
      return;
    }

    // 设置初始值
    const newPlayer: Player = {
      ...player,
      lives: player.lives ?? this.config.initialLives,
      score: player.score ?? 0,
      isReady: player.isReady ?? false,
    };

    this.players.set(newPlayer.id, newPlayer);
    this.log(`Added player: ${newPlayer.id}`, { name: newPlayer.name });
  }

  /**
   * 移除玩家
   */
  removePlayer(playerId: string): boolean {
    const existed = this.players.delete(playerId);
    this.snapshots.delete(playerId);
    this.log(`Removed player: ${playerId}`, { existed });
    return existed;
  }

  /**
   * 获取玩家
   */
  getPlayer(playerId: string): Player | null {
    return this.players.get(playerId) ?? null;
  }

  /**
   * 获取所有玩家
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * 更新玩家
   */
  updatePlayer(player: Player): boolean {
    if (!this.players.has(player.id)) {
      this.log(`Player ${player.id} not found`);
      return false;
    }

    const existing = this.players.get(player.id)!;
    const updated: Player = { ...existing, ...player };
    this.players.set(player.id, updated);
    this.log(`Updated player: ${player.id}`);
    return true;
  }

  /**
   * 设置玩家生命值
   */
  setPlayerLives(playerId: string, lives: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      this.log(`Player ${playerId} not found`);
      return;
    }

    player.lives = lives;
    this.log(`Set ${playerId} lives to ${lives}`);
  }

  /**
   * 增加玩家生命值
   */
  addPlayerLives(playerId: string, amount: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      this.log(`Player ${playerId} not found`);
      return;
    }

    player.lives = Math.min(this.config.maxLives, player.lives + amount);
    this.log(`Added ${amount} lives to ${playerId}, new lives: ${player.lives}`);
  }

  /**
   * 减少玩家生命值
   */
  deductPlayerLives(playerId: string, amount: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      this.log(`Player ${playerId} not found`);
      return;
    }

    if (this.config.allowNegativeLives) {
      player.lives -= amount;
    } else {
      player.lives = Math.max(0, player.lives - amount);
    }

    this.log(`Deducted ${amount} lives from ${playerId}, new lives: ${player.lives}`);
  }

  /**
   * 设置玩家准备状态
   */
  setPlayerReady(playerId: string, isReady: boolean): void {
    const player = this.players.get(playerId);
    if (!player) {
      this.log(`Player ${playerId} not found`);
      return;
    }

    player.isReady = isReady;
    this.log(`Set ${playerId} ready to ${isReady}`);
  }

  /**
   * 获取准备就绪的玩家列表
   */
  getReadyPlayers(): string[] {
    return Array.from(this.players.values())
      .filter(player => player.isReady)
      .map(player => player.id);
  }

  /**
   * 检查玩家是否存活
   */
  isPlayerAlive(playerId: string): boolean {
    const player = this.players.get(playerId);
    return player ? player.lives > 0 : false;
  }

  /**
   * 获取存活玩家列表
   */
  getAlivePlayers(): string[] {
    return Array.from(this.players.values())
      .filter(player => player.lives > 0)
      .map(player => player.id);
  }

  /**
   * 重置所有玩家状态
   */
  resetAllPlayers(): void {
    this.players.forEach(player => {
      player.lives = this.config.initialLives;
      player.score = 0;
      player.isReady = false;
    });
    this.log('Reset all players');
  }

  /**
   * 保存玩家快照
   */
  savePlayerSnapshot(playerId: string): Player | null {
    const player = this.players.get(playerId);
    if (!player) {
      this.log(`Player ${playerId} not found`);
      return null;
    }

    const snapshot = { ...player };
    this.snapshots.set(playerId, snapshot);
    this.log(`Saved snapshot for player: ${playerId}`);
    return snapshot;
  }

  /**
   * 恢复玩家快照
   */
  restorePlayerSnapshot(playerId: string, snapshot: Player): boolean {
    if (!this.players.has(playerId)) {
      this.log(`Player ${playerId} not found`);
      return false;
    }

    this.players.set(playerId, { ...snapshot });
    this.snapshots.delete(playerId);
    this.log(`Restored snapshot for player: ${playerId}`);
    return true;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const players = Array.from(this.players.values());
    const totalScore = players.reduce((sum, player) => sum + player.score, 0);
    const totalLives = players.reduce((sum, player) => sum + player.lives, 0);
    const aliveCount = this.getAlivePlayers().length;
    const readyCount = this.getReadyPlayers().length;

    return {
      totalPlayers: players.length,
      totalScore,
      averageScore: players.length > 0 ? totalScore / players.length : 0,
      highestScore: players.length > 0 ? Math.max(...players.map(p => p.score)) : 0,
      lowestScore: players.length > 0 ? Math.min(...players.map(p => p.score)) : 0,
      totalLives,
      averageLives: players.length > 0 ? totalLives / players.length : 0,
      aliveCount,
      deadCount: players.length - aliveCount,
      readyCount,
      notReadyCount: players.length - readyCount,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    console.log(`[PlayerStateService] ${message}`, data ? data : '');
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.players.clear();
    this.snapshots.clear();
    this.log('Cleared all player data');
  }
}
