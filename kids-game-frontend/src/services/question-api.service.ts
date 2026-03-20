/**
 * 答题相关 API 服务
 */
import { BaseApiService } from './base-api.service';
import type { Question, AnswerRecord } from './api.types';

export class QuestionApiService extends BaseApiService {
  private static instance: QuestionApiService;

  private constructor() {
    super();
  }

  static getInstance(): QuestionApiService {
    if (!QuestionApiService.instance) {
      QuestionApiService.instance = new QuestionApiService();
    }
    return QuestionApiService.instance;
  }

  /**
   * 获取随机题目
   */
  async getRandom(grade: string): Promise<Question> {
    return this.get<Question>(`/api/question/random?grade=${grade}`);
  }

  /**
   * 提交答案
   */
  async submit(data: {
    kidId: number;
    questionId: number;
    userAnswer: string;
  }): Promise<{ isCorrect: boolean; points: number; correctAnswer: string }> {
    return this.post('/api/question/submit', data);
  }

  /**
   * 获取答题记录
   */
  async getRecords(kidId: number, limit: number = 20): Promise<AnswerRecord[]> {
    return this.get<AnswerRecord[]>(`/api/question/records?kidId=${kidId}&limit=${limit}`);
  }
}

export const questionApi = QuestionApiService.getInstance();
export default questionApi;
