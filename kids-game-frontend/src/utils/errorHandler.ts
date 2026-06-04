import { ElMessage } from 'element-plus'

/**
 * 全局错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  
  // 错误消息映射
  private errorMessages: Record<string, string> = {
    'Network Error': '网络连接失败，请检查网络设置',
    'timeout': '请求超时，请重试',
    '401': '登录已过期，请重新登录',
    '403': '无权访问该资源',
    '404': '请求的资源不存在',
    '500': '服务器内部错误',
    '502': '网关错误',
    '503': '服务暂时不可用'
  }
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler()
    }
    return this.instance
  }
  
  /**
   * 处理 HTTP 错误
   */
  handleHttpError(error: any): void {
    const message = this.getErrorMessage(error)
    
    ElMessage.error({
      message,
      duration: 3000,
      showClose: true
    })
    
    // 记录错误日志
    this.logError(error)
  }
  
  /**
   * 获取错误消息
   */
  private getErrorMessage(error: any): string {
    // 自定义错误消息
    if (error.message) {
      return error.message
    }
    
    // HTTP 状态码错误
    if (error.response) {
      const status = error.response.status
      const customMessage = this.errorMessages[status.toString()]
      if (customMessage) {
        return customMessage
      }
      
      // 后端返回的错误消息
      if (error.response.data?.message) {
        return error.response.data.message
      }
      
      return `请求失败 (${status})`
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      return this.errorMessages['timeout']
    }
    
    if (!navigator.onLine) {
      return this.errorMessages['Network Error']
    }
    
    // 默认错误消息
    return error.message || '操作失败，请稍后重试'
  }
  
  /**
   * 记录错误日志
   */
  private logError(error: any): void {
    console.error('[Global Error]:', error)
    
    // 可以添加更多的日志记录逻辑
    // 例如：发送到日志服务器
  }
  
  /**
   * 显示成功消息
   */
  success(message: string, duration: number = 2000): void {
    ElMessage.success({
      message,
      duration,
      showClose: true
    })
  }
  
  /**
   * 显示警告消息
   */
  warning(message: string, duration: number = 2000): void {
    ElMessage.warning({
      message,
      duration,
      showClose: true
    })
  }
  
  /**
   * 显示信息消息
   */
  info(message: string, duration: number = 2000): void {
    ElMessage.info({
      message,
      duration,
      showClose: true
    })
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance()

/**
 * 统一的错误处理装饰器
 */
export function catchError(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  
  descriptor.value = async function(...args: any[]) {
    try {
      return await originalMethod.apply(this, args)
    } catch (error) {
      ErrorHandler.getInstance().handleHttpError(error)
      throw error
    }
  }
  
  return descriptor
}
