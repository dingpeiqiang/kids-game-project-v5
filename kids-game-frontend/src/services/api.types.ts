/**
 * 常量定义
 */
export const API_CONSTANTS = {
  TOKEN_KEY: 'authToken',
  PARENT_TOKEN_KEY: 'parentToken',
  DEFAULT_API_URL: 'http://localhost:8080',
  LOGIN_PATH: '/login',
  HTTP_STATUS: {
    OK: 200,
    UNAUTHORIZED: 401,
  },
} as const;

/**
 * API 响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 分页数据结构
 */
export interface PageData<T> {
  list: T[];
  total: number;
}

/**
 * 分页查询参数
 */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/**
 * 判断是否为分页数据结构
 */
export function isPageData<T>(data: any): data is PageData<T> {
  return data && 
    typeof data === 'object' && 
    'list' in data && 
    'total' in data &&
    Array.isArray(data.list);
}

/**
 * 规范化数据格式
 * 如果是分页数据，保持原样；如果是数组，包装为分页格式
 */
export function normalizeData<T>(data: T | T[] | PageData<T>, autoWrap = false): T | PageData<T> {
  // 如果是分页数据结构，直接返回
  if (isPageData(data)) {
    return data;
  }
  
  // 如果是数组且需要自动包装
  if (autoWrap && Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
    };
  }
  
  // 其他情况直接返回
  return data;
}

/**
 * 通用数据接口
 */
export interface Game {
  gameId: number;
  gameCode: string;
  gameName: string;
  category: string;
  grade: string;
  iconUrl?: string;
  coverUrl?: string;
  description?: string;
  status: number;
}

export interface Kid {
  kidId: number;
  username: string;
  nickname: string;
  avatar?: string;
  grade: string;
  parentId?: number;
  fatiguePoints: number;
  dailyAnswerPoints: number;
}

export interface Parent {
  parentId: number;
  phone: string;
  nickname: string;
  token?: string;
}

export interface ParentLimit {
  kidId: number;
  dailyDuration: number;
  singleDuration: number;
  allowedTimeStart: string;
  allowedTimeEnd: string;
  answerGetPoints: number;
  dailyAnswerLimit: number;
}

export interface Question {
  questionId: number;
  content: string;
  options: string;
  correctAnswer: string;
  analysis?: string;
  grade: string;
  type: string;
}

export interface AnswerRecord {
  recordId: number;
  kidId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: number;
  getPoints: number;
  answerTime: number;
}

export interface GameRecord {
  recordId: number;
  kidId: number;
  gameId: number;
  duration: number;
  score: number;
  consumePoints: number;
}

/**
 * 游戏会话
 */
export interface GameSession {
  sessionId: number;
  gameId: number;
  gameCode: string;
  gameName: string;
  userId: number;
  startTime: number;
  duration: number;
  score: number;
  status: 'playing' | 'paused' | 'ended';
  sessionToken?: string;
}

/**
 * 排行榜相关类型
 */
export interface LeaderboardConfig {
  configId: number;
  gameId: number;
  dimensionCode: string; // 维度代码：SCORE/HIGHEST_LEVEL/DURATION/ACCURACY 等
  dimensionName: string; // 维度名称
  sortOrder: 'ASC' | 'DESC'; // 排序方式
  dataType: 'INT' | 'LONG' | 'DECIMAL'; // 数据类型
  icon?: string; // 维度图标
  description?: string; // 维度描述
  isEnabled: number; // 是否启用
  displayOrder: number; // 显示顺序
}

export interface LeaderboardData {
  dataId?: number;
  gameId: number;
  userId: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  dimensionCode: string;
  dimensionValue: number; // 维度值
  decimalValue?: number; // 小数值
  rankType?: string; // ALL/DAILY/MONTHLY/YEARLY
  rankDate?: string; // YYYY-MM-DD
  rankMonth?: string; // YYYY-MM
  rankYear?: string; // YYYY
  extraData?: any; // 额外数据
}

export interface LeaderboardRank extends LeaderboardData {
  rank: number; // 排名
  createTime?: number;
}
