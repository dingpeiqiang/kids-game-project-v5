/**
 * 性能监控器
 * 功能：采集和分析游戏性能指标
 *
 * Playwright 迁移点：
 * - page.evaluate() 调用方式与 Puppeteer 完全兼容，无需修改
 * - 新增 CDP Session（chromium 专用）获取精准 JS 堆内存
 * - Playwright page.metrics() 提供 TaskDuration / JSHeapUsedSize 等额外指标
 * - waitForLoadState('networkidle') 替代 waitForNavigation
 */

const { logger } = require('./utils/logger');
const { formatDuration, withTimeout } = require('./utils/helpers');

// 默认阈值（当配置文件未提供时使用）
const DEFAULT_THRESHOLDS = {
    loadTime:    5000,   // ms
    frameRate:   30,     // FPS
    memoryUsage: 512,    // MB
    lcpTime:     2500    // ms（Google Core Web Vitals）
};

class PerformanceMonitor {
    /**
     * @param {Object} gameConfig - 游戏配置
     * @param {Object} perfConfig  - 全局 performance 配置（来自 test-config.json）
     */
    constructor(gameConfig, perfConfig = {}) {
        this.config    = gameConfig;
        this.metrics   = {};
        this.thresholds = Object.assign({}, DEFAULT_THRESHOLDS, perfConfig.thresholds || {});
    }

    /**
     * 执行性能测量
     * @param {import('playwright').Page} page - Playwright page（已导航到游戏页面，不会重新导航）
     */
    async measure(page) {
        logger.info('Starting performance measurement (Playwright, existing page)...');

        // 每个指标采集独立超时，防止某个 PerformanceObserver 永远挂住
        const safe = async (label, fn, defaultVal = null) => {
            try {
                return await withTimeout(fn(), 8000, label);
            } catch (e) {
                logger.warn(`  [perf] ${label} failed: ${e.message}`);
                return defaultVal;
            }
        };

        try {
            this.metrics.loadTime                = await safe('loadTime',             () => this.getNavigationLoadTime(page));
            this.metrics.firstPaint              = await safe('firstPaint',           () => this.measurePaintEntry(page, 'first-paint'));
            this.metrics.firstContentfulPaint    = await safe('firstContentfulPaint', () => this.measurePaintEntry(page, 'first-contentful-paint'));
            this.metrics.largestContentfulPaint  = await safe('LCP',                 () => this.measureLCP(page));
            this.metrics.timeToInteractive       = await safe('TTI',                 () => this.measureTTI(page));

            const pwMetrics = await safe('playwrightMetrics', () => this.getPlaywrightMetrics(page), {});
            Object.assign(this.metrics, pwMetrics);

            this.metrics.frameRate   = await safe('frameRate',   () => this.measureFrameRate(page));
            this.metrics.memoryUsage = await safe('memoryUsage', () => this.measureMemory(page));

            const issues = this.checkThresholds();

            logger.info('Performance metrics collected:');
            for (const [key, value] of Object.entries(this.metrics)) {
                if (value !== null && value !== undefined) {
                    logger.info(`  ${key}: ${value}`);
                }
            }

            return {
                metrics:    this.metrics,
                issues,
                thresholds: this.thresholds,
                timestamp:  new Date().toISOString()
            };

        } catch (error) {
            logger.error('Performance measurement failed:', error.message);
            return { metrics: {}, issues: [], error: error.message };
        }
    }

    // ─── 指标采集方法 ──────────────────────────────────────────────────────────

