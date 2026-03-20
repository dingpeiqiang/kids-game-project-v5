import {
  IScoringService,
  ScoringConfig,
} from '../interfaces/ServiceInterface';

/**
 * 计分服务实现
 * 提供分数管理、排名、历史记录等功能
 */
export class ScoringService implements IScoringService {
  private config: ScoringConfig;
  private scores: Map<string, number> = new Map();
  private scoreHistory: Map<string, Array<{ action: string; points: number; timestamp: number }>> = new Map();
  private consecutiveActions: Map<string, number> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      initialScore: 0,
      scorePerAction: 10,
      scorePenalty: 5,
      enableMultiplier: false,
      multiplierRules: [
        { consecutiveCount: 3, multiplier: 1.5 },
        { consecutiveCount: 5, multiplier: 2.0 },
      ],
      ...config,
    };
  }

  /**
   * 初始化计分系统
   */
  initialize(config: ScoringConfig): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    this.log('ScoringService initialized', config);
  }

  /**
   * 获取玩家分数
   */
  getPlayerScore(playerId: string): number {
    return this.scores.get(playerId) ?? this.config.initialScore;
  }

  /**
   * 设置玩家分数
   */
  setPlayerScore(playerId: string, score: number): void {
    const oldScore = this.getPlayerScore(playerId);
    this.scores.set(playerId, score);
    this.recordScoreHistory(playerId, 'set_score', score - oldScore);
    this.log(`Set ${playerId} score to ${score}`);
  }

  /**
   * 增加玩家分数
   */
  addScore(playerId: string, points: number): void {
    if (points <= 0) {
      this.log(`Ignoring non-positive score addition: ${points}`);
      return;
    }

    let finalPoints = points;

    // 计算倍率
    if (this.config.enableMultiplier) {
      const consecutiveCount = this.consecutiveActions.get(playerId) ?? 0;
      const multiplier = this.calculateMultiplier(consecutiveCount + 1);
      finalPoints = Math.floor(points * multiplier);
      this.log(`Applied multiplier: ${multiplier}x, points: ${points} -> ${finalPoints}`);
    }

    const currentScore = this.getPlayerScore(playerId);
    const newScore = currentScore + finalPoints;
    this.scores.set(playerId, newScore);
    this.recordScoreHistory(playerId, 'add_score', finalPoints);

    // 更新连续操作计数
    this.consecutiveActions.set(playerId, (this.consecutiveActions.get(playerId) ?? 0) + 1);

    this.log(`Added ${finalPoints} points to ${playerId}, new score: ${newScore}`);
  }

  /**
   * 扣除玩家分数
   */
  deductScore(playerId: string, points: number): void {
    if (points <= 0) {
      this.log(`Ignoring non-positive score deduction: ${points}`);
      return;
    }

    const currentScore = this.getPlayerScore(playerId);
    const newScore = Math.max(0, currentScore - points);
    this.scores.set(playerId, newScore);
    this.recordScoreHistory(playerId, 'deduct_score', -points);

    // 重置连续操作计数
    this.consecutiveActions.set(playerId, 0);

    this.log(`Deducted ${points} points from ${playerId}, new score: ${newScore}`);
  }

  /**
   * 重置玩家分数
   */
  resetScore(playerId: string): void {
    const oldScore = this.getPlayerScore(playerId);
    this.scores.set(playerId, this.config.initialScore);
    this.recordScoreHistory(playerId, 'reset_score', this.config.initialScore - oldScore);
    this.consecutiveActions.set(playerId, 0);
    this.log(`Reset ${playerId} score to ${this.config.initialScore}`);
  }

  /**
   * 获取所有玩家分数排名
   */
  getRanking(): string[] {
    const players = Array.from(this.scores.entries());
    players.sort((a, b) => b[1] - a[1]);
    return players.map(([playerId]) => playerId);
  }

  /**
   * 获取排行榜数据
   */
  getLeaderboard(): Array<{ playerId: string; score: number; rank: number }> {
    const players = Array.from(this.scores.entries());
    players.sort((a, b) => b[1] - a[1]);

    return players.map(([playerId, score], index) => ({
      playerId,
      score,
      rank: index + 1,
    }));
  }

  /**
   * 记录得分历史
   */
  recordScoreHistory(playerId: string, action: string, points: number): void {
    if (!this.scoreHistory.has(playerId)) {
      this.scoreHistory.set(playerId, []);
    }

    const history = this.scoreHistory.get(playerId)!;
    history.push({
      action,
      points,
      timestamp: Date.now(),
    });

    // 限制历史记录数量
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * 获取玩家得分历史
   */
  getScoreHistory(playerId: string): Array<{ action: string; points: number; timestamp: number }> {
    return this.scoreHistory.get(playerId) ?? [];
  }

  /**
   * 计算倍率
   */
  private calculateMultiplier(consecutiveCount: number): number {
    let multiplier = 1.0;

    for (const rule of this.config.multiplierRules) {
      if (consecutiveCount >= rule.consecutiveCount) {
        multiplier = rule.multiplier;
      }
    }

    return multiplier;
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    console.log(`[ScoringService] ${message}`, data ? data : '');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const players = Array.from(this.scores.entries());
    const totalScore = players.reduce((sum, [, score]) => sum + score, 0);

    return {
      totalPlayers: players.length,
      totalScore,
      averageScore: players.length > 0 ? totalScore / players.length : 0,
      highestScore: players.length > 0 ? Math.max(...players.map(([, s]) => s)) : 0,
      lowestScore: players.length > 0 ? Math.min(...players.map(([, s]) => s)) : 0,
      topPlayers: this.getLeaderboard().slice(0, 5),
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.scores.clear();
    this.scoreHistory.clear();
    this.consecutiveActions.clear();
    this.log('Cleared all scoring data');
  }
}
