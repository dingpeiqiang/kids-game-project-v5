/**
 * 错题本 API
 */
import { apiClient } from './api-client.service';
import type { WrongQuestion } from './api.types';

export interface WrongBookPageParams {
  subjectId?: number;
  masteryLevel?: number;
  status?: number;
  page?: number;
  size?: number;
}

export interface WrongBookPageResult {
  list: WrongQuestion[];
  total: number;
}

export interface WrongBookReviewParams {
  questionId: number;
  userAnswer: string;
}

export interface WrongBookStats {
  total: number;
  pending: number;
  mastered: number;
  reviewing: number;
  [key: string]: unknown;
}

interface BackendPageResult<T> {
  page?: number;
  size?: number;
  total: number;
  records: T[];
}

export const wrongBookApi = {
  /** 分页查询错题 */
  async page(params: WrongBookPageParams): Promise<WrongBookPageResult> {
    const q = new URLSearchParams();
    if (params.subjectId) q.set('subjectId', String(params.subjectId));
    if (params.masteryLevel !== undefined && params.masteryLevel !== null) {
      q.set('masteryLevel', String(params.masteryLevel));
    }
    if (params.status !== undefined && params.status !== null) {
      q.set('status', String(params.status));
    }
    q.set('page', String(params.page ?? 1));
    q.set('size', String(params.size ?? 10));
    const res = await apiClient.get<BackendPageResult<WrongQuestion>>(
      `/api/wrong-book/page?${q.toString()}`,
    );
    return {
      list: res.records ?? [],
      total: res.total ?? 0,
    };
  },

  /** 待复习错题列表 */
  async listDueReview(): Promise<WrongQuestion[]> {
    return apiClient.get<WrongQuestion[]>('/api/wrong-book/due-review');
  },

  /** 复习错题（提交答案判分） */
  async review(params: WrongBookReviewParams): Promise<WrongQuestion> {
    return apiClient.post<WrongQuestion>('/api/wrong-book/review', params);
  },

  /** 标记已掌握 */
  async markMastered(questionId: number): Promise<void> {
    await apiClient.post(`/api/wrong-book/${questionId}/mastered`);
  },

  /** 移出错题本 */
  async remove(questionId: number): Promise<void> {
    await apiClient.delete(`/api/wrong-book/${questionId}`);
  },

  /** 错题统计 */
  async stats(): Promise<WrongBookStats> {
    return apiClient.get<WrongBookStats>('/api/wrong-book/stats');
  },
};

export default wrongBookApi;
