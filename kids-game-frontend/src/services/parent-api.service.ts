/**
 * 家长相关 API
 */
import { apiClient } from './api-client.service';
import { authApi } from './auth-api.service';
import type { Parent, ParentLimit, Kid, GameRecord, AnswerRecord } from './api.types';
import { API_CONSTANTS, USER_TYPE } from './api.types';

export const parentApi = {
  setParentToken(token: string): void {
    apiClient.setParentToken(token);
  },

  clearParentToken(): void {
    apiClient.clearParentToken();
  },

  clearToken(): void {
    apiClient.clearParentToken();
  },

  async register(data: {
    username: string;
    phone: string;
    password: string;
    nickname?: string;
    realName?: string;
  }): Promise<Parent> {
    const result = await authApi.registerParent(data);
    return {
      userId: result.userId,
      username: result.username,
      nickname: result.nickname,
      userType: USER_TYPE.PARENT,
    } as Parent;
  },

  async login(phone: string, password: string): Promise<Parent> {
    const result = await apiClient.post<Parent>('/api/parent/login', { phone, password });
    if (result.token) {
      apiClient.setParentToken(result.token);
    }
    return result;
  },

  async loginBySms(phone: string, smsCode: string): Promise<Parent> {
    const result = await apiClient.post<Parent>('/api/parent/login/sms', { phone, smsCode });
    if (result.token) {
      apiClient.setParentToken(result.token);
    }
    return result;
  },

  async sendSmsCode(phone: string): Promise<void> {
    await apiClient.post('/api/parent/sms/send', { phone });
  },

  async verifyPassword(parentId: number, password: string): Promise<boolean> {
    return apiClient.post<boolean>('/api/parent/verify', { parentId, password });
  },

  async getParentLimit(kidId: number): Promise<ParentLimit> {
    return apiClient.get<ParentLimit>(`/api/parent/limit?kidId=${kidId}`);
  },

  async updateParentLimit(limit: ParentLimit): Promise<void> {
    await apiClient.put('/api/parent/limit', limit);
  },

  async remotePauseGame(kidId: number): Promise<void> {
    await apiClient.post('/api/parent/remote/pause', { kidId });
  },

  async remoteUnlockGame(kidId: number): Promise<void> {
    await apiClient.post('/api/parent/remote/unlock', { kidId });
  },

  async getKids(parentId: number): Promise<Kid[]> {
    return apiClient.get<Kid[]>(`/api/parent/kids?parentId=${parentId}`);
  },

  async getChildren(parentId?: number): Promise<Kid[]> {
    if (!parentId) {
      const storedParentId = localStorage.getItem('currentParentId');
      if (storedParentId) {
        parentId = parseInt(storedParentId, 10);
      }
    }
    if (!parentId) {
      throw new Error('parentId is required to fetch children');
    }
    return parentApi.getKids(parentId);
  },

  async getKidGameRecords(kidId: number, limit: number = 20): Promise<GameRecord[]> {
    return apiClient.get<GameRecord[]>(`/api/parent/game-records?kidId=${kidId}&limit=${limit}`);
  },

  async getKidAnswerRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return apiClient.get<AnswerRecord[]>(`/api/parent/answer-records?kidId=${kidId}&limit=${limit}`);
  },

  async blockGame(kidId: number, gameId: number): Promise<void> {
    await apiClient.post('/api/parent/game/block', { kidId, gameId });
  },

  async unblockGame(kidId: number, gameId: number): Promise<void> {
    await apiClient.post('/api/parent/game/unblock', { kidId, gameId });
  },

  async batchBlockGames(kidId: number, gameIds: number[]): Promise<void> {
    await apiClient.post('/api/parent/game/block/batch', { kidId, gameIds });
  },

  async batchUnblockGames(kidId: number, gameIds: number[]): Promise<void> {
    await apiClient.post('/api/parent/game/unblock/batch', { kidId, gameIds });
  },

  async requestBindKid(
    parentId: number,
    kidUsername: string,
    roleType?: number,
    isPrimary?: boolean,
  ): Promise<number> {
    return apiClient.post<number>('/api/parent/request-bind-kid', {
      parentId,
      kidUsername,
      roleType: roleType || 3,
      isPrimary: isPrimary || false,
    });
  },

  async consumeFatiguePoints(parentId: number, points: number = 1): Promise<boolean> {
    return apiClient.postForm<boolean>('/api/user/fatigue/consume', {
      userId: String(parentId),
      userType: '1',
      points: String(points),
    });
  },

  async getFatiguePoints(parentId: number): Promise<number> {
    return apiClient.get<number>(
      `/api/user/fatigue/points?userId=${parentId}&userType=${USER_TYPE.PARENT}`,
    );
  },
};

export default parentApi;