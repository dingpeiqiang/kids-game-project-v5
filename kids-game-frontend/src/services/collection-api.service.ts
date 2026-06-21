/**
 * 题目收藏 API
 */
import { apiClient } from './api-client.service';
import type { QuestionCollection } from './api.types';

export interface CollectionPageParams {
  page?: number;
  size?: number;
}

export interface CollectionPageResult {
  list: QuestionCollection[];
  total: number;
}

export interface CollectionToggleParams {
  questionId: number;
  note?: string;
}

interface BackendPageResult<T> {
  page?: number;
  size?: number;
  total: number;
  records: T[];
}

export const collectionApi = {
  /** 分页查询收藏 */
  async page(params: CollectionPageParams = {}): Promise<CollectionPageResult> {
    const q = new URLSearchParams();
    q.set('page', String(params.page ?? 1));
    q.set('size', String(params.size ?? 10));
    const res = await apiClient.get<BackendPageResult<QuestionCollection>>(
      `/api/collection/page?${q.toString()}`,
    );
    return {
      list: res.records ?? [],
      total: res.total ?? 0,
    };
  },

  /** 收藏/取消收藏（返回 true=已收藏，false=已取消） */
  async toggle(params: CollectionToggleParams): Promise<boolean> {
    return apiClient.post<boolean>('/api/collection/toggle', params);
  },

  /** 检查是否已收藏 */
  async check(questionId: number): Promise<boolean> {
    return apiClient.get<boolean>(`/api/collection/check/${questionId}`);
  },

  /** 取消收藏 */
  async remove(questionId: number): Promise<void> {
    await apiClient.delete(`/api/collection/${questionId}`);
  },
};

export default collectionApi;
