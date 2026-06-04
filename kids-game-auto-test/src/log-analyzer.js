/**
 * 日志分析器
 * 功能：收集和分析前后端日志，检测问题
 *
 * Playwright 迁移点：
 * - page.on('console', msg)  → msg.type() / msg.text() 与 Puppeteer 相同
 * - page.on('request', req)  → req.url() / req.method() 相同
 * - page.on('response', res) → res.url() / res.status() 相同
 * - page.on('pageerror', err) → err.message 相同
 * - page.on('requestfailed', req) → req.failure() 相同
 *   Playwright 中 failure() 返回 errorText（string），无需 ?.errorText
 *
 * 其他优化：
 * - URL 去重（Set）
 * - 5xx → critical，4xx → warning
 * - clear() 支持多轮复用
 */

const { logger } = require('./utils/logger');

class LogAnalyzer {
    constructor() {
        this.consoleLogs  = [];
        this.networkLogs  = [];
        this.errors       = [];
        this.warnings     = [];
        this._collecting  = false;
        this._failedUrls  = new Set();
    }

    /**
     * 绑定到 Playwright page，开始收集日志
     * ⚠️ 必须在 page.goto() 之前调用！
     * @param {import('playwright').Page} page
     */
    startCollecting(page) {
        if (this._collecting) return;
        this._collecting = true;
        logger.info('Log collection started (Playwright)');

        // ── Console 日志 ──────────────────────────────────────────────────────
        page.on('console', msg => {
            const entry = {
                type:      msg.type(),
                text:      msg.text(),
                timestamp: new Date().toISOString(),
                location:  msg.location()          // { url, lineNumber, columnNumber }
            };
            this.consoleLogs.push(entry);

            if (entry.type === 'error') {
                logger.error(`[Console] ${entry.text}`);
                this.errors.push({
                    type:      'console_error',
                    message:   entry.text,
                    location:  entry.location,
                    timestamp: entry.timestamp,
                    severity:  'critical'
                });
            } else if (entry.type === 'warning') {
                logger.warn(`[Console] ${entry.text}`);
                this.warnings.push({
                    type:      'console_warning',
                    message:   entry.text,
                    timestamp: entry.timestamp,
                    severity:  'warning'
                });
            }
        });

        // ── 网络请求 ──────────────────────────────────────────────────────────
        page.on('request', request => {
            this.networkLogs.push({
                type:      'request',
                url:       request.url(),
                method:    request.method(),
                timestamp: new Date().toISOString()
            });
        });

        // ── 网络响应 ──────────────────────────────────────────────────────────
        page.on('response', response => {
            const status = response.status();
            const entry = {
                type:       'response',
                url:        response.url(),
                status,
                statusText: response.statusText(),
                timestamp:  new Date().toISOString()
            };
            this.networkLogs.push(entry);

            if (status >= 500) {
                logger.error(`[Network] ${status} ${response.url()}`);
                this.errors.push({
                    type:      'network_server_error',
                    message:   `HTTP ${status}: ${response.url()}`,
                    url:       response.url(),
                    timestamp: entry.timestamp,
                    severity:  'critical'
                });
            } else if (status >= 400) {
                logger.warn(`[Network] ${status} ${response.url()}`);
                this.warnings.push({
                    type:      'network_client_error',
                    message:   `HTTP ${status}: ${response.url()}`,
                    url:       response.url(),
                    timestamp: entry.timestamp,
                    severity:  'warning'
                });
            }
        });

        // ── 页面级 JS 错误 ────────────────────────────────────────────────────
        page.on('pageerror', error => {
            logger.error(`[Page Error] ${error.message}`);
            this.errors.push({
                type:      'page_error',
                message:   error.message,
                stack:     error.stack,
                timestamp: new Date().toISOString(),
                severity:  'critical'
            });
        });

        // ── 资源请求失败（去重）─────────────────────────────────────────────
        page.on('requestfailed', request => {
            const url = request.url();
            if (this._failedUrls.has(url)) return;
            this._failedUrls.add(url);

            // Playwright: request.failure() 返回字符串（errorText），Puppeteer 返回对象
            const errorText = request.failure() || 'Unknown';
            logger.warn(`[Request Failed] ${errorText} — ${url}`);
            this.warnings.push({
                type:      'request_failed',
                url,
                errorText,
                timestamp: new Date().toISOString(),
                severity:  'warning'
            });
        });

        // ── Dialog 自动处理（避免 alert 阻塞测试）────────────────────────────
        page.on('dialog', async dialog => {
            logger.warn(`[Dialog] ${dialog.type()}: "${dialog.message()}" → auto-dismissed`);
            this.warnings.push({
                type:    'dialog',
                kind:    dialog.type(),
                message: dialog.message(),
                timestamp: new Date().toISOString(),
                severity: 'warning'
            });
            await dialog.dismiss().catch(() => {});
        });
    }

    /**
     * 分析已收集的日志
     * @param {string} gameName
     */
    async analyze(gameName) {
        logger.info(`Analyzing logs for ${gameName}...`);
        const issues = this.categorizeIssues();
        logger.info(`Log analysis: ${this.errors.length} errors, ${this.warnings.length} warnings, ${issues.length} total issues`);

        return {
            gameName,
            consoleLogs:  this.consoleLogs.length,
            networkLogs:  this.networkLogs.length,
            errors:       this.errors.length,
            warnings:     this.warnings.length,
            issues,
            timestamp:    new Date().toISOString()
        };
    }

    // ─── 分类 & 优先级 ────────────────────────────────────────────────────────

    categorizeIssues() {
        const issues = [
            ...this.errors.map(e  => ({ ...e,  category: 'error',   priority: this.getErrorPriority(e.type) })),
            ...this.warnings.map(w => ({ ...w, category: 'warning', priority: this.getWarningPriority(w.type) }))
        ];
        issues.sort((a, b) => b.priority - a.priority);
        return issues;
    }

    getErrorPriority(type) {
        return ({ page_error: 10, console_error: 9, network_server_error: 8, request_failed: 7 })[type] || 5;
    }

    getWarningPriority(type) {
        return ({ network_server_error: 8, network_client_error: 6, console_warning: 5, request_failed: 5, resource_warning: 4, dialog: 3 })[type] || 3;
    }

    // ─── 工具方法 ─────────────────────────────────────────────────────────────

    getSummary() {
        return {
            totalLogs:      this.consoleLogs.length + this.networkLogs.length,
            consoleLogs:    this.consoleLogs.length,
            networkLogs:    this.networkLogs.length,
            errors:         this.errors.length,
            warnings:       this.warnings.length,
            criticalIssues: this.errors.filter(e => e.severity === 'critical').length,
            failedRequests: this._failedUrls.size
        };
    }

    /** 清空所有收集数据（多轮测试复用时调用） */
    clear() {
        this.consoleLogs  = [];
        this.networkLogs  = [];
        this.errors       = [];
        this.warnings     = [];
        this._failedUrls.clear();
        this._collecting  = false;
    }
}

module.exports = { LogAnalyzer };
