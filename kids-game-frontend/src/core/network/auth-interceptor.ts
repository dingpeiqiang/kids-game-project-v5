import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

/**
 * 认证拦截器类
 * 负责：
 * 1. 请求时自动添加 Token
 * 2. Token 过期时自动刷新
 * 3. 认证失败时处理登出
 */
export class AuthInterceptor {
  private static instance: AuthInterceptor;
  private isRefreshing: boolean = false;
  private failedQueue: Array<(token: string | null) => void> = [];
  
  private constructor() {}
  
  static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }
  
  /**
   * 请求拦截器：自动添加 Token
   */
  requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加设备指纹（用于安全审计）
    const deviceId = this.getDeviceFingerprint();
    if (deviceId && !config.headers.has('X-Device-Fingerprint')) {
      config.headers.set('X-Device-Fingerprint', deviceId);
    }
    
    return config;
  }
  
  /**
   * 响应拦截器：处理成功响应
   */
  responseInterceptor(response: AxiosResponse): AxiosResponse {
    return response;
  }
  
  /**
   * 错误拦截器：处理 401 等错误
   */
  async errorInterceptor(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // 如果是 401 错误且没有重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新 Token
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const newToken = await this.refreshToken(refreshToken);
          
          // 保存新 Token
          localStorage.setItem(TOKEN_KEY, newToken);
          
          // 重试原请求
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return axios.request(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        console.error('[AuthInterceptor] Token 刷新失败，请重新登录');
        this.handleLogout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
  
  /**
   * 刷新 Token
   */
  private async refreshToken(refreshToken: string): Promise<string | null> {
    // 防止重复刷新
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.failedQueue.push(resolve);
      });
    }
  
    this.isRefreshing = true;
  
    try {
      const response = await axios.post('/api/auth/refresh', null, {
        params: { refreshToken },
        headers: {
          'Content-Type': 'application/json'
        }
      });
        
      if (response.data && response.data.code === 200) {
        const newToken = response.data.data.accessToken;
        // 处理队列中的请求
        this.processQueue(newToken);
        return newToken;
      }
        
      throw new Error('刷新 Token 失败');
    } catch (error) {
      this.processQueue(null);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.failedQueue = [];
    }
  }
  
  /**
   * 处理等待的队列
   */
  private processQueue(token: string | null) {
    this.failedQueue.forEach(callback => {
      callback(token);
    });
  }
  
  /**
   * 登出处理
   */
  handleLogout(): void {
    // 清除所有认证相关数据
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // 跳转到登录页
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && !currentPath.startsWith('/parent')) {
      window.location.href = '/login';
    }
  }
  
  /**
   * 生成设备指纹
   * 使用浏览器特征生成唯一标识，用于安全审计
   */
  private getDeviceFingerprint(): string {
    let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    
    if (!fingerprint) {
      try {
        // 收集浏览器特征
        const userAgent = navigator.userAgent;
        const language = navigator.language;
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        const screenColorDepth = screen.colorDepth;
        const screenSize = `${screenWidth}x${screenHeight}x${screenColorDepth}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const platform = navigator.platform;
        
        // 生成简单指纹（生产环境建议使用专门的库如 fingerprintjs）
        const data = `${userAgent}${language}${screenSize}${timezone}${platform}${Date.now()}`;
        fingerprint = this.generateHash(data);
        
        localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
      } catch (error) {
        console.error('[AuthInterceptor] 生成设备指纹失败:', error);
        fingerprint = 'unknown-device';
      }
    }
    
    return fingerprint;
  }
  
  /**
   * 生成哈希（简化版本，生产环境建议使用 crypto-js）
   */
  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * 设置 Token
   */
  setToken(token: string, refreshToken?: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }
  
  /**
   * 清除 Token
   */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  
  /**
   * 获取当前 Token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
  
  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // 可以在这里添加 Token 有效期检查
    return true;
  }
}

// 导出配置函数
export function setupAuthInterceptors() {
  const authInterceptor = AuthInterceptor.getInstance();
  
  // 注册请求拦截器
  axios.interceptors.request.use(
    config => authInterceptor.requestInterceptor(config),
    error => Promise.reject(error)
  );
  
  // 注册响应拦截器
  axios.interceptors.response.use(
    response => authInterceptor.responseInterceptor(response),
    error => authInterceptor.errorInterceptor(error)
  );
}

// 导出工具函数
export const authUtils = {
  setToken: (token: string, refreshToken?: string) => {
    AuthInterceptor.getInstance().setToken(token, refreshToken);
  },
  
  clearToken: () => {
    AuthInterceptor.getInstance().clearToken();
  },
  
  getToken: () => {
    return AuthInterceptor.getInstance().getToken();
  },
  
  isAuthenticated: () => {
    return AuthInterceptor.getInstance().isAuthenticated();
  },
  
  logout: () => {
    AuthInterceptor.getInstance().handleLogout();
  }
};
