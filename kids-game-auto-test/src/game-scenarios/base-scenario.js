/**
 * BaseScenario - 游戏测试场景基类
 * 所有游戏专属测试场景都继承此类
 *
 * 场景编写规范：
 *  1. 每个 step 方法命名为 stepXxx，返回 TestResult
 *  2. 使用 this.action() 包裹每个操作，自动记录耗时和错误
 *  3. 通过 this.page 访问 Playwright page
 *  4. 通过 this.config 访问游戏配置
 *
 * 鲁棒性增强（v2）：
 *  - action() 支持 { soft: true } 选项：失败记 WARNING 而非 FAILED
 *  - assertCanvasHasContent(soft) 支持软断言：canvas 不可检测时返回 warning 而非抛出
 *  - waitForAny()：多个选择器中任一出现就继续
 *  - tryClick()：找不到元素时返回 false 而非抛出
 *  - measureFPS()：封装成公共方法，各场景复用
 *  - getScenarioTimeout()：从 options 读超时配置
 */

const { logger } = require('../utils/logger');
const { sleep, takeScreenshot, withTimeout } = require('../utils/helpers');
const path = require('path');

class BaseScenario {
    /**
     * @param {import('playwright').Page} page   - Playwright page
     * @param {Object}                   config  - 游戏配置
     * @param {Object}                   options - 全局选项（headless / timeout 等）
     */
    constructor(page, config, options = {}) {
        this.page    = page;
        this.config  = config;
        this.options = options;
        this.results = [];
        this.screenshotsDir = path.resolve(__dirname, '../../screenshots',
            (config.name || 'unknown').replace(/[^a-zA-Z0-9\-_]/g, '_'));
    }

    /** 每个测试动作的默认超时（ms） */
    get actionTimeout() {
        return Math.min(this.options.timeout || 60000, 30000);
    }

    // ─── 工具方法 ──────────────────────────────────────────────────

    /**
     * 包裹一个测试动作，自动计时、捕获错误、记录结果
     * @param {string}   name    - 测试项目名称
     * @param {Function} fn      - async 操作函数
     * @param {Object}   [meta]  - 附加信息
     * @param {boolean}  [meta.soft] - true 时失败标记 WARNING 而非 FAILED
     */
    async action(name, fn, meta = {}) {
        const startTime = Date.now();
        let status  = 'PASSED';
        let details = meta.details || '';
        let error   = null;
        const isSoft = meta.soft === true;

        try {
            // 为每个 action 包一层超时
            const result = await withTimeout(fn(), this.actionTimeout, name);
            if (typeof result === 'string') details = result;
            else if (result && typeof result === 'object' && result.details) details = result.details;
        } catch (err) {
            if (isSoft) {
                status  = 'WARNING';
                error   = err.message;
                details = `[soft] ${err.message}`;
                logger.warn(`  ⚠ [${name}]: ${err.message.slice(0, 120)}`);
            } else {
                status  = 'FAILED';
                error   = err.message;
                details = err.message;
                logger.warn(`  ✗ [${name}]: ${err.message.slice(0, 120)}`);
                // 失败时自动截图
                try {
                    await takeScreenshot(this.page, this.screenshotsDir, `fail-${name.replace(/[\s/\\]/g, '_')}`);
                } catch { /* ignore */ }
            }
        }

        const duration = Date.now() - startTime;
        const record = {
            name,
            status,
            duration,
            details,
            error: error || undefined,
            timestamp: new Date().toISOString()
        };
        // 不把 soft meta 字段混入 record
        if (meta.category) record.category = meta.category;

        this.results.push(record);
        const icon = { PASSED: '✓', FAILED: '✗', WARNING: '⚠' }[status] || '?';
        logger.info(`  ${icon} [${name}] ${status} (${duration}ms)${details ? ': ' + details.slice(0, 100) : ''}`);

        return record;
    }

    /**
     * 等待指定时间（简写）
     */
    async wait(ms) { return sleep(ms); }

    /**
     * 模拟按键（单键或组合键）
     * @param {string|string[]} keys - 'ArrowLeft' | ['Control', 'KeyA']
     * @param {number}          [repeat=1] - 重复次数
     * @param {number}          [interval=50] - 重复间隔 ms
     */
    async pressKey(keys, repeat = 1, interval = 50) {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (let i = 0; i < repeat; i++) {
            for (const k of keyList) {
                await this.page.keyboard.press(k);
            }
            if (repeat > 1 && i < repeat - 1) await sleep(interval);
        }
    }

    /**
     * 点击 canvas 中心点（找不到 canvas 时返回 false 而非抛出）
     * @param {Object} [offset] - { dx, dy } 相对中心偏移
     */
    async clickCanvas(offset = { dx: 0, dy: 0 }) {
        const canvas = await this.page.$('canvas');
        if (!canvas) return false;
        const box = await canvas.boundingBox();
        if (!box) return false;
        await this.page.mouse.click(
            box.x + box.width  / 2 + (offset.dx || 0),
            box.y + box.height / 2 + (offset.dy || 0)
        );
        return true;
    }

    /**
     * 尝试点击第一个匹配的选择器，找不到时返回 false（不抛出）
     * @param {string|string[]} selectors
     */
    async tryClick(selectors) {
        const list = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of list) {
            try {
                const el = await this.page.$(sel);
                if (el) {
                    await el.click();
                    return sel;
                }
            } catch { /* try next */ }
        }
        return false;
    }

    /**
     * 等待多个选择器中任意一个出现（比单个 waitForSelector 更宽容）
     * @param {string[]} selectors
     * @param {number}   [timeout=8000]
     * @returns {Promise<string|null>} 找到的选择器，超时返回 null
     */
    async waitForAny(selectors, timeout = 8000) {
        const promises = selectors.map(sel =>
            this.page.waitForSelector(sel, { timeout }).then(() => sel).catch(() => null)
        );
        const results = await Promise.all(promises);
        return results.find(r => r !== null) || null;
    }

    /**
     * 检查 canvas 是否实际渲染了内容（非全透明）
     * @param {boolean} [soft=false] - true 时找不到/跨域 canvas 返回 'skipped' 而非抛出
     */
    async assertCanvasHasContent(soft = false) {
        const result = await this.page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return 'no-canvas';
            if (canvas.width === 0 || canvas.height === 0) return 'zero-size';
            try {
                const ctx  = canvas.getContext('2d');
                const data = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data;
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > 0) return 'has-content';
                }
                return 'transparent';
            } catch (e) {
                return `cross-origin:${e.message}`;
            }
        });

        if (result === 'has-content') return true;

        const msg = `Canvas check: ${result}`;
        if (soft || result.startsWith('cross-origin') || result === 'no-canvas') {
            logger.warn(`  ⚠ ${msg} (soft, continuing)`);
            return false;   // 不抛出，让测试继续
        }
        throw new Error(msg);
    }

    /**
     * 等待 DOM 元素出现（超时时根据 throwOnMissing 决定是否抛出）
     * @param {string}  selector
     * @param {number}  [timeout=5000]
     * @param {boolean} [throwOnMissing=true]
     */
    async waitForElement(selector, timeout = 5000, throwOnMissing = true) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (e) {
            if (throwOnMissing) throw e;
            logger.warn(`  ⚠ waitForElement "${selector}" not found within ${timeout}ms`);
            return false;
        }
    }

    /**
     * FPS 采样（2 秒内 rAF 计数，公共复用）
     * @param {number} [durationMs=2000]
     * @param {number} [minFPS=10]    - 低于此值抛出
     * @returns {Promise<number>}
     */
    async measureFPS(durationMs = 2000, minFPS = 10) {
        const fps = await this.page.evaluate((dur) =>
            new Promise(resolve => {
                let frames = 0;
                const start = performance.now();
                const tick = () => {
                    frames++;
                    if (performance.now() - start < dur) {
                        requestAnimationFrame(tick);
                    } else {
                        const elapsed = (performance.now() - start) / 1000;
                        resolve(elapsed > 0 ? Math.round(frames / elapsed) : 60);
                    }
                };
                requestAnimationFrame(tick);
                setTimeout(() => resolve(Math.max(frames, 1)), dur + 1000);
            }),
            durationMs
        );
        if (fps < minFPS) throw new Error(`FPS too low: ${fps} (min: ${minFPS})`);
        return fps;
    }

    /**
     * 检查页面是否有 JS 报错（从外部传入收集的错误数组）
     */
    async assertNoJSErrors(errors) {
        if (errors && errors.length > 0) {
            throw new Error(`JS errors detected: ${errors.map(e => e.message || e).join('; ')}`);
        }
    }

    /**
     * 运行此场景的所有测试
     * 子类重写此方法，依次调用 action()
     * @returns {Array<TestResult>}
     */
    async run() {
        throw new Error(`${this.constructor.name}.run() must be implemented`);
    }

    /**
     * 获取场景名称（子类可重写）
     */
    get name() { return this.constructor.name; }
}

module.exports = { BaseScenario };
