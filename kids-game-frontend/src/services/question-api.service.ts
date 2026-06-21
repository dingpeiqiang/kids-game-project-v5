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
  /** 题型 */
  questionType?: string;
  /** 知识点ID数组（JSON） */
  knowledgePoints?: string;
  /** 是否已加入错题本 */
  addedToWrongBook?: boolean;
  /** 简答题关键词匹配提示（仅简答题返回） */
  matchedKeywords?: string[];
}

export interface QuestionPageResult {
  list: Question[];
  total: number;
}

export interface QuestionSavePayload {
  questionId?: number;
  content: string;
  options: string;
  correctAnswer?: string;
  analysis?: string;
  grade: string;
  type: string;
  difficulty?: number;
  status?: number;
  /** 学科ID */
  subjectId?: number;
  /** 知识点ID数组（JSON 字符串，如 "[1,2,3]"） */
  knowledgePoints?: string;
  /** 标签数组（JSON 字符串） */
  tags?: string;
  /** 媒体附件（JSON 字符串） */
  mediaUrls?: string;
  /** 分值 */
  score?: number;
  /** 建议答题限时（秒） */
  timeLimit?: number;
  /** 作答模式 */
  answerMode?: string;
  /** 填空题配置（JSON 字符串） */
  fillConfig?: string;
  /** 简答题关键词（JSON 字符串数组） */
  shortAnswerKeywords?: string;
}

/** 随机抽题查询参数 */
export interface RandomQuestionParams {
  grade: string;
  /** 本会话已做题目ID */
  excludeQuestionIds?: number[];
  /** 学科ID */
  subjectId?: number;
  /** 知识点ID */
  knowledgePointIds?: number[];
  /** 难度范围：ALL/EASY/MEDIUM/HARD */
  difficultyRange?: string;
  /** 题型 */
  type?: string;
}

/** 分页查询参数（管理端） */
export interface QuestionPageParams {
  grade?: string;
  type?: string;
  status?: number;
  /** 学科ID */
  subjectId?: number;
  /** 难度 */
  difficulty?: number;
  /** 题干关键词 */
  keyword?: string;
  /** 知识点ID */
  knowledgePointId?: number;
  page?: number;
  size?: number;
}

/** 提交答案参数 */
export interface SubmitAnswerParams {
  kidId: number;
  questionId: number;
  userAnswer: string;
  answerTime?: number;
  /** 每日练习会话ID */
  sessionId?: number;
  /** 是否标记本题 */
  marked?: boolean;
  /** 是否收藏本题 */
  collected?: boolean;
}

interface BackendPageResult<T> {
  page?: number;
  size?: number;
  total: number;
  records: T[];
}

export const questionApi = {
  /**
   * 获取随机题目（支持学科/知识点/难度/题型筛选）
   */
  async getRandom(params: RandomQuestionParams | string): Promise<Question> {
    const q = new URLSearchParams();
    // 兼容旧签名 getRandom(grade, excludeQuestionIds?)
    if (typeof params === 'string') {
      q.set('grade', params);
    } else {
      q.set('grade', params.grade);
      if (params.excludeQuestionIds?.length) {
        q.set('excludeIds', params.excludeQuestionIds.join(','));
      }
      if (params.subjectId) q.set('subjectId', String(params.subjectId));
      if (params.knowledgePointIds?.length) {
        q.set('knowledgePointIds', params.knowledgePointIds.join(','));
      }
      if (params.difficultyRange) q.set('difficultyRange', params.difficultyRange);
      if (params.type) q.set('type', params.type);
    }
    return apiClient.get<Question>(`/api/question/random?${q.toString()}`);
  },

  /**
   * 提交答案
   */
  async submitAnswer(
    kidIdOrParams: number | SubmitAnswerParams,
    questionId?: number,
    userAnswer?: string,
    answerTime?: number,
  ): Promise<AnswerSubmitResult> {
    let payload: Record<string, unknown>;
    if (typeof kidIdOrParams === 'number') {
      // 兼容旧签名 submitAnswer(kidId, questionId, userAnswer, answerTime)
      payload = {
        kidId: kidIdOrParams,
        questionId,
        userAnswer,
        answerTime: answerTime ?? 0,
      };
    } else {
      const p = kidIdOrParams;
      payload = {
        kidId: p.kidId,
        questionId: p.questionId,
        userAnswer: p.userAnswer,
        answerTime: p.answerTime ?? 0,
        sessionId: p.sessionId,
        marked: p.marked,
        collected: p.collected,
      };
    }
    const result = await apiClient.post<AnswerSubmitResult>('/api/question/submit', payload);
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

  /**
   * 分页查询题目（管理端，支持多条件）
   */
  async pageQuestions(params: QuestionPageParams): Promise<QuestionPageResult> {
    const q = new URLSearchParams();
    if (params.grade) q.set('grade', params.grade);
    if (params.type) q.set('type', params.type);
    if (params.status !== undefined && params.status !== null) {
      q.set('status', String(params.status));
    }
    if (params.subjectId) q.set('subjectId', String(params.subjectId));
    if (params.difficulty !== undefined && params.difficulty !== null) {
      q.set('difficulty', String(params.difficulty));
    }
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.knowledgePointId) q.set('knowledgePointId', String(params.knowledgePointId));
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

  /**
   * 批量导入题目
   */
  async batchImport(questions: QuestionSavePayload[]): Promise<{ count: number }> {
    const result = await apiClient.post<number>('/api/question/batch-import', questions);
    return { count: result };
  },
};

export default questionApi;
