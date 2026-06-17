/**
 * 答题与题库 API
 */
import { apiClient } from './api-client.service';
import type { Question, AnswerRecord } from './api.types';

export interface AnswerSubmitResult {
  isCorrect: boolean;
  correctAnswer: string;
  analysis?: string;
  getPoints: number;
  currentPoints?: number;
  points?: number;
}

export interface QuestionPageResult {
  list: Question[];
  total: number;
}

export interface QuestionSavePayload {
  questionId?: number;
  content: string;
  options: string;
  correctAnswer: string;
  analysis?: string;
  grade: string;
  type: string;
  difficulty?: number;
  status?: number;
}

interface BackendPageResult<T> {
  page?: number;
  size?: number;
  total: number;
  records: T[];
}

export const questionApi = {
  async getRandom(grade: string, excludeQuestionIds?: number[]): Promise<Question> {
    const q = new URLSearchParams();
    q.set('grade', grade);
    if (excludeQuestionIds?.length) {
      q.set('excludeIds', excludeQuestionIds.join(','));
    }
    return apiClient.get<Question>(`/api/question/random?${q.toString()}`);
  },

  async submitAnswer(
    kidId: number,
    questionId: number,
    userAnswer: string,
    answerTime?: number,
  ): Promise<AnswerSubmitResult> {
    const result = await apiClient.post<AnswerSubmitResult>('/api/question/submit', {
      kidId,
      questionId,
      userAnswer,
      answerTime: answerTime ?? 0,
    });
    return {
      ...result,
      points: result.getPoints ?? result.points ?? 0,
    };
  },

  async getRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return apiClient.get<AnswerRecord[]>(`/api/question/records?kidId=${kidId}&limit=${limit}`);
  },

  async getTodayAnswerPoints(kidId: number): Promise<number> {
    return apiClient.get<number>(`/api/question/today-points?kidId=${kidId}`);
  },

  async pageQuestions(params: {
    grade?: string;
    type?: string;
    status?: number;
    page?: number;
    size?: number;
  }): Promise<QuestionPageResult> {
    const q = new URLSearchParams();
    if (params.grade) q.set('grade', params.grade);
    if (params.type) q.set('type', params.type);
    if (params.status !== undefined && params.status !== null) {
      q.set('status', String(params.status));
    }
    q.set('page', String(params.page ?? 1));
    q.set('size', String(params.size ?? 10));
    const res = await apiClient.get<BackendPageResult<Question>>(`/api/question/page?${q.toString()}`);
    return {
      list: res.records ?? [],
      total: res.total ?? 0,
    };
  },

  async getDetail(questionId: number): Promise<Question> {
    return apiClient.get<Question>(`/api/question/${questionId}`);
  },

  async createQuestion(payload: QuestionSavePayload): Promise<Question> {
    return apiClient.post<Question>('/api/question', payload);
  },

  async updateQuestion(questionId: number, payload: QuestionSavePayload): Promise<Question> {
    return apiClient.put<Question>(`/api/question/${questionId}`, {
      ...payload,
      questionId,
    });
  },

  async deleteQuestion(questionId: number): Promise<void> {
    await apiClient.delete(`/api/question/${questionId}`);
  },

  async batchUpdateStatus(questionIds: number[], status: number): Promise<number> {
    return apiClient.put<number>('/api/question/batch-status', { questionIds, status });
  },
};

export default questionApi;