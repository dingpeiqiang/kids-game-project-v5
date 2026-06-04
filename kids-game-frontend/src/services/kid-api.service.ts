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
   * 统一用户登录（支持儿童和家长自动识别）
   */
  async unifiedLogin(username: string, password: string): Promise<any> {
    const result = await this.post<any>('/api/user/login', { username, password });

    // 保存 token（基类 setToken 会自动保存到 localStorage）
    if (result?.token) {
      this.setToken(result.token);
    }
    if (result?.refreshToken) {
      localStorage.setItem('refreshToken', result.refreshToken);
    }

    return result;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token 不存在');
    }

    const result = await this.post<any>('/api/user/refresh-token', { refreshToken });

    if (result?.token) {
      this.setToken(result.token);
      return result.token;
    }
    throw new Error('刷新 Token 失败');
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
   * 获取疲劳点数
   */
  async getFatiguePoints(kidId: number): Promise<number> {
    return this.get<number>(`/api/kid/fatigue-points?kidId=${kidId}`);
  }

  /**
   * 消耗疲劳点
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
   * 增加疲劳点（答题奖励）
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
