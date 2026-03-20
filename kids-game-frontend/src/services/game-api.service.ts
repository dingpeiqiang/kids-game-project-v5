/**
 * 游戏相关 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { Game, GameSession } from './api.types';

export class GameApiService extends BaseApiService {
  private static instance: GameApiService;

  private constructor() {
    super();
  }

  static getInstance(): GameApiService {
    if (!GameApiService.instance) {
      GameApiService.instance = new GameApiService();
    }
    return GameApiService.instance;
  }

  /**
   * 获取游戏列表
   */
  async getList(grade?: string, category?: string, kidId?: number): Promise<Game[]> {
    let url = '/api/game/list';
    const params = new URLSearchParams();

    if (grade) params.append('grade', grade);
    if (category) params.append('category', category);
    if (kidId) params.append('kidId', kidId.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.get<Game[]>(url);
  }

  /**
   * 获取游戏详情
   */
  async getDetail(gameId: number): Promise<Game> {
    return this.get<Game>(`/api/game/${gameId}`);
  }

  /**
   * 开始游戏
   * @param userId 用户ID（儿童或家长）
   * @param gameId 游戏ID
   */
  async start(userId: number, gameId: number): Promise<number> {
    return this.post<number>('/api/game/start', { userId, gameId });
  }

  /**
   * 结束游戏
   */
  async end(sessionId: number, duration: number, score: number): Promise<void> {
    await this.post('/api/game/end', { sessionId, duration, score });
  }

  /**
   * 游戏心跳
   */
  async heartbeat(sessionId: number, duration: number, score: number): Promise<void> {
    await this.post('/api/game/heartbeat', { sessionId, duration, score });
  }

  /**
   * 通过游戏代码获取游戏信息
   */
  async getByCode(code: string): Promise<Game> {
    return this.get<Game>(`/api/game/code/${code}`);
  }

  /**
   * 获取游戏的主题资源模板
   * GET /api/game/theme-template?gameCode=xxx
   */
  async getThemeTemplate(gameCode: string): Promise<any> {
    return this.get<any>(`/api/game/theme-template?gameCode=${gameCode}`);
  }

  /**
   * 启动游戏会话（用于独立部署游戏）
   */
  async startSession(gameId: number): Promise<GameSession> {
    return this.post<GameSession>('/api/game/session/start', { gameId });
  }

  /**
   * 提交游戏结果（用于独立部署游戏）
   */
  async submitResult(sessionId: string, result: any): Promise<void> {
    await this.post(`/api/game/session/${sessionId}/result`, result);
  }

  /**
   * 结束游戏会话（用于独立部署游戏）
   */
  async endSession(sessionId: string): Promise<void> {
    await this.post(`/api/game/session/${sessionId}/end`);
  }
}

export const gameApi = GameApiService.getInstance();
export default gameApi;
