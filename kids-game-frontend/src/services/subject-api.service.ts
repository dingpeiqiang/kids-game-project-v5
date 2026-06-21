/**
 * 学科管理 API
 */
import { apiClient } from './api-client.service';
import type { Subject } from './api.types';

export interface SubjectSavePayload {
  subjectId?: number;
  subjectCode: string;
  subjectName: string;
  iconUrl?: string;
  description?: string;
  sortOrder?: number;
  status?: number;
}

export const subjectApi = {
  /** 查询所有启用学科（登录即可） */
  async list(): Promise<Subject[]> {
    return apiClient.get<Subject[]>('/api/subject/list');
  },

  /** 查询所有学科（含禁用，管理端） */
  async listAll(): Promise<Subject[]> {
    return apiClient.get<Subject[]>('/api/subject/list-all');
  },

  async getById(id: number): Promise<Subject> {
    return apiClient.get<Subject>(`/api/subject/${id}`);
  },

  async create(payload: SubjectSavePayload): Promise<Subject> {
    return apiClient.post<Subject>('/api/subject', payload);
  },

  async update(id: number, payload: SubjectSavePayload): Promise<Subject> {
    return apiClient.put<Subject>(`/api/subject/${id}`, { ...payload, subjectId: id });
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/subject/${id}`);
  },
};

export default subjectApi;
