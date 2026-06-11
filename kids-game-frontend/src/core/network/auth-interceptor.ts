import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONSTANTS } from '@/services/api.types';

const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

function getBearerToken(): string | null {
  return (
    localStorage.getItem(API_CONSTANTS.TOKEN_KEY) ||
    localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY)
  );
}

function persistAccessToken(accessToken: string): void {
  localStorage.setItem(API_CONSTANTS.TOKEN_KEY, accessToken);
  if (localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY)) {
    localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, accessToken);
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
  localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('parentInfo');
  localStorage.removeItem('adminInfo');
}

function redirectToLogin(): void {
  const path = window.location.pathname;
  if (path !== '/login' && !path.startsWith('/register')) {
    window.location.href = '/login';
  }
}

function getDeviceFingerprint(): string {
  let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (!fingerprint) {
    fingerprint = `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
  }
  return fingerprint;
}

async function refreshAccessTokenOnce(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshWaiters.push((token) => {
        if (token) resolve(token);
        else reject(new Error('刷新 Token 失败'));
      });
    });
  }

  isRefreshing = true;
  try {
    const { authApi } = await import('@/services/auth-api.service');
    const token = await authApi.refreshAccessToken();
    refreshWaiters.forEach((cb) => cb(token));
    refreshWaiters = [];
    return token;
  } catch (e) {
    refreshWaiters.forEach((cb) => cb(null));
    refreshWaiters = [];
    throw e;
  } finally {
    isRefreshing = false;
  }
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/public-key')
  );
}

/**
 * 供 BaseApiService 使用的 401 处理（与业务 axios 实例绑定）
 */
export function createAuthErrorHandler(retryRequest: (config: InternalAxiosRequestConfig) => Promise<unknown>) {
  return async (error: AxiosError): Promise<unknown> => {
    const original = error.config as InternalAxiosRequestConfig & { _authRetry?: boolean };
    if (error.response?.status !== 401 || !original || original._authRetry) {
      return Promise.reject(error);
    }
    if (isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    original._authRetry = true;

    try {
      const newToken = await refreshAccessTokenOnce();
      persistAccessToken(newToken);
      if (original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      if (!original.headers?.['X-Device-Fingerprint']) {
        original.headers = original.headers || {};
        original.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
      }
      return retryRequest(original);
    } catch {
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }
  };
}

/** 请求头：Token + 设备指纹 */
export function attachAuthHeaders(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getBearerToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers = config.headers || {};
  if (!config.headers['X-Device-Fingerprint']) {
    config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
  }
  return config;
}

/**
 * @deprecated 业务请求请使用 BaseApiService（已内置 401 刷新）
 */
export function setupAuthInterceptors(): void {
  console.info('[auth-interceptor] 全局 axios 拦截器已停用，请使用 BaseApiService');
}

export const authUtils = {
  getToken: getBearerToken,
  clearToken: clearAuthStorage,
  logout: () => {
    clearAuthStorage();
    redirectToLogin();
  },
  isAuthenticated: () => !!getBearerToken(),
};