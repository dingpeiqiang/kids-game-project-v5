/**
 * 全项目唯一 HTTP 客户端（唯一 Axios 出口）
 * Token、设备指纹、401 刷新由 shared-http.client 拦截器处理
 */
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from './api.types';
import { API_CONSTANTS, isPageData } from './api.types';
import { handleApiError } from '@/utils/error-handler';
import { envConfig } from '@/core/config/env';
import { getSharedHttpClient } from '@/core/network/shared-http.client';

export interface RequestOptions extends InternalAxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  skipErrorHandler?: boolean;
  returnPageData?: boolean;
}

const http = getSharedHttpClient();
const defaultRetry = 0;
const defaultRetryDelay = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(config: RequestOptions): Promise<ApiResponse<T>> {
  const {
    retry = defaultRetry,
    retryDelay = defaultRetryDelay,
    skipErrorHandler = false,
    ...axiosConfig
  } = config;

  let lastError: unknown;

  for (let i = 0; i <= retry; i++) {
    try {
      return await http.request<ApiResponse<T>, ApiResponse<T>>(axiosConfig);
    } catch (error) {
      lastError = error;
      if (i === retry || skipErrorHandler) {
        break;
      }
      await delay(retryDelay);
    }
  }

  return Promise.reject(handleApiError(lastError, { skipErrorHandler }));
}

async function get<T>(url: string, config?: RequestOptions): Promise<T> {
  const { returnPageData, ...restConfig } = config || {};
  const response = await request<T>({
    method: 'GET',
    url,
    ...restConfig,
  });

  const data = response.data;

  if (returnPageData && !isPageData(data) && Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
    } as T;
  }

  return data;
}

async function post<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
  const response = await request<T>({
    method: 'POST',
    url,
    data,
    ...config,
  });
  return response.data;
}

async function put<T>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
  const response = await request<T>({
    method: 'PUT',
    url,
    data,
    ...config,
  });
  return response.data;
}

async function del<T>(url: string, config?: RequestOptions): Promise<T> {
  const response = await request<T>({
    method: 'DELETE',
    url,
    ...config,
  });
  return response.data;
}

async function postForm<T>(
  url: string,
  data: Record<string, string>,
  config?: RequestOptions,
): Promise<T> {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await request<T>({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...config,
  });
  return response.data;
}

function setBaseUrl(url: string): void {
  http.defaults.baseURL = url;
}

function setToken(token: string): void {
  localStorage.setItem(API_CONSTANTS.TOKEN_KEY, token);
}

function setParentToken(token: string): void {
  localStorage.setItem(API_CONSTANTS.PARENT_TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
}

function clearParentToken(): void {
  localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
}

function persistSessionToken(token: string, options?: { isParent?: boolean }): void {
  if (options?.isParent) {
    setParentToken(token);
  } else {
    setToken(token);
  }
}

/** 初始化 baseURL（与 env 一致） */
setBaseUrl(envConfig.apiBaseUrl);

export const apiClient = {
  get,
  post,
  put,
  delete: del,
  postForm,
  requestRaw: request,
  setBaseUrl,
  setToken,
  setParentToken,
  clearToken,
  clearParentToken,
  persistSessionToken,
};

export default apiClient;