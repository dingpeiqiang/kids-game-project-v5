/**
 * Logger - 分级日志系统
 * 支持不同级别的日志输出，便于调试和监控
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LOG_COLORS = {
  DEBUG: '#888888',
  INFO: '#4CAF50',
  WARN: '#FF9800',
  ERROR: '#F44336'
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.enabled = options.enabled !== false;
    this.showTimestamp = options.showTimestamp !== false;
    this.showLevel = options.showLevel !== false;
    this.moduleName = options.moduleName || 'Game';
    
    // 日志历史记录
    this.history = [];
    this.maxHistoryLength = options.maxHistoryLength || 1000;
  }

  /**
   * 调试日志
   * @param {...any} args - 日志内容
   */
  debug(...args) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', ...args);
  }

  /**
   * 信息日志
   * @param {...any} args - 日志内容
   */
  info(...args) {
    this._log(LOG_LEVELS.INFO, 'INFO', ...args);
  }

  /**
   * 警告日志
   * @param {...any} args - 日志内容
   */
  warn(...args) {
    this._log(LOG_LEVELS.WARN, 'WARN', ...args);
  }

  /**
   * 错误日志
   * @param {...any} args - 日志内容
   */
  error(...args) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', ...args);
  }

  /**
   * 核心日志方法
   * @private
   */
  _log(level, levelName, ...args) {
    if (!this.enabled || level < this.level) return;

    const timestamp = this.showTimestamp ? new Date().toLocaleTimeString() : '';
    const modulePrefix = `[${this.moduleName}]`;
    const levelPrefix = this.showLevel ? `[${levelName}]` : '';
    
    // 构建日志消息
    const messageParts = [];
    if (timestamp) messageParts.push(timestamp);
    messageParts.push(modulePrefix);
    messageParts.push(levelPrefix);
    
    // 控制台输出
    const color = LOG_COLORS[levelName];
    console.log(
      `%c${messageParts.join(' ')}`, 
      `color: ${color}; font-weight: bold`,
      ...args
    );

    // 记录到历史
    this._addToHistory({
      level: levelName,
      timestamp: new Date().toISOString(),
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      data: args
    });

    // 错误级别额外处理
    if (level === LOG_LEVELS.ERROR) {
      console.error(...args);
      
      // 如果有堆栈跟踪，也记录下来
      if (args[0] instanceof Error) {
        console.error(args[0].stack);
      }
    }
  }

  /**
   * 添加到历史记录
   * @private
   */
  _addToHistory(entry) {
    this.history.push(entry);
    
    // 限制历史长度
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * 设置日志级别
   * @param {string|number} level - 日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    } else {
      this.level = level;
    }
  }

  /**
   * 启用/禁用日志
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 获取日志历史
   * @param {string} level - 过滤级别（可选）
   * @returns {Array} 日志历史
   */
  getHistory(level = null) {
    if (!level) return [...this.history];
    
    return this.history.filter(entry => entry.level === level);
  }

  /**
   * 清除日志历史
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * 导出日志为JSON
   * @returns {string} JSON字符串
   */
  exportToJSON() {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * 导出日志为CSV
   * @returns {string} CSV字符串
   */
  exportToCSV() {
    const headers = 'Timestamp,Level,Message\n';
    const rows = this.history.map(entry => {
      const timestamp = entry.timestamp;
      const level = entry.level;
      const message = `"${entry.message.replace(/"/g, '""')}"`;
      return `${timestamp},${level},${message}`;
    }).join('\n');
    
    return headers + rows;
  }

  /**
   * 创建子模块日志器
   * @param {string} moduleName - 模块名称
   * @returns {Logger} 新的日志器实例
   */
  createChild(moduleName) {
    return new Logger({
      level: this.level,
      enabled: this.enabled,
      showTimestamp: this.showTimestamp,
      showLevel: this.showLevel,
      moduleName: `${this.moduleName}:${moduleName}`,
      maxHistoryLength: this.maxHistoryLength
    });
  }

  /**
   * 性能计时开始
   * @param {string} label - 计时标签
   */
  time(label) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.time(`${this.moduleName}:${label}`);
    }
  }

  /**
   * 性能计时结束
   * @param {string} label - 计时标签
   */
  timeEnd(label) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.timeEnd(`${this.moduleName}:${label}`);
    }
  }

  /**
   * 分组开始
   * @param {string} label - 分组标签
   */
  group(label) {
    console.group(`${this.moduleName}: ${label}`);
  }

  /**
   * 分组结束
   */
  groupEnd() {
    console.groupEnd();
  }

  /**
   * 断言
   * @param {boolean} condition - 条件
   * @param {...any} args - 失败时的消息
   */
  assert(condition, ...args) {
    if (!condition) {
      this.error('Assertion failed:', ...args);
    }
  }

  /**
   * 表格形式输出数据
   * @param {Array|Object} data - 表格数据
   */
  table(data) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.table(data);
    }
  }

  /**
   * 追踪调用栈
   */
  trace() {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.trace(`${this.moduleName}:`);
    }
  }

  /**
   * 销毁日志器
   */
  destroy() {
    this.clearHistory();
  }
}

// 创建全局日志器实例
const globalLogger = new Logger({
  moduleName: 'BasicFantasyRPG'
});

// 导出类和全局实例
export default Logger;
export { globalLogger, LOG_LEVELS };
