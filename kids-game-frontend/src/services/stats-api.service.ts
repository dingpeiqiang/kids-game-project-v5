/**
 * 统计 API
 */
import { apiClient } from './api-client.service';

export const statsApi = {
  getTodayStats(): Promise<unknown> {
    return apiClient.get('/api/stats/today');
  },

  getKidGameStats(kidId: number): Promise<unknown> {
    return apiClient.get(`/api/stats/kid/game?kidId=${kidId}`);
  },

  getKidAnswerStats(kidId: number): Promise<unknown> {
    return apiClient.get(`/api/stats/kid/answer?kidId=${kidId}`);
  },
};

export default statsApi;