/**
 * 统一认证 API（/api/auth/*）
 */
import { apiClient } from './api-client.service';
import { API_CONSTANTS } from './api.types';
import { encryptPasswordForLogin } from '@/utils/rsa-password';

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

export const authApi = {
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

    const raw = await apiClient.post<RawAuthResponse>('/api/auth/login', body);
    return normalizeAuthResponse(raw);
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token 不存在');
    }

    const raw = await apiClient.post<{ accessToken?: string }>(
      `/api/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
    );
    const accessToken = raw?.accessToken;
    if (!accessToken) {
      throw new Error('刷新 Token 失败');
    }
    localStorage.setItem(API_CONSTANTS.TOKEN_KEY, accessToken);
    if (localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY)) {
      localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, accessToken);
      apiClient.setParentToken(accessToken);
    } else {
      apiClient.setToken(accessToken);
    }
    return accessToken;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>('/api/auth/logout', {});
    } catch {
      /* ignore */
    }
  },

  async registerParent(data: ParentRegisterPayload): Promise<ParentRegisterResult> {
    const raw = await apiClient.post<ParentRegisterResult>('/api/auth/register', {
      username: data.username.trim(),
      phone: data.phone?.trim(),
      password: data.password,
      nickname: data.nickname?.trim() || '家长',
      realName: data.realName?.trim(),
      userType: 1,
    });
    if (!raw?.userId) {
      throw new Error('注册响应不完整');
    }
    return raw;
  },

  async checkUsername(username: string): Promise<{ exists: boolean; available: boolean }> {
    return apiClient.get<{ exists: boolean; available: boolean }>(
      `/api/auth/check-username?username=${encodeURIComponent(username.trim())}`,
    );
  },
};

export interface ParentRegisterPayload {
  username: string;
  phone?: string;
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

export default authApi;