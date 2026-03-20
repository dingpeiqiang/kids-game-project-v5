/**
 * 统一错误处理器
 * 负责分类处理 API 错误，统一展示错误提示
 */

import type { AxiosError } from 'axios';
import { API_CONSTANTS } from '@/services/api.types';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',         // 网络错误
  BUSINESS = 'BUSINESS',       // 业务错误
  AUTH = 'AUTH',               // 认证错误
  PERMISSION = 'PERMISSION',   // 权限错误
  SERVER = 'SERVER',           // 服务器错误
  UNKNOWN = 'UNKNOWN',         // 未知错误
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerOptions {
  skipToast?: boolean;        // 跳过自动提示
  skipAuthRedirect?: boolean; // 跳过认证错误跳转
  onError?: (error: ApiError) => void; // 自定义处理钩子
}

/**
 * API 错误对象
 */
export interface ApiError extends Error {
  type: ErrorType;
  code?: number;
  httpStatus?: number;
  originalError?: any;
}

/**
 * Toast 消息接口
 */
interface ToastMessage {
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * 全局 Toast 显示函数（需要在 main.ts 中初始化）
 */
let showToastFn: ((message: ToastMessage) => void) | null = null;

/**
 * 设置全局 Toast 函数
 */
export function setToastFn(fn: (message: ToastMessage) => void) {
  showToastFn = fn;
}

/**
 * 显示 Toast
 */
function showToast(message: string, variant: ToastMessage['variant'] = 'error', duration = 3000) {
  if (showToastFn) {
    showToastFn({ message, variant, duration });
  } else {
    console.error(`[ErrorHandler] Toast 未初始化，无法显示: ${message}`);
  }
}

/**
 * 判断错误类型
 */
function getErrorType(error: any): ErrorType {
  if (error.isAxiosError) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      const { status } = axiosError.response;
      
      if (status === 401 || status === 403) {
        return ErrorType.AUTH;
      }
      if (status === 403) {
        return ErrorType.PERMISSION;
      }
      if (status >= 500) {
        return ErrorType.SERVER;
      }
    } else if (axiosError.request) {
      return ErrorType.NETWORK;
    }
  }
  
  // 检查是否是业务错误（后端返回的 code 字段）
  if (error.code && typeof error.code === 'number') {
    const code = error.code;
    
    // 认证错误码范围：2001-2999
    if (code >= 2001 && code <= 2999) {
      return ErrorType.AUTH;
    }
    
    // 权限错误码范围：3001-3999
    if (code >= 3001 && code <= 3999) {
      return ErrorType.PERMISSION;
    }
    
    // 系统错误码范围：8001-8999
    if (code >= 8001 && code <= 8999) {
      return ErrorType.SERVER;
    }
    
    // 业务错误码范围：1000-1999
    if (code >= 1000 && code <= 1999) {
      return ErrorType.BUSINESS;
    }
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * 处理认证错误
 */
function handleAuthError(error: ApiError): void {
  localStorage.removeItem(API_CONSTANTS.TOKEN_KEY);
  localStorage.removeItem(API_CONSTANTS.PARENT_TOKEN_KEY);
  
  // 跳转到登录页
  if (window.location.pathname !== API_CONSTANTS.LOGIN_PATH) {
    window.location.href = API_CONSTANTS.LOGIN_PATH;
  }
}

/**
 * 提取错误消息
 */
function extractErrorMessage(error: any): string {
  // 优先使用后端返回的 msg
  if (error.response?.data?.msg) {
    return error.response.data.msg;
  }
  
  // 其次使用 error.msg
  if (error.msg) {
    return error.msg;
  }
  
  // 再次使用 error.message
  if (error.message) {
    return error.message;
  }
  
  // 默认消息
  return '请求失败，请稍后重试';
}

/**
 * 根据错误类型获取默认消息
 */
function getDefaultMessageByType(type: ErrorType): string {
  const messageMap: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: '网络连接失败，请检查网络设置',
    [ErrorType.BUSINESS]: '操作失败',
    [ErrorType.AUTH]: '登录已过期，请重新登录',
    [ErrorType.PERMISSION]: '您没有权限执行此操作',
    [ErrorType.SERVER]: '系统繁忙，请稍后重试',
    [ErrorType.UNKNOWN]: '请求失败，请稍后重试',
  };
  
  return messageMap[type];
}

/**
 * 根据错误类型获取 Toast 变体
 */
function getToastVariantByType(type: ErrorType): ToastMessage['variant'] {
  const variantMap: Record<ErrorType, ToastMessage['variant']> = {
    [ErrorType.NETWORK]: 'error',
    [ErrorType.BUSINESS]: 'warning',
    [ErrorType.AUTH]: 'warning',
    [ErrorType.PERMISSION]: 'warning',
    [ErrorType.SERVER]: 'error',
    [ErrorType.UNKNOWN]: 'error',
  };
  
  return variantMap[type];
}

/**
 * 统一错误处理函数
 */
export function handleApiError(error: any, options: ErrorHandlerOptions = {}): ApiError {
  const {
    skipToast = false,
    skipAuthRedirect = false,
    onError,
  } = options;
  
  // 判断错误类型
  const type = getErrorType(error);
  
  // 提取错误消息
  const message = extractErrorMessage(error);
  
  // 提取错误码
  const code = error.response?.data?.code || error.code;
  
  // 提取 HTTP 状态码
  const httpStatus = error.response?.status;
  
  // 创建统一错误对象
  const apiError: ApiError = {
    name: 'ApiError',
    message,
    type,
    code,
    httpStatus,
    originalError: error,
  } as ApiError;
  
  // 自定义错误处理钩子
  if (onError) {
    onError(apiError);
  }
  
  // 认证错误处理
  if (type === ErrorType.AUTH && !skipAuthRedirect) {
    handleAuthError(apiError);
  }
  
  // 显示错误提示
  if (!skipToast) {
    const variant = getToastVariantByType(type);
    showToast(message, variant);
  }
  
  // 记录错误日志
  console.error(`[ErrorHandler] ${type}:`, error);
  
  return apiError;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return getErrorType(error) === ErrorType.NETWORK;
}

/**
 * 判断是否为业务错误
 */
export function isBusinessError(error: any): boolean {
  return getErrorType(error) === ErrorType.BUSINESS;
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return getErrorType(error) === ErrorType.AUTH;
}

/**
 * 判断是否为权限错误
 */
export function isPermissionError(error: any): boolean {
  return getErrorType(error) === ErrorType.PERMISSION;
}

/**
 * 判断是否为服务器错误
 */
export function isServerError(error: any): boolean {
  return getErrorType(error) === ErrorType.SERVER;
}
