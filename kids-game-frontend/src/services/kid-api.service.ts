/**
 * 儿童相关 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { Kid, GameRecord, AnswerRecord } from './api.types';

export class KidApiService extends BaseApiService {
  private static instance: KidApiService;

  private constructor() {
    super();
  }

  static getInstance(): KidApiService {
    if (!KidApiService.instance) {
      KidApiService.instance = new KidApiService();
    }
    return KidApiService.instance;
  }

  /**
   * @deprecated 请使用 authApi.login + userStore.unifiedLogin
   */
  async unifiedLogin(username: string, password: string): Promise<any> {
    const { authApi } = await import('./auth-api.service');
    const { persistAuthSession } = await import('@/utils/auth-session');
    const result = await authApi.login(username, password);
    persistAuthSession(result);
    return { ...result, token: result.token };
  }

  /**
   * @deprecated 请使用 authApi.refreshAccessToken
   */
  async refreshToken(): Promise<string> {
    const { authApi } = await import('./auth-api.service');
    return authApi.refreshAccessToken();
  }

  /**
   * 儿童注册
   */
  async register(data: {
    username: string;
    password: string;
    nickname?: string;
    grade?: string;
    avatar?: string;
    parentPhone: string;
    parentRoleType?: number;
  }): Promise<Kid> {
    return this.post<Kid>('/api/kid/register', data);
  }

  /**
   * 儿童登录
   */
  async login(username: string, password: string): Promise<Kid> {
    const result = await this.post<Kid>('/api/kid/login', { username, password });

    // 保存 token（在 deviceId 字段中，基类 setToken 会自动保存到 localStorage）
    if (result?.deviceId) {
      this.setToken(result.deviceId);
    }

    return result;
  }

  /**
   * 获取儿童信息
   */
  async getInfo(kidId: number): Promise<Kid> {
    return this.get<Kid>(`/api/kid/info?kidId=${kidId}`);
  }

  /**
   * 搜索儿童（按用户名或昵称模糊搜索）
   */
  async search(keyword: string): Promise<Kid[]> {
    return this.get<Kid[]>(`/api/kid/search?keyword=${encodeURIComponent(keyword)}`);
  }

  /**
   * 获取游学币
   */
  async getFatiguePoints(kidId: number): Promise<number> {
    return this.get<number>(`/api/kid/fatigue-points?kidId=${kidId}`);
  }

  /**
   * 消耗游学币
   * 后端使用 @RequestParam，需以 x-www-form-urlencoded 格式传参
   */
  async consumeFatiguePoints(kidId: number, points: number = 1): Promise<boolean> {
    return this.postForm<boolean>('/api/user/fatigue/consume', {
      userId: String(kidId),
      userType: '0',
      points: String(points)
    });
  }

  /**
   * 增加游学币（答题奖励）
   * 后端使用 @RequestParam，需以 x-www-form-urlencoded 格式传参
   */
  async addFatiguePoints(kidId: number, points: number = 1, relatedId?: number): Promise<number> {
    const params: Record<string, string> = {
      userId: String(kidId),
      userType: '0',
      points: String(points)
    };
    if (relatedId) params.relatedId = String(relatedId);
    return this.postForm<number>('/api/user/fatigue/add', params);
  }

  /**
   * 获取儿童游戏记录
   */
  async getGameRecords(kidId: number, limit: number = 20): Promise<GameRecord[]> {
    return this.get<GameRecord[]>(`/api/parent/game-records?kidId=${kidId}&limit=${limit}`);
  }

  /**
   * 获取儿童答题记录
   */
  async getAnswerRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return this.get<AnswerRecord[]>(`/api/parent/answer-records?kidId=${kidId}&limit=${limit}`);
  }
}

export const kidApi = KidApiService.getInstance();
export default kidApi;
