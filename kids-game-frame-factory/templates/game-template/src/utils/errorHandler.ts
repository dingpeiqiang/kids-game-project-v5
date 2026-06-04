/**
 * 🛡️ 游戏错误处理工具类
 * 
 * 提供统一的错误分类、处理和重试机制
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 资源加载错误 */
  RESOURCE_LOAD = 'RESOURCE_LOAD',
  /** 配置错误 */
  CONFIG = 'CONFIG',
  /** 用户认证错误 */
  AUTH = 'AUTH',
  /** 游戏逻辑错误 */
  GAME_LOGIC = 'GAME_LOGIC',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误级别
 */
export enum ErrorLevel {
  /** 信息 - 不影响游戏运行 */
  INFO = 'INFO',
  /** 警告 - 部分功能受限 */
  WARNING = 'WARNING',
  /** 错误 - 功能不可用 */
  ERROR = 'ERROR',
  /** 致命 - 游戏无法继续 */
  FATAL = 'FATAL'
}

/**
 * 错误信息接口
 */
export interface GameError {
  /** 错误类型 */
  type: ErrorType
  /** 错误级别 */
  level: ErrorLevel
  /** 错误消息 */
  message: string
  /** 友好的错误提示 */
  friendlyMessage: string
  /** 建议的解决方案 */
  suggestion?: string
  /** 是否可重试 */
  retryable: boolean
  /** 原始错误对象 */
  originalError?: any
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 重试间隔（毫秒） */
  retryDelay: number
  /** 是否显示错误日志 */
  showLogs: boolean
  /** 错误回调函数 */
  onError?: (error: GameError) => void
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  showLogs: true,
  onError: undefined
}

/**
 * 错误处理器
 */
export class GameErrorHandler {
  private config: ErrorHandlerConfig
  private retryCounts: Map<string, number> = new Map()

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 分析错误并转换为 GameError
   */
  analyzeError(error: any, context?: string): GameError {
    let type = ErrorType.UNKNOWN
    let level = ErrorLevel.ERROR
    let friendlyMessage = '发生未知错误，请稍后重试'
    let suggestion = '如果问题持续，请刷新页面或联系客服'
    let retryable = true

    // 网络错误
    if (error instanceof TypeError && error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('NetworkError')) {
      type = ErrorType.NETWORK
      friendlyMessage = '网络连接失败，请检查网络设置'
      suggestion = '1. 检查网络连接\n2. 刷新页面重试\n3. 如仍无法解决，请联系客服'
      
    // 资源加载错误
    } else if (error.message.includes('load') || 
               error.message.includes('加载') ||
               error.message.includes('404') ||
               error.message.includes('resource')) {
      type = ErrorType.RESOURCE_LOAD
      friendlyMessage = '资源加载失败，可能是文件不存在或网络问题'
      suggestion = '1. 检查资源文件是否存在\n2. 清除浏览器缓存\n3. 重新加载资源'
      
    // 配置错误
    } else if (error.message.includes('config') || 
               error.message.includes('配置') ||
               error.message.includes('invalid')) {
      type = ErrorType.CONFIG
      level = ErrorLevel.WARNING
      friendlyMessage = '配置无效，已恢复默认配置'
      suggestion = '请检查配置参数是否正确'
      retryable = false
      
    // 认证错误
    } else if (error.message.includes('auth') || 
               error.message.includes('登录') ||
               error.message.includes('token') ||
               error.message.includes('401') ||
               error.message.includes('403')) {
      type = ErrorType.AUTH
      level = ErrorLevel.FATAL
      friendlyMessage = '登录已过期，请重新登录'
      suggestion = '点击确定跳转到登录页'
      retryable = false
      
    // 游戏逻辑错误
    } else if (error.message.includes('game') || 
               error.message.includes('游戏')) {
      type = ErrorType.GAME_LOGIC
      friendlyMessage = '游戏运行异常'
      suggestion = '请重新开始游戏'
    }

    const gameError: GameError = {
      type,
      level,
      message: error.message || String(error),
      friendlyMessage,
      suggestion,
      retryable,
      originalError: error
    }

    // 记录错误日志
    if (this.config.showLogs) {
      this.logError(gameError, context)
    }

    // 调用错误回调
    if (this.config.onError) {
      this.config.onError(gameError)
    }

    return gameError
  }

  /**
   * 执行带重试的操作
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    onSuccess?: (result: T) => void,
    onRetry?: (retryCount: number, error: GameError) => void
  ): Promise<T> {
    const retryKey = context
    let lastError: any

    for (let i = 0; i <= this.config.maxRetries; i++) {
      try {
        const result = await operation()
        
        // 成功时重置重试计数
        this.retryCounts.delete(retryKey)
        
        if (onSuccess) {
          onSuccess(result)
        }
        
        return result
        
      } catch (error: any) {
        lastError = error
        const gameError = this.analyzeError(error, context)
        
        // 不可重试的错误直接抛出
        if (!gameError.retryable) {
          throw gameError
        }
        
        // 达到最大重试次数
        if (i >= this.config.maxRetries) {
          break
        }
        
        // 增加重试计数
        const currentRetryCount = (this.retryCounts.get(retryKey) || 0) + 1
        this.retryCounts.set(retryKey, currentRetryCount)
        
        // 调用重试回调
        if (onRetry) {
          onRetry(currentRetryCount, gameError)
        }
        
        // 等待延迟后重试
        await this.delay(this.config.retryDelay * Math.pow(2, i)) // 指数退避
      }
    }
    
    // 所有重试失败
    const finalError = this.analyzeError(lastError, context)
    throw finalError
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 记录错误日志
   */
  private logError(error: GameError, context?: string) {
    const prefix = context ? `[${context}]` : '[GameError]'
    
    console.group(`${prefix} ${error.level}`)
    console.log('类型:', error.type)
    console.log('消息:', error.message)
    console.log('友好提示:', error.friendlyMessage)
    console.log('建议:', error.suggestion)
    console.log('可重试:', error.retryable)
    if (error.originalError) {
      console.log('原始错误:', error.originalError)
    }
    console.groupEnd()
  }

  /**
   * 获取友好的错误提示（用于 UI 显示）
   */
  getFriendlyMessage(error: any, context?: string): string {
    const gameError = this.analyzeError(error, context)
    return gameError.friendlyMessage
  }

  /**
   * 根据错误级别采取不同行动
   */
  handleByLevel(error: GameError): void {
    switch (error.level) {
      case ErrorLevel.INFO:
        console.log('ℹ️ INFO:', error.friendlyMessage)
        break
        
      case ErrorLevel.WARNING:
        console.warn('⚠️ WARNING:', error.friendlyMessage)
        break
        
      case ErrorLevel.ERROR:
        console.error('❌ ERROR:', error.friendlyMessage)
        if (error.suggestion) {
          console.log('💡 建议:', error.suggestion)
        }
        break
        
      case ErrorLevel.FATAL:
        console.error('💀 FATAL:', error.friendlyMessage)
        // 致命错误可能需要跳转到错误页面或登录页
        break
    }
  }

  /**
   * 清理重试计数
   */
  clearRetryCount(context: string) {
    this.retryCounts.delete(context)
  }

  /**
   * 重置所有状态
   */
  reset() {
    this.retryCounts.clear()
  }
}

/**
 * 创建错误处理器的便捷函数
 */
export function createErrorHandler(config?: Partial<ErrorHandlerConfig>): GameErrorHandler {
  return new GameErrorHandler(config)
}
