/**
 * 测试结果上报模块
 *
 * 功能：
 * 1. 将测试结果上报至 kids-game-backend REST API
 *    POST /api/test/report           — 汇总报告
 *    POST /api/test/task/{taskId}    — 单任务结果
 * 2. 生成 JUnit XML 格式报告（供 Jenkins/GitLab CI 使用）
 * 3. 生成 CSV 格式测试结果表（方便人工查阅）
 * 4. 失败时优雅降级（上报不影响主流程）
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { logger }    = require('./utils/logger');
const { ensureDir } = require('./utils/helpers');

// ── 常量 ──────────────────────────────────────────────────────────────────────

const REPORT_ENDPOINT    = '/api/test/report';
const TASK_ENDPOINT_TPL  = '/api/test/task/:taskId';

// ── 主类 ──────────────────────────────────────────────────────────────────────

class ResultReporter {
    /**
     * @param {object}    options
     * @param {ApiClient} [options.apiClient]     已登录的 ApiClient（不提供则跳过后端上报）
     * @param {string}    [options.outputDir]     本地报告输出目录（默认 reports/）
     * @param {boolean}   [options.enableJunit]   是否生成 JUnit XML（默认 true）
     * @param {boolean}   [options.enableCsv]     是否生成 CSV（默认 false）
     * @param {boolean}   [options.enableBackend] 是否上报后端（默认 true，若无 apiClient 则自动 false）
     */
    constructor(options = {}) {
        this.apiClient     = options.apiClient     || null;
        this.outputDir     = options.outputDir     || path.resolve(__dirname, '../reports');
        this.enableJunit   = options.enableJunit   !== false;
        this.enableCsv     = options.enableCsv     || false;
        this.enableBackend = options.enableBackend !== false && !!this.apiClient;

        ensureDir(this.outputDir);
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 上报所有任务的最终结果
     * @param {Task[]}      tasks        任务列表（来自 TaskManager）
     * @param {TaskManager} taskManager
     * @param {object}      [runMeta]    运行元数据（触发方式、CI信息等）
     * @returns {Promise<ReportSummary>}
     */
    async report(tasks, taskManager, runMeta = {}) {
        logger.info('\n📤 Result Reporter started...');

        const summary = this._buildSummary(tasks, taskManager, runMeta);
        const results = [];

        // 1. 生成 JUnit XML
        if (this.enableJunit) {
            const xmlFile = await this._writeJunitXml(tasks, taskManager, summary);
            results.push({ type: 'junit', file: xmlFile });
            logger.info(`  ✅ JUnit XML → ${xmlFile}`);
        }

        // 2. 生成 CSV
        if (this.enableCsv) {
            const csvFile = await this._writeCsv(tasks, taskManager);
            results.push({ type: 'csv', file: csvFile });
            logger.info(`  ✅ CSV        → ${csvFile}`);
        }

        // 3. 上报后端
        if (this.enableBackend) {
            try {
                await this._uploadToBackend(summary, tasks, taskManager);
                results.push({ type: 'backend', success: true });
                logger.info(`  ✅ Backend upload OK`);
            } catch (e) {
                results.push({ type: 'backend', success: false, error: e.message });
                logger.warn(`  ⚠️  Backend upload failed: ${e.message}`);
            }
        }

        logger.info(`📤 Result Reporter finished. Generated ${results.length} outputs.\n`);
        return { summary, results };
    }

    /**
     * 单独上报一个任务（流式上报，任务完成后立即调用）
     * @param {Task} task
     * @returns {Promise<boolean>}
     */
    async reportTask(task) {
        if (!this.enableBackend || !this.apiClient) return false;
        try {
            const endpoint = TASK_ENDPOINT_TPL.replace(':taskId', task.taskId);
            const payload  = this._buildTaskPayload(task);
            await this.apiClient.post(endpoint, payload);
            logger.debug(`[ResultReporter] Task ${task.taskId} reported to backend`);
            return true;
        } catch (e) {
            logger.debug(`[ResultReporter] Failed to report task ${task.taskId}: ${e.message}`);
            return false;
        }
    }

    // ── 内部：汇总数据构建 ────────────────────────────────────────────────────

    _buildSummary(tasks, taskManager, runMeta) {
        const stats = taskManager.getStats();
        const total = tasks.length;

        const caseStats = tasks.reduce((acc, t) => {
            const taskData = taskManager.getTask(t.taskId);
            for (const tc of taskData?.testCases || []) {
                acc.total++;
                acc[tc.status?.toLowerCase() || 'pending'] = (acc[tc.status?.toLowerCase() || 'pending'] || 0) + 1;
            }
            return acc;
        }, { total: 0 });

        return {
            runId:       `run_${Date.now()}`,
            triggeredBy: runMeta.triggeredBy || 'pipeline',
            startTime:   runMeta.startTime   || new Date(Date.now() - (runMeta.duration || 0)).toISOString(),
            endTime:     new Date().toISOString(),
            duration:    runMeta.duration    || 0,
            environment: {
                nodeVersion: process.version,
                platform:    process.platform,
                ci:          !!process.env.CI,
                ciJob:       process.env.CI_JOB_ID || process.env.GITHUB_RUN_ID || null,
            },
            taskStats: stats,
            caseStats,
            passRate: total > 0 ? Math.round(((stats.passed || 0) / total) * 100) : 0,
        };
    }

    _buildTaskPayload(task) {
        return {
            taskId:    task.taskId,
            gameId:    task.gameId,
            gameName:  task.gameName,
            taskType:  task.meta?.taskType || 'ui',
            status:    task.status,
            priority:  task.priority,
            duration:  task.duration,
            progress:  task.progress,
            createdAt: task.createdAt,
            startedAt: task.startedAt,
            finishedAt:task.finishedAt,
            caseStats: {
                total:   (task.testCases || []).length,
                passed:  (task.testCases || []).filter(tc => tc.status === 'PASSED').length,
                failed:  (task.testCases || []).filter(tc => tc.status === 'FAILED' || tc.status === 'ERROR').length,
                skipped: (task.testCases || []).filter(tc => tc.status === 'SKIPPED').length,
            },
            cases: (task.testCases || []).map(tc => ({
                caseId:   tc.caseId,
                name:     tc.name,
                type:     tc.type,
                priority: tc.priority,
                status:   tc.status,
                duration: tc.result?.duration || 0,
                error:    tc.result?.error    || null,
                details:  tc.result?.details  || '',
            })),
            error: task.summary?.error || null,
        };
    }

    // ── 内部：后端上报 ────────────────────────────────────────────────────────

    async _uploadToBackend(summary, tasks, taskManager) {
        const payload = {
            summary,
            tasks: tasks.map(t => this._buildTaskPayload(taskManager.getTask(t.taskId) || t)),
        };

        // 尝试上报汇总报告
        await this.apiClient.post(REPORT_ENDPOINT, payload);
    }

    // ── 内部：JUnit XML 生成 ──────────────────────────────────────────────────

    async _writeJunitXml(tasks, taskManager, summary) {
        const lines = [];
        const timestamp = new Date().toISOString().slice(0, 19);

        // 总 testsuites
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push(`<testsuites name="Kids Game Auto Test" time="${(summary.duration / 1000).toFixed(3)}" timestamp="${timestamp}" tests="${summary.caseStats.total || 0}" failures="${summary.caseStats.failed || 0}" errors="${summary.caseStats.error || 0}" skipped="${summary.caseStats.skipped || 0}">`);

        for (const taskRef of tasks) {
            const task = taskManager.getTask(taskRef.taskId) || taskRef;
            const cases    = task.testCases || [];
            const passed   = cases.filter(c => c.status === 'PASSED').length;
            const failed   = cases.filter(c => c.status === 'FAILED').length;
            const errors   = cases.filter(c => c.status === 'ERROR').length;
            const skipped  = cases.filter(c => c.status === 'SKIPPED').length;
            const durationS = ((task.duration || 0) / 1000).toFixed(3);

            lines.push(`  <testsuite name="${escXml(task.gameName || task.gameId)}" tests="${cases.length}" failures="${failed}" errors="${errors}" skipped="${skipped}" time="${durationS}" timestamp="${timestamp}">`);
            // 属性
            lines.push(`    <properties>`);
            lines.push(`      <property name="gameId"   value="${escXml(task.gameId || '')}"/>`);
            lines.push(`      <property name="taskType" value="${escXml(task.meta?.taskType || 'ui')}"/>`);
            lines.push(`      <property name="priority" value="${escXml(task.priority || '')}"/>`);
            lines.push(`    </properties>`);

            for (const tc of cases) {
                const caseDur = ((tc.result?.duration || 0) / 1000).toFixed(3);
                const classname = `${task.gameName || task.gameId}.${tc.type || 'functional'}`;
                lines.push(`    <testcase name="${escXml(tc.name)}" classname="${escXml(classname)}" time="${caseDur}">`);

                if (tc.status === 'FAILED') {
                    const msg = escXml(tc.result?.error || 'Assertion failed');
                    const det = escXml(tc.result?.details || '');
                    lines.push(`      <failure message="${msg}" type="AssertionError">${det}</failure>`);
                } else if (tc.status === 'ERROR') {
                    const msg = escXml(tc.result?.error || 'Unexpected error');
                    lines.push(`      <error message="${msg}" type="Error"/>`);
                } else if (tc.status === 'SKIPPED') {
                    lines.push(`      <skipped message="${escXml(tc.result?.error || 'Skipped')}"/>`);
                }

                lines.push(`    </testcase>`);
            }

            lines.push(`  </testsuite>`);
        }

        lines.push('</testsuites>');

        const xmlContent = lines.join('\n');
        const filename   = `junit-${Date.now()}.xml`;
        const filepath   = path.join(this.outputDir, filename);
        fs.writeFileSync(filepath, xmlContent, 'utf8');
        return filepath;
    }

    // ── 内部：CSV 生成 ────────────────────────────────────────────────────────

    async _writeCsv(tasks, taskManager) {
        const rows = [
            ['TaskId', 'GameName', 'GameId', 'TaskType', 'Priority', 'CaseId', 'CaseName', 'CaseType', 'CasePriority', 'Status', 'Duration(ms)', 'Error', 'Details'],
        ];

        for (const taskRef of tasks) {
            const task = taskManager.getTask(taskRef.taskId) || taskRef;
            for (const tc of task.testCases || []) {
                rows.push([
                    task.taskId,
                    task.gameName || '',
                    task.gameId   || '',
                    task.meta?.taskType || 'ui',
                    task.priority || '',
                    tc.caseId,
                    tc.name,
                    tc.type       || '',
                    tc.priority   || '',
                    tc.status     || 'PENDING',
                    tc.result?.duration || 0,
                    (tc.result?.error   || '').replace(/,/g, '；'),
                    (tc.result?.details || '').replace(/,/g, '；').slice(0, 200),
                ]);
            }
        }

        const csv      = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const filename = `test-results-${Date.now()}.csv`;
        const filepath = path.join(this.outputDir, filename);
        fs.writeFileSync(filepath, '\uFEFF' + csv, 'utf8'); // BOM for Excel
        return filepath;
    }
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * XML 特殊字符转义
 */
function escXml(str) {
    return String(str || '')
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&apos;');
}

module.exports = { ResultReporter };
