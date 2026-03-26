/**
 * 日志分析器
 * 功能：收集和分析前后端日志，检测问题
 */

const { logger } = require('./utils/logger');

class LogAnalyzer {
    constructor() {
        this.consoleLogs = [];
        this.networkLogs = [];
        this.errors = [];
        this.warnings = [];
    }

    async analyze(gameName) {
        logger.info(`Starting log analysis for ${gameName}...`);
        
        try {
            const result = {
                gameName: gameName,
                consoleLogs: this.consoleLogs,
                networkLogs: this.networkLogs,
                errors: this.errors,
                warnings: this.warnings,
                issues: this.categorizeIssues(),
                timestamp: new Date().toISOString()
            };
            
            logger.info(`Log analysis completed. Found ${result.issues.length} issues.`);
            
            return result;
            
        } catch (error) {
            logger.error('Log analysis failed:', error);
            throw error;
        }
    }

    startCollecting(page) {
        logger.info('Starting log collection...');
        
        // 收集 Console 日志
        page.on('console', (msg) => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                location: msg.location()
            };
            
            this.consoleLogs.push(logEntry);
            
            // 实时记录重要日志
            if (msg.type() === 'error') {
                logger.error(`[Console] ${logEntry.text}`);
                this.errors.push({
                    type: 'console_error',
                    message: logEntry.text,
                    timestamp: logEntry.timestamp,
                    severity: 'critical'
                });
            } else if (msg.type() === 'warning') {
                logger.warn(`[Console] ${logEntry.text}`);
                this.warnings.push({
                    type: 'console_warning',
                    message: logEntry.text,
                    timestamp: logEntry.timestamp,
                    severity: 'warning'
                });
            }
        });
        
        // 收集网络请求
        page.on('request', (request) => {
            this.networkLogs.push({
                type: 'request',
                url: request.url(),
                method: request.method(),
                timestamp: new Date().toISOString()
            });
        });
        
        page.on('response', (response) => {
            const logEntry = {
                type: 'response',
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            };
            
            this.networkLogs.push(logEntry);
            
            // 检测失败的请求
            if (response.status() >= 400) {
                logger.warn(`[Network] ${response.status()} ${response.url()}`);
                this.warnings.push({
                    type: 'network_error',
                    message: `HTTP ${response.status()}: ${response.url()}`,
                    url: response.url(),
                    timestamp: logEntry.timestamp,
                    severity: 'warning'
                });
            }
        });
        
        // 收集页面错误
        page.on('pageerror', (error) => {
            logger.error(`[Page Error] ${error.message}`);
            this.errors.push({
                type: 'page_error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                severity: 'critical'
            });
        });
        
        // 收集请求失败
        page.on('requestfailed', (request) => {
            logger.error(`[Request Failed] ${request.url()}`);
            this.errors.push({
                type: 'request_failed',
                url: request.url(),
                errorText: request.failure()?.errorText || 'Unknown',
                timestamp: new Date().toISOString(),
                severity: 'warning'
            });
        });
        
        logger.info('Log collection started');
    }

    categorizeIssues() {
        const issues = [];
        
        // 分类错误
        for (const error of this.errors) {
            issues.push({
                ...error,
                category: 'error',
                priority: this.getErrorPriority(error.type)
            });
        }
        
        // 分类警告
        for (const warning of this.warnings) {
            issues.push({
                ...warning,
                category: 'warning',
                priority: this.getWarningPriority(warning.type)
            });
        }
        
        // 按优先级排序
        issues.sort((a, b) => b.priority - a.priority);
        
        return issues;
    }

    getErrorPriority(errorType) {
        const priorities = {
            'page_error': 10,          // 最高优先级
            'console_error': 9,
            'request_failed': 7,
            'network_error': 8
        };
        
        return priorities[errorType] || 5;
    }

    getWarningPriority(warningType) {
        const priorities = {
            'console_warning': 6,
            'network_error': 7,
            'resource_warning': 5
        };
        
        return priorities[warningType] || 4;
    }

    getSummary() {
        return {
            totalLogs: this.consoleLogs.length + this.networkLogs.length,
            consoleLogs: this.consoleLogs.length,
            networkLogs: this.networkLogs.length,
            errors: this.errors.length,
            warnings: this.warnings.length,
            criticalIssues: this.errors.filter(e => e.severity === 'critical').length
        };
    }

    clear() {
        this.consoleLogs = [];
        this.networkLogs = [];
        this.errors = [];
        this.warnings = [];
    }
}

module.exports = { LogAnalyzer };
