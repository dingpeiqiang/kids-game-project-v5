import { BaseGameMode } from './BaseGameMode';
import { GameModeConfig, GameModeType, Player, AIDifficulty, AIConfig } from '../interfaces';

/**
 * 单机模式实现
 * 处理AI对手逻辑、本地计分、单人回合控制
 */
export class SinglePlayerMode extends BaseGameMode {
  private aiConfig: AIConfig;
  private aiPlayer: Player | null = null;
  private aiActionQueue: Array<{ action: any; delay: number }> = [];
  private aiTimer: number | null = null;
  private consecutiveCorrect: number = 0;

  constructor(config?: Partial<GameModeConfig>, aiConfig?: Partial<AIConfig>) {
    super({
      ...config,
      modeType: GameModeType.SINGLE_PLAYER,
      modeName: 'Single Player',
      maxPlayers: 2,
      supportAI: true,
    });

    this.aiConfig = {
      difficulty: AIDifficulty.MEDIUM,
      responseDelay: 2000,
      errorRate: 0.2,
      ...aiConfig,
    };
  }

  /**
   * 初始化单机模式
   */
  async initialize(config: GameModeConfig): Promise<void> {
    await super.initialize(config);

    // 创建AI玩家
    this.createAIPlayer();

    this.log('SinglePlayerMode initialized with AI', {
      aiDifficulty: this.aiConfig.difficulty,
      responseDelay: this.aiConfig.responseDelay,
      errorRate: this.aiConfig.errorRate,
    });
  }

  /**
   * 启动模式
   */
  start(): void {
    super.start();

    // 启动AI处理
    this.startAIProcessing();
  }

  /**
   * 停止模式
   */
  stop(): void {
    super.stop();
    this.stopAIProcessing();
    this.aiActionQueue = [];
  }

  /**
   * 暂停模式
   */
  pause(): void {
    super.pause();
    this.stopAIProcessing();
  }

  /**
   * 恢复模式
   */
  resume(): void {
    super.resume();
    this.startAIProcessing();
  }

  /**
   * 创建AI玩家
   */
  private createAIPlayer(): void {
    this.aiPlayer = {
      id: 'ai_player',
      name: 'AI Opponent',
      score: 0,
      lives: 3,
      isReady: true,
      properties: {
        isAI: true,
        difficulty: this.aiConfig.difficulty,
      },
    };

    this.addPlayer(this.aiPlayer);
    this.log('Created AI player', { id: this.aiPlayer.id, name: this.aiPlayer.name });
  }

  /**
   * 启动AI处理
   */
  private startAIProcessing(): void {
    if (this.aiTimer) {
      clearInterval(this.aiTimer);
    }

    this.aiTimer = window.setInterval(() => {
      this.processAIActions();
    }, 100);
  }

  /**
   * 停止AI处理
   */
  private stopAIProcessing(): void {
    if (this.aiTimer) {
      clearInterval(this.aiTimer);
      this.aiTimer = null;
    }
  }

