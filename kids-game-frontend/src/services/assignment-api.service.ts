/**
 * 教师练习任务 API
 */
import { apiClient } from './api-client.service';
import type { PracticeAssignment, AssignmentCompletion } from './api.types';

export interface AssignmentSavePayload {
  assignmentId?: number;
  classId: number;
  title: string;
  description?: string;
  subjectId?: number;
  /** 知识点范围 */
  knowledgePointIds?: number[];
  /** 难度范围 */
  difficultyRange?: string;
  /** 题目数量 */
  questionCount: number;
  /** 指定题型（null 为混合） */
  questionType?: string;
  /** 截止时间（毫秒时间戳） */
  dueTime?: number;
  /** 完成奖励游学币 */
  pointsReward?: number;
  /** 状态：0-草稿，1-发布 */
  status?: number;
}

export interface AssignmentPageParams {
  status?: number;
  page?: number;
  size?: number;
}

export interface AssignmentPageResult {
  list: PracticeAssignment[];
  total: number;
}

interface BackendPageResult<T> {
  page?: number;
  size?: number;
  total: number;
  records: T[];
}

export const assignmentApi = {
  /** 创建任务（教师） */
  async create(payload: AssignmentSavePayload): Promise<PracticeAssignment> {
    return apiClient.post<PracticeAssignment>('/api/assignment', payload);
  },

  /** 更新任务（教师） */
  async update(assignmentId: number, payload: AssignmentSavePayload): Promise<PracticeAssignment> {
    return apiClient.put<PracticeAssignment>(`/api/assignment/${assignmentId}`, payload);
  },

  /** 删除任务（教师） */
  async delete(assignmentId: number): Promise<void> {
    await apiClient.delete(`/api/assignment/${assignmentId}`);
  },

  /** 任务详情 */
  async getById(assignmentId: number): Promise<PracticeAssignment> {
    return apiClient.get<PracticeAssignment>(`/api/assignment/${assignmentId}`);
  },

  /** 教师任务列表 */
  async pageByTeacher(params: AssignmentPageParams = {}): Promise<AssignmentPageResult> {
    const q = new URLSearchParams();
    if (params.status !== undefined && params.status !== null) {
      q.set('status', String(params.status));
    }
    q.set('page', String(params.page ?? 1));
    q.set('size', String(params.size ?? 10));
    const res = await apiClient.get<BackendPageResult<PracticeAssignment>>(
      `/api/assignment/teacher?${q.toString()}`,
    );
    return {
      list: res.records ?? [],
      total: res.total ?? 0,
    };
  },

  /** 班级任务列表（学生） */
  async listByClass(classId: number): Promise<PracticeAssignment[]> {
    return apiClient.get<PracticeAssignment[]>(`/api/assignment/class/${classId}`);
  },

  /** 任务完成情况列表（教师） */
  async listCompletions(assignmentId: number): Promise<AssignmentCompletion[]> {
    return apiClient.get<AssignmentCompletion[]>(`/api/assignment/${assignmentId}/completions`);
  },

  /** 我的完成情况（学生） */
  async getCompletion(assignmentId: number): Promise<AssignmentCompletion> {
    return apiClient.get<AssignmentCompletion>(`/api/assignment/${assignmentId}/completion`);
  },

  /** 开始任务（学生） */
  async startAssignment(assignmentId: number): Promise<AssignmentCompletion> {
    return apiClient.post<AssignmentCompletion>(`/api/assignment/${assignmentId}/start`);
  },

  /** 完成任务（学生） */
  async finishAssignment(assignmentId: number): Promise<void> {
    await apiClient.post(`/api/assignment/${assignmentId}/finish`);
  },
};

export default assignmentApi;
