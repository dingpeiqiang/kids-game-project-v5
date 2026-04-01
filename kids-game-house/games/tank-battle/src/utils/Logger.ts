// ============================================================================
// 📝 日志分级系统 - 支持环境配置
// ============================================================================
// 
// 📌 说明:
//   提供分级别的日志输出，生产环境可关闭 DEBUG 日志
//   支持格式化输出和性能追踪
// ============================================================================

/**
 * ⭐ 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * ⭐ 日志配置接口
 */
export interface ILogConfig {
  level: LogLevel
  showTimestamp: boolean
  showColors: boolean
  prefix?: string
}

/**
 * ⭐ 日志管理器（单例模式）
 */
class LoggerClass {
  private static instance: LoggerClass
  private config: ILogConfig = {
    level: LogLevel.INFO,  // 默认 INFO 级别
    showTimestamp: true,
    showColors: true,
    prefix: '🎮'
  }
  
  // 性能追踪
  private performanceMarks: Map<string, number> = new Map()
  
  private constructor() {}
  
  /**
   * ⭐ 获取单例实例
   */
  static getInstance(): LoggerClass {
    if (!this.instance) {
      this.instance = new LoggerClass()
    }
    return this.instance
  }
  
  /**
   * ⭐ 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
    console.log(`📊 [Logger] 日志级别已设置为：${LogLevel[level]}`)
  }
  
  /**
   * ⭐ 设置配置
   */
  setConfig(config: Partial<ILogConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * ⭐ DEBUG 日志
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.print('🔍', 'DEBUG', '#888888', message, args)
    }
  }
  
  /**
   * ⭐ INFO 日志
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.print('ℹ️', 'INFO', '#00ff00', message, args)
    }
  }
  
  /**
   * ⭐ WARN 日志
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      this.print('⚠️', 'WARN', '#ffff00', message, args)
    }
  }
  
  /**
   * ⭐ ERROR 日志
   */
  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.print('❌', 'ERROR', '#ff0000', message, args)
    }
  }
  
  /**
   * ⭐ 成功日志
   */
  success(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.print('✅', 'SUCCESS', '#00ff00', message, args)
    }
  }
  
  /**
   * ⭐ 开始性能计时
   */
  startTimer(label: string): void {
    this.performanceMarks.set(label, performance.now())
  }
  
  /**
   * ⭐ 结束性能计时并输出
   */
  endTimer(label: string): void {
    const startTime = this.performanceMarks.get(label)
    if (!startTime) {
      this.warn(`计时器 "${label}" 不存在`)
      return
    }
    
    const duration = performance.now() - startTime
    this.info(`${label}: ${duration.toFixed(2)}ms`)
    
    this.performanceMarks.delete(label)
  }
  
  /**
   * ⭐ 打印分组表格
   */
  printTable(title: string, data: Record<string, any>): void {
    if (this.config.level > LogLevel.INFO) return
    
    console.groupCollapsed(`${this.config.prefix} ${title}`)
    console.table(data)
    console.groupEnd()
  }
  
  /**
   * ⭐ 内部打印方法
   */
  private print(
    icon: string,
    level: string,
    color: string,
    message: string,
    args: any[]
  ): void {
    const timestamp = this.config.showTimestamp
      ? `[${new Date().toLocaleTimeString()}] `
      : ''
    
    const levelStr = this.config.showColors
      ? `%c${icon} [${level}]%c`
      : `${icon} [${level}]`
    
    const style1 = this.config.showColors
      ? `color: ${color}; font-weight: bold`
      : ''
    const style2 = this.config.showColors ? 'color: inherit; font-weight: normal' : ''
    
    if (this.config.showColors) {
      console.log(`${timestamp}${levelStr} ${message}`, style1, style2, ...args)
    } else {
      console.log(`${timestamp}${icon} [${level}] ${message}`, ...args)
    }
  }
}

// ============================================================================
// 📌 导出便捷函数
// ============================================================================

const logger = LoggerClass.getInstance()

export const Logger = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  success: (message: string, ...args: any[]) => logger.success(message, ...args),
  startTimer: (label: string) => logger.startTimer(label),
  endTimer: (label: string) => logger.endTimer(label),
  printTable: (title: string, data: Record<string, any>) => logger.printTable(title, data),
  setLevel: (level: LogLevel) => logger.setLevel(level),
  setConfig: (config: Partial<ILogConfig>) => logger.setConfig(config)
}

// ============================================================================
// 🎯 环境自适应配置
// ============================================================================

// 开发环境：DEBUG 级别 + 彩色输出
if (process.env.NODE_ENV === 'development') {
  Logger.setLevel(LogLevel.DEBUG)
  Logger.setConfig({ showColors: true })
  console.log('🔧 [Logger] 开发模式：DEBUG 级别已启用')
}
// 生产环境：WARN 级别 + 简洁输出
else if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(LogLevel.WARN)
  Logger.setConfig({ showColors: false, showTimestamp: false })
}
