/**
 * 游戏相关 API
 */
import { apiClient } from './api-client.service';
import type { Game, GameSession } from './api.types';

export const gameApi = {
  async getList(grade?: string, category?: string, kidId?: number): Promise<Game[]> {
    let url = '/api/game/list';
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (category) params.append('category', category);
    if (kidId) params.append('kidId', kidId.toString());
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return apiClient.get<Game[]>(url);
  },

  async getDetail(gameId: number): Promise<Game> {
    return apiClient.get<Game>(`/api/game/${gameId}`);
  },

  async start(userId: number, gameId: number): Promise<number> {
    return apiClient.post<number>('/api/game/start', { userId, gameId });
  },

  async end(sessionId: number, duration: number, score: number): Promise<void> {
    await apiClient.post('/api/game/end', { sessionId, duration, score });
  },

  async heartbeat(sessionId: number, duration: number, score: number): Promise<void> {
    await apiClient.post('/api/game/heartbeat', { sessionId, duration, score });
  },

  async getByCode(code: string): Promise<Game> {
    return apiClient.get<Game>(`/api/game/code/${code}`);
  },

  async getThemeTemplate(gameCode: string): Promise<unknown> {
    return apiClient.get<unknown>(`/api/game/theme-template?gameCode=${gameCode}`);
  },

  async startSession(gameId: number): Promise<GameSession> {
    return apiClient.post<GameSession>('/api/game/session/start', { gameId });
  },

  async submitResult(sessionId: string, result: unknown): Promise<void> {
    await apiClient.post(`/api/game/session/${sessionId}/result`, result);
  },

  async endSession(sessionId: string): Promise<void> {
    await apiClient.post(`/api/game/session/${sessionId}/end`);
  },
};

export default gameApi;