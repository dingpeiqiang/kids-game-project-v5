// ============================================================================
// 🛡️ 全局错误处理器 - 带重试和降级机制
// ============================================================================
// 
// 📌 说明:
//   提供统一的错误捕获、重试、降级处理机制
//   防止未处理的异常导致游戏崩溃
// ============================================================================

/**
 * ⭐ 错误记录接口
 */
interface ErrorRecord {
  message: string
  context: string
  attempt: number
  timestamp: number
  stack?: string
}

/**
 * ⭐ 错误处理器（单例模式）
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: ErrorRecord[] = []
  private maxRetries = 3
  private readonly MAX_QUEUE_SIZE = 50
  
  private constructor() {}
  
  /**
   * ⭐ 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler()
    }
    return this.instance
  }
  
  /**
   * ⭐ 安全执行异步函数（带重试机制）
   */
  async safeExecute<T>(
    fn: () => Promise<T>,
    context: string,
    fallback?: () => T
  ): Promise<T | null> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        // 记录错误
        this.handleError(error, context, attempt)
        
        // 如果是最后一次尝试，使用 fallback
        if (attempt === this.maxRetries) {
          console.error(
            `❌ [${context}] 失败 ${attempt} 次，使用备用方案`
          )
          return fallback ? fallback() : null
        }
        
        // 等待后重试（指数退避：100ms, 200ms, 400ms）
        const delay = Math.pow(2, attempt) * 100
        await this.delay(delay)
      }
    }
    
    return null
  }
  
  /**
   * ⭐ 安全执行同步函数
   */
  safeExecuteSync<T>(
    fn: () => T,
    context: string,
    fallback?: () => T
  ): T | null {
    try {
      return fn()
    } catch (error) {
      this.handleError(error, context, 1)
      
      if (fallback) {
        console.warn(`⚠️ [${context}] 失败，使用备用方案`)
        return fallback()
      }
      
      return null
    }
  }
  
  /**
   * ⭐ 处理错误（记录 + 格式化输出）
   */
  private handleError(error: unknown, context: string, attempt: number): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 格式化错误信息（带边框）
    console.error(`
╔════════════════════════════════════════════════════╗
║  💥 错误详情                                        ║
╠────────────────────────────────────────────────────╣
║  上下文：${context.padEnd(36)}║
║  尝试次数：${String(attempt).padEnd(34)}║
║  错误信息：${errorMessage.padEnd(36)}║
╚════════════════════════════════════════════════════╝
    `)
    
    // 记录到队列
    const record: ErrorRecord = {
      message: errorMessage,
      context,
      attempt,
      timestamp: Date.now(),
      stack: errorStack
    }
    
    this.errorQueue.push(record)
    
    // 限制队列大小
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift()
    }
  }
  
  /**
   * ⭐ 获取错误统计信息
   */
  getErrorStats(): {
    totalErrors: number
    recentErrors: ErrorRecord[]
    errorRate: number  // 每分钟错误数
    criticalContexts: string[]
  } {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    const recentErrors = this.errorQueue.filter(e => e.timestamp > oneMinuteAgo)
    
    // 找出频繁出错的上下文
    const contextCount = new Map<string, number>()
    recentErrors.forEach(err => {
      contextCount.set(err.context, (contextCount.get(err.context) || 0) + 1)
    })
    
    const criticalContexts = Array.from(contextCount.entries())
      .filter(([_, count]) => count >= 3)
      .map(([context]) => context)
    
    return {
      totalErrors: this.errorQueue.length,
      recentErrors,
      errorRate: recentErrors.length,
      criticalContexts
    }
  }
  
  /**
   * ⭐ 清除错误历史
   */
  clearHistory(): void {
    this.errorQueue = []
    console.log('🧹 [ErrorHandler] 错误历史已清除')
  }
  
  /**
   * ⭐ 打印错误报告
   */
  printReport(): void {
    const stats = this.getErrorStats()
    
    console.log(`
╔════════════════════════════════════════════════════╗
║  📊 错误统计报告                                    ║
╠────────────────────────────────────────────────────╣
║  总错误数：${String(stats.totalErrors).padEnd(36)}║
║  最近 1 分钟：${String(stats.recentErrors.length).padEnd(34)}║
║  关键问题：${stats.criticalContexts.join(', ').padEnd(34)}║
╚════════════════════════════════════════════════════╝
    `)
  }
  
  /**
   * ⭐ 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
