/**
 * 排行榜 API
 */
import { apiClient } from './api-client.service';
import type { LeaderboardConfig, LeaderboardData, LeaderboardRank } from './api.types';

export const leaderboardApi = {
  getLeaderboardConfigs(gameId: number): Promise<LeaderboardConfig[]> {
    return apiClient.get<LeaderboardConfig[]>(`/api/leaderboard/configs/${gameId}`);
  },

  getLeaderboard(
    gameId: number,
    dimensionCode: string,
    rankType: string = 'ALL',
    limit: number = 100,
  ): Promise<LeaderboardRank[]> {
    const params = new URLSearchParams({ rankType, limit: limit.toString() });
    return apiClient.get<LeaderboardRank[]>(`/api/leaderboard/${gameId}/${dimensionCode}?${params.toString()}`);
  },

  async updateLeaderboardMax(data: Partial<LeaderboardData>): Promise<void> {
    await apiClient.post('/api/leaderboard/update/max', data);
  },

  async updateLeaderboardMin(data: Partial<LeaderboardData>): Promise<void> {
    await apiClient.post('/api/leaderboard/update/min', data);
  },

  getUserBestRank(
    userId: number,
    gameId: number,
    dimensionCode: string,
  ): Promise<{ userRank: number; userValue: number; totalCount: number }> {
    const params = new URLSearchParams({ gameId: gameId.toString(), dimensionCode });
    return apiClient.get(`/api/leaderboard/user/${userId}/best-rank?${params.toString()}`);
  },

  getUserLeaderboardStats(
    userId: number,
    gameId: number,
  ): Promise<{ ranks: Array<unknown>; totalDimensions: number }> {
    const params = new URLSearchParams({ gameId: gameId.toString() });
    return apiClient.get(`/api/leaderboard/user/${userId}/stats?${params.toString()}`);
  },
};

export default leaderboardApi;