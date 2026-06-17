/**
 * 全项目唯一 Axios 实例（拦截器只注册一次）
 * 禁止在业务中 axios.create / fetch('/api/...')，统一走 apiClient 或 *Api 服务
 */
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/services/api.types';
import { API_CONSTANTS } from '@/services/api.types';
import { envConfig } from '@/core/config/env';
import { attachAuthHeaders, createAuthErrorHandler } from '@/core/network/auth-interceptor';

let sharedInstance: AxiosInstance | null = null;

function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config) => attachAuthHeaders(config),
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response;
      if (data.code === API_CONSTANTS.HTTP_STATUS.OK) {
        return data;
      }
      return Promise.reject(
        Object.assign(new Error(data.msg || '请求失败'), { code: data.code }),
      );
    },
    async (error: AxiosError) => {
      const handler = createAuthErrorHandler((cfg: InternalAxiosRequestConfig) =>
        instance.request(cfg),
      );
      return handler(error);
    },
  );
}

export function getSharedHttpClient(): AxiosInstance {
  if (!sharedInstance) {
    sharedInstance = axios.create({
      baseURL: envConfig.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    setupInterceptors(sharedInstance);
  }
  return sharedInstance;
}

/** 测试或热更新时重置（一般业务勿调用） */
export function resetSharedHttpClientForTests(): void {
  sharedInstance = null;
}