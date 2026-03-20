import { BaseGameMode } from './BaseGameMode';
import { GameModeConfig, GameModeType, Player } from '../interfaces';

/**
 * 本地对抗模式实现
 * 处理多玩家本地输入同步、分屏/键鼠适配、本地状态校验
 */
export class LocalBattleMode extends BaseGameMode {
  private playerInputs: Map<string, any> = new Map();
  private inputHistory: Array<{ playerId: string; action: any; timestamp: number }> = [];

  constructor(config?: Partial<GameModeConfig>) {
    super({
      ...config,
      modeType: GameModeType.LOCAL_BATTLE,
      modeName: 'Local Battle',
      maxPlayers: 2,
      supportAI: false,
    });
  }

  /**
   * 初始化本地对抗模式
   */
  async initialize(config: GameModeConfig): Promise<void> {
    await super.initialize(config);
    this.log('LocalBattleMode initialized', { maxPlayers: this.config.maxPlayers });
  }

  /**
   * 添加玩家
   */
  addPlayer(player: Player): boolean {
    const success = super.addPlayer(player);

    if (success) {
      // 初始化玩家输入映射
      this.playerInputs.set(player.id, null);
      this.log(`Initialized input for player: ${player.id}`);
    }

    return success;
  }

  /**
   * 移除玩家
   */
  removePlayer(playerId: string): boolean {
    this.playerInputs.delete(playerId);
    return super.removePlayer(playerId);
  }

  /**
   * 处理玩家输入
   */
  handlePlayerInput(playerId: string, input: any): void {
    if (!this.players.has(playerId)) {
      this.log(`Player ${playerId} not found`);
      return;
    }

    // 记录输入
    this.playerInputs.set(playerId, input);
    this.log(`Received input from player ${playerId}`, { input });

    // 记录输入历史
    this.inputHistory.push({
      playerId,
      action: input,
      timestamp: Date.now(),
    });

    // 限制历史记录长度
    if (this.inputHistory.length > 1000) {
      this.inputHistory.shift();
    }
  }

  /**
   * 获取玩家输入
   */
  getPlayerInput(playerId: string): any {
    return this.playerInputs.get(playerId);
  }

  /**
   * 获取所有玩家输入
   */
  getAllPlayerInputs(): Map<string, any> {
    return new Map(this.playerInputs);
  }

  /**
   * 验证玩家操作有效性
   */
  validateAction(playerId: string, action: any): boolean {
    // 基本验证
    if (!super.validateAction(playerId, action)) {
      return false;
    }

    // 本地对抗特有验证
    const player = this.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // 检查输入时间戳（防止作弊）
    if (action.timestamp) {
      const inputDelay = Date.now() - action.timestamp;
      if (Math.abs(inputDelay) > 1000) {
        this.log(`Invalid timestamp for player ${playerId}`, { inputDelay });
        return false;
      }
    }

    return true;
  }

  /**
   * 同步状态
   */
  syncState(): Map<string, any> {
    const state = new Map<string, any>();

    this.players.forEach((player, playerId) => {
      state.set(playerId, {
        id: player.id,
        score: player.score,
        lives: player.lives,
        isReady: player.isReady,
        input: this.playerInputs.get(playerId),
      });
    });

    this.log('Synced state for all players', { playerCount: state.size });
    return state;
  }

  /**
   * 获取输入历史
   */
  getInputHistory(playerId?: string): Array<{ playerId: string; action: any; timestamp: number }> {
    if (playerId) {
      return this.inputHistory.filter(h => h.playerId === playerId);
    }
    return [...this.inputHistory];
  }

  /**
   * 检查输入冲突
   */
  checkInputConflicts(): Array<{ playerId: string; conflicts: string[] }> {
    const conflicts: Array<{ playerId: string; conflicts: string[] }> = [];
    const inputs = Array.from(this.playerInputs.entries());

    for (let i = 0; i < inputs.length; i++) {
      const [playerId1, input1] = inputs[i];
      const playerConflicts: string[] = [];

      for (let j = i + 1; j < inputs.length; j++) {
        const [playerId2, input2] = inputs[j];

        // 检查是否有冲突（例如同时按下相同的按钮）
        if (this.detectConflict(input1, input2)) {
          playerConflicts.push(playerId2);
        }
      }

      if (playerConflicts.length > 0) {
        conflicts.push({ playerId: playerId1, conflicts: playerConflicts });
      }
    }

    return conflicts;
  }

  /**
   * 检测输入冲突
   */
  private detectConflict(input1: any, input2: any): boolean {
    if (!input1 || !input2) return false;

    // 检查是否有相同的按键
    if (input1.keys && input2.keys) {
      const commonKeys = input1.keys.filter((k: string) => input2.keys.includes(k));
      return commonKeys.length > 0;
    }

    // 检查是否有相同的动作
    if (input1.action === input2.action && input1.timestamp === input2.timestamp) {
      return true;
    }

    return false;
  }

  /**
   * 重置所有玩家输入
   */
  resetAllInputs(): void {
    this.playerInputs.forEach((_, playerId) => {
      this.playerInputs.set(playerId, null);
    });
    this.log('Reset all player inputs');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const baseStats = super.getStatistics();

    return {
      ...baseStats,
      inputHistoryLength: this.inputHistory.length,
      playerInputsCount: this.playerInputs.size,
      conflicts: this.checkInputConflicts(),
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.playerInputs.clear();
    this.inputHistory = [];
    super.cleanup();
  }
}
