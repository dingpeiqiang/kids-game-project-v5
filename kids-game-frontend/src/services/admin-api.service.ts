/**
 * 后台管理 API 服务
 * 继承 BaseApiService 统一使用 fetch
 */
import { BaseApiService } from './base-api.service';

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export interface DashboardOverview {
  totalUsers: number;
  todayNewUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalGames: number;
  publishedGames: number;
  totalQuestions: number;
  totalAnswers: number;
  todayAnswers: number;
  answerCorrectRate: number;
  totalGameDuration: number;
  todayGameDuration: number;
}

export interface TodayStats {
  date: string;
  newUsers: number;
  activeUsers: number;
  gameCount: number;
  gameDuration: number;
  answerCount: number;
  correctAnswers: number;
  hourlyActiveUsers: Array<{
    hour: number;
    value: number;
  }>;
}

export interface TrendStats {
  days: number;
  dates: string[];
  newUsers: number[];
  activeUsers: number[];
  gameCounts: number[];
  answerCounts: number[];
  gameCategories: Array<{
    name: string;
    value: number;
  }>;
  answerCorrectRate: {
    correct: number;
    incorrect: number;
  };
}

export interface AdminUser {
  userId: number;
  username: string;
  nickname: string;
  avatar?: string;
  userType: number;
  status: number;
  fatiguePoints?: number;
  dailyAnswerPoints?: number;
  createTime: number;
  updateTime: number;
}

export interface AdminGame {
  gameId: number;
  gameCode: string;
  gameName: string;
  category?: string;
  grade?: string;
  iconUrl?: string;
  coverUrl?: string;
  resourceUrl?: string;
  description?: string;
  modulePath?: string;
  sortOrder?: number;
  consumePointsPerMinute?: number;
  onlineCount?: number;
  status: number;
  createTime: number;
  updateTime: number;
}

export interface GameCreateParams {
  gameCode?: string;
  gameName: string;
  category: string;
  grade: string;
  iconUrl?: string;
  coverUrl?: string;
  resourceUrl?: string;
  description?: string;
  modulePath?: string;
  sortOrder?: number;
  consumePointsPerMinute?: number;
  status?: number;
}

export interface GameUpdateParams extends Partial<GameCreateParams> {}

export interface GameStats {
  gameId: number;
  totalPlayCount: number;
  todayPlayCount: number;
  averageScore?: number;
  favoriteCount?: number;
  satisfactionRate?: number;
}

export interface AdminQuestion {
  questionId: number;
  content: string;
  options: string;
  correctAnswer: string;
  analysis?: string;
  grade: string;
  type: string;
  difficulty: number;
  status: number;
  createTime: number;
  updateTime: number;
}

export interface QuestionCreateDTO {
  content: string;
  options: string;
  correctAnswer: string;
  analysis?: string;
  grade: string;
  type?: string;
  difficulty?: number;
  status?: number;
}

export interface QuestionUpdateDTO {
  content?: string;
  options?: string;
  correctAnswer?: string;
  analysis?: string;
  grade?: string;
  type?: string;
  difficulty?: number;
  status?: number;
}

class AdminApiService extends BaseApiService {
  private static instance: AdminApiService;

  private constructor() {
    super();
  }

  static getInstance(): AdminApiService {
    if (!AdminApiService.instance) {
      AdminApiService.instance = new AdminApiService();
    }
    return AdminApiService.instance;
  }

  /**
   * 获取仪表盘概览
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.get<DashboardOverview>('/api/admin/dashboard/overview');
  }

  /**
   * 获取今日实时统计
   */
  async getTodayStats(): Promise<TodayStats> {
    return this.get<TodayStats>('/api/admin/dashboard/today-stats');
  }

  /**
   * 获取趋势统计
   */
  async getTrendStats(days: number = 7): Promise<TrendStats> {
    return this.get<TrendStats>(`/api/admin/dashboard/trend?days=${days}`);
  }

  /**
   * 获取用户列表
   */
  async getUserList(params: {
    username?: string;
    userType?: number;
    status?: number;
    page?: number;
    size?: number;
  }): Promise<PageResult<AdminUser>> {
    const queryParams = new URLSearchParams();
    if (params.username) queryParams.append('username', params.username);
    if (params.userType !== undefined) queryParams.append('userType', params.userType.toString());
    if (params.status !== undefined) queryParams.append('status', params.status.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    return this.get<PageResult<AdminUser>>(`/api/admin/users?${queryParams.toString()}`);
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: number, status: number): Promise<void> {
    await this.put<void>(`/api/admin/users/${userId}/status`, { status });
  }

  /**
   * 获取游戏列表
   */
  async getGameList(params: {
    gameName?: string;
    category?: string;
    status?: number;
    page?: number;
    size?: number;
  }): Promise<PageResult<AdminGame>> {
    const queryParams = new URLSearchParams();
    if (params.gameName) queryParams.append('gameName', params.gameName);
    if (params.category) queryParams.append('category', params.category);
    if (params.status !== undefined) queryParams.append('status', params.status.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    return this.get<PageResult<AdminGame>>(`/api/admin/games?${queryParams.toString()}`);
  }

  /**
   * 更新游戏状态
   */
  async updateGameStatus(gameId: number, status: number): Promise<void> {
    await this.put<void>(`/api/admin/games/${gameId}/status`, { status });
  }

  /**
   * 获取题目列表
   */
  async getQuestionList(params: {
    content?: string;
    type?: string;
    difficulty?: number;
    status?: number;
    page?: number;
    size?: number;
  }): Promise<PageResult<AdminQuestion>> {
    const queryParams = new URLSearchParams();
    if (params.content) queryParams.append('content', params.content);
    if (params.type) queryParams.append('type', params.type);
    if (params.difficulty !== undefined) queryParams.append('difficulty', params.difficulty.toString());
    if (params.status !== undefined) queryParams.append('status', params.status.toString());
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    return this.get<PageResult<AdminQuestion>>(`/api/admin/questions?${queryParams.toString()}`);
  }

  /**
   * 创建题目
   */
  async createQuestion(data: QuestionCreateDTO): Promise<number> {
    return this.post<number>('/api/admin/questions', data);
  }

  /**
   * 更新题目
   */
  async updateQuestion(questionId: number, data: QuestionUpdateDTO): Promise<void> {
    await this.put<void>(`/api/admin/questions/${questionId}`, data);
  }

  /**
   * 删除题目
   */
  async deleteQuestion(questionId: number): Promise<void> {
    await this.delete<void>(`/api/admin/questions/${questionId}`);
  }

  /**
   * 获取最新注册用户
   */
  async getLatestUsers(limit: number = 5): Promise<AdminUser[]> {
    return this.get<AdminUser[]>(`/api/admin/users/latest?limit=${limit}`);
  }

  /**
   * 获取最新游戏记录
   */
  async getLatestGameRecords(limit: number = 5): Promise<Array<{ [key: string]: any }>> {
    return this.get<Array<{ [key: string]: any }>>(`/api/admin/game-records/latest?limit=${limit}`);
  }

  /**
   * 获取最新答题记录
   */
  async getLatestAnswerRecords(limit: number = 5): Promise<Array<{ [key: string]: any }>> {
    return this.get<Array<{ [key: string]: any }>>(`/api/admin/answer-records/latest?limit=${limit}`);
  }

  /**
   * 创建游戏
   */
  async createGame(params: GameCreateParams): Promise<AdminGame> {
    return this.post<AdminGame>('/api/admin/games', params);
  }

  /**
   * 更新游戏
   */
  async updateGame(gameId: number, params: GameUpdateParams): Promise<void> {
    await this.put<void>(`/api/admin/games/${gameId}`, params);
  }

  /**
   * 批量删除游戏
   */
  async batchDeleteGames(gameIds: number[]): Promise<void> {
    await this.post<void>('/api/admin/games/batch-delete', gameIds);
  }

  /**
   * 获取游戏统计
   */
  async getGameStats(gameId: number): Promise<GameStats> {
    return this.get<GameStats>(`/api/admin/games/${gameId}/stats`);
  }
}

export const adminApi = AdminApiService.getInstance();
export default adminApi;
export { AdminApiService };
