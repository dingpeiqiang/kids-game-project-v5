/**
 * 日志工具类
 * 提供统一的日志输出格式
 */

export class Logger {
  static debug(message: string, ...args: any[]): void {
    console.debug(`[TowerDefense] ${message}`, ...args)
  }

  static info(message: string, ...args: any[]): void {
    console.info(`[TowerDefense] ${message}`, ...args)
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`[TowerDefense] ${message}`, ...args)
  }

  static error(message: string, ...args: any[]): void {
    console.error(`[TowerDefense] ${message}`, ...args)
  }
}