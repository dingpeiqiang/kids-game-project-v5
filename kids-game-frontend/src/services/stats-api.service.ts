/**
 * 统计相关 API 服务
 */
import { BaseApiService } from './base-api.service';

export class StatsApiService extends BaseApiService {
  private static instance: StatsApiService;

  private constructor() {
    super();
  }

  static getInstance(): StatsApiService {
    if (!StatsApiService.instance) {
      StatsApiService.instance = new StatsApiService();
    }
    return StatsApiService.instance;
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(): Promise<any> {
    return this.get('/api/stats/today');
  }

  /**
   * 获取儿童游戏统计
   */
  async getKidGameStats(kidId: number): Promise<any> {
    return this.get(`/api/stats/kid/game?kidId=${kidId}`);
  }

  /**
   * 获取儿童答题统计
   */
  async getKidAnswerStats(kidId: number): Promise<any> {
    return this.get(`/api/stats/kid/answer?kidId=${kidId}`);
  }
}

export const statsApi = StatsApiService.getInstance();
export default statsApi;