  /**
   * 处理AI动作队列
   */
  private processAIActions(): void {
    if (this.aiActionQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const { action, delay } = this.aiActionQueue[0];

    if (now - action.timestamp >= delay) {
      this.aiActionQueue.shift();
      this.executeAIAction(action);
    }
  }

  /**
   * 执行AI动作
   */
  private executeAIAction(action: any): void {
    this.log('Executing AI action', { action });

    // 触发AI操作事件
    this.emit('ai_action', {
      playerId: this.aiPlayer!.id,
      action,
      timestamp: Date.now(),
    });
  }

  /**
   * 生成AI回答
   */
  public generateAIAnswer(correctAnswer: number, options: number[]): number {
    const random = Math.random();

    // 根据错误率决定是否回答错误
    if (random < this.aiConfig.errorRate) {
      // 选择错误答案
      const wrongOptions = options.filter(o => o !== correctAnswer);
      return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    }

    // 根据难度选择答案
    switch (this.aiConfig.difficulty) {
      case AIDifficulty.EASY:
        // 30%几率回答正确
        return Math.random() < 0.3 ? correctAnswer : options[Math.floor(Math.random() * options.length)];

      case AIDifficulty.MEDIUM:
        // 60%几率回答正确
        return Math.random() < 0.6 ? correctAnswer : options[Math.floor(Math.random() * options.length)];

      case AIDifficulty.HARD:
        // 90%几率回答正确
        return Math.random() < 0.9 ? correctAnswer : options[Math.floor(Math.random() * options.length)];

      case AIDifficulty.EXPERT:
        // 99%几率回答正确
        return Math.random() < 0.99 ? correctAnswer : options[Math.floor(Math.random() * options.length)];

      default:
        return correctAnswer;
    }
  }

  /**
   * 处理玩家正确回答
   */
  public onPlayerCorrect(): void {
    this.consecutiveCorrect++;

    // 玩家连续答对，AI可能会有压力，提高错误率
    if (this.consecutiveCorrect >= 3) {
      this.aiConfig.errorRate = Math.min(0.4, this.aiConfig.errorRate + 0.05);
      this.log('Player on streak, AI error rate increased', { errorRate: this.aiConfig.errorRate });
    }
  }

  /**
   * 处理玩家错误回答
   */
  public onPlayerWrong(): void {
    this.consecutiveCorrect = 0;

    // 玩家出错，AI降低错误率
    this.aiConfig.errorRate = Math.max(0.1, this.aiConfig.errorRate - 0.05);
    this.log('Player wrong, AI error rate decreased', { errorRate: this.aiConfig.errorRate });
  }

  /**
   * 调度AI动作
   */
  public scheduleAIAction(action: any): void {
    const delay = this.calculateAIDelay();
    const aiAction = {
      ...action,
      timestamp: Date.now(),
    };

    this.aiActionQueue.push({ action: aiAction, delay });
    this.log('Scheduled AI action', { action, delay });
  }

  /**
   * 计算AI响应延迟
   */
  private calculateAIDelay(): number {
    const baseDelay = this.aiConfig.responseDelay;

    // 根据难度调整延迟
    switch (this.aiConfig.difficulty) {
      case AIDifficulty.EASY:
        // 简单：延迟较长，模拟思考时间长
        return baseDelay * (1 + Math.random() * 0.5);

      case AIDifficulty.MEDIUM:
        // 普通：标准延迟
        return baseDelay * (0.8 + Math.random() * 0.4);

      case AIDifficulty.HARD:
        // 困难：延迟较短
        return baseDelay * (0.6 + Math.random() * 0.3);

      case AIDifficulty.EXPERT:
        // 专家：延迟很短
        return baseDelay * (0.4 + Math.random() * 0.2);

      default:
        return baseDelay;
    }
  }

  /**
   * 设置AI难度
   */
  public setAIDifficulty(difficulty: AIDifficulty): void {
    this.aiConfig.difficulty = difficulty;

    // 根据难度调整错误率
    switch (difficulty) {
      case AIDifficulty.EASY:
        this.aiConfig.errorRate = 0.4;
        break;
      case AIDifficulty.MEDIUM:
        this.aiConfig.errorRate = 0.2;
        break;
      case AIDifficulty.HARD:
        this.aiConfig.errorRate = 0.1;
        break;
      case AIDifficulty.EXPERT:
        this.aiConfig.errorRate = 0.01;
        break;
    }

    if (this.aiPlayer) {
      this.aiPlayer.properties!.difficulty = difficulty;
    }

    this.log('AI difficulty updated', { difficulty, errorRate: this.aiConfig.errorRate });
  }

  /**
   * 获取AI配置
   */
  public getAIConfig(): AIConfig {
    return { ...this.aiConfig };
  }

  /**
   * 获取AI玩家
   */
  public getAIPlayer(): Player | null {
    return this.aiPlayer;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const baseStats = super.getStatistics();

    return {
      ...baseStats,
      aiConfig: this.aiConfig,
      aiPlayer: this.aiPlayer,
      consecutiveCorrect: this.consecutiveCorrect,
      aiActionQueueLength: this.aiActionQueue.length,
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopAIProcessing();
    this.aiActionQueue = [];
    this.consecutiveCorrect = 0;
    super.cleanup();
  }
}
