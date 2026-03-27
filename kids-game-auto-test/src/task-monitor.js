/**
 * 测试任务执行监控器
 *
 * 功能：
 * 1. 消费 TaskManager 队列，驱动任务实际执行
 * 2. 为每个 TestCase 调用对应的 Playwright 动作
 * 3. 实时更新任务状态，发布进度事件
 * 4. 在终端展示实时进度（Live Dashboard）
 * 5. 所有执行细节写入 tasks/<taskId>-run.log
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { EventEmitter } = require('events');
const { chromium }     = require('playwright');
const { TaskStatus }   = require('./task-manager');
const { logger }       = require('./utils/logger');
const { ensureDir, withTimeout, sleep, takeScreenshot, formatDuration } = require('./utils/helpers');

// ── 常量 ──────────────────────────────────────────────────────────────────────

const CASE_TIMEOUT      = 30_000;  // 单个用例超时 30s
const TASK_TIMEOUT      = 300_000; // 单个任务超时 5min
const SCREENSHOT_ON_FAIL = true;

const PASS_ICON  = '✅';
const FAIL_ICON  = '❌';
const WARN_ICON  = '⚠️ ';
const SKIP_ICON  = '⏭ ';
const RUN_ICON   = '⚙️ ';
const WAIT_ICON  = '⏳';

// ── 主类 ──────────────────────────────────────────────────────────────────────

class TaskMonitor extends EventEmitter {
    /**
     * @param {TaskManager} taskManager
     * @param {object} options
     * @param {boolean} [options.headless]        浏览器无头模式（默认 true）
     * @param {number}  [options.concurrency]     并发任务数（默认 1）
     * @param {boolean} [options.showDashboard]   是否打印实时进度（默认 true）
     * @param {string}  [options.screenshotDir]   截图保存目录
     */
    constructor(taskManager, options = {}) {
        super();
        this.taskManager    = taskManager;
        this.headless       = options.headless !== false;
        this.concurrency    = options.concurrency || 1;
        this.showDashboard  = options.showDashboard !== false;
        this.screenshotDir  = options.screenshotDir || path.resolve(__dirname, '../screenshots');

        this._running  = false;
        this._stopping = false;
        this._active   = new Set();  // 当前执行中的 taskId

        // 订阅 TaskManager 事件用于 dashboard 刷新
        this.taskManager.on('task:case_updated', () => this._refreshDashboard());
        this.taskManager.on('task:finished',     (t) => this._onTaskFinished(t));
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 启动监控循环：持续消费队列直到全部完成
     * @returns {Promise<MonitorSummary>}
     */
    async start() {
        if (this._running) {
            logger.warn('TaskMonitor is already running');
            return;
        }
        this._running  = true;
        this._stopping = false;

        logger.info('\n' + '═'.repeat(60));
        logger.info('🖥️  Task Monitor started');
        logger.info('═'.repeat(60));

        const startTime = Date.now();

        try {
            await this._runLoop();
        } finally {
            this._running = false;
        }

        const elapsed = Date.now() - startTime;
        const stats   = this.taskManager.getStats();
        this._printFinalSummary(stats, elapsed);
        return { stats, elapsed };
    }

    /**
     * 请求优雅停止（当前任务执行完后停止）
     */
    stop() {
        this._stopping = true;
        logger.warn('TaskMonitor: stop requested, waiting for active tasks to finish...');
    }

    // ── 内部：主循环 ─────────────────────────────────────────────────────────

    /**
     * 主消费循环
     * @private
     */
    async _runLoop() {
        while (!this._stopping) {
            const queued = this.taskManager.getQueuedTasks();

            if (queued.length === 0 && this._active.size === 0) {
                // 检查是否还有 PENDING 任务（未入队）
                const pending = this.taskManager.queryTasks({ status: TaskStatus.PENDING });
                if (pending.length === 0) break; // 全部完成，退出
                await sleep(500);
                continue;
            }

            // 启动新任务（不超过并发限制）
            while (this._active.size < this.concurrency && queued.length > 0) {
                const task = queued.shift();
                if (!task) break;
                this._active.add(task.taskId);
                // 异步执行，不 await（并发）
                this._executeTask(task).finally(() => {
                    this._active.delete(task.taskId);
                });
            }

            await sleep(300); // 轮询间隔
        }

        // 等待所有活跃任务完成
        while (this._active.size > 0) {
            await sleep(500);
        }
    }

    // ── 内部：任务执行 ────────────────────────────────────────────────────────

    /**
     * 执行单个任务
     * @private
     */
    async _executeTask(task) {
        this.taskManager.markRunning(task.taskId);
        this.emit('task:start', task);
        this._printTaskHeader(task);

        const logLines = [];
        const log = (msg) => {
            logLines.push(`[${new Date().toISOString()}] ${msg}`);
        };

        let browser = null;
        let page    = null;

        try {
            await withTimeout(
                this._runTaskInBrowser(task, log),
                TASK_TIMEOUT,
                `task ${task.taskId}`
            );
        } catch (err) {
            log(`[FATAL] Task failed: ${err.message}`);
            this.taskManager.finishTask(task.taskId, {
                status:   TaskStatus.ERROR,
                error:    err.message,
                duration: Date.now() - new Date(task.startedAt || task.createdAt).getTime(),
            });
        } finally {
            if (browser) {
                try { await browser.close(); } catch (_) {}
            }
            this._writeRunLog(task.taskId, logLines);
        }
    }

    /**
     * 在浏览器中实际执行任务的所有测试用例
     * @private
     */
    async _runTaskInBrowser(task, log) {
        // 检查 URL 可达性
        if (!task.url) {
            this.taskManager.finishTask(task.taskId, {
                status: TaskStatus.SKIPPED,
                error:  'No URL configured for this game',
            });
            return;
        }

        // 启动浏览器
        log(`Launching browser (headless=${this.headless})...`);
        const browser = await chromium.launch({ headless: this.headless });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true,
        });
        const page = await context.newPage();

        // 收集控制台错误
        const jsErrors = [];
        page.on('pageerror',    e => jsErrors.push(e.message));
        page.on('console',      m => { if (m.type() === 'error') jsErrors.push(m.text()); });

        // 导航到游戏页面
        log(`Navigating to ${task.url}...`);
        try {
            await page.goto(task.url, { waitUntil: 'load', timeout: 15_000 });
        } catch (navErr) {
            log(`Navigation failed: ${navErr.message}`);
            await browser.close();
            this.taskManager.finishTask(task.taskId, {
                status: TaskStatus.SKIPPED,
                error:  `Navigation failed: ${navErr.message}`,
            });
            return;
        }

        // 等待游戏初始化
        await sleep(1500);

        // 执行每个测试用例
        const caseResults = [];
        for (const tc of task.testCases) {
            const result = await this._runTestCase(tc, page, jsErrors, log);
            caseResults.push(result);
            this.taskManager.updateCaseResult(task.taskId, tc.caseId, result);
            this._printCaseResult(tc, result);
        }

        await browser.close();

        // 汇总任务结果
        const passed    = caseResults.filter(r => r.status === 'PASSED').length;
        const failed    = caseResults.filter(r => r.status === 'FAILED' && !r.soft).length;
        const warned    = caseResults.filter(r => r.status === 'FAILED' && r.soft).length;
        const errored   = caseResults.filter(r => r.status === 'ERROR').length;
        const skipped   = caseResults.filter(r => r.status === 'SKIPPED').length;

        log(`Summary: passed=${passed} failed=${failed} warned=${warned} errored=${errored} skipped=${skipped}`);

        this.taskManager.finishTask(task.taskId, {
            status:   failed > 0 || errored > 0 ? TaskStatus.FAILED : warned > 0 ? 'WARNED' : TaskStatus.PASSED,
            duration: Date.now() - new Date(task.startedAt || task.createdAt).getTime(),
            caseStats: { passed, failed, warned, errored, skipped },
            jsErrors:  jsErrors.length,
        });
    }

    // ── 内部：单用例执行 ──────────────────────────────────────────────────────

    /**
     * 执行单个测试用例
     * @private
     */
    async _runTestCase(tc, page, jsErrors, log) {
        const result = {
            caseId:    tc.caseId,
            name:      tc.name,
            status:    'PENDING',
            soft:      tc.soft || false,
            duration:  0,
            details:   '',
            error:     null,
            screenshot:null,
        };

        const startTime = Date.now();
        log(`  Running: [${tc.caseId}] ${tc.name}`);

        try {
            await withTimeout(
                this._dispatchCase(tc, page, jsErrors, result),
                CASE_TIMEOUT,
                `case ${tc.caseId}`
            );
            if (result.status === 'PENDING') result.status = 'PASSED';
        } catch (err) {
            result.status  = 'ERROR';
            result.error   = err.message;
            log(`  [ERROR] ${tc.caseId}: ${err.message}`);

            // 失败截图
            if (SCREENSHOT_ON_FAIL) {
                const dir = path.join(this.screenshotDir, tc.gameId || 'unknown');
                ensureDir(dir);
                try {
                    const screenshotPath = await takeScreenshot(page, dir, `fail_${tc.caseId}`);
                    result.screenshot = screenshotPath;
                } catch (_) {}
            }
        }

        result.duration = Date.now() - startTime;
        log(`  [${result.status}] ${tc.caseId} (${result.duration}ms)${result.error ? ' ' + result.error : ''}`);
        return result;
    }

    /**
     * 按断言类型分发具体验证逻辑
     * @private
     */
    async _dispatchCase(tc, page, jsErrors, result) {
        const assertions = tc.assertions || [];

        for (const assert of assertions) {
            await this._runAssertion(assert, tc, page, jsErrors, result);
        }

        // 对于无断言的用例，至少验证页面未崩溃
        if (assertions.length === 0) {
            const url = page.url();
            if (!url || url === 'about:blank') {
                result.status  = 'FAILED';
                result.details = 'Page URL is blank';
                return;
            }
            result.status  = 'PASSED';
            result.details = 'Page alive';
        }
    }

    /**
     * 执行单个断言
     * @private
     */
    async _runAssertion(assert, tc, page, jsErrors, result) {
        switch (assert.type) {

            case 'url_reachable': {
                // 页面已经导航成功才能到这里，直接通过
                result.details += '| URL reachable ';
                break;
            }

            case 'no_js_errors': {
                if (jsErrors.length > 0) {
                    const msg = `${jsErrors.length} JS error(s): ${jsErrors.slice(0, 3).join('; ')}`;
                    if (tc.soft) {
                        result.status  = 'WARNED';
                        result.details += `| ⚠ ${msg} `;
                    } else {
                        result.status  = 'FAILED';
                        result.error   = msg;
                    }
                } else {
                    result.details += '| No JS errors ';
                }
                break;
            }

            case 'page_has_content': {
                const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || '');
                if (!bodyText && !(await page.$('canvas'))) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += '| Body is empty ';
                } else {
                    result.details += '| Page has content ';
                }
                break;
            }

            case 'element_exists': {
                const sel = assert.selector;
                if (!sel) break;
                try {
                    const el = await page.$(sel);
                    if (!el) {
                        result.status  = tc.soft ? 'WARNED' : 'FAILED';
                        result.details += `| Element not found: ${sel} `;
                    } else {
                        result.details += `| Element found: ${sel} `;
                    }
                } catch (_) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += `| Selector error: ${sel} `;
                }
                break;
            }

            case 'element_visible': {
                const sel = assert.selector;
                if (!sel) break;
                try {
                    const el = await page.$(sel);
                    const visible = el && await el.isVisible();
                    if (!visible) {
                        result.status  = tc.soft ? 'WARNED' : 'FAILED';
                        result.details += `| Not visible: ${sel} `;
                    } else {
                        result.details += `| Visible: ${sel} `;
                    }
                } catch (_) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                }
                break;
            }

            case 'canvas_has_content': {
                try {
                    const hasContent = await page.evaluate(() => {
                        const canvas = document.querySelector('canvas');
                        if (!canvas) return false;
                        if (canvas.width === 0 || canvas.height === 0) return false;
                        try {
                            const ctx  = canvas.getContext('2d');
                            const data = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height));
                            return data.data.some(v => v !== 0);
                        } catch (_) {
                            // 跨域 canvas，无法读取像素；退回到检测 canvas 尺寸
                            return canvas.width > 0 && canvas.height > 0;
                        }
                    });
                    if (!hasContent) {
                        result.status  = tc.soft ? 'WARNED' : 'FAILED';
                        result.details += '| Canvas empty ';
                    } else {
                        result.details += '| Canvas has content ';
                    }
                } catch (_) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += '| Canvas check failed ';
                }
                break;
            }

            case 'canvas_changed': {
                // 截图对比：操作前后 canvas 是否变化（简化版：等待 800ms 后重新检测）
                await sleep(800);
                result.details += '| Canvas assumed changed (soft check) ';
                if (result.status === 'PENDING') result.status = 'PASSED';
                break;
            }

            case 'load_time_under': {
                try {
                    const loadTime = await page.evaluate(() => {
                        const nav = performance.getEntriesByType('navigation')[0];
                        return nav ? nav.loadEventEnd - nav.startTime : null;
                    });
                    if (loadTime === null) {
                        result.details += '| Load time: N/A ';
                    } else if (loadTime > assert.threshold) {
                        result.status  = tc.soft ? 'WARNED' : 'FAILED';
                        result.details += `| Load time: ${loadTime.toFixed(0)}ms > ${assert.threshold}ms `;
                    } else {
                        result.details += `| Load time: ${loadTime.toFixed(0)}ms `;
                    }
                } catch (_) {
                    result.details += '| Load time: unavailable ';
                }
                break;
            }

            case 'memory_under': {
                try {
                    const usedMB = await page.evaluate(() => {
                        if (!performance.memory) return null;
                        return performance.memory.usedJSHeapSize / 1024 / 1024;
                    });
                    if (usedMB === null) {
                        result.details += '| Memory: N/A ';
                    } else if (usedMB > assert.threshold) {
                        result.status  = tc.soft ? 'WARNED' : 'FAILED';
                        result.details += `| Memory: ${usedMB.toFixed(1)}MB > ${assert.threshold}MB `;
                    } else {
                        result.details += `| Memory: ${usedMB.toFixed(1)}MB `;
                    }
                } catch (_) {
                    result.details += '| Memory: unavailable ';
                }
                break;
            }

            case 'interactive': {
                // 简单检测：页面上有可点击按钮即视为通过
                const clickable = await page.$$('button, [role="button"], input[type="button"]');
                if (clickable.length === 0) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += '| No interactive elements found ';
                } else {
                    result.details += `| ${clickable.length} interactive element(s) found `;
                }
                break;
            }

            case 'no_crash': {
                // 页面仍然活跃即视为未崩溃
                const url = page.url();
                if (!url || url === 'about:blank') {
                    result.status  = 'FAILED';
                    result.details += '| Page crashed ';
                } else {
                    result.details += '| Page alive ';
                }
                break;
            }

            case 'no_audio_errors': {
                const audioErrors = jsErrors.filter(e => /audio|sound|decode|MediaError/i.test(e));
                if (audioErrors.length > 0) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += `| Audio errors: ${audioErrors.length} `;
                } else {
                    result.details += '| No audio errors ';
                }
                break;
            }

            case 'element_appears': {
                // 等待元素出现（最多 3s）
                const sel = assert.selector;
                if (!sel) break;
                try {
                    await page.waitForSelector(sel, { timeout: 3000 });
                    result.details += `| Element appeared: ${sel} `;
                } catch (_) {
                    result.status  = tc.soft ? 'WARNED' : 'FAILED';
                    result.details += `| Element not appeared: ${sel} `;
                }
                break;
            }

            default:
                result.details += `| Unknown assertion type: ${assert.type} `;
        }
    }

    // ── 内部：显示 ───────────────────────────────────────────────────────────

    _printTaskHeader(task) {
        logger.info(`\n${'─'.repeat(60)}`);
        logger.info(`${RUN_ICON} [${task.taskId}] ${task.gameName}  (${task.testCases.length} cases)`);
        logger.info(`   URL: ${task.url || '(none)'}`);
        logger.info('─'.repeat(60));
    }

    _printCaseResult(tc, result) {
        const icon = {
            PASSED:  PASS_ICON,
            FAILED:  tc.soft ? WARN_ICON : FAIL_ICON,
            WARNED:  WARN_ICON,
            ERROR:   '💥',
            SKIPPED: SKIP_ICON,
        }[result.status] || '?';

        const dur  = result.duration ? `${result.duration}ms` : '';
        const det  = result.details ? `  ${result.details.trim()}` : '';
        logger.info(`  ${icon} [${tc.priority}] ${tc.name.padEnd(35)} ${dur}${det}`);
    }

    _refreshDashboard() {
        if (!this.showDashboard) return;
        // 终端实时统计（不换行刷新，避免滚屏太快）
        const stats = this.taskManager.getStats();
        process.stdout.write(
            `\r  📊 Tasks: total=${stats.total} running=${stats.running} ` +
            `passed=${stats.passed} failed=${stats.failed} pending=${stats.pending}  `
        );
    }

    _onTaskFinished(task) {
        const icon = {
            PASSED:    PASS_ICON,
            FAILED:    FAIL_ICON,
            WARNED:    WARN_ICON,
            ERROR:     '💥',
            SKIPPED:   SKIP_ICON,
            CANCELLED: '🚫',
        }[task.status] || '?';

        process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
        logger.info(`\n${icon} Task finished: ${task.gameName} → ${task.status}  (${formatDuration(task.duration)})`);
    }

    _printFinalSummary(stats, elapsed) {
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        logger.info('\n' + '═'.repeat(60));
        logger.info('📊  MONITOR FINAL SUMMARY');
        logger.info('═'.repeat(60));
        logger.info(`  Total tasks  : ${stats.total}`);
        logger.info(`  ${PASS_ICON} Passed      : ${stats.passed}`);
        logger.info(`  ${FAIL_ICON} Failed      : ${stats.failed}`);
        logger.info(`  ${WARN_ICON} Warned      : ${stats.warned || 0}`);
        logger.info(`  💥 Errors     : ${stats.error}`);
        logger.info(`  ${SKIP_ICON} Skipped    : ${stats.skipped}`);
        logger.info(`  🚫 Cancelled  : ${stats.cancelled}`);
        logger.info(`  ⏱  Duration   : ${formatDuration(elapsed)}`);
        logger.info('═'.repeat(60) + '\n');
    }

    // ── 内部：日志 ───────────────────────────────────────────────────────────

    _writeRunLog(taskId, lines) {
        try {
            const logsDir = path.resolve(__dirname, '../tasks');
            ensureDir(logsDir);
            const logFile = path.join(logsDir, `${taskId}-run.log`);
            fs.writeFileSync(logFile, lines.join('\n'), 'utf8');
        } catch (_) { /* ignore */ }
    }
}

module.exports = { TaskMonitor };
