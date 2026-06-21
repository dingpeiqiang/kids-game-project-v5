/**
 * 班级管理 API
 */
import { apiClient } from './api-client.service';
import type { SchoolClass, ClassMember, Kid } from './api.types';

export interface ClassSavePayload {
  classId?: number;
  className: string;
  grade?: string;
  schoolYear?: string;
  description?: string;
}

export interface JoinByCodeParams {
  inviteCode: string;
  role?: string;
}

export interface JoinParams {
  role?: string;
}

export const classApi = {
  /** 创建班级 */
  async create(payload: ClassSavePayload): Promise<SchoolClass> {
    return apiClient.post<SchoolClass>('/api/class', payload);
  },

  /** 更新班级 */
  async update(classId: number, payload: ClassSavePayload): Promise<SchoolClass> {
    return apiClient.put<SchoolClass>(`/api/class/${classId}`, payload);
  },

  /** 解散班级 */
  async delete(classId: number): Promise<void> {
    await apiClient.delete(`/api/class/${classId}`);
  },

  /** 班级详情 */
  async getById(classId: number): Promise<SchoolClass> {
    return apiClient.get<SchoolClass>(`/api/class/${classId}`);
  },

  /** 我的班级列表（教师返回教的班，学生返回加入的班） */
  async myClasses(): Promise<SchoolClass[]> {
    return apiClient.get<SchoolClass[]>('/api/class/my');
  },

  /** 通过邀请码加入班级 */
  async joinByCode(params: JoinByCodeParams): Promise<boolean> {
    return apiClient.post<boolean>('/api/class/join', params);
  },

  /** 直接加入班级 */
  async join(classId: number, params: JoinParams = {}): Promise<boolean> {
    return apiClient.post<boolean>(`/api/class/${classId}/join`, params);
  },

  /** 退出班级 */
  async leave(classId: number): Promise<boolean> {
    return apiClient.post<boolean>(`/api/class/${classId}/leave`);
  },

  /** 班级成员列表 */
  async listMembers(classId: number): Promise<ClassMember[]> {
    return apiClient.get<ClassMember[]>(`/api/class/${classId}/members`);
  },

  /** 班级学生列表 */
  async listStudents(classId: number): Promise<Kid[]> {
    return apiClient.get<Kid[]>(`/api/class/${classId}/students`);
  },
};

export default classApi;
