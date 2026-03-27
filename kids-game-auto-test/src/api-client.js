/**
 * 后端 REST API 客户端
 *
 * 功能：
 * 1. 封装对 kids-game-backend (Spring Boot) 的 HTTP 请求
 * 2. JWT Token 自动管理（登录、刷新、请求头注入）
 * 3. 统一响应解析（{ code, message, data } 格式）
 * 4. 连接失败时优雅降级
 *
 * 后端接口清单（Base: http://localhost:8080）：
 *   POST /api/auth/login                       — 统一登录
 *   GET  /api/game/list                        — 游戏列表
 *   GET  /api/game/{gameId}                    — 游戏详情
 *   GET  /api/game/code/{gameCode}             — 按 code 查游戏
 *   POST /api/game/session/start               — 启动游戏会话
 *   POST /api/game/session/{id}/result         — 提交游戏结果
 *   GET  /api/game/config/{gameCode}           — 游戏配置
 *   GET  /api/stats/today                      — 今日统计
 *   GET  /api/admin/dashboard/overview         — 仪表盘概览
 *   GET  /api/admin/game/management/list       — 游戏管理列表
 *   GET  /api/user/parent/profile              — 家长资料
 */

'use strict';

const http  = require('http');
const https = require('https');
const { URL } = require('url');
const { logger } = require('./utils/logger');

// ── 常量 ──────────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL    = 'http://localhost:8080';
const DEFAULT_TIMEOUT     = 10_000;   // 10s 请求超时
const DEFAULT_ADMIN_USER  = 'admin';
const DEFAULT_ADMIN_PASS  = 'admin123';
const TOKEN_REFRESH_AHEAD = 5 * 60 * 1000; // 提前 5 分钟刷新

// 后端统一成功码
const SUCCESS_CODE = 200;

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * 把 options 对象发成 HTTP/HTTPS 请求，返回 { statusCode, body }
 * @param {string} urlStr
 * @param {object} options  method, headers, body(string|undefined), timeout
 * @returns {Promise<{ statusCode:number, headers:object, body:string }>}
 */
