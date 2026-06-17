/**
 * 任务 API（委托统一 apiClient）
 */
import { apiClient } from './api-client.service';

export interface UserTaskItem {
  [key: string]: unknown;
}

export interface TaskDefinition {
  [key: string]: unknown;
}

export const taskApi = {
  listForUser(): Promise<UserTaskItem[]> {
    return apiClient.get<UserTaskItem[]>('/api/task/list');
  },

  claim(taskId: number): Promise<Record<string, unknown>> {
    return apiClient.post<Record<string, unknown>>('/api/task/claim', { taskId });
  },

  listManageable(kidId?: number): Promise<TaskDefinition[]> {
    const qs = kidId != null ? `?kidId=${kidId}` : '';
    return apiClient.get<TaskDefinition[]>(`/api/task/manage/list${qs}`);
  },

  saveTask(body: TaskDefinition): Promise<TaskDefinition> {
    return apiClient.post<TaskDefinition>('/api/task/manage', body);
  },
};

/** @deprecated 使用 taskApi 对象即可 */
export type TaskApiService = typeof taskApi;

export default taskApi;