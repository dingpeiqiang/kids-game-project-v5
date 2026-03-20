/**
 * 家长相关 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { Parent, ParentLimit, Kid, GameRecord, AnswerRecord } from './api.types';
import { API_CONSTANTS } from './api.types';

export class ParentApiService extends BaseApiService {
  private static instance: ParentApiService;
  private parentToken: string | null = null;

  private constructor() {
    super();
    this.loadParentToken();
  }

  static getInstance(): ParentApiService {
    if (!ParentApiService.instance) {
      ParentApiService.instance = new ParentApiService();
    }
    return ParentApiService.instance;
  }

  /**
   * 设置家长 Token
   */
  setParentToken(token: string): void {
    this.parentToken = token;
    localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, token);
  }

  /**
   * 清除家长 Token
   */
  clearParentToken(): void {
    this.parentToken = null;
    localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
  }

  /**
   * 加载家长 Token
   */
  private loadParentToken(): void {
    this.parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);
  }

  /**
   * 重写 getCurrentToken 方法
   */
  protected getCurrentToken(): string | null {
    return this.parentToken || super.getCurrentToken();
  }

  /**
   * 家长注册
   */
  async register(data: {
    phone: string;
    password: string;
    nickname?: string;
  }): Promise<Parent> {
    return this.post<Parent>('/api/parent/register', data);
  }

  /**
   * 家长登录
   */
  async login(phone: string, password: string): Promise<Parent> {
    const result = await this.post<Parent>('/api/parent/login', { phone, password });

    if (result.token) {
      this.setParentToken(result.token);
    }

    return result;
  }

  /**
   * 家长短信验证码登录
   */
  async loginBySms(phone: string, smsCode: string): Promise<Parent> {
    const result = await this.post<Parent>('/api/parent/login/sms', { phone, smsCode });

    if (result.token) {
      this.setParentToken(result.token);
    }

    return result;
  }

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phone: string): Promise<void> {
    await this.post('/api/parent/sms/send', { phone });
  }

  /**
   * 验证家长密码
   */
  async verifyPassword(parentId: number, password: string): Promise<boolean> {
    return this.post<boolean>('/api/parent/verify', { parentId, password });
  }

  /**
   * 获取管控规则
   */
  async getParentLimit(kidId: number): Promise<ParentLimit> {
    return this.get<ParentLimit>(`/api/parent/limit?kidId=${kidId}`);
  }

  /**
   * 更新管控规则
   */
  async updateParentLimit(limit: ParentLimit): Promise<void> {
    await this.put('/api/parent/limit', limit);
  }

  /**
   * 远程暂停游戏
   */
  async remotePauseGame(kidId: number): Promise<void> {
    await this.post('/api/parent/remote/pause', { kidId });
  }

  /**
   * 远程解锁游戏
   */
  async remoteUnlockGame(kidId: number): Promise<void> {
    await this.post('/api/parent/remote/unlock', { kidId });
  }

  /**
   * 获取儿童列表
   */
  async getKids(parentId: number): Promise<Kid[]> {
    return this.get<Kid[]>(`/api/parent/kids?parentId=${parentId}`);
  }

  /**
   * 获取儿童列表（别名，兼容旧代码）
   */
  async getChildren(parentId?: number): Promise<Kid[]> {
    // 如果没有传入 parentId，尝试从 profile 或其他地方获取
    if (!parentId) {
      // 尝试从已知的家长信息中获取
      // 这里简化处理，实际项目中可能需要从 store 或 token 中解析
      const storedParentId = localStorage.getItem('currentParentId');
      if (storedParentId) {
        parentId = parseInt(storedParentId, 10);
      }
    }
    
    if (!parentId) {
      throw new Error('parentId is required to fetch children');
    }
    
    return this.getKids(parentId);
  }

  /**
   * 获取儿童游戏记录
   */
  async getKidGameRecords(kidId: number, limit: number = 20): Promise<GameRecord[]> {
    return this.get<GameRecord[]>(`/api/parent/game-records?kidId=${kidId}&limit=${limit}`);
  }

  /**
   * 获取儿童答题记录
   */
  async getKidAnswerRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return this.get<AnswerRecord[]>(`/api/parent/answer-records?kidId=${kidId}&limit=${limit}`);
  }

  /**
   * 屏蔽游戏
   */
  async blockGame(kidId: number, gameId: number): Promise<void> {
    await this.post('/api/parent/game/block', { kidId, gameId });
  }

  /**
   * 取消屏蔽游戏
   */
  async unblockGame(kidId: number, gameId: number): Promise<void> {
    await this.post('/api/parent/game/unblock', { kidId, gameId });
  }

  /**
   * 批量屏蔽游戏
   */
  async batchBlockGames(kidId: number, gameIds: number[]): Promise<void> {
    await this.post('/api/parent/game/block/batch', { kidId, gameIds });
  }

  /**
   * 批量取消屏蔽游戏
   */
  async batchUnblockGames(kidId: number, gameIds: number[]): Promise<void> {
    await this.post('/api/parent/game/unblock/batch', { kidId, gameIds });
  }

  /**
   * 请求绑定孩子（创建待确认关系）
   */
  async requestBindKid(
    parentId: number,
    kidUsername: string,
    roleType?: number,
    isPrimary?: boolean
  ): Promise<number> {
    return this.post<number>('/api/parent/request-bind-kid', {
      parentId,
      kidUsername,
      roleType: roleType || 3,
      isPrimary: isPrimary || false
    });
  }

  /**
   * 消耗家长疲劳点
   * 后端使用 @RequestParam，需以 x-www-form-urlencoded 格式传参
   */
  async consumeFatiguePoints(parentId: number, points: number = 1): Promise<boolean> {
    return this.postForm<boolean>('/api/user/fatigue/consume', {
      userId: String(parentId),
      userType: '1',
      points: String(points)
    });
  }

  /**
   * 获取家长疲劳点数
   */
  async getFatiguePoints(parentId: number): Promise<number> {
    return this.get<number>(`/api/user/fatigue/points?userId=${parentId}&userType=1`);
  }
}

export const parentApi = ParentApiService.getInstance();
export default parentApi;