function rawRequest(urlStr, { method = 'GET', headers = {}, body, timeout = DEFAULT_TIMEOUT } = {}) {
    return new Promise((resolve, reject) => {
        let parsed;
        try { parsed = new URL(urlStr); } catch (e) {
            return reject(new Error(`Invalid URL: ${urlStr}`));
        }

        const isHttps = parsed.protocol === 'https:';
        const lib     = isHttps ? https : http;

        const reqOptions = {
            hostname: parsed.hostname,
            port:     parsed.port || (isHttps ? 443 : 80),
            path:     parsed.pathname + parsed.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept':       'application/json',
                ...headers,
            },
        };

        const req = lib.request(reqOptions, (res) => {
            const chunks = [];
            res.on('data',  chunk => chunks.push(chunk));
            res.on('end',   ()    => resolve({
                statusCode: res.statusCode,
                headers:    res.headers,
                body:       Buffer.concat(chunks).toString('utf8'),
            }));
        });

        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Request timeout (${timeout}ms): ${urlStr}`));
        });

        if (body) req.write(body);
        req.end();
    });
}

// ── 主类 ──────────────────────────────────────────────────────────────────────

class ApiClient {
    /**
     * @param {object} options
     * @param {string}  [options.baseUrl]     后端 Base URL（默认 http://localhost:8080）
     * @param {string}  [options.username]    登录用户名（默认 admin）
     * @param {string}  [options.password]    登录密码（默认 admin123）
     * @param {string}  [options.userType]    用户类型 ADMIN|PARENT|KID（默认 ADMIN）
     * @param {number}  [options.timeout]     请求超时（ms）
     * @param {boolean} [options.autoLogin]   首次请求前自动登录（默认 true）
     */
    constructor(options = {}) {
        this.baseUrl   = (options.baseUrl   || process.env.BACKEND_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
        this.username  = options.username   || process.env.BACKEND_USERNAME  || DEFAULT_ADMIN_USER;
        this.password  = options.password   || process.env.BACKEND_PASSWORD  || DEFAULT_ADMIN_PASS;
        this.userType  = options.userType   || process.env.BACKEND_USER_TYPE || 'ADMIN';
        this.timeout   = options.timeout    || DEFAULT_TIMEOUT;
        this.autoLogin = options.autoLogin  !== false;

        this._token      = null;
        this._tokenExp   = 0;      // token 过期时间戳（ms）
        this._loginInFlight = null; // 防止并发登录
    }

    // ── 公开：连接检测 ────────────────────────────────────────────────────────

    /**
     * 检测后端是否可达（不需要登录）
     * @returns {Promise<boolean>}
     */
    async isReachable() {
        try {
            const { statusCode } = await rawRequest(`${this.baseUrl}/api/auth/login`, {
                method:  'POST',
                body:    JSON.stringify({ username: '__ping__', password: '__ping__' }),
                timeout: 3000,
            });
            // 任何 HTTP 响应（包括 400/401）都说明服务器在跑
            return statusCode > 0;
        } catch (_) {
            return false;
        }
    }

    // ── 公开：认证 ────────────────────────────────────────────────────────────

    /**
     * 登录，获取并缓存 JWT Token
     * @param {string} [username]
     * @param {string} [password]
     * @param {string} [userType]
     * @returns {Promise<string>} token
     */
    async login(username, password, userType) {
        const u = username || this.username;
        const p = password || this.password;
        const t = userType || this.userType;

        logger.debug(`[ApiClient] Logging in as ${u} (${t})...`);

        const data = await this._rawApiPost('/api/auth/login', { username: u, password: p, userType: t });
        // data 可能是 { token, userId, ... } 或直接是 token 字符串
        const token = typeof data === 'string' ? data : (data?.token || data?.accessToken || data?.jwt);

        if (!token) {
            throw new Error(`Login succeeded but no token found in response: ${JSON.stringify(data)}`);
        }

        this._token    = token;
        // 简单解析 JWT payload 的 exp 字段
        this._tokenExp = this._parseTokenExp(token);
        logger.debug(`[ApiClient] Login OK, token expires at ${new Date(this._tokenExp).toISOString()}`);
        return token;
    }

    /**
     * 确保 token 有效（若无或快过期则重新登录）
     * @private
     */
    async _ensureToken() {
        if (this._token && Date.now() < this._tokenExp - TOKEN_REFRESH_AHEAD) {
            return; // token 仍有效
        }

        // 防止并发重复登录
        if (this._loginInFlight) {
            await this._loginInFlight;
            return;
        }

        this._loginInFlight = this.login().finally(() => {
            this._loginInFlight = null;
        });
        await this._loginInFlight;
    }

    // ── 公开：游戏 API ────────────────────────────────────────────────────────

    /**
     * 获取游戏列表
     * @param {object} [params]  { page, size, status, type, ... }
     * @returns {Promise<object>}  后端返回的 data（分页或列表）
     */
    async getGameList(params = {}) {
        const qs = this._buildQueryString(params);
        return this._get(`/api/game/list${qs}`);
    }

    /**
     * 获取游戏详情
     * @param {number|string} gameId
     */
    async getGameDetail(gameId) {
        return this._get(`/api/game/${gameId}`);
    }

    /**
     * 通过 gameCode 获取游戏
     * @param {string} gameCode  如 "plane-shooter"
     */
    async getGameByCode(gameCode) {
        return this._get(`/api/game/code/${encodeURIComponent(gameCode)}`);
    }

    /**
     * 获取游戏配置（包含阈值、皮肤等）
     * @param {string} gameCode
     */
    async getGameConfig(gameCode) {
        return this._get(`/api/game/config/${encodeURIComponent(gameCode)}`);
    }

    // ── 公开：游戏会话 API ────────────────────────────────────────────────────

    /**
     * 启动游戏会话
     * @param {object} payload  { gameId, kidId?, difficulty? }
     * @returns {Promise<{ sessionId, token? }>}
     */
    async startGameSession(payload) {
        return this._post('/api/game/session/start', payload);
    }

    /**
     * 提交游戏结果（结束会话）
     * @param {string|number} sessionId
     * @param {object} result  { score, duration, passed, ... }
     */
    async submitGameResult(sessionId, result) {
        return this._post(`/api/game/session/${sessionId}/result`, result);
    }

    // ── 公开：统计 API ────────────────────────────────────────────────────────

    /**
     * 今日统计
     */
    async getTodayStats() {
        return this._get('/api/stats/today');
    }

    /**
     * 仪表盘概览
     */
    async getDashboardOverview() {
        return this._get('/api/admin/dashboard/overview');
    }

    /**
     * 游戏管理列表（admin）
     * @param {object} [params]
     */
    async getAdminGameList(params = {}) {
        const qs = this._buildQueryString(params);
        return this._get(`/api/admin/game/management/list${qs}`);
    }

    // ── 公开：通用请求（暴露给 API 测试用） ──────────────────────────────────

    /**
     * 通用 GET 请求（带自动鉴权）
     * @param {string} path
     * @returns {Promise<any>} data 字段
     */
    async get(path) {
        return this._get(path);
    }

    /**
     * 通用 POST 请求（带自动鉴权）
     * @param {string} path
     * @param {object} body
     */
    async post(path, body) {
        return this._post(path, body);
    }

    /**
     * 通用 PUT 请求
     */
    async put(path, body) {
        return this._request('PUT', path, body);
    }

    /**
     * 通用 DELETE 请求
     */
    async delete(path) {
        return this._request('DELETE', path);
    }

    /**
     * 原始请求（返回完整响应对象 { code, message, data }）
     * 用于需要检查 code/message 的测试断言
     */
    async rawGet(path) {
        return this._rawApiRequest('GET', path);
    }

    async rawPost(path, body) {
        return this._rawApiRequest('POST', path, body);
    }

    // ── 内部：HTTP 方法封装 ───────────────────────────────────────────────────

    async _get(path) {
        return this._request('GET', path);
    }

    async _post(path, body) {
        return this._request('POST', path, body);
    }

    /**
     * 带鉴权的统一请求，提取 data 字段
     * @private
     */
    async _request(method, path, body) {
        if (this.autoLogin) await this._ensureToken();

        const url     = `${this.baseUrl}${path}`;
        const headers = {};
        if (this._token) headers['Authorization'] = `Bearer ${this._token}`;

        const bodyStr = body ? JSON.stringify(body) : undefined;

        logger.debug(`[ApiClient] ${method} ${path}`);

        const { statusCode, body: resBody } = await rawRequest(url, {
            method,
            headers,
            body: bodyStr,
            timeout: this.timeout,
        });

        if (statusCode === 401) {
            // Token 失效，重新登录一次
            this._token    = null;
            this._tokenExp = 0;
            if (this.autoLogin) {
                await this.login();
                headers['Authorization'] = `Bearer ${this._token}`;
                const retry = await rawRequest(url, { method, headers, body: bodyStr, timeout: this.timeout });
                return this._parseBody(retry.body, path);
            }
        }

        return this._parseBody(resBody, path);
    }

    /**
     * 不带 auto-login 的原始 POST（用于 login 接口本身）
     * @private
     */
    async _rawApiPost(path, body) {
        const url     = `${this.baseUrl}${path}`;
        const { statusCode, body: resBody } = await rawRequest(url, {
            method:  'POST',
            body:    JSON.stringify(body),
            timeout: this.timeout,
        });

        if (statusCode === 0) {
            throw new Error(`Server not reachable at ${this.baseUrl}`);
        }

        return this._parseBody(resBody, path);
    }

    /**
     * 返回完整 { code, message, data } 对象（不提取 data）
     * @private
     */
    async _rawApiRequest(method, path, body) {
        if (this.autoLogin) await this._ensureToken();

        const url     = `${this.baseUrl}${path}`;
        const headers = {};
        if (this._token) headers['Authorization'] = `Bearer ${this._token}`;

        const { statusCode, body: resBody } = await rawRequest(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            timeout: this.timeout,
        });

        let parsed = null;
        try { parsed = JSON.parse(resBody); } catch (_) { parsed = { code: statusCode, message: resBody, data: null }; }
        parsed._httpStatus = statusCode;
        return parsed;
    }

    /**
     * 解析后端响应 body，返回 data 字段
     * @private
     */
    _parseBody(bodyStr, path) {
        if (!bodyStr) return null;

        let json;
        try {
            json = JSON.parse(bodyStr);
        } catch (_) {
            throw new Error(`[ApiClient] Non-JSON response from ${path}: ${bodyStr.slice(0, 200)}`);
        }

        // 标准后端格式 { code, message, data }
        if (typeof json.code !== 'undefined') {
            if (json.code === SUCCESS_CODE || json.code === 0) {
                return json.data;
            }
            throw new ApiError(json.code, json.message || 'API error', path);
        }

        // 兼容直接返回 data 的格式
        return json;
    }

    // ── 内部：工具 ────────────────────────────────────────────────────────────

    _buildQueryString(params) {
        const pairs = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        return pairs.length ? '?' + pairs.join('&') : '';
    }

    /**
     * 解析 JWT 的 exp 字段（不做签名校验）
     * @private
     */
    _parseTokenExp(token) {
        try {
            const parts   = token.split('.');
            if (parts.length < 2) return Date.now() + 3600_000;
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload.exp) return payload.exp * 1000; // JWT exp 是秒级时间戳
        } catch (_) {}
        // 无法解析则假设 1h 有效
        return Date.now() + 3600_000;
    }
}

// ── 自定义错误 ────────────────────────────────────────────────────────────────

class ApiError extends Error {
    constructor(code, message, path) {
        super(`[${code}] ${message}  (${path})`);
        this.name    = 'ApiError';
        this.code    = code;
        this.apiPath = path;
    }
}

// ── 静态工厂 ─────────────────────────────────────────────────────────────────

/**
 * 根据环境变量或 options 创建并自动登录的客户端
 * @param {object} [options]
 * @returns {Promise<ApiClient>}
 */
ApiClient.create = async function (options = {}) {
    const client = new ApiClient(options);
    await client.login();
    return client;
};

module.exports = { ApiClient, ApiError };
