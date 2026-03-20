import type { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * 统一的API错误处理函数
 * @param error 错误对象
 * @returns 格式化后的错误信息
 */
export function handleApiError(error: any): ApiError {
  console.error('API Error:', error);

  if (error.response) {
    // 有响应的错误
    const status = error.response.status;
    const data = error.response.data;

    if (data && data.message) {
      return {
        message: data.message,
        code: data.code,
        status,
      };
    }

    if (data) {
      return {
        message: JSON.stringify(data),
        status,
      };
    }

    // 根据HTTP状态码返回通用错误信息
    const statusMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权,请重新登录',
      403: '没有权限访问',
      404: '请求的资源不存在',
      500: '服务器错误,请稍后重试',
      502: '网关错误',
      503: '服务暂时不可用',
    };

    return {
      message: statusMessages[status] || `请求失败 (${status}): ${error.response.statusText}`,
      status,
    };
  }

  if (error.request) {
    // 请求发送了但没有响应
    return {
      message: '网络连接失败,请检查网络后重试',
    };
  }

  // 其他错误
  return {
    message: error.message || '操作失败,请稍后重试',
  };
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return !!error.request && !error.response;
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * 判断是否为服务器错误
 */
export function isServerError(error: any): boolean {
  const status = error.response?.status;
  return status && status >= 500;
}
