/**
 * RetryManager - 高级重试管理器
 * 功能：
 *   1. 指数退避（Exponential Backoff）重试
 *   2. 熔断器（Circuit Breaker）模式 - 避免级联失败
 *   3. 超时竞争（Promise.race with timeout）
 *   4. 带标签的日志追踪
 */

const { logger } = require('./logger');
const { sleep } = require('./helpers');

// ─── 熔断器状态 ───────────────────────────────────────────────
const CIRCUIT_STATE = {
    CLOSED:   'CLOSED',    // 正常工作
    OPEN:     'OPEN',      // 熔断中，拒绝请求
    HALF_OPEN: 'HALF_OPEN' // 尝试恢复
};

/**
 * 熔断器
 * 当失败次数超过阈值时，自动熔断（短路），避免雪崩
 */
class CircuitBreaker {
    /**
     * @param {Object} options
     * @param {number} options.failureThreshold   - 触发熔断的连续失败次数（默认 5）
     * @param {number} options.resetTimeout       - 熔断后等待恢复的时间（ms，默认 30s）
     * @param {number} options.halfOpenMaxCalls   - HALF_OPEN 状态下允许的试探请求数（默认 1）
     */
    constructor(options = {}) {
        this.failureThreshold  = options.failureThreshold  ?? 5;
        this.resetTimeout      = options.resetTimeout      ?? 30000;
        this.halfOpenMaxCalls  = options.halfOpenMaxCalls  ?? 1;

        this.state            = CIRCUIT_STATE.CLOSED;
        this.failureCount     = 0;
        this.lastFailureTime  = null;
        this.halfOpenCalls    = 0;
    }

    /**
     * 包裹一个异步函数，执行前检查熔断状态
     * @param {Function} fn
     * @param {string} label
     */
    async call(fn, label = 'operation') {
        if (this.state === CIRCUIT_STATE.OPEN) {
            const elapsed = Date.now() - this.lastFailureTime;
            if (elapsed >= this.resetTimeout) {
                logger.warn(`[CircuitBreaker] ${label}: switching OPEN → HALF_OPEN after ${Math.round(elapsed / 1000)}s`);
                this.state = CIRCUIT_STATE.HALF_OPEN;
                this.halfOpenCalls = 0;
            } else {
                throw new CircuitOpenError(`[CircuitBreaker] ${label} is OPEN. Retry after ${Math.round((this.resetTimeout - elapsed) / 1000)}s`);
            }
        }

        if (this.state === CIRCUIT_STATE.HALF_OPEN) {
            if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
                throw new CircuitOpenError(`[CircuitBreaker] ${label} HALF_OPEN trial limit reached`);
            }
            this.halfOpenCalls++;
        }

        try {
            const result = await fn();
            this._onSuccess(label);
            return result;
        } catch (error) {
            this._onFailure(label, error);
            throw error;
        }
    }

    _onSuccess(label) {
        if (this.state === CIRCUIT_STATE.HALF_OPEN) {
            logger.info(`[CircuitBreaker] ${label}: HALF_OPEN → CLOSED (recovered)`);
        }
        this.state        = CIRCUIT_STATE.CLOSED;
        this.failureCount = 0;
    }

    _onFailure(label, error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CIRCUIT_STATE.HALF_OPEN) {
            logger.warn(`[CircuitBreaker] ${label}: HALF_OPEN probe failed → re-OPEN`);
            this.state = CIRCUIT_STATE.OPEN;
        } else if (this.failureCount >= this.failureThreshold) {
            logger.warn(`[CircuitBreaker] ${label}: failure count ${this.failureCount} ≥ threshold ${this.failureThreshold} → OPEN`);
            this.state = CIRCUIT_STATE.OPEN;
        }
    }

    get isOpen()     { return this.state === CIRCUIT_STATE.OPEN;      }
    get isClosed()   { return this.state === CIRCUIT_STATE.CLOSED;    }
    get isHalfOpen() { return this.state === CIRCUIT_STATE.HALF_OPEN; }
}

class CircuitOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}

// ─── RetryManager ────────────────────────────────────────────

/**
 * 高级重试管理器
 */
class RetryManager {
    /**
     * @param {Object} options
     * @param {number}   options.maxAttempts      - 最大尝试次数（默认 3）
     * @param {number}   options.baseDelay        - 基础延时 ms（默认 500）
     * @param {number}   options.maxDelay         - 最大延时 ms（默认 15000）
     * @param {number}   options.backoffFactor    - 指数退避系数（默认 2）
     * @param {boolean}  options.jitter           - 是否添加随机抖动（默认 true）
     * @param {Function} options.retryIf          - 自定义重试条件 fn(error) → bool（默认全部重试）
     * @param {Object}   options.circuitBreaker   - 熔断器配置（null=禁用）
     */
    constructor(options = {}) {
        this.maxAttempts   = options.maxAttempts   ?? 3;
        this.baseDelay     = options.baseDelay     ?? 500;
        this.maxDelay      = options.maxDelay      ?? 15000;
        this.backoffFactor = options.backoffFactor ?? 2;
        this.jitter        = options.jitter        ?? true;
        this.retryIf       = options.retryIf       ?? (() => true);

        this.circuit = options.circuitBreaker !== null
            ? new CircuitBreaker(options.circuitBreaker || {})
            : null;
    }

    /**
     * 计算第 attempt 次重试的延时（指数退避 + 抖动）
     * @param {number} attempt - 当前重试次数（1-indexed）
     */
    _calcDelay(attempt) {
        const base   = this.baseDelay * Math.pow(this.backoffFactor, attempt - 1);
        const capped = Math.min(base, this.maxDelay);
        const jitter = this.jitter ? capped * 0.2 * Math.random() : 0;
        return Math.round(capped + jitter);
    }

    /**
     * 执行带重试的操作
     * @param {Function} fn      - 异步函数
     * @param {string}   label   - 操作标签（用于日志）
     * @returns {Promise<*>}
     */
    async run(fn, label = 'operation') {
        let lastError;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                if (this.circuit) {
                    return await this.circuit.call(fn, label);
                }
                return await fn();
            } catch (error) {
                lastError = error;

                // 熔断器短路 → 不重试
                if (error instanceof CircuitOpenError) {
                    logger.warn(`[RetryManager] ${label}: circuit is OPEN, skipping retries`);
                    throw error;
                }

                // 自定义重试条件检查
                if (!this.retryIf(error)) {
                    logger.debug(`[RetryManager] ${label}: error is non-retryable, giving up`);
                    throw error;
                }

                if (attempt < this.maxAttempts) {
                    const delay = this._calcDelay(attempt);
                    logger.warn(`[RetryManager] ${label}: attempt ${attempt}/${this.maxAttempts} failed (${error.message.slice(0, 80)}). Retrying in ${delay}ms...`);
                    await sleep(delay);
                }
            }
        }

        throw new Error(`[RetryManager] ${label} failed after ${this.maxAttempts} attempts: ${lastError.message}`);
    }

    /**
     * 静态快捷方法：一次性带超时的 Promise 竞争
     * @param {Promise} promise   - 目标 Promise
     * @param {number}  ms        - 超时毫秒数
     * @param {string}  label     - 超时错误标签
     */
    static withTimeout(promise, ms, label = 'operation') {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[Timeout] ${label} timed out after ${ms}ms`)), ms)
        );
        return Promise.race([promise, timeoutPromise]);
    }

    /**
     * 静态快捷方法：简单指数退避重试（不需要实例化）
     * @param {Function} fn
     * @param {Object}   opts
     */
    static async retry(fn, opts = {}) {
        return new RetryManager(opts).run(fn, opts.label || 'operation');
    }
}

module.exports = { RetryManager, CircuitBreaker, CircuitOpenError, CIRCUIT_STATE };
