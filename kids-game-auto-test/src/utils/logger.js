/**
 * 日志工具类
 * 功能：统一的日志记录和管理
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
);

// 创建 logger 实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'kids-game-auto-test' },
    transports: [
        // 错误日志
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        // 警告日志
        new winston.transports.File({
            filename: path.join(logDir, 'warning.log'),
            level: 'warn',
            maxsize: 10485760,
            maxFiles: 5
        }),
        // 所有日志
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

// 开发环境下输出到控制台
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            logFormat
        )
    }));
}

// 便捷的日志方法
logger.test = (message, data) => {
    logger.info(`[TEST] ${message}`, data);
};

logger.game = (gameName, action, result) => {
    logger.info(`[GAME:${gameName}] ${action}: ${result}`);
};

logger.performance = (metric, value, unit) => {
    logger.info(`[PERF] ${metric}: ${value}${unit}`);
};

logger.ai = (analysis, score) => {
    logger.info(`[AI] ${analysis}: ${score}/10`);
};

module.exports = { logger };
