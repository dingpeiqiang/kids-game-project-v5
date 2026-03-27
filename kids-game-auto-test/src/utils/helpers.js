/**
 * 辅助工具函数
 * 功能：提供通用的工具方法，减少代码重复
 */

const fs = require('fs');
const path = require('path');

/**
 * 带重试机制的异步执行
 * @param {Function} fn - 待执行的异步函数
 * @param {number} maxAttempts - 最大重试次数
 * @param {number} delay - 重试间隔（毫秒）
 * @param {string} label - 日志标签
 */
async function withRetry(fn, maxAttempts = 3, delay = 1000, label = 'operation') {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                console.warn(`[Retry] ${label} failed (attempt ${attempt}/${maxAttempts}): ${error.message}. Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    throw new Error(`${label} failed after ${maxAttempts} attempts: ${lastError.message}`);
}

/**
 * 延时函数
 * @param {number} ms - 毫秒数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 确保目录存在，不存在则创建
 * @param {string} dirPath - 目录路径
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * 格式化毫秒为可读字符串
 * @param {number} ms - 毫秒数
 */
function formatDuration(ms) {
    if (!ms || isNaN(ms)) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    const s = (ms / 1000).toFixed(1);
    return `${s}s`;
}

/**
 * 格式化字节为可读字符串
 * @param {number} bytes - 字节数
 */
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 计算两个日期之间的持续时间（毫秒）
 * @param {Date} startTime
 * @param {Date} endTime
 */
function calcDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    return new Date(endTime) - new Date(startTime);
}

/**
 * 截取截图并保存（兼容 Playwright & Puppeteer Page API）
 * @param {import('playwright').Page} page - Playwright page
 * @param {string} screenshotsDir - 截图保存目录
 * @param {string} name - 截图文件名（不含扩展名）
 * @returns {Promise<string|null>} 截图文件路径
 */
async function takeScreenshot(page, screenshotsDir, name) {
    try {
        ensureDir(screenshotsDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath  = path.join(screenshotsDir, `${name}-${timestamp}.png`);
        // Playwright: page.screenshot({ path, fullPage }) — 与 Puppeteer 完全兼容
        await page.screenshot({ path: filePath, fullPage: false });
        return filePath;
    } catch (error) {
        console.warn(`Screenshot failed for ${name}: ${error.message}`);
        return null;
    }
}

/**
 * 检测命令是否可用
 * @param {string} command - shell 命令
 */
function isCommandAvailable(command) {
    try {
        const { execSync } = require('child_process');
        execSync(`${command} --version`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * HTTP/HTTPS 连通性检测（不依赖浏览器）
 * 在启动 Playwright 浏览器之前快速验证服务是否在线
 * @param {string} url - 目标 URL
 * @param {number} [timeoutMs=5000] - 超时毫秒
 * @returns {Promise<{ok:boolean, status:number|null, error:string|null}>}
 */
function checkUrlReachable(url, timeoutMs = 5000) {
    return new Promise(resolve => {
        try {
            const { URL } = require('url');
            const parsed  = new URL(url);
            const lib     = parsed.protocol === 'https:' ? require('https') : require('http');
            const req = lib.get({
                hostname: parsed.hostname,
                port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
                path:     parsed.pathname || '/',
                timeout:  timeoutMs,
                headers:  { 'User-Agent': 'kids-game-auto-test/health-check' }
            }, (res) => {
                req.destroy();
                resolve({ ok: res.statusCode < 500, status: res.statusCode, error: null });
            });
            req.on('timeout', () => {
                req.destroy();
                resolve({ ok: false, status: null, error: 'timeout' });
            });
            req.on('error', (err) => {
                resolve({ ok: false, status: null, error: err.message });
            });
        } catch (err) {
            resolve({ ok: false, status: null, error: err.message });
        }
    });
}

/**
 * 带超时的 Promise 竞争（防止某个 await 永远挂住）
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} [label]
 */
function withTimeout(promise, ms, label = 'operation') {
    let timer;
    const timeoutP = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutP]).finally(() => clearTimeout(timer));
}

/**
 * 安全的 JSON 序列化（处理循环引用）
 * @param {*} obj
 * @param {number} indent
 */
function safeStringify(obj, indent = 2) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
        }
        return value;
    }, indent);
}

/**
 * 防抖函数
 * @param {Function} fn
 * @param {number} wait
 */
function debounce(fn, wait) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * 将对象数组按指定字段分组
 * @param {Array} arr
 * @param {string} key
 */
function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
        const group = item[key] || 'unknown';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});
}

module.exports = {
    withRetry,
    sleep,
    ensureDir,
    formatDuration,
    formatBytes,
    calcDuration,
    takeScreenshot,
    isCommandAvailable,
    checkUrlReachable,
    withTimeout,
    safeStringify,
    debounce,
    groupBy
};
