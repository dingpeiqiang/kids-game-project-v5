/**
 * 后台管理 API
 */
import { apiClient } from './api-client.service';

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
  hourlyActiveUsers: Array<{ hour: number; value: number }>;
}

export interface TrendStats {
  days: number;
  dates: string[];
  newUsers: number[];
  activeUsers: number[];
  gameCounts: number[];
  answerCounts: number[];
  gameCategories: Array<{ name: string; value: number }>;
  answerCorrectRate: { correct: number; incorrect: number };
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

export const adminApi = {
  getDashboardOverview(): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>('/api/admin/dashboard/overview');
  },

  getTodayStats(): Promise<TodayStats> {
    return apiClient.get<TodayStats>('/api/admin/dashboard/today-stats');
  },

  getTrendStats(days: number = 7): Promise<TrendStats> {
    return apiClient.get<TrendStats>(`/api/admin/dashboard/trend?days=${days}`);
  },

  getUserList(params: {
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
    return apiClient.get<PageResult<AdminUser>>(`/api/admin/users?${queryParams.toString()}`);
  },

  updateUserStatus(userId: number, status: number): Promise<void> {
    return apiClient.put<void>(`/api/admin/users/${userId}/status`, { status });
  },

  getGameList(params: {
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
    return apiClient.get<PageResult<AdminGame>>(`/api/admin/games?${queryParams.toString()}`);
  },

  updateGameStatus(gameId: number, status: number): Promise<void> {
    return apiClient.put<void>(`/api/admin/games/${gameId}/status`, { status });
  },

  getQuestionList(params: {
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
    return apiClient.get<PageResult<AdminQuestion>>(`/api/admin/questions?${queryParams.toString()}`);
  },

  createQuestion(data: QuestionCreateDTO): Promise<number> {
    return apiClient.post<number>('/api/admin/questions', data);
  },

  updateQuestion(questionId: number, data: QuestionUpdateDTO): Promise<void> {
    return apiClient.put<void>(`/api/admin/questions/${questionId}`, data);
  },

  deleteQuestion(questionId: number): Promise<void> {
    return apiClient.delete<void>(`/api/admin/questions/${questionId}`);
  },

  getLatestUsers(limit: number = 5): Promise<AdminUser[]> {
    return apiClient.get<AdminUser[]>(`/api/admin/users/latest?limit=${limit}`);
  },

  getLatestGameRecords(limit: number = 5): Promise<Array<Record<string, unknown>>> {
    return apiClient.get<Array<Record<string, unknown>>>(`/api/admin/game-records/latest?limit=${limit}`);
  },

  getLatestAnswerRecords(limit: number = 5): Promise<Array<Record<string, unknown>>> {
    return apiClient.get<Array<Record<string, unknown>>>(`/api/admin/answer-records/latest?limit=${limit}`);
  },

  createGame(params: GameCreateParams): Promise<AdminGame> {
    return apiClient.post<AdminGame>('/api/admin/games', params);
  },

  updateGame(gameId: number, params: GameUpdateParams): Promise<void> {
    return apiClient.put<void>(`/api/admin/games/${gameId}`, params);
  },

  batchDeleteGames(gameIds: number[]): Promise<void> {
    return apiClient.post<void>('/api/admin/games/batch-delete', gameIds);
  },

  getGameStats(gameId: number): Promise<GameStats> {
    return apiClient.get<GameStats>(`/api/admin/games/${gameId}/stats`);
  },

  submitReview(gameId: number): Promise<void> {
    return apiClient.post<void>(`/api/admin/games/${gameId}/submit-review`);
  },
};

export default adminApi;