/**
 * 后端 API 测试执行器
 *
 * 功能：
 * 1. 消费 API 类型的 TestCase，对后端 REST 接口发起真实 HTTP 请求
 * 2. 支持 14 种 API 断言类型（对应 TaskMonitor 中的 UI 断言体系）
 * 3. 并发执行 API 测试用例
 * 4. 输出标准格式的 TaskResult，与 TaskManager 完全兼容
 * 5. 可单独使用，也可集成进 Pipeline 的第四阶段
 *
 * 断言类型：
 *   api_status_ok        HTTP 状态码 2xx
 *   api_status_is        HTTP 状态码 === expected
 *   api_code_ok          响应 body.code === 200
 *   api_code_is          响应 body.code === expected
 *   api_code_not_ok      响应 body.code !== 200（用于测试失败场景）
 *   api_data_not_null    body.data 非 null/undefined
 *   api_field_exists     body.data[field] 存在
 *   api_field_equals     body.data[field] === expected
 *   api_field_type       body.data[field] 是 expected 类型
 *   api_array_not_empty  body.data 或 body.data[field] 为非空数组
 *   api_unauthorized     HTTP 401 或 code 表示未授权（403/401）
 *   api_message_contains body.message 包含 expected 字符串
 *   api_response_time    响应时间 < expected ms
 *   api_schema_match     body.data 与 expected schema 的字段集匹配
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const { EventEmitter } = require('events');
const { ApiClient }    = require('./api-client');
const { TaskManager, TaskStatus } = require('./task-manager');
const { logger }       = require('./utils/logger');
const { ensureDir, sleep, formatDuration, withTimeout } = require('./utils/helpers');

// ── 常量 ──────────────────────────────────────────────────────────────────────

const CASE_TIMEOUT    = 15_000;  // 单个 API 用例超时 15s
const TASK_TIMEOUT    = 120_000; // 单个任务超时 2min
const CONCURRENCY_DEF = 3;       // 默认并发数（API 测试比 UI 测试更轻，并发可更高）

const PASS_ICON  = '✅';
const FAIL_ICON  = '❌';
const WARN_ICON  = '⚠️ ';
const SKIP_ICON  = '⏭ ';
const RUN_ICON   = '🌐';

// ── 主类 ──────────────────────────────────────────────────────────────────────

class ApiTestRunner extends EventEmitter {
    /**
     * @param {TaskManager} taskManager
     * @param {object}      options
     * @param {string}      [options.baseUrl]       后端 base URL
     * @param {string}      [options.username]      登录用户名
     * @param {string}      [options.password]      登录密码
     * @param {string}      [options.userType]      用户类型
     * @param {number}      [options.concurrency]   并发数（默认 3）
     * @param {boolean}     [options.showDashboard] 是否打印进度（默认 true）
     */
    constructor(taskManager, options = {}) {
        super();
        this.taskManager   = taskManager;
        this.baseUrl       = options.baseUrl    || process.env.BACKEND_BASE_URL || 'http://localhost:8080';
        this.username      = options.username   || process.env.BACKEND_USERNAME  || 'admin';
        this.password      = options.password   || process.env.BACKEND_PASSWORD  || 'admin123';
        this.userType      = options.userType   || process.env.BACKEND_USER_TYPE || 'ADMIN';
        this.concurrency   = options.concurrency || CONCURRENCY_DEF;
        this.showDashboard = options.showDashboard !== false;

        this._client   = null;   // ApiClient（登录后赋值）
        this._running  = false;
        this._stopping = false;
        this._active   = new Set();

        this.taskManager.on('task:case_updated', () => this._refreshDashboard());
        this.taskManager.on('task:finished',     (t) => this._onTaskFinished(t));
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 启动 API 测试执行循环
     * @returns {Promise<MonitorSummary>}
     */
    async start() {
        if (this._running) {
            logger.warn('ApiTestRunner is already running');
            return;
        }
        this._running  = true;
        this._stopping = false;

        logger.info('\n' + '═'.repeat(60));
        logger.info(`${RUN_ICON}  API Test Runner started`);
        logger.info(`   Backend: ${this.baseUrl}`);
        logger.info('═'.repeat(60));

        const startTime = Date.now();

        // 1. 尝试连接后端并登录
        const ok = await this._initClient();
        if (!ok) {
            // 后端不可达，将所有任务标记为 SKIPPED
            logger.warn(`\n⚠️  Backend not reachable at ${this.baseUrl}, skipping all API tasks`);
            await this._skipAllTasks('Backend not reachable');
            const elapsed = Date.now() - startTime;
            const stats   = this.taskManager.getStats();
            this._printFinalSummary(stats, elapsed);
            return { stats, elapsed };
        }

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

    stop() {
        this._stopping = true;
        logger.warn('ApiTestRunner: stop requested...');
    }

    // ── 内部：初始化 ──────────────────────────────────────────────────────────

    async _initClient() {
        const client = new ApiClient({
            baseUrl:  this.baseUrl,
            username: this.username,
            password: this.password,
            userType: this.userType,
            autoLogin: false,
        });

        const reachable = await client.isReachable();
        if (!reachable) return false;

        try {
            await client.login();
            this._client = client;
            logger.info(`✅ Authenticated as ${this.username} (${this.userType})`);
            return true;
        } catch (err) {
            logger.warn(`⚠️  Login failed: ${err.message}`);
            // 登录失败不致命，部分接口可能不需要认证
            this._client = client;
            return true;
        }
    }

    // ── 内部：主循环 ──────────────────────────────────────────────────────────

    async _runLoop() {
        while (!this._stopping) {
            const queued = this.taskManager.getQueuedTasks();

            if (queued.length === 0 && this._active.size === 0) {
                const pending = this.taskManager.queryTasks({ status: TaskStatus.PENDING });
                if (pending.length === 0) break;
                await sleep(500);
                continue;
            }

            while (this._active.size < this.concurrency && queued.length > 0) {
                const task = queued.shift();
                if (!task) break;
                this._active.add(task.taskId);
                this._executeApiTask(task).finally(() => {
                    this._active.delete(task.taskId);
                });
            }

            await sleep(200);
        }

        while (this._active.size > 0) {
            await sleep(300);
        }
    }

    // ── 内部：任务执行 ────────────────────────────────────────────────────────

    async _executeApiTask(task) {
        this.taskManager.markRunning(task.taskId);
        this.emit('task:start', task);

        const logLines = [];
        const log = msg => logLines.push(`[${new Date().toISOString()}] ${msg}`);

        this._printTaskHeader(task);

        try {
            await withTimeout(
                this._runAllCases(task, log),
                TASK_TIMEOUT,
                `api-task ${task.taskId}`
            );
        } catch (err) {
            log(`[FATAL] Task failed: ${err.message}`);
            this.taskManager.finishTask(task.taskId, {
                status:   TaskStatus.ERROR,
                error:    err.message,
                duration: Date.now() - new Date(task.startedAt || task.createdAt).getTime(),
            });
        } finally {
            this._writeRunLog(task.taskId, logLines);
        }
    }

    async _runAllCases(task, log) {
        const caseResults = [];

        for (const tc of task.testCases) {
            const result = await this._runApiCase(tc, log);
            caseResults.push(result);
            this.taskManager.updateCaseResult(task.taskId, tc.caseId, result);
            this._printCaseResult(tc, result);
        }

        const passed  = caseResults.filter(r => r.status === 'PASSED').length;
        const failed  = caseResults.filter(r => r.status === 'FAILED' && !r.soft).length;
        const warned  = caseResults.filter(r => r.status === 'FAILED' && r.soft).length;
        const errored = caseResults.filter(r => r.status === 'ERROR').length;
        const skipped = caseResults.filter(r => r.status === 'SKIPPED').length;

        log(`Summary: passed=${passed} failed=${failed} warned=${warned} errored=${errored} skipped=${skipped}`);

        this.taskManager.finishTask(task.taskId, {
            status:   failed > 0 || errored > 0 ? TaskStatus.FAILED
                    : warned  > 0 ? 'WARNED'
                    : TaskStatus.PASSED,
            duration: Date.now() - new Date(task.startedAt || task.createdAt).getTime(),
            caseStats: { passed, failed, warned, errored, skipped },
        });
    }

    // ── 内部：单用例执行 ──────────────────────────────────────────────────────

    async _runApiCase(tc, log) {
        const result = {
            caseId:    tc.caseId,
            name:      tc.name,
            status:    'PENDING',
            soft:      tc.soft || false,
            duration:  0,
            details:   '',
            error:     null,
        };

        const startTime = Date.now();
        log(`  Running: [${tc.caseId}] ${tc.name}`);

        try {
            await withTimeout(
                this._dispatchApiCase(tc, result, log),
                CASE_TIMEOUT,
                `case ${tc.caseId}`
            );
            if (result.status === 'PENDING') result.status = 'PASSED';
        } catch (err) {
            result.status = 'ERROR';
            result.error  = err.message;
            log(`  [ERROR] ${tc.caseId}: ${err.message}`);
        }

        result.duration = Date.now() - startTime;
        log(`  [${result.status}] ${tc.caseId} (${result.duration}ms)${result.error ? ' ' + result.error : ''}`);
        return result;
    }

    /**
     * 发起 API 请求并执行断言
     * @private
     */
    async _dispatchApiCase(tc, result, log) {
        const spec = tc.apiSpec;
        if (!spec?.path) {
            result.status  = 'SKIPPED';
            result.details = 'No apiSpec.path defined';
            return;
        }

        // 执行 HTTP 请求
        const t0       = Date.now();
        let response   = null;
        let httpError  = null;

        try {
            if (spec.skipAuth) {
                // 故意不带 Token（测试未授权场景）
                response = await this._requestNoAuth(spec.method || 'GET', spec.path, spec.body);
            } else {
                response = await this._client.rawGet
                    ? await this._rawRequest(spec.method || 'GET', spec.path, spec.body)
                    : { code: 500, message: 'client not initialized', data: null, _httpStatus: 500 };
            }
        } catch (err) {
            httpError = err;
            response  = { code: -1, message: err.message, data: null, _httpStatus: 0 };
        }

        const elapsed = Date.now() - t0;
        log(`    HTTP ${spec.method || 'GET'} ${spec.path} → status=${response._httpStatus} code=${response.code} (${elapsed}ms)`);

        result.details += `| ${spec.method || 'GET'} ${spec.path} ${elapsed}ms `;

        // 执行断言
        const assertions = tc.assertions || [];
        for (const assert of assertions) {
            this._runApiAssertion(assert, response, elapsed, tc, result);
        }
    }

    /**
     * 执行单个 API 断言
     * @private
     */
    _runApiAssertion(assert, resp, elapsed, tc, result) {
        const fail = (msg) => {
            if (tc.soft) {
                result.status  = result.status === 'PASSED' || result.status === 'PENDING' ? 'WARNED' : result.status;
                result.details += `| ⚠ ${msg} `;
            } else {
                result.status  = 'FAILED';
                result.error   = msg;
            }
        };
        const pass = (msg) => { result.details += `| ✓ ${msg} `; };

        switch (assert.type) {

            case 'api_status_ok': {
                const s = resp._httpStatus || 0;
                if (s >= 200 && s < 300) pass(`HTTP ${s}`);
                else fail(`HTTP ${s} (expected 2xx)`);
                break;
            }

            case 'api_status_is': {
                const s = resp._httpStatus || 0;
                if (s === assert.expected) pass(`HTTP ${s}`);
                else fail(`HTTP ${s} (expected ${assert.expected})`);
                break;
            }

            case 'api_code_ok': {
                if (resp.code === 200 || resp.code === 0) pass(`code=${resp.code}`);
                else fail(`code=${resp.code} (expected 200)`);
                break;
            }

            case 'api_code_is': {
                if (resp.code === assert.expected) pass(`code=${resp.code}`);
                else fail(`code=${resp.code} (expected ${assert.expected})`);
                break;
            }

            case 'api_code_not_ok': {
                if (resp.code !== 200 && resp.code !== 0) pass(`code=${resp.code} (non-200, expected)`);
                else fail(`code=${resp.code} (expected non-200)`);
                break;
            }

            case 'api_data_not_null': {
                if (resp.data !== null && resp.data !== undefined) pass('data not null');
                else fail('data is null/undefined');
                break;
            }

            case 'api_field_exists': {
                const field = assert.field;
                const data  = resp.data || resp;
                const val   = this._getNestedField(data, field);
                if (val !== undefined && val !== null && val !== '') pass(`data.${field} exists`);
                else fail(`data.${field} missing or empty`);
                break;
            }

            case 'api_field_equals': {
                const field    = assert.field;
                const expected = assert.expected;
                const data     = resp.data || resp;
                const val      = this._getNestedField(data, field);
                if (val === expected) pass(`data.${field} === ${expected}`);
                else fail(`data.${field}=${JSON.stringify(val)} (expected ${expected})`);
                break;
            }

            case 'api_field_type': {
                const field    = assert.field;
                const expected = assert.expected; // 'string'|'number'|'array'|'object'|'boolean'
                const data     = resp.data || resp;
                const val      = this._getNestedField(data, field);
                const actual   = Array.isArray(val) ? 'array' : typeof val;
                if (actual === expected) pass(`data.${field} is ${expected}`);
                else fail(`data.${field} is ${actual} (expected ${expected})`);
                break;
            }

            case 'api_array_not_empty': {
                const field = assert.field;
                const data  = field ? (resp.data?.[field] || resp[field]) : resp.data;
                if (Array.isArray(data) && data.length > 0) pass(`array not empty (${data.length} items)`);
                else fail(`array is empty or not array`);
                break;
            }

            case 'api_unauthorized': {
                const s = resp._httpStatus || 0;
                const c = resp.code || 0;
                if (s === 401 || s === 403 || c === 401 || c === 403 || c === 40100 || c === 40300) {
                    pass(`unauthorized (HTTP ${s}, code ${c})`);
                } else {
                    fail(`expected 401/403, got HTTP ${s} code ${c}`);
                }
                break;
            }

            case 'api_message_contains': {
                const msg = String(resp.message || '').toLowerCase();
                const exp = String(assert.expected || '').toLowerCase();
                if (msg.includes(exp)) pass(`message contains "${assert.expected}"`);
                else fail(`message "${resp.message}" does not contain "${assert.expected}"`);
                break;
            }

            case 'api_response_time': {
                const threshold = assert.threshold || 3000;
                if (elapsed <= threshold) pass(`response ${elapsed}ms < ${threshold}ms`);
                else fail(`response ${elapsed}ms > ${threshold}ms`);
                break;
            }

            case 'api_schema_match': {
                const schema    = assert.schema || {};
                const data      = resp.data || {};
                const missing   = Object.keys(schema).filter(k => !(k in data));
                if (missing.length === 0) pass(`schema matched (${Object.keys(schema).length} fields)`);
                else fail(`missing fields: ${missing.join(', ')}`);
                break;
            }

            default:
                result.details += `| Unknown assert type: ${assert.type} `;
        }
    }

    // ── 内部：HTTP 请求 ───────────────────────────────────────────────────────

    async _rawRequest(method, path, body) {
        try {
            const res = await this._client.rawGet
                ? (method === 'GET' ? this._client.rawGet(path) : this._client.rawPost(path, body))
                : this._clientCall(method, path, body);
            return res;
        } catch (err) {
            return { code: -1, message: err.message, data: null, _httpStatus: 0 };
        }
    }

    async _clientCall(method, path, body) {
        switch ((method || '').toUpperCase()) {
            case 'GET':    return this._client.rawGet(path);
            case 'POST':   return this._client.rawPost(path, body);
            case 'PUT':    return this._client.put && this._client.rawPost(path, body);
            case 'DELETE': return this._client.rawGet(path);
            default:       return this._client.rawGet(path);
        }
    }

    /**
     * 不带鉴权的请求（用于未授权测试）
     * @private
     */
    async _requestNoAuth(method, path, body) {
        const noAuthClient = new ApiClient({
            baseUrl:   this.baseUrl,
            autoLogin: false,
        });
        // 覆盖 _ensureToken 使其不登录
        noAuthClient._ensureToken = async () => {};
        try {
            return await noAuthClient.rawGet(path);
        } catch (err) {
            return { code: -1, message: err.message, data: null, _httpStatus: 0 };
        }
    }

    // ── 内部：工具 ────────────────────────────────────────────────────────────

    /** 支持 "a.b.c" 形式的嵌套字段访问 */
    _getNestedField(obj, field) {
        if (!obj || !field) return undefined;
        return field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    }

    async _skipAllTasks(reason) {
        const tasks = [
            ...this.taskManager.getQueuedTasks(),
            ...this.taskManager.queryTasks({ status: TaskStatus.PENDING }),
        ];
        for (const t of tasks) {
            this.taskManager.finishTask(t.taskId, { status: TaskStatus.SKIPPED, error: reason });
        }
    }

    // ── 内部：显示 ───────────────────────────────────────────────────────────

    _printTaskHeader(task) {
        logger.info(`\n${'─'.repeat(60)}`);
        logger.info(`${RUN_ICON} [${task.taskId.slice(-8)}] ${task.gameName}  (${task.testCases.length} API cases)`);
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

        const dur = result.duration ? `${result.duration}ms` : '';
        const det = result.details ? `  ${result.details.trim()}` : '';
        logger.info(`  ${icon} [${tc.priority}] ${tc.name.padEnd(40)} ${dur}${det}`);
    }

    _refreshDashboard() {
        if (!this.showDashboard) return;
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

        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        logger.info(`\n${icon} API Task finished: ${task.gameName} → ${task.status}  (${formatDuration(task.duration)})`);
    }

    _printFinalSummary(stats, elapsed) {
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        logger.info('\n' + '═'.repeat(60));
        logger.info(`📊  API TEST RUNNER SUMMARY`);
        logger.info('═'.repeat(60));
        logger.info(`  Total tasks  : ${stats.total}`);
        logger.info(`  ${PASS_ICON} Passed      : ${stats.passed}`);
        logger.info(`  ${FAIL_ICON} Failed      : ${stats.failed}`);
        logger.info(`  ${WARN_ICON} Warned      : ${stats.warned || 0}`);
        logger.info(`  💥 Errors     : ${stats.error}`);
        logger.info(`  ${SKIP_ICON} Skipped    : ${stats.skipped}`);
        logger.info(`  ⏱  Duration   : ${formatDuration(elapsed)}`);
        logger.info('═'.repeat(60) + '\n');
    }

    _writeRunLog(taskId, lines) {
        try {
            const logsDir = path.resolve(__dirname, '../tasks');
            ensureDir(logsDir);
            const logFile = path.join(logsDir, `${taskId}-api-run.log`);
            fs.writeFileSync(logFile, lines.join('\n'), 'utf8');
        } catch (_) {}
    }
}

module.exports = { ApiTestRunner };
