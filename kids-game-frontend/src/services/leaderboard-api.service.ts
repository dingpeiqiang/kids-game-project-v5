/**
 * 排行榜相关 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { LeaderboardConfig, LeaderboardData, LeaderboardRank } from './api.types';

export class LeaderboardApiService extends BaseApiService {
  private static instance: LeaderboardApiService;

  private constructor() {
    super();
  }

  static getInstance(): LeaderboardApiService {
    if (!LeaderboardApiService.instance) {
      LeaderboardApiService.instance = new LeaderboardApiService();
    }
    return LeaderboardApiService.instance;
  }

  /**
   * 获取游戏的排行榜配置列表
   */
  async getLeaderboardConfigs(gameId: number): Promise<LeaderboardConfig[]> {
    return this.get(`/api/leaderboard/configs/${gameId}`);
  }

  /**
   * 获取排行榜数据
   * @param gameId 游戏 ID
   * @param dimensionCode 维度代码
   * @param rankType 排行类型（ALL/DAILY/MONTHLY/YEARLY）
   * @param limit 返回数量限制
   */
  async getLeaderboard(
    gameId: number,
    dimensionCode: string,
    rankType: string = 'ALL',
    limit: number = 100
  ): Promise<LeaderboardRank[]> {
    const params = new URLSearchParams({ rankType, limit: limit.toString() });
    return this.get(`/api/leaderboard/${gameId}/${dimensionCode}?${params.toString()}`);
  }

  /**
   * 更新排行榜数据（最大值，用于分数、关卡等）
   */
  async updateLeaderboardMax(data: Partial<LeaderboardData>): Promise<void> {
    await this.post('/api/leaderboard/update/max', data);
  }

  /**
   * 更新排行榜数据（最小值，用于时间、步数等）
   */
  async updateLeaderboardMin(data: Partial<LeaderboardData>): Promise<void> {
    await this.post('/api/leaderboard/update/min', data);
  }

  /**
   * 获取用户最佳排名
   */
  async getUserBestRank(
    userId: number,
    gameId: number,
    dimensionCode: string
  ): Promise<{ userRank: number; userValue: number; totalCount: number }> {
    const params = new URLSearchParams({ gameId: gameId.toString(), dimensionCode });
    return this.get(`/api/leaderboard/user/${userId}/best-rank?${params.toString()}`);
  }

  /**
   * 获取用户排行榜统计信息
   */
  async getUserLeaderboardStats(
    userId: number,
    gameId: number
  ): Promise<{ ranks: Array<any>; totalDimensions: number }> {
    const params = new URLSearchParams({ gameId: gameId.toString() });
    return this.get(`/api/leaderboard/user/${userId}/stats?${params.toString()}`);
  }
}

export const leaderboardApi = LeaderboardApiService.getInstance();
export default leaderboardApi;
