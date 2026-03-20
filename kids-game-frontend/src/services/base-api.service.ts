/**
 * HTTP 请求基类（基于 Axios）
 * 封装通用的请求逻辑、错误处理和重试机制
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, PageData } from './api.types';
import { API_CONSTANTS, isPageData } from './api.types';
import { handleApiError, type ErrorHandlerOptions, type ApiError } from '@/utils/error-handler';

/**
 * 请求配置选项
 */
export interface RequestOptions extends InternalAxiosRequestConfig {
  retry?: number;               // 重试次数
  retryDelay?: number;          // 重试延迟（毫秒）
  skipErrorHandler?: boolean;   // 跳过自动错误处理
  returnPageData?: boolean;     // 强制返回分页格式 {list, total}
}

export class BaseApiService {
  protected axiosInstance: AxiosInstance;
  protected baseUrl: string;
  protected token: string | null = null;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || API_CONSTANTS.DEFAULT_API_URL;
    this.loadToken();
    
    // 创建 Axios 实例
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 设置拦截器
    this.setupInterceptors();
  }

  /**
   * 设置基础 URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.axiosInstance.defaults.baseURL = url;
  }

  /**
   * 设置 Token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(API_CONSTANTS.TOKEN_KEY, token);
  }

  /**
   * 清除 Token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
    this.axiosInstance.defaults.headers['Authorization'] = undefined;
  }

  /**
   * 加载 Token
   */
  protected loadToken(): void {
    const authToken = localStorage.getItem(API_CONSTANTS.TOKEN_KEY);
    const parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    this.token = authToken || parentToken;
  }

  /**
   * 获取当前 Token（每次都从 localStorage 重新读取，确保获取最新 token）
   */
  protected getCurrentToken(): string | null {
    const authToken = localStorage.getItem(API_CONSTANTS.TOKEN_KEY);
    const parentToken = localStorage.getItem(API_CONSTANTS.PARENT_TOKEN_KEY);
    return authToken || parentToken || this.token;
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 添加 token
        const currentToken = this.getCurrentToken();
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;
        
        // 业务成功
        if (data.code === API_CONSTANTS.HTTP_STATUS.OK) {
          return data;
        }
        
        // 业务错误
        return Promise.reject(
          new Error(data.msg || '请求失败') as ApiError & { code: number }
        );
      },
      (error: AxiosError) => {
        // 统一错误处理
        return Promise.reject(error);
      }
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 通用请求方法（支持重试）
   */
  protected async request<T>(
    config: RequestOptions
  ): Promise<ApiResponse<T>> {
    const {
      retry = this.retryCount,
      retryDelay = this.retryDelay,
      skipErrorHandler = false,
      ...axiosConfig
    } = config;

    let lastError: any;

    for (let i = 0; i <= retry; i++) {
      try {
        return await this.axiosInstance.request<ApiResponse<T>>(axiosConfig);
      } catch (error) {
        lastError = error;
        
        // 最后一次失败或需要跳过错误处理时，直接抛出
        if (i === retry || skipErrorHandler) {
          break;
        }
        
        // 延迟后重试
        await this.delay(retryDelay);
      }
    }

    // 统一错误处理
    return Promise.reject(
      handleApiError(lastError, { skipErrorHandler })
    );
  }

  /**
   * GET 请求
   * @param returnPageData - 是否强制返回分页格式（自动将数组包装为 {list, total}）
   */
  protected async get<T>(
    url: string,
    config?: RequestOptions
  ): Promise<T> {
    const { returnPageData, ...restConfig } = config || {};
    const response = await this.request<T>({
      method: 'GET',
      url,
      ...restConfig,
    });
    
    const data = response.data;
    
    // 如果需要返回分页格式，且当前不是分页格式
    if (returnPageData && !isPageData(data) && Array.isArray(data)) {
      return {
        list: data,
        total: data.length,
      } as T;
    }
    
    return data;
  }

  /**
   * POST 请求
   */
  protected async post<T>(
    url: string,
    data?: any,
    config?: RequestOptions
  ): Promise<T> {
    const response = await this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
    return response.data;
  }

  /**
   * PUT 请求
   */
  protected async put<T>(
    url: string,
    data?: any,
    config?: RequestOptions
  ): Promise<T> {
    const response = await this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
    return response.data;
  }

  /**
   * DELETE 请求
   */
  protected async delete<T>(
    url: string,
    config?: RequestOptions
  ): Promise<T> {
    const response = await this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
    return response.data;
  }

  /**
   * POST 表单请求
   */
  protected async postForm<T>(
    url: string,
    data: Record<string, string>,
    config?: RequestOptions
  ): Promise<T> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await this.request<T>({
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
}
