/**
 * 知识点管理 API
 */
import { apiClient } from './api-client.service';
import type { KnowledgePoint } from './api.types';

export interface KnowledgePointSavePayload {
  knowledgePointId?: number;
  subjectId: number;
  parentId?: number;
  code?: string;
  name: string;
  chapter?: string;
  description?: string;
  sortOrder?: number;
  status?: number;
}

export const knowledgePointApi = {
  /** 按学科查知识点列表 */
  async list(subjectId: number): Promise<KnowledgePoint[]> {
    return apiClient.get<KnowledgePoint[]>(`/api/knowledge-point/list?subjectId=${subjectId}`);
  },

  /** 按学科查知识点树形结构 */
  async tree(subjectId: number): Promise<KnowledgePoint[]> {
    return apiClient.get<KnowledgePoint[]>(`/api/knowledge-point/tree?subjectId=${subjectId}`);
  },

  async getById(id: number): Promise<KnowledgePoint> {
    return apiClient.get<KnowledgePoint>(`/api/knowledge-point/${id}`);
  },

  async create(payload: KnowledgePointSavePayload): Promise<KnowledgePoint> {
    return apiClient.post<KnowledgePoint>('/api/knowledge-point', payload);
  },

  async update(id: number, payload: KnowledgePointSavePayload): Promise<KnowledgePoint> {
    return apiClient.put<KnowledgePoint>(`/api/knowledge-point/${id}`, {
      ...payload,
      knowledgePointId: id,
    });
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/knowledge-point/${id}`);
  },
};

export default knowledgePointApi;