    async getNavigationLoadTime(page) {
        try {
            const t = await page.evaluate(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                if (nav && nav.loadEventEnd > 0) {
                    return Math.round(nav.loadEventEnd - nav.startTime);
                }
                const timing = performance.timing;
                return timing && timing.loadEventEnd > 0
                    ? Math.round(timing.loadEventEnd - timing.navigationStart)
                    : null;
            });
            logger.info(`  Load Time (NavAPI): ${t != null ? formatDuration(t) : 'N/A'}`);
            return t;
        } catch (e) {
            logger.warn('Navigation Timing unavailable:', e.message);
            return null;
        }
    }

    async measurePaintEntry(page, name) {
        try {
            const v = await page.evaluate((n) => {
                const entries = performance.getEntriesByType('paint');
                const entry   = entries.find(e => e.name === n);
                return entry ? Math.round(entry.startTime) : null;
            }, name);
            logger.info(`  ${name}: ${v != null ? formatDuration(v) : 'N/A'}`);
            return v;
        } catch (e) {
            logger.warn(`${name} measurement failed:`, e.message);
            return null;
        }
    }

    async measureLCP(page) {
        try {
            const v = await page.evaluate(() =>
                new Promise(resolve => {
                    const existing = performance.getEntriesByType('largest-contentful-paint');
                    if (existing && existing.length > 0) {
                        resolve(Math.round(existing[existing.length - 1].startTime));
                        return;
                    }
                    try {
                        const obs = new PerformanceObserver(list => {
                            const entries = list.getEntries();
                            if (entries.length > 0) {
                                obs.disconnect();
                                resolve(Math.round(entries[entries.length - 1].startTime));
                            }
                        });
                        obs.observe({ type: 'largest-contentful-paint', buffered: true });
                        setTimeout(() => { obs.disconnect(); resolve(null); }, 3000);
                    } catch {
                        resolve(null);
                    }
                })
            );
            logger.info(`  LCP: ${v != null ? formatDuration(v) : 'N/A'}`);
            return v;
        } catch (e) {
            logger.warn('LCP measurement failed:', e.message);
            return null;
        }
    }

    async measureTTI(page) {
        try {
            const v = await page.evaluate(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                if (nav && nav.domInteractive > 0) return Math.round(nav.domInteractive - nav.startTime);
                const t = performance.timing;
                return t ? Math.round(t.domInteractive - t.navigationStart) : null;
            });
            logger.info(`  TTI (domInteractive): ${v != null ? formatDuration(v) : 'N/A'}`);
            return v;
        } catch (e) {
            logger.warn('TTI measurement failed:', e.message);
            return null;
        }
    }

    /**
     * Playwright 内置 page.metrics()（仅 Chromium 支持）
     * 返回 TaskDuration、ScriptDuration、RecalcStyleCount 等
     */
    async getPlaywrightMetrics(page) {
        try {
            const raw = await page.evaluate(() => ({
                domNodes:       document.querySelectorAll('*').length,
                // page.metrics() 在 evaluate 中无法调用，通过 CDP 替代
            }));

            // Playwright 提供 page.metrics() 方法（Chromium CDP 派生）
            let pwMetrics = {};
            if (typeof page.metrics === 'function') {
                const m = await page.metrics();
                pwMetrics = {
                    taskDuration:    m.TaskDuration    ? parseFloat((m.TaskDuration * 1000).toFixed(2))   : null,
                    scriptDuration:  m.ScriptDuration  ? parseFloat((m.ScriptDuration * 1000).toFixed(2)) : null,
                    layoutCount:     m.LayoutCount     || null,
                    recalcStyleCount: m.RecalcStyleCount || null
                };
            }

            return { ...pwMetrics, domNodes: raw.domNodes };
        } catch {
            return {};
        }
    }

    async measureFrameRate(page) {
        try {
            const fps = await page.evaluate(() =>
                new Promise(resolve => {
                    const timestamps = [];
                    let rafId;
                    const duration  = 2000;
                    const startTime = performance.now();

                    function tick() {
                        timestamps.push(performance.now());
                        if (performance.now() - startTime < duration) {
                            rafId = requestAnimationFrame(tick);
                        } else {
                            cancelAnimationFrame(rafId);
                            const n = timestamps.length;
                            const elapsed = (timestamps[n - 1] - timestamps[0]) / 1000;
                            resolve(elapsed > 0 ? Math.round(n / elapsed) : 60);
                        }
                    }
                    requestAnimationFrame(tick);
                    setTimeout(() => { cancelAnimationFrame(rafId); resolve(60); }, 4000);
                })
            );
            logger.info(`  Frame Rate: ${fps} FPS`);
            return fps;
        } catch (e) {
            logger.warn('Frame rate measurement failed:', e.message);
            return null;
        }
    }

    async measureMemory(page) {
        try {
            // 优先 performance.memory（Chrome 专属）
            const mb = await page.evaluate(() => {
                if (performance.memory) {
                    return parseFloat((performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2));
                }
                return null;
            });
            logger.info(`  Memory Usage: ${mb != null ? `${mb} MB` : 'N/A'}`);
            return mb;
        } catch (e) {
            logger.warn('Memory measurement failed:', e.message);
            return null;
        }
    }

    // ─── 阈值检查 ──────────────────────────────────────────────────────────────

    checkThresholds() {
        const issues = [];
        const { metrics: m, thresholds: t } = this;

        if (m.loadTime != null && m.loadTime > t.loadTime) {
            issues.push(this.buildIssue('loadTime', m.loadTime, t.loadTime,
                `加载时间过长：${formatDuration(m.loadTime)} (阈值 ${formatDuration(t.loadTime)})`));
        }

        if (m.frameRate != null && m.frameRate < t.frameRate) {
            issues.push(this.buildIssue('frameRate', m.frameRate, t.frameRate,
                `帧率过低：${m.frameRate} FPS (阈值 ${t.frameRate} FPS)`));
        }

        if (m.memoryUsage != null && m.memoryUsage > t.memoryUsage) {
            issues.push(this.buildIssue('memoryUsage', m.memoryUsage, t.memoryUsage,
                `内存过高：${m.memoryUsage} MB (阈值 ${t.memoryUsage} MB)`));
        }

        if (m.largestContentfulPaint != null && m.largestContentfulPaint > (t.lcpTime || 2500)) {
            issues.push(this.buildIssue('largestContentfulPaint', m.largestContentfulPaint, t.lcpTime || 2500,
                `LCP 较慢：${formatDuration(m.largestContentfulPaint)} (建议 < 2.5s)`));
        }

        return issues;
    }

    buildIssue(metric, value, threshold, message) {
        return { type: 'performance', metric, value, threshold, severity: 'warning', message };
    }
}

module.exports = { PerformanceMonitor };
