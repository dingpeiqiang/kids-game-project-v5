/**
 * 测试任务 Web 监控面板
 *
 * 功能：
 * 1. 启动轻量级 HTTP 服务器（无需 express 依赖，原生 http 模块）
 * 2. 提供 RESTful API：GET /api/tasks、GET /api/stats、GET /api/tasks/:id
 * 3. SSE (Server-Sent Events) 实时推送任务状态变更
 * 4. 内置 HTML/JS 监控面板（单页应用，自动轮询/SSE 更新）
 * 5. 支持触发重新执行（POST /api/tasks/:id/retry）
 *
 * 访问地址：http://localhost:9090（默认端口）
 */

'use strict';

const http    = require('http');
const path    = require('path');
const url     = require('url');
const { EventEmitter } = require('events');
const { logger } = require('./utils/logger');

// ── 常量 ──────────────────────────────────────────────────────────────────────

const DEFAULT_PORT = 9090;
const MIME = {
    html: 'text/html; charset=utf-8',
    json: 'application/json; charset=utf-8',
    js:   'text/javascript; charset=utf-8',
    css:  'text/css; charset=utf-8',
    txt:  'text/plain; charset=utf-8',
    sse:  'text/event-stream; charset=utf-8',
};

// ── 主类 ──────────────────────────────────────────────────────────────────────

class DashboardServer extends EventEmitter {
    /**
     * @param {TaskManager} taskManager
     * @param {object}      [options]
     * @param {number}      [options.port]          监听端口（默认 9090）
     * @param {string}      [options.host]          监听地址（默认 0.0.0.0）
     * @param {boolean}     [options.autoOpen]      启动后自动打开浏览器（默认 false）
     * @param {boolean}     [options.cors]          允许跨域（默认 true）
     */
    constructor(taskManager, options = {}) {
        super();
        this.taskManager = taskManager;
        this.port        = options.port    || parseInt(process.env.DASHBOARD_PORT, 10) || DEFAULT_PORT;
        this.host        = options.host    || '0.0.0.0';
        this.autoOpen    = options.autoOpen || false;
        this.cors        = options.cors    !== false;

        this._server     = null;
        this._sseClients = new Set();   // 存储所有 SSE 连接的 response 对象

        // 订阅 TaskManager 事件，实时推送给所有 SSE 客户端
        this._bindTaskEvents();
    }

    // ── 公开 API ─────────────────────────────────────────────────────────────

    /**
     * 启动 HTTP 服务器
     * @returns {Promise<string>} 监控面板 URL
     */
    async start() {
        return new Promise((resolve, reject) => {
            this._server = http.createServer((req, res) => {
                this._handleRequest(req, res);
            });

            this._server.on('error', (e) => {
                if (e.code === 'EADDRINUSE') {
                    logger.warn(`Dashboard port ${this.port} in use, trying ${this.port + 1}`);
                    this.port += 1;
                    this._server.listen(this.port, this.host);
                } else {
                    reject(e);
                }
            });

            this._server.listen(this.port, this.host, () => {
                const dashUrl = `http://localhost:${this.port}`;
                logger.info(`\n🖥️  Dashboard running at ${dashUrl}`);
                if (this.autoOpen) this._openBrowser(dashUrl);
                resolve(dashUrl);
            });
        });
    }

    /**
     * 关闭服务器
     */
    async stop() {
        // 关闭所有 SSE 客户端
        for (const res of this._sseClients) {
            try { res.end(); } catch (_) {}
        }
        this._sseClients.clear();

        return new Promise((resolve) => {
            if (this._server) {
                this._server.close(() => resolve());
            } else {
                resolve();
            }
        });
    }

    /**
     * 广播 SSE 事件给所有连接的客户端
     * @param {string} event  事件名称
     * @param {object} data   数据载荷
     */
    broadcast(event, data) {
        if (this._sseClients.size === 0) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const res of this._sseClients) {
            try {
                res.write(payload);
            } catch (_) {
                this._sseClients.delete(res);
            }
        }
    }

    // ── 内部：请求路由 ────────────────────────────────────────────────────────

    _handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname  = parsedUrl.pathname || '/';
        const method    = req.method.toUpperCase();

        // CORS 支持
        if (this.cors) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
        if (method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // SSE 端点
        if (pathname === '/events' && method === 'GET') {
            return this._handleSSE(req, res);
        }

        // API 路由
        if (pathname === '/api/stats' && method === 'GET') {
            return this._sendJSON(res, this._buildStats());
        }
        if (pathname === '/api/tasks' && method === 'GET') {
            return this._sendJSON(res, this._buildTaskList(parsedUrl.query));
        }
        const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
        if (taskMatch && method === 'GET') {
            return this._getTask(req, res, taskMatch[1]);
        }
        const logMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/log$/);
        if (logMatch && method === 'GET') {
            return this._getTaskLog(req, res, logMatch[1]);
        }
        const retryMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/retry$/);
        if (retryMatch && method === 'POST') {
            return this._retryTask(req, res, retryMatch[1]);
        }

        // 根路径 → 返回 HTML 面板
        if (pathname === '/' || pathname === '/index.html') {
            res.writeHead(200, { 'Content-Type': MIME.html });
            res.end(this._buildHtml());
            return;
        }

        // 404
        this._sendJSON(res, { error: 'Not Found' }, 404);
    }

    _handleSSE(req, res) {
        res.writeHead(200, {
            'Content-Type':  MIME.sse,
            'Cache-Control': 'no-cache',
            'Connection':    'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        // 初始推送当前全量数据
        res.write(`event: init\ndata: ${JSON.stringify({
            stats: this._buildStats(),
            tasks: this._buildTaskList(),
        })}\n\n`);

        this._sseClients.add(res);
        logger.debug(`[Dashboard] SSE client connected (${this._sseClients.size} total)`);

        // 客户端断开时清理
        req.on('close', () => {
            this._sseClients.delete(res);
            logger.debug(`[Dashboard] SSE client disconnected (${this._sseClients.size} remaining)`);
        });

        // 心跳，防止超时断连
        const heartbeat = setInterval(() => {
            try {
                res.write(': ping\n\n');
            } catch (_) {
                clearInterval(heartbeat);
                this._sseClients.delete(res);
            }
        }, 15_000);

        req.on('close', () => clearInterval(heartbeat));
    }

    _getTask(req, res, taskId) {
        const task = this.taskManager.getTask(taskId);
        if (!task) {
            return this._sendJSON(res, { error: 'Task not found' }, 404);
        }
        this._sendJSON(res, task);
    }

    _getTaskLog(req, res, taskId) {
        const fs = require('fs');
        const logFile = path.resolve(__dirname, `../tasks/${taskId}-run.log`);
        const apiLog  = path.resolve(__dirname, `../tasks/${taskId}-api-run.log`);
        const file    = fs.existsSync(logFile) ? logFile : (fs.existsSync(apiLog) ? apiLog : null);

        if (!file) {
            res.writeHead(200, { 'Content-Type': MIME.txt });
            return res.end('(no log file yet)');
        }

        try {
            const content = fs.readFileSync(file, 'utf8');
            res.writeHead(200, { 'Content-Type': MIME.txt });
            res.end(content);
        } catch (e) {
            res.writeHead(500, { 'Content-Type': MIME.txt });
            res.end(`Error reading log: ${e.message}`);
        }
    }

    _retryTask(req, res, taskId) {
        const task = this.taskManager.getTask(taskId);
        if (!task) {
            return this._sendJSON(res, { error: 'Task not found' }, 404);
        }

        // 将任务重置为 QUEUED（若非 RUNNING）
        const TERMINAL = ['PASSED', 'FAILED', 'ERROR', 'SKIPPED', 'CANCELLED'];
        if (!TERMINAL.includes(task.status)) {
            return this._sendJSON(res, { error: `Task is ${task.status}, cannot retry` }, 400);
        }

        task.status     = 'QUEUED';
        task.queuedAt   = new Date().toISOString();
        task.startedAt  = null;
        task.finishedAt = null;
        task.progress   = 0;
        task.summary    = null;
        for (const tc of task.testCases || []) {
            tc.status = 'PENDING';
            tc.result = null;
        }

        this.taskManager._persist(task);
        this.taskManager.emit('task:queued', task);
        this.broadcast('task:queued', { taskId, status: 'QUEUED' });

        this._sendJSON(res, { ok: true, taskId, status: 'QUEUED' });
    }

    // ── 内部：数据构建 ────────────────────────────────────────────────────────

    _buildStats() {
        const stats = this.taskManager.getStats();
        const tasks = this.taskManager.queryTasks();
        const passRate = stats.total > 0
            ? Math.round(((stats.passed || 0) / stats.total) * 100)
            : 0;

        // 计算最近 5 分钟完成的任务数
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const recentDone = tasks.filter(t => t.finishedAt && new Date(t.finishedAt).getTime() > fiveMinAgo).length;

        return {
            ...stats,
            warned:     stats.warned || 0,
            passRate,
            recentDone,
            timestamp:  new Date().toISOString(),
        };
    }

    _buildTaskList(query = {}) {
        let tasks = this.taskManager.queryTasks(query.status ? { status: query.status } : {});

        // 只返回最近 200 个（按 createdAt 降序）
        if (tasks.length > 200) tasks = tasks.slice(0, 200);

        return tasks.map(t => ({
            taskId:     t.taskId,
            gameId:     t.gameId,
            gameName:   t.gameName,
            status:     t.status,
            priority:   t.priority,
            progress:   t.progress,
            duration:   t.duration,
            createdAt:  t.createdAt,
            startedAt:  t.startedAt,
            finishedAt: t.finishedAt,
            caseTotal:  (t.testCases || []).length,
            casePassed: (t.testCases || []).filter(c => c.status === 'PASSED').length,
            caseFailed: (t.testCases || []).filter(c => c.status === 'FAILED' || c.status === 'ERROR').length,
            meta:       { taskType: t.meta?.taskType, triggeredBy: t.meta?.triggeredBy },
            error:      t.summary?.error || null,
        }));
    }

    // ── 内部：事件绑定 ────────────────────────────────────────────────────────

    _bindTaskEvents() {
        const forward = (eventName) => {
            this.taskManager.on(eventName, (task) => {
                this.broadcast(eventName, {
                    taskId:    task.taskId,
                    gameName:  task.gameName,
                    status:    task.status,
                    progress:  task.progress,
                    duration:  task.duration,
                    timestamp: new Date().toISOString(),
                });
            });
        };

        forward('task:created');
        forward('task:queued');
        forward('task:running');
        forward('task:finished');
        forward('task:cancelled');

        this.taskManager.on('task:case_updated', ({ task, caseId, result }) => {
            this.broadcast('task:case_updated', {
                taskId:   task.taskId,
                caseId,
                status:   result.status,
                progress: task.progress,
            });
        });
    }

    // ── 内部：响应工具 ────────────────────────────────────────────────────────

    _sendJSON(res, data, statusCode = 200) {
        res.writeHead(statusCode, { 'Content-Type': MIME.json });
        res.end(JSON.stringify(data));
    }

    _openBrowser(url) {
        const { exec } = require('child_process');
        const cmd = process.platform === 'win32'
            ? `start "" "${url}"`
            : process.platform === 'darwin'
                ? `open "${url}"`
                : `xdg-open "${url}"`;
        exec(cmd, (err) => { if (err) logger.debug(`Failed to open browser: ${err.message}`); });
    }

    // ── 内部：HTML 面板 ───────────────────────────────────────────────────────

    _buildHtml() {
        return /* html */`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kids Game 测试监控面板</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117; --bg2: #1a1d27; --bg3: #23263a;
    --border: #2e3147; --text: #e2e8f0; --muted: #8892a4;
    --green: #22c55e; --red: #ef4444; --yellow: #f59e0b;
    --blue: #3b82f6; --purple: #a855f7; --cyan: #06b6d4;
    --accent: #6366f1;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; min-height: 100vh; }
  header { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  header h1 { font-size: 18px; font-weight: 700; letter-spacing: .5px; }
  header h1 span { color: var(--accent); }
  #conn-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--red); display: inline-block; margin-right: 6px; transition: background .3s; }
  #conn-dot.connected { background: var(--green); }
  #conn-label { font-size: 12px; color: var(--muted); }
  .stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; padding: 16px 24px; background: var(--bg2); border-bottom: 1px solid var(--border); }
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; text-align: center; }
  .stat-card .val { font-size: 28px; font-weight: 800; }
  .stat-card .label { font-size: 11px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
  .stat-card.pass .val { color: var(--green); }
  .stat-card.fail .val { color: var(--red); }
  .stat-card.run  .val { color: var(--blue); }
  .stat-card.skip .val { color: var(--muted); }
  .stat-card.rate .val { color: var(--accent); }
  .toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .filter-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--muted); border-radius: 6px; padding: 5px 14px; cursor: pointer; transition: all .2s; font-size: 13px; }
  .filter-btn.active, .filter-btn:hover { border-color: var(--accent); color: var(--text); }
  #search { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 5px 12px; font-size: 13px; width: 200px; outline: none; }
  #search:focus { border-color: var(--accent); }
  #refresh-btn { margin-left: auto; background: var(--accent); border: none; color: white; border-radius: 6px; padding: 5px 14px; cursor: pointer; font-size: 13px; }
  .main { padding: 16px 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 12px; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); position: sticky; top: 57px; background: var(--bg); z-index: 10; }
  td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:hover td { background: var(--bg2); }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  .badge-PASSED   { background: rgba(34,197,94,.15); color: var(--green); }
  .badge-FAILED   { background: rgba(239,68,68,.15); color: var(--red); }
  .badge-RUNNING  { background: rgba(59,130,246,.15); color: var(--blue); }
  .badge-QUEUED   { background: rgba(168,85,247,.15); color: var(--purple); }
  .badge-PENDING  { background: rgba(100,116,139,.15); color: var(--muted); }
  .badge-SKIPPED  { background: rgba(100,116,139,.1); color: var(--muted); }
  .badge-ERROR    { background: rgba(239,68,68,.2); color: #ff6b6b; }
  .badge-WARNED   { background: rgba(245,158,11,.15); color: var(--yellow); }
  .badge-CANCELLED{ background: rgba(100,116,139,.1); color: var(--muted); }
  .badge-HIGH     { background: rgba(239,68,68,.1); color: #ff8a80; font-size: 10px; }
  .badge-MEDIUM   { background: rgba(245,158,11,.1); color: var(--yellow); font-size: 10px; }
  .badge-LOW      { background: rgba(34,197,94,.1); color: var(--green); font-size: 10px; }
  .progress-bar { width: 80px; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 6px; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width .4s; }
  .progress-fill.done { background: var(--green); }
  .progress-fill.fail { background: var(--red); }
  .case-ratio { font-size: 12px; color: var(--muted); }
  .action-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all .2s; }
  .action-btn:hover { border-color: var(--accent); color: var(--text); }
  .action-btn.retry { border-color: var(--yellow); color: var(--yellow); }
  .anim-spin { display: inline-block; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  #toast { position: fixed; bottom: 24px; right: 24px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 10px 18px; font-size: 13px; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 999; }
  #toast.show { opacity: 1; }
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 200; align-items: center; justify-content: center; }
  .modal-overlay.open { display: flex; }
  .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 700px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; }
  .modal h2 { font-size: 16px; margin-bottom: 12px; }
  .modal pre { flex: 1; overflow: auto; background: var(--bg); border-radius: 8px; padding: 12px; font-size: 12px; color: var(--muted); line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
  .modal-close { margin-top: 12px; align-self: flex-end; }
  .empty { text-align: center; padding: 60px; color: var(--muted); }
</style>
</head>
<body>

<header>
  <h1>🎮 <span>Kids Game</span> 测试监控面板</h1>
  <div>
    <span id="conn-dot"></span>
    <span id="conn-label">连接中...</span>
  </div>
</header>

<div class="stats-bar" id="stats-bar">
  <div class="stat-card">      <div class="val" id="s-total">-</div>    <div class="label">总任务</div>    </div>
  <div class="stat-card run">  <div class="val" id="s-running">-</div>  <div class="label">运行中</div>   </div>
  <div class="stat-card pass"> <div class="val" id="s-passed">-</div>   <div class="label">通过</div>     </div>
  <div class="stat-card fail"> <div class="val" id="s-failed">-</div>   <div class="label">失败</div>     </div>
  <div class="stat-card skip"> <div class="val" id="s-skipped">-</div>  <div class="label">跳过</div>     </div>
  <div class="stat-card rate"> <div class="val" id="s-rate">-</div>     <div class="label">通过率</div>   </div>
</div>

<div class="toolbar">
  <button class="filter-btn active" data-filter="">全部</button>
  <button class="filter-btn" data-filter="RUNNING">运行中</button>
  <button class="filter-btn" data-filter="QUEUED">队列中</button>
  <button class="filter-btn" data-filter="PASSED">通过</button>
  <button class="filter-btn" data-filter="FAILED">失败</button>
  <button class="filter-btn" data-filter="SKIPPED">跳过</button>
  <input type="text" id="search" placeholder="搜索游戏名...">
  <button id="refresh-btn">⟳ 刷新</button>
</div>

<div class="main">
  <table>
    <thead>
      <tr>
        <th>任务 ID</th>
        <th>游戏</th>
        <th>类型</th>
        <th>优先级</th>
        <th>状态</th>
        <th>进度</th>
        <th>用例</th>
        <th>耗时</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody id="task-tbody">
      <tr><td colspan="9" class="empty">加载中...</td></tr>
    </tbody>
  </table>
</div>

<div id="toast"></div>

<!-- Log Modal -->
<div class="modal-overlay" id="log-modal">
  <div class="modal">
    <h2 id="modal-title">任务日志</h2>
    <pre id="modal-log">加载中...</pre>
    <button class="action-btn modal-close" onclick="closeModal()">关闭</button>
  </div>
</div>

<script>
  // ── 状态 ────────────────────────────────────────────────────────────────────
  let tasks     = [];
  let filter    = '';
  let searchVal = '';
  let evtSource = null;

  // ── SSE ──────────────────────────────────────────────────────────────────────
  function connectSSE() {
    evtSource = new EventSource('/events');
    evtSource.addEventListener('init',  e => {
      const d = JSON.parse(e.data);
      updateStats(d.stats);
      tasks = d.tasks;
      renderTable();
      setConnected(true);
    });
    evtSource.addEventListener('task:created',       handleTaskUpdate);
    evtSource.addEventListener('task:queued',        handleTaskUpdate);
    evtSource.addEventListener('task:running',       handleTaskUpdate);
    evtSource.addEventListener('task:finished',      handleTaskUpdate);
    evtSource.addEventListener('task:cancelled',     handleTaskUpdate);
    evtSource.addEventListener('task:case_updated',  handleCaseUpdate);
    evtSource.onerror = () => { setConnected(false); setTimeout(connectSSE, 3000); };
  }

  function handleTaskUpdate(e) {
    const upd = JSON.parse(e.data);
    // 局部更新任务列表中的对应项
    const idx = tasks.findIndex(t => t.taskId === upd.taskId);
    if (idx >= 0) {
      Object.assign(tasks[idx], upd);
    } else {
      // 新任务：全量刷新
      fetchTasks();
      return;
    }
    renderTable();
    // 同步更新统计（简单全量拉取）
    fetchStats();
  }

  function handleCaseUpdate(e) {
    const upd = JSON.parse(e.data);
    const task = tasks.find(t => t.taskId === upd.taskId);
    if (task) {
      task.progress = upd.progress;
      // 简单更新进度条
      const row = document.querySelector('tr[data-id="' + upd.taskId + '"]');
      if (row) {
        const fill = row.querySelector('.progress-fill');
        const pct  = row.querySelector('.progress-pct');
        if (fill) { fill.style.width = upd.progress + '%'; fill.className = 'progress-fill' + (upd.progress === 100 ? ' done' : ''); }
        if (pct)  { pct.textContent  = upd.progress + '%'; }
      }
    }
  }

  // ── HTTP 请求 ─────────────────────────────────────────────────────────────────
  async function fetchStats() {
    try {
      const r = await fetch('/api/stats');
      updateStats(await r.json());
    } catch (_) {}
  }
  async function fetchTasks() {
    try {
      const r = await fetch('/api/tasks' + (filter ? '?status=' + filter : ''));
      tasks = await r.json();
      renderTable();
    } catch (_) {}
  }
  async function fetchLog(taskId, gameName) {
    document.getElementById('modal-title').textContent = '任务日志 — ' + gameName;
    document.getElementById('modal-log').textContent   = '加载中...';
    document.getElementById('log-modal').classList.add('open');
    try {
      const r = await fetch('/api/tasks/' + taskId + '/log');
      document.getElementById('modal-log').textContent = await r.text();
    } catch (e) {
      document.getElementById('modal-log').textContent = '加载失败: ' + e.message;
    }
  }
  function closeModal() {
    document.getElementById('log-modal').classList.remove('open');
  }
  async function retryTask(taskId) {
    try {
      const r = await fetch('/api/tasks/' + taskId + '/retry', { method: 'POST' });
      const d = await r.json();
      if (d.ok) { showToast('✅ 任务已重新加入队列'); fetchTasks(); fetchStats(); }
      else       showToast('❌ ' + (d.error || '重试失败'));
    } catch (e) { showToast('❌ ' + e.message); }
  }

  // ── 渲染 ──────────────────────────────────────────────────────────────────────
  function renderTable() {
    let list = tasks;
    if (filter)    list = list.filter(t => t.status === filter);
    if (searchVal) list = list.filter(t => (t.gameName || '').toLowerCase().includes(searchVal));

    const tbody = document.getElementById('task-tbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(t => {
      const pct       = t.progress || 0;
      const dur       = t.duration ? fmtDur(t.duration) : (t.status === 'RUNNING' ? '<span class="anim-spin">⚙</span>' : '-');
      const fillCls   = 'progress-fill' + (pct >= 100 ? ' done' : '') + (t.caseFailed > 0 ? ' fail' : '');
      const taskType  = (t.meta?.taskType || 'ui').toUpperCase();
      const TERMINAL  = ['PASSED','FAILED','ERROR','SKIPPED','CANCELLED'];
      const retryBtn  = TERMINAL.includes(t.status) ? '<button class="action-btn retry" onclick="retryTask(\\'' + t.taskId + '\\')">↺ 重试</button>' : '';
      return '<tr data-id="' + t.taskId + '">' +
        '<td style="font-family:monospace;font-size:11px;color:var(--muted)">' + t.taskId.slice(-8) + '</td>' +
        '<td>' + (t.gameName || '-') + '</td>' +
        '<td><span class="badge" style="background:rgba(6,182,212,.1);color:var(--cyan);font-size:10px">' + taskType + '</span></td>' +
        '<td><span class="badge badge-' + (t.priority||'LOW') + '">' + (t.priority||'LOW') + '</span></td>' +
        '<td><span class="badge badge-' + t.status + '">' + t.status + '</span></td>' +
        '<td><div class="progress-bar"><div class="' + fillCls + '" style="width:' + pct + '%" ></div></div><span class="progress-pct" style="font-size:11px;color:var(--muted)">' + pct + '%</span></td>' +
        '<td><span class="case-ratio">' + (t.casePassed||0) + '<span style="color:var(--muted)"> / ' + (t.caseTotal||0) + '</span></span></td>' +
        '<td>' + dur + '</td>' +
        '<td><button class="action-btn" onclick="fetchLog(\\'' + t.taskId + '\\',\\'' + escHtml(t.gameName||'') + '\\')">日志</button> ' + retryBtn + '</td>' +
        '</tr>';
    }).join('');
  }

  function updateStats(s) {
    document.getElementById('s-total').textContent   = s.total   || 0;
    document.getElementById('s-running').textContent = s.running || 0;
    document.getElementById('s-passed').textContent  = s.passed  || 0;
    document.getElementById('s-failed').textContent  = (s.failed || 0) + (s.error || 0);
    document.getElementById('s-skipped').textContent = s.skipped || 0;
    document.getElementById('s-rate').textContent    = (s.passRate || 0) + '%';
  }

  function setConnected(ok) {
    const dot   = document.getElementById('conn-dot');
    const label = document.getElementById('conn-label');
    dot.className = ok ? 'connected' : '';
    label.textContent = ok ? 'SSE 实时连接' : '已断连，重连中...';
  }

  // ── 工具 ──────────────────────────────────────────────────────────────────────
  function fmtDur(ms) {
    if (!ms) return '-';
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return m + 'm ' + s + 's';
  }
  function escHtml(s) { return s.replace(/'/g, "\\'"); }
  let _toastTmr;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTmr);
    _toastTmr = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ── 事件绑定 ──────────────────────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      renderTable();
    });
  });
  document.getElementById('search').addEventListener('input', e => {
    searchVal = e.target.value.trim().toLowerCase();
    renderTable();
  });
  document.getElementById('refresh-btn').addEventListener('click', () => {
    fetchStats();
    fetchTasks();
    showToast('已刷新');
  });
  document.getElementById('log-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // ── 初始化 ────────────────────────────────────────────────────────────────────
  connectSSE();
  // 定时全量刷新（作为 SSE 的兜底）
  setInterval(() => { fetchStats(); fetchTasks(); }, 30_000);
</script>
</body>
</html>`;
    }
}

module.exports = { DashboardServer };
