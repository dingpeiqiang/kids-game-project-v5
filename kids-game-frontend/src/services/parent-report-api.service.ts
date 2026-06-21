/**
 * 家长报表 API
 */
import { apiClient } from './api-client.service';
import type { LearningOverview, TrendData, RecentRecordItem } from './learning-report-api.service';

/** 孩子薄弱知识点 */
export interface KidWeakPointItem {
  knowledgePointId: number;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  wrongCount: number;
}

export interface KidWeakPointsData {
  items: KidWeakPointItem[];
  [key: string]: unknown;
}

/** 孩子错题本概览 */
export interface KidWrongBookOverview {
  total: number;
  pending: number;
  mastered: number;
  reviewing: number;
  bySubject: Array<{ subjectId: number; subjectName: string; count: number }>;
  [key: string]: unknown;
}

export const parentReportApi = {
  /** 孩子总览 */
  async kidOverview(kidId: number): Promise<LearningOverview> {
    return apiClient.get<LearningOverview>(`/api/parent/report/kid/${kidId}/overview`);
  },

  /** 孩子答题趋势 */
  async kidTrend(kidId: number, days: number = 7): Promise<TrendData> {
    return apiClient.get<TrendData>(`/api/parent/report/kid/${kidId}/trend?days=${days}`);
  },

  /** 孩子薄弱知识点 */
  async kidWeakPoints(kidId: number): Promise<KidWeakPointsData> {
    return apiClient.get<KidWeakPointsData>(`/api/parent/report/kid/${kidId}/weak-points`);
  },

  /** 孩子错题本概览 */
  async kidWrongBook(kidId: number): Promise<KidWrongBookOverview> {
    return apiClient.get<KidWrongBookOverview>(`/api/parent/report/kid/${kidId}/wrong-book`);
  },

  /** 孩子最近答题 */
  async kidRecent(kidId: number, limit: number = 10): Promise<RecentRecordItem[]> {
    return apiClient.get<RecentRecordItem[]>(
      `/api/parent/report/kid/${kidId}/recent?limit=${limit}`,
    );
  },
};

export default parentReportApi;
