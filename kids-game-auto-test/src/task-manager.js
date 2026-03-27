/**
 * 测试任务管理器
 *
 * 功能：
 * 1. 接收测试套件（GeneratedTestSuite[]），创建持久化的测试任务
 * 2. 管理任务状态机：PENDING → RUNNING → PASSED/FAILED/ERROR/SKIPPED
 * 3. 支持任务队列、任务查询、任务取消
 * 4. 任务数据持久化到 tasks/*.json（无需数据库）
 * 5. 提供事件回调（onTaskUpdate）供监控器订阅
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { logger } = require('./utils/logger');
const { ensureDir } = require('./utils/helpers');

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 任务状态枚举 */
const TaskStatus = {
    PENDING:   'PENDING',
    QUEUED:    'QUEUED',
    RUNNING:   'RUNNING',
    PASSED:    'PASSED',
    FAILED:    'FAILED',
    ERROR:     'ERROR',
    SKIPPED:   'SKIPPED',
    CANCELLED: 'CANCELLED',
};

/** 默认任务存储目录 */
const DEFAULT_TASKS_DIR = path.resolve(__dirname, '../tasks');

// ── 主类 ──────────────────────────────────────────────────────────────────────

class TaskManager extends EventEmitter {
    /**
     * @param {object} options
     * @param {string} [options.tasksDir]     任务存储目录
     * @param {number} [options.maxQueueSize] 最大队列数量
     */
    constructor(options = {}) {
        super();
        this.tasksDir     = options.tasksDir     || DEFAULT_TASKS_DIR;
        this.maxQueueSize = options.maxQueueSize  || 100;

        /** 内存队列：taskId → Task */
        this._tasks = new Map();

        ensureDir(this.tasksDir);
        this._loadExistingTasks();
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 批量创建测试任务（来自生成器输出的 suites）
     * @param {GeneratedTestSuite[]} suites
     * @param {object} [meta]  附加元数据（如触发人、运行参数等）
     * @returns {Task[]}       创建成功的任务列表
     */
    createTasks(suites, meta = {}) {
        const created = [];

        for (const suite of suites) {
            const task = this._buildTask(suite, meta);
            this._tasks.set(task.taskId, task);
            this._persist(task);
            created.push(task);
            this.emit('task:created', task);
            logger.info(`  📋 Task created: [${task.taskId}] ${task.gameName} (${task.testCases.length} cases)`);
        }

        logger.info(`✅ TaskManager: ${created.length} tasks created\n`);
        return created;
    }

    /**
     * 将任务加入运行队列（状态 PENDING → QUEUED）
     * @param {string[]} taskIds  若为空则将所有 PENDING 任务入队
     * @returns {Task[]}
     */
    enqueue(taskIds = []) {
        const targets = taskIds.length
            ? taskIds.map(id => this._tasks.get(id)).filter(Boolean)
            : [...this._tasks.values()].filter(t => t.status === TaskStatus.PENDING);

        for (const task of targets) {
            if (task.status !== TaskStatus.PENDING) continue;
            task.status      = TaskStatus.QUEUED;
            task.queuedAt    = new Date().toISOString();
            this._persist(task);
            this.emit('task:queued', task);
        }

        logger.info(`📥 ${targets.length} task(s) enqueued`);
        return targets;
    }

    /**
     * 将任务标记为 RUNNING
     * @param {string} taskId
     * @returns {Task|null}
     */
    markRunning(taskId) {
        const task = this._tasks.get(taskId);
        if (!task) return null;
        task.status    = TaskStatus.RUNNING;
        task.startedAt = new Date().toISOString();
        this._persist(task);
        this.emit('task:running', task);
        return task;
    }

    /**
     * 更新单个测试用例的结果
     * @param {string} taskId
     * @param {string} caseId
     * @param {object} result  { status, duration, error, details }
     */
    updateCaseResult(taskId, caseId, result) {
        const task = this._tasks.get(taskId);
        if (!task) return;

        const tc = task.testCases.find(c => c.caseId === caseId);
        if (tc) {
            tc.result    = result;
            tc.status    = result.status;
            tc.finishedAt = new Date().toISOString();
        }

        task.progress = this._calcProgress(task);
        this._persist(task);
        this.emit('task:case_updated', { task, caseId, result });
    }

    /**
     * 完成任务
     * @param {string} taskId
     * @param {object} summary  { status, duration, issues, metrics }
     */
    finishTask(taskId, summary = {}) {
        const task = this._tasks.get(taskId);
        if (!task) return;

        task.status     = summary.status || this._deriveStatus(task);
        task.finishedAt = new Date().toISOString();
        task.duration   = summary.duration || this._calcDuration(task);
        task.summary    = summary;
        task.progress   = 100;

        this._persist(task);
        this.emit('task:finished', task);
        logger.info(`  🏁 Task finished: [${task.taskId}] ${task.gameName} → ${task.status}`);
    }

    /**
     * 取消任务
     * @param {string} taskId
     */
    cancelTask(taskId) {
        const task = this._tasks.get(taskId);
        if (!task) return false;
        if ([TaskStatus.PASSED, TaskStatus.FAILED, TaskStatus.ERROR].includes(task.status)) return false;

        task.status      = TaskStatus.CANCELLED;
        task.cancelledAt = new Date().toISOString();
        this._persist(task);
        this.emit('task:cancelled', task);
        return true;
    }

    /**
     * 查询任务
     * @param {object} filter  { status, gameId }
     * @returns {Task[]}
     */
    queryTasks(filter = {}) {
        let tasks = [...this._tasks.values()];
        if (filter.status) tasks = tasks.filter(t => t.status === filter.status);
        if (filter.gameId) tasks = tasks.filter(t => t.gameId === filter.gameId);
        return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * 获取单个任务
     * @param {string} taskId
     * @returns {Task|null}
     */
    getTask(taskId) {
        return this._tasks.get(taskId) || null;
    }

    /**
     * 返回整体任务统计
     */
    getStats() {
        const all = [...this._tasks.values()];
        const stats = {
            total:     all.length,
            pending:   0,
            queued:    0,
            running:   0,
            passed:    0,
            failed:    0,
            error:     0,
            skipped:   0,
            cancelled: 0,
        };
        for (const t of all) {
            stats[t.status.toLowerCase()] = (stats[t.status.toLowerCase()] || 0) + 1;
        }
        return stats;
    }

    /**
     * 获取所有队列中（QUEUED）的任务，按创建时间升序
     */
    getQueuedTasks() {
        return [...this._tasks.values()]
            .filter(t => t.status === TaskStatus.QUEUED)
            .sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt));
    }

    /**
     * 清空已完成任务（PASSED/FAILED/ERROR/CANCELLED）
     * @returns {number} 清除的任务数
     */
    clearFinished() {
        const DONE = [TaskStatus.PASSED, TaskStatus.FAILED, TaskStatus.ERROR, TaskStatus.CANCELLED];
        let count = 0;
        for (const [id, task] of this._tasks) {
            if (DONE.includes(task.status)) {
                this._tasks.delete(id);
                const file = path.join(this.tasksDir, `${id}.json`);
                if (fs.existsSync(file)) fs.unlinkSync(file);
                count++;
            }
        }
        return count;
    }

    // ── 内部工具 ─────────────────────────────────────────────────────────────

    _buildTask(suite, meta) {
        const taskId = `task_${suite.gameId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // 深拷贝 testCases，并为每个用例设置初始状态
        const testCases = (suite.testCases || []).map(tc => ({
            ...tc,
            status:     'PENDING',
            result:     null,
            finishedAt: null,
        }));

        return {
            taskId,
            gameId:    suite.gameId,
            gameName:  suite.gameName,
            gameType:  suite.gameType,
            url:       suite.url,
            suiteId:   suite.suiteId,
            status:    TaskStatus.PENDING,
            priority:  this._calcTaskPriority(testCases),
            createdAt: new Date().toISOString(),
            queuedAt:  null,
            startedAt: null,
            finishedAt:null,
            duration:  0,
            progress:  0,
            testCases,
            summary:   null,
            meta: {
                ...meta,
                sourceProfile: suite.sourceProfile,
                generatedAt:   suite.generatedAt,
            },
        };
    }

    _calcTaskPriority(testCases) {
        if (testCases.some(tc => tc.priority === 'P0')) return 'HIGH';
        if (testCases.some(tc => tc.priority === 'P1')) return 'MEDIUM';
        return 'LOW';
    }

    _calcProgress(task) {
        const total = task.testCases.length;
        if (!total) return 100;
        const done = task.testCases.filter(tc => tc.status !== 'PENDING').length;
        return Math.round((done / total) * 100);
    }

    _deriveStatus(task) {
        const cases = task.testCases;
        const failed = cases.filter(c => !c.soft && (c.status === 'FAILED' || c.status === 'ERROR')).length;
        const warned = cases.filter(c => c.status === 'WARNED' || (c.soft && c.status === 'FAILED')).length;
        if (failed > 0) return TaskStatus.FAILED;
        if (warned > 0) return 'WARNED';
        return TaskStatus.PASSED;
    }

    _calcDuration(task) {
        if (!task.startedAt) return 0;
        return Date.now() - new Date(task.startedAt).getTime();
    }

    _persist(task) {
        try {
            const file = path.join(this.tasksDir, `${task.taskId}.json`);
            fs.writeFileSync(file, JSON.stringify(task, null, 2), 'utf8');
        } catch (e) {
            logger.warn(`TaskManager: persist failed for ${task.taskId}: ${e.message}`);
        }
    }

    _loadExistingTasks() {
        try {
            const files = fs.readdirSync(this.tasksDir).filter(f => f.endsWith('.json'));
            for (const f of files) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(this.tasksDir, f), 'utf8'));
                    if (data.taskId) {
                        // 将 RUNNING 状态重置（可能是上次意外中断）
                        if (data.status === TaskStatus.RUNNING) {
                            data.status = TaskStatus.ERROR;
                            data.summary = { error: 'Recovered: task was interrupted' };
                        }
                        this._tasks.set(data.taskId, data);
                    }
                } catch (_) { /* ignore corrupted file */ }
            }
            if (this._tasks.size > 0) {
                logger.info(`TaskManager: loaded ${this._tasks.size} existing task(s) from disk`);
            }
        } catch (_) { /* tasks dir might be empty */ }
    }
}

module.exports = { TaskManager, TaskStatus };
