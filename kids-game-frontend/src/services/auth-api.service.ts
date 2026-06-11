/**
 * 统一认证 API（/api/auth/*）
 * 登录、刷新 Token；响应字段与 store 约定对齐（accessToken → token）
 */
import { BaseApiService } from './base-api.service';
import { API_CONSTANTS } from './api.types';
import { kidApi } from './kid-api.service';
import { parentApi } from './parent-api.service';
import { encryptPasswordForLogin } from '@/utils/rsa-password';

/** 与后端 AuthResponseDTO 对齐，并兼容前端使用的 token 字段 */
export interface UnifiedAuthResult {
  userId: number;
  userType: number;
  username: string;
  nickname?: string;
  avatar?: string;
  token: string;
  refreshToken?: string;
  fatiguePoints?: number;
  dailyAnswerPoints?: number;
  grade?: string;
  parentId?: number;
  phone?: string;
}

interface AuthLoginBody {
  username: string;
  password?: string;
  encryptedPassword?: string;
  keyIndex?: number;
  rememberMe?: boolean;
  deviceFingerprint?: string;
}

interface RawAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
  userType?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  fatiguePoints?: number;
  dailyAnswerPoints?: number;
  grade?: string;
  parentId?: number;
  phone?: string;
}

function normalizeAuthResponse(raw: RawAuthResponse): UnifiedAuthResult {
  const token = raw.accessToken;
  if (!token || raw.userId == null || raw.userType == null || !raw.username) {
    throw new Error('登录响应不完整，请稍后重试');
  }
  return {
    userId: raw.userId,
    userType: raw.userType,
    username: raw.username,
    nickname: raw.nickname,
    avatar: raw.avatar,
    token,
    refreshToken: raw.refreshToken,
    fatiguePoints: raw.fatiguePoints,
    dailyAnswerPoints: raw.dailyAnswerPoints,
    grade: raw.grade,
    parentId: raw.parentId,
    phone: raw.userType === 1 ? (raw.phone || raw.username) : undefined,
  };
}

function getDeviceFingerprint(): string | undefined {
  try {
    let fp = localStorage.getItem('device_fingerprint');
    if (!fp) {
      fp = `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('device_fingerprint', fp);
    }
    return fp;
  } catch {
    return undefined;
  }
}

export class AuthApiService extends BaseApiService {
  private static instance: AuthApiService;

  static getInstance(): AuthApiService {
    if (!AuthApiService.instance) {
      AuthApiService.instance = new AuthApiService();
    }
    return AuthApiService.instance;
  }

  /**
   * 统一登录（儿童 / 家长 / 管理员，后端按用户名识别）
   */
  async login(username: string, password: string, rememberMe = false): Promise<UnifiedAuthResult> {
    const body: AuthLoginBody = {
      username: username.trim(),
      rememberMe,
      deviceFingerprint: getDeviceFingerprint(),
    };

    const encrypted = await encryptPasswordForLogin(password);
    if (encrypted) {
      body.encryptedPassword = encrypted.encryptedPassword;
      body.keyIndex = encrypted.keyIndex;
    } else if (import.meta.env.PROD) {
      throw new Error('无法安全加密密码，请检查网络后重试');
    } else {
      body.password = password;
    }

    const raw = await this.post<RawAuthResponse>('/api/auth/login', body);
    return normalizeAuthResponse(raw);
  }

  /** 刷新 Access Token */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token 不存在');
    }

    const raw = await this.post<{ accessToken?: string }>(
      `/api/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
    );
    const accessToken = raw?.accessToken;
    if (!accessToken) {
      throw new Error('刷新 Token 失败');
    }
    localStorage.setItem(API_CONSTANTS.TOKEN_KEY, accessToken);
    if (localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY)) {
      localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, accessToken);
      parentApi.setParentToken(accessToken);
    } else {
      kidApi.setToken(accessToken);
    }
    this.token = accessToken;
    return accessToken;
  }

  /** 服务端登出（客户端仍须 clearAllLogout） */
  async logout(): Promise<void> {
    try {
      await this.post<void>('/api/auth/logout', {});
    } catch {
      /* 无状态 JWT，忽略网络错误 */
    }
  }

  /** 家长注册（BaseUser + UserProfile） */
  async registerParent(data: ParentRegisterPayload): Promise<ParentRegisterResult> {
    console.log(`[AuthApi] registerParent 被调用 at ${new Date().toISOString()}, username=${data.username}`);
    const raw = await this.post<ParentRegisterResult>('/api/auth/register', {
      username: data.username.trim(),
      phone: data.phone.trim(),
      password: data.password,
      nickname: data.nickname?.trim() || '家长',
      realName: data.realName?.trim(),
      userType: 1,
    });
    console.log(`[AuthApi] registerParent 返回 at ${new Date().toISOString()}`);
    if (!raw?.userId) {
      throw new Error('注册响应不完整');
    }
    return raw;
  }

  /** 检查用户名是否已存在 */
  async checkUsername(username: string): Promise<{ exists: boolean; available: boolean }> {
    const result = await this.get<{ exists: boolean; available: boolean }>(
      `/api/auth/check-username?username=${encodeURIComponent(username.trim())}`
    );
    return result;
  }
}

export interface ParentRegisterPayload {
  username: string;
  phone?: string;  // 改为可选
  password: string;
  nickname?: string;
  realName?: string;
}

export interface ParentRegisterResult {
  userId: number;
  username: string;
  nickname?: string;
  userType: number;
}

export const authApi = AuthApiService.getInstance();