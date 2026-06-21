/**
 * 个人学习报告 API（儿童端）
 */
import { apiClient } from './api-client.service';

/** 学习总览 */
export interface LearningOverview {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  totalPoints: number;
  totalDuration: number;
  wrongCount: number;
  collectedCount: number;
  streakDays: number;
  [key: string]: unknown;
}

/** 答题趋势数据点 */
export interface TrendPoint {
  date: string;
  answered: number;
  correct: number;
  accuracy: number;
  points: number;
  duration: number;
}

export interface TrendData {
  points: TrendPoint[];
  [key: string]: unknown;
}

/** 知识点掌握度 */
export interface KnowledgeMasteryItem {
  knowledgePointId: number;
  name: string;
  total: number;
  correct: number;
  accuracy: number;
  masteryLevel: number;
}

export interface KnowledgeMasteryData {
  items: KnowledgeMasteryItem[];
  [key: string]: unknown;
}

/** 学科分布 */
export interface SubjectDistributionItem {
  subjectId: number;
  subjectName: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface SubjectDistributionData {
  items: SubjectDistributionItem[];
  [key: string]: unknown;
}

/** 难度分析 */
export interface DifficultyAnalysisItem {
  difficulty: number;
  total: number;
  correct: number;
  accuracy: number;
}

export interface DifficultyAnalysisData {
  items: DifficultyAnalysisItem[];
  [key: string]: unknown;
}

/** 最近答题记录 */
export interface RecentRecordItem {
  recordId: number;
  questionId: number;
  content: string;
  questionType: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  answerTime: number;
  createTime: number;
  subjectName?: string;
  [key: string]: unknown;
}

export const learningReportApi = {
  /** 学习总览 */
  async overview(): Promise<LearningOverview> {
    return apiClient.get<LearningOverview>('/api/learning-report/overview');
  },

  /** 答题趋势 */
  async trend(days: number = 7): Promise<TrendData> {
    return apiClient.get<TrendData>(`/api/learning-report/trend?days=${days}`);
  },

  /** 知识点掌握度 */
  async knowledgeMastery(): Promise<KnowledgeMasteryData> {
    return apiClient.get<KnowledgeMasteryData>('/api/learning-report/knowledge-mastery');
  },

  /** 学科分布 */
  async subjectDistribution(): Promise<SubjectDistributionData> {
    return apiClient.get<SubjectDistributionData>('/api/learning-report/subject-distribution');
  },

  /** 难度分析 */
  async difficultyAnalysis(): Promise<DifficultyAnalysisData> {
    return apiClient.get<DifficultyAnalysisData>('/api/learning-report/difficulty-analysis');
  },

  /** 最近答题记录 */
  async recent(limit: number = 10): Promise<RecentRecordItem[]> {
    return apiClient.get<RecentRecordItem[]>(`/api/learning-report/recent?limit=${limit}`);
  },
};

export default learningReportApi;
