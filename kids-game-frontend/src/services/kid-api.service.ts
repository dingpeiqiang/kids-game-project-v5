/**
 * 儿童相关 API
 */
import { apiClient } from './api-client.service';
import type { Kid, GameRecord, AnswerRecord } from './api.types';

export const kidApi = {
  async unifiedLogin(username: string, password: string): Promise<unknown> {
    const { authApi } = await import('./auth-api.service');
    const { persistAuthSession } = await import('@/utils/auth-session');
    const result = await authApi.login(username, password);
    persistAuthSession(result);
    return { ...result, token: result.token };
  },

  async refreshToken(): Promise<string> {
    const { authApi } = await import('./auth-api.service');
    return authApi.refreshAccessToken();
  },

  async register(data: {
    username: string;
    password: string;
    nickname?: string;
    grade?: string;
    avatar?: string;
    parentPhone?: string;
    parentRoleType?: number;
  }): Promise<Kid> {
    return apiClient.post<Kid>('/api/kid/register', data);
  },

  async login(username: string, password: string): Promise<Kid> {
    const result = await apiClient.post<Kid>('/api/kid/login', { username, password });
    if (result?.deviceId) {
      apiClient.setToken(result.deviceId);
    }
    return result;
  },

  setToken(token: string): void {
    apiClient.setToken(token);
  },

  async getInfo(kidId: number): Promise<Kid> {
    return apiClient.get<Kid>(`/api/kid/info?kidId=${kidId}`);
  },

  async search(keyword: string): Promise<Kid[]> {
    return apiClient.get<Kid[]>(`/api/kid/search?keyword=${encodeURIComponent(keyword)}`);
  },

  async getFatiguePoints(kidId: number): Promise<number> {
    return apiClient.get<number>(`/api/kid/fatigue-points?kidId=${kidId}`);
  },

  async consumeFatiguePoints(kidId: number, points: number = 1): Promise<boolean> {
    return apiClient.postForm<boolean>('/api/user/fatigue/consume', {
      userId: String(kidId),
      userType: '0',
      points: String(points),
    });
  },

  async addFatiguePoints(kidId: number, points: number = 1, relatedId?: number): Promise<number> {
    const params: Record<string, string> = {
      userId: String(kidId),
      userType: '0',
      points: String(points),
    };
    if (relatedId) params.relatedId = String(relatedId);
    return apiClient.postForm<number>('/api/user/fatigue/add', params);
  },

  async getGameRecords(kidId: number, limit: number = 20): Promise<GameRecord[]> {
    return apiClient.get<GameRecord[]>(`/api/parent/game-records?kidId=${kidId}&limit=${limit}`);
  },

  async getAnswerRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return apiClient.get<AnswerRecord[]>(`/api/parent/answer-records?kidId=${kidId}&limit=${limit}`);
  },
};

export default kidApi;