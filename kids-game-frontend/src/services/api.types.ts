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
 * 用户类型枚举（与后端 BaseUser.userType 一致：0=KID, 1=PARENT, 2=ADMIN）
 */
export const USER_TYPE = {
  KID: 0,
  PARENT: 1,
  ADMIN: 2,
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

/**
 * 题型常量（与后端 QuestionAnswerEvaluator.normalizeType 对齐）
 * 历史值 choice→single、judgment→judge 已归一化
 */
export const QUESTION_TYPE = {
  SINGLE: 'single',           // 单选
  MULTIPLE: 'multiple',       // 多选
  JUDGE: 'judge',             // 判断
  FILL: 'fill',               // 填空（多空用 ||| 分隔，备选答案用 | 分隔）
  SHORT_ANSWER: 'short_answer', // 简答/论述（人工阅卷，关键词辅助）
  IMAGE: 'image',             // 图片题
  AUDIO: 'audio',             // 音频题
} as const;
export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE];

/**
 * 难度范围
 */
export const DIFFICULTY_RANGE = {
  ALL: 'ALL',
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type DifficultyRange = typeof DIFFICULTY_RANGE[keyof typeof DIFFICULTY_RANGE];

/**
 * 填空题容错模式
 */
export const FILL_TOLERANCE_MODE = {
  EXACT: 'EXACT',                       // 精确匹配
  IGNORE_CASE: 'IGNORE_CASE',           // 忽略大小写
  IGNORE_WHITESPACE: 'IGNORE_WHITESPACE', // 忽略空白
  IGNORE_PUNCTUATION: 'IGNORE_PUNCTUATION', // 忽略标点
  KEYWORD: 'KEYWORD',                   // 关键词包含
} as const;
export type FillToleranceMode = typeof FILL_TOLERANCE_MODE[keyof typeof FILL_TOLERANCE_MODE];

/**
 * 练习会话来源
 */
export const SESSION_SOURCE = {
  DAILY: 'DAILY',                 // 每日练习
  RECOMMEND: 'RECOMMEND',         // 推荐练习
  WRONG_REVIEW: 'WRONG_REVIEW',   // 错题复习
  ASSIGNMENT: 'ASSIGNMENT',       // 教师任务
} as const;
export type SessionSource = typeof SESSION_SOURCE[keyof typeof SESSION_SOURCE];

/**
 * 班级成员角色
 */
export const CLASS_ROLE = {
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;
export type ClassRole = typeof CLASS_ROLE[keyof typeof CLASS_ROLE];

/**
 * 学科
 */
export interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  iconUrl?: string;
  description?: string;
  sortOrder?: number;
  status?: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 知识点（树形结构）
 */
export interface KnowledgePoint {
  knowledgePointId: number;
  subjectId: number;
  parentId?: number;
  code?: string;
  name: string;
  chapter?: string;
  description?: string;
  sortOrder?: number;
  status?: number;
  createTime?: number;
  updateTime?: number;
  /** 前端组装：子节点（tree 接口返回） */
  children?: KnowledgePoint[];
}

/**
 * 媒体附件
 */
export interface QuestionMedia {
  type: 'image' | 'audio' | 'video';
  url: string;
  description?: string;
}

/**
 * 填空题配置
 */
export interface FillConfig {
  /** 每个空的正确答案数组（多空时为二维） */
  answers: string[][];
  /** 每个空的容错模式 */
  toleranceModes?: FillToleranceMode[];
  /** 是否允许多空 */
  multiBlank?: boolean;
}

/**
 * 题目（扩展版，对标粉笔/作业帮）
 */
export interface Question {
  questionId: number;
  /** 学科ID */
  subjectId?: number;
  /** 知识点ID数组（JSON 字符串，如 "[1,2,3]"） */
  knowledgePoints?: string;
  /** 标签数组（JSON 字符串，如 "[\"易错\",\"重点\"]"） */
  tags?: string;
  /** 媒体附件（JSON 字符串，图片/音频/视频 URL 数组） */
  mediaUrls?: string;
  /** 题目内容（纯文本或富文本JSON） */
  content: string;
  /** 选项（JSON 数组字符串） */
  options: string;
  /** 正确答案（单选为 A 或选项全文；多选为 A,C,D；填空为 北京|||上海；简答为参考答案） */
  correctAnswer?: string;
  /** 答案解析 */
  analysis?: string;
  /** 适龄阶段 */
  grade: string;
  /**
   * 题型：single/multiple/judge/fill/short_answer/image/audio
   * 兼容历史值：choice→single、judgment→judge
   */
  type: string;
  /** 难度（1-5） */
  difficulty?: number;
  /** 分值 */
  score?: number;
  /** 建议答题限时（秒），0表示不限 */
  timeLimit?: number;
  /** 作答模式：single/multiple/text */
  answerMode?: string;
  /** 填空题配置（JSON 字符串） */
  fillConfig?: string;
  /** 简答题关键词（JSON 字符串数组） */
  shortAnswerKeywords?: string;
  /** 状态：0-禁用，1-启用 */
  status?: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 答题记录（扩展版）
 */
export interface AnswerRecord {
  recordId: number;
  /** 儿童用户ID（后端字段 user_id） */
  kidId: number;
  questionId: number;
  /** 每日练习会话ID */
  sessionId?: number;
  /** 学科ID（冗余便于统计） */
  subjectId?: number;
  /** 本题知识点ID数组（冗余，JSON） */
  knowledgePointIds?: string;
  /** 题型（冗余） */
  questionType?: string;
  /** 难度（冗余） */
  difficulty?: number;
  userAnswer: string;
  /** 是否正确：0-错误，1-正确 */
  isCorrect: number;
  /** 是否标记：0-否，1-是 */
  isMarked?: number;
  /** 是否收藏：0-否，1-是 */
  isCollected?: number;
  /** 是否错题：0-否，1-是（错题本来源） */
  isWrong?: number;
  /** 获得游学币 */
  getPoints: number;
  /** 答题时间（秒） */
  answerTime: number;
  createTime?: number;
}

/**
 * 错题本
 */
export interface WrongQuestion {
  wrongId: number;
  userId: number;
  questionId: number;
  subjectId?: number;
  knowledgePointIds?: string;
  /** 错误次数 */
  wrongCount: number;
  /** 最近答错时间 */
  lastWrongTime?: number;
  /** 最近错误答案 */
  lastWrongAnswer?: string;
  /** 掌握度：0-未掌握，1-了解，2-熟悉，3-掌握 */
  masteryLevel: number;
  /** 复习次数 */
  reviewCount?: number;
  /** 最近复习时间 */
  lastReviewTime?: number;
  /** 下次推荐复习时间 */
  nextReviewTime?: number;
  /** 状态：0-已掌握移除，1-待复习，2-复习中 */
  status?: number;
  createTime?: number;
  updateTime?: number;
  /** 关联题目（部分接口会联查返回） */
  question?: Question;
}

/**
 * 题目收藏
 */
export interface QuestionCollection {
  collectionId: number;
  userId: number;
  questionId: number;
  /** 收藏笔记 */
  note?: string;
  createTime?: number;
  /** 关联题目（部分接口会联查返回） */
  question?: Question;
}

/**
 * 每日练习会话
 */
export interface DailySession {
  sessionId: number;
  userId: number;
  /** 会话日期（ISO 字符串，后端为 LocalDate） */
  sessionDate?: string;
  /** 学科ID（NULL为综合） */
  subjectId?: number;
  /** 本次练习知识点范围（JSON） */
  knowledgePointIds?: string;
  /** 难度范围：ALL/EASY/MEDIUM/HARD */
  difficultyRange?: string;
  /** 本次题目总数 */
  totalCount: number;
  /** 已答题数 */
  answeredCount: number;
  /** 答对题数 */
  correctCount: number;
  /** 本次获得游学币 */
  pointsEarned: number;
  /** 本次用时（秒） */
  duration?: number;
  /** 来源：DAILY/RECOMMEND/WRONG_REVIEW/ASSIGNMENT */
  source: string;
  /** 来源ID（如任务ID） */
  sourceId?: number;
  /** 状态：0-进行中，1-已完成，2-已放弃 */
  status: number;
  startTime?: number;
  endTime?: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 班级
 */
export interface SchoolClass {
  classId: number;
  className: string;
  grade?: string;
  /** 学年（如 2025-2026） */
  schoolYear?: string;
  /** 创建者ID（教师） */
  creatorId?: number;
  /** 邀请码 */
  inviteCode?: string;
  description?: string;
  /** 状态：0-已解散，1-正常 */
  status?: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 班级成员
 */
export interface ClassMember {
  memberId: number;
  classId: number;
  userId: number;
  /** 角色：TEACHER/STUDENT */
  role: string;
  joinTime?: number;
  /** 状态：0-已退出，1-正常 */
  status?: number;
  createTime?: number;
  updateTime?: number;
  /** 关联用户信息（部分接口联查返回） */
  kid?: Kid;
}

/**
 * 教师练习任务
 */
export interface PracticeAssignment {
  assignmentId: number;
  teacherId: number;
  classId: number;
  title: string;
  description?: string;
  subjectId?: number;
  /** 知识点范围（JSON） */
  knowledgePointIds?: string;
  /** 难度范围 */
  difficultyRange?: string;
  /** 题目数量 */
  questionCount: number;
  /** 指定题型（NULL为混合） */
  questionType?: string;
  /** 截止时间（毫秒时间戳） */
  dueTime?: number;
  /** 完成奖励游学币 */
  pointsReward?: number;
  /** 状态：0-草稿，1-已发布，2-已截止，3-已删除 */
  status: number;
  createTime?: number;
  updateTime?: number;
}

/**
 * 任务完成情况
 */
export interface AssignmentCompletion {
  completionId: number;
  assignmentId: number;
  studentId: number;
  /** 关联的练习会话ID */
  sessionId?: number;
  totalCount: number;
  answeredCount: number;
  correctCount: number;
  pointsEarned?: number;
  /** 用时（秒） */
  duration?: number;
  /** 完成状态：0-未开始，1-进行中，2-已完成 */
  finishStatus: number;
  finishTime?: number;
  createTime?: number;
  updateTime?: number;
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
