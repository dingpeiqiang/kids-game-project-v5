/**
 * 每日练习会话 API
 */
import { apiClient } from './api-client.service';
import type { DailySession, Question } from './api.types';
import type { AnswerSubmitResult } from './question-api.service';

export interface PracticeStartParams {
  /** 学科ID（null 为综合） */
  subjectId?: number;
  /** 知识点ID范围 */
  knowledgePointIds?: number[];
  /** 难度范围：ALL/EASY/MEDIUM/HARD */
  difficultyRange?: string;
  /** 题目数量（默认 5） */
  questionCount?: number;
  /** 题型限制（null 为混合） */
  questionType?: string;
  /** 来源：DAILY/RECOMMEND/WRONG_REVIEW/ASSIGNMENT */
  source?: string;
  /** 来源ID（如任务ID） */
  sourceId?: number;
}

export interface PracticeSubmitParams {
  kidId?: number;
  questionId: number;
  userAnswer: string;
  answerTime?: number;
  /** 是否标记本题 */
  marked?: boolean;
  /** 是否收藏本题 */
  collected?: boolean;
}

export interface PracticeTodayStats {
  sessionCount: number;
  totalCount: number;
  correctCount: number;
  pointsEarned: number;
  duration: number;
  [key: string]: unknown;
}

export const practiceApi = {
  /** 开始练习会话 */
  async start(params: PracticeStartParams): Promise<DailySession> {
    return apiClient.post<DailySession>('/api/practice/start', params);
  },

  /** 获取下一题 */
  async nextQuestion(sessionId: number): Promise<Question> {
    return apiClient.get<Question>(`/api/practice/${sessionId}/next`);
  },

  /** 提交单题答案 */
  async submit(sessionId: number, params: PracticeSubmitParams): Promise<AnswerSubmitResult> {
    return apiClient.post<AnswerSubmitResult>(`/api/practice/${sessionId}/submit`, params);
  },

  /** 结束会话 */
  async finish(sessionId: number): Promise<DailySession> {
    return apiClient.post<DailySession>(`/api/practice/${sessionId}/finish`);
  },

  /** 放弃会话 */
  async abandon(sessionId: number): Promise<DailySession> {
    return apiClient.post<DailySession>(`/api/practice/${sessionId}/abandon`);
  },

  /** 会话详情 */
  async getById(sessionId: number): Promise<DailySession> {
    return apiClient.get<DailySession>(`/api/practice/${sessionId}`);
  },

  /** 今日会话列表 */
  async listToday(): Promise<DailySession[]> {
    return apiClient.get<DailySession[]>('/api/practice/today');
  },

  /** 今日统计 */
  async todayStats(): Promise<PracticeTodayStats> {
    return apiClient.get<PracticeTodayStats>('/api/practice/today-stats');
  },
};

export default practiceApi;
