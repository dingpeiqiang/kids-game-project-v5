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
 * 游戏状态枚举
 */
export const GAME_STATUS = {
  DRAFT: 0,           // 草稿
  PENDING_REVIEW: 1,  // 待审核
  ON_SALE: 2,         // 已上架
  OFFLINE: 3,         // 已下架
  REJECTED: 4,        // 审核驳回
} as const;
export type GameStatus = typeof GAME_STATUS[keyof typeof GAME_STATUS];

/**
 * 游戏状态配置（用于显示）
 */
export const GAME_STATUS_CONFIG: Record<number, {
  text: string;
  color: string;
  bgClass: string;
  icon: string;
}> = {
  [GAME_STATUS.DRAFT]: {
    text: '草稿',
    color: '#6b7280',
    bgClass: 'bg-gray-100',
    icon: '📝'
  },
  [GAME_STATUS.PENDING_REVIEW]: {
    text: '待审核',
    color: '#f59e0b',
    bgClass: 'bg-yellow-100',
    icon: '⏳'
  },
  [GAME_STATUS.ON_SALE]: {
    text: '已上架',
    color: '#10b981',
    bgClass: 'bg-green-100',
    icon: '📤'
  },
  [GAME_STATUS.OFFLINE]: {
    text: '已下架',
    color: '#ef4444',
    bgClass: 'bg-red-100',
    icon: '📥'
  },
  [GAME_STATUS.REJECTED]: {
    text: '审核驳回',
    color: '#dc2626',
    bgClass: 'bg-red-100',
    icon: '❌'
  }
};

/**
 * 获取游戏状态文本
 */
export function getGameStatusText(status: number): string {
  return GAME_STATUS_CONFIG[status]?.text || '未知状态';
}

/**
 * 获取游戏状态颜色
 */
export function getGameStatusColor(status: number): string {
  return GAME_STATUS_CONFIG[status]?.color || '#6b7280';
}

/**
 * 获取游戏状态背景样式类
 */
export function getGameStatusBgClass(status: number): string {
  return GAME_STATUS_CONFIG[status]?.bgClass || 'bg-gray-100';
}

/**
 * 获取游戏状态图标
 */
export function getGameStatusIcon(status: number): string {
  return GAME_STATUS_CONFIG[status]?.icon || '📝';
}

/**
 * 判断是否为可上架状态
 */
export function canPublish(status: number): boolean {
  return status === GAME_STATUS.OFFLINE || status === GAME_STATUS.DRAFT;
}

/**
 * 判断是否为可下架状态
 */
export function canUnpublish(status: number): boolean {
  return status === GAME_STATUS.ON_SALE;
}

/**
 * 判断是否为可提交审核状态
 */
export function canSubmitReview(status: number): boolean {
  return status === GAME_STATUS.DRAFT || status === GAME_STATUS.REJECTED;
}

/**
 * 判断游戏是否已上架（可玩）
 */
export function isOnSale(status: number): boolean {
  return status === GAME_STATUS.ON_SALE;
}

/**
 * 判断游戏是否为草稿状态
 */
export function isDraft(status: number): boolean {
  return status === GAME_STATUS.DRAFT;
}

/**
 * 判断游戏是否待审核
 */
export function isPendingReview(status: number): boolean {
  return status === GAME_STATUS.PENDING_REVIEW;
}

/**
 * 判断游戏是否已下架
 */
export function isOffline(status: number): boolean {
  return status === GAME_STATUS.OFFLINE;
}

/**
 * 判断游戏是否被驳回
 */
export function isRejected(status: number): boolean {
  return status === GAME_STATUS.REJECTED;
}

/**
 * 判断游戏是否可启动（仅上架状态可玩）
 */
export function canPlay(status: number): boolean {
  return isOnSale(status);
}

/**
 * 主题状态枚举
 */
export const THEME_STATUS = {
  OFFLINE: 'offline',    // 下架
  ON_SALE: 'on_sale',    // 上架
  PENDING: 'pending',     // 待审核
} as const;
export type ThemeStatus = typeof THEME_STATUS[keyof typeof THEME_STATUS];

/**
 * 用户类型枚举
 */
export const USER_TYPE = {
  KID: 1,
  PARENT: 2,
  ADMIN: 3,
} as const;
export type UserType = typeof USER_TYPE[keyof typeof USER_TYPE];

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
