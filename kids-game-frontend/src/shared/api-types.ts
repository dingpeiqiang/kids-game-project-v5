/**
 * 跨应用共享 API 常量与类型（从 kids-game-frontend 抽离）
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

export const GAME_STATUS = {
  DRAFT: 0,
  PENDING_REVIEW: 1,
  ON_SALE: 2,
  OFFLINE: 3,
  REJECTED: 4,
} as const;
export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];

export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface PageData<T> {
  list: T[];
  total: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export function isPageData<T>(data: unknown): data is PageData<T> {
  return (
    !!data &&
    typeof data === 'object' &&
    'list' in data &&
    'total' in data &&
    Array.isArray((data as PageData<T>).list)
  );
}

/** 后端登录返回 userType: 0=儿童 1=家长 2=管理员 */
export const BACKEND_USER_TYPE = {
  KID: 0,
  PARENT: 1,
  ADMIN: 2,
} as const;

export type BackendUserType = (typeof BACKEND_USER_TYPE)[keyof typeof BACKEND_USER_TYPE];