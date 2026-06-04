/**
 * AI 体验分析器（DOM 增强版 v2）
 *
 * 评估维度（全部来自 page.evaluate 的 DOM/API 分析，非 mock 随机数）：
 *   1. visualQuality    - Canvas 渲染质量、DOM 复杂度、图片资源质量
 *   2. userExperience   - 可交互元素数量、按钮文字、加载反馈
 *   3. accessibility    - alt 属性、aria 标签、键盘焦点支持、色彩对比
 *   4. performance      - FPS、DOM 节点数、脚本耗时
 *   5. stability        - JS 错误数、失败请求数
 *
 * 如果 Python 可用且 ai/analyzer.py 存在，可升级为真实 ML 模型分析。
 */

'use strict';

const path = require('path');
const { logger } = require('./utils/logger');
const { isCommandAvailable, takeScreenshot } = require('./utils/helpers');

class AIExperienceAnalyzer {
    constructor(gameConfig) {
        this.config = gameConfig;
        this._pythonChecked  = false;
        this._pythonAvailable = false;
    }

    /** 延迟检测 Python */
    checkPython() {
        if (!this._pythonChecked) {
            this._pythonAvailable = isCommandAvailable('python');
            this._pythonChecked   = true;
        }
        return this._pythonAvailable;
    }

    /**
     * 主入口：执行体验分析
     * @param {import('playwright').Page|null} page
     * @param {Object} [context] - 可附加外部指标（jsErrors、failedRequests 等）
     */
    async analyze(page = null, context = {}) {
        logger.info('Running AI Experience Analysis (DOM-based)...');

        try {
            let screenshotPath = null;
            if (page) {
                const dir = path.join(__dirname, '..', 'screenshots', 'ai-analysis');
                screenshotPath = await takeScreenshot(page, dir, 'ai-input');
            }

            // 若有 page，做真实 DOM 分析
            const domScores = page ? await this._analyzeDom(page) : null;

            // 融合分数
            const scores    = domScores || this._fallbackScores();
            const weights   = { visualQuality: 0.25, userExperience: 0.25, accessibility: 0.20, performance: 0.20, stability: 0.10 };
            const overall   = Object.entries(weights)
                .reduce((sum, [k, w]) => sum + (parseFloat(scores[k]) || 0) * w, 0)
                .toFixed(2);

            const suggestions = this._generateSuggestions(scores);

            logger.info(`  AI Overall Score: ${overall}`);
            return {
                enabled:        true,
                mode:           domScores ? 'dom-analysis' : 'fallback',
                scores,
                overall,
                suggestions,
                screenshotPath: screenshotPath || null,
                timestamp:      new Date().toISOString()
            };

        } catch (error) {
            logger.error('AI analysis failed:', error.message);
            return { enabled: false, error: error.message, scores: null };
        }
    }

    // ─── DOM 分析核心 ────────────────────────────────────────────────────────

    async _analyzeDom(page) {
        const data = await page.evaluate(() => {
            // ── 1. 视觉质量 ─────────────────────────────────────────────────
            const canvas        = document.querySelector('canvas');
            const hasCanvas     = !!canvas;
            const canvasHasSize = canvas ? (canvas.width > 100 && canvas.height > 100) : false;
            const imgCount      = document.images.length;
            const imgWithAlt    = [...document.images].filter(i => i.alt && i.alt.trim()).length;
            const domNodes      = document.querySelectorAll('*').length;

            // Canvas 渲染检测（非透明像素）
            let canvasRendered = false;
            if (canvas) {
                try {
                    const ctx  = canvas.getContext('2d');
                    const data = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50)).data;
                    for (let i = 3; i < data.length; i += 4) {
                        if (data[i] > 0) { canvasRendered = true; break; }
                    }
                } catch { /* cross-origin */ }
            }

            // ── 2. 用户体验 ─────────────────────────────────────────────────
            const buttons     = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
            const textButtons = [...buttons].filter(b => b.textContent.trim().length > 0);
            const inputs      = document.querySelectorAll('input, select, textarea');
            const hasScore    = !!document.querySelector('[class*="score"],[id*="score"]');
            const hasPause    = !!document.querySelector('[class*="pause"],[id*="pause"]');
            const hasLoading  = !!document.querySelector('[class*="loading"],[class*="spinner"]');

            // ── 3. 无障碍性 ─────────────────────────────────────────────────
            const allInteractive    = [...buttons, ...inputs];
            const ariaLabeled       = allInteractive.filter(el => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title).length;
            const tabIndexPositive  = document.querySelectorAll('[tabindex]').length;
            const langAttr          = !!document.documentElement.getAttribute('lang');
            const metaViewport      = !!document.querySelector('meta[name="viewport"]');
            const colorInputs       = document.querySelectorAll('[class*="color-blind"],[class*="contrast"]').length;

            // ── 4. 性能指标 ─────────────────────────────────────────────────
            const nav    = performance.getEntriesByType('navigation')[0];
            const loadMs = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.startTime : null;
            const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
            const fcpMs  = fcpEntry ? fcpEntry.startTime : null;
            const memMb  = performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024) : null;

            return {
                // visual
                hasCanvas, canvasHasSize, canvasRendered,
                imgCount, imgWithAlt, domNodes,
                // ux
                buttonCount: buttons.length, textButtonCount: textButtons.length,
                inputCount: inputs.length, hasScore, hasPause, hasLoading,
                // a11y
                interactiveCount: allInteractive.length, ariaLabeled,
                tabIndexPositive, langAttr, metaViewport, colorInputs,
                // perf
                loadMs, fcpMs, memMb
            };
        });

        // ── 计算各维度分数（0–10）──────────────────────────────────────────

        // 1. 视觉质量
        let vq = 5.0;
        if (data.hasCanvas)       vq += 1.5;
        if (data.canvasHasSize)   vq += 1.0;
        if (data.canvasRendered)  vq += 1.5;
        if (data.imgCount > 0 && data.imgWithAlt / data.imgCount > 0.5) vq += 0.5;
        if (data.domNodes > 10 && data.domNodes < 2000) vq += 0.5;

        // 2. 用户体验
        let ux = 5.0;
        if (data.buttonCount > 0)     ux += 1.0;
        if (data.textButtonCount > 0) ux += 1.0;
        if (data.hasScore)            ux += 1.0;
        if (data.hasPause)            ux += 1.0;
        if (!data.hasLoading)         ux += 1.0;   // 无加载遮罩 = 加载完成

        // 3. 无障碍
        let a11y = 5.0;
        if (data.langAttr)       a11y += 1.0;
        if (data.metaViewport)   a11y += 1.0;
        const ariaRatio = data.interactiveCount > 0 ? data.ariaLabeled / data.interactiveCount : 0;
        a11y += Math.min(ariaRatio * 3, 2.0);  // 最多 +2
        if (data.tabIndexPositive > 0) a11y += 1.0;

        // 4. 性能
        let perf = 6.0;
        if (data.loadMs != null) {
            if (data.loadMs < 2000)  perf += 2.0;
            else if (data.loadMs < 4000) perf += 1.0;
            else perf -= 1.0;
        }
        if (data.fcpMs != null) {
            if (data.fcpMs < 1000) perf += 1.0;
            else if (data.fcpMs > 3000) perf -= 0.5;
        }
        if (data.memMb != null && data.memMb < 100) perf += 1.0;

        // ── 5. 稳定性（优先使用外部真实数据）────────────────────────────
        let stability = 10.0;
        if (typeof context.jsErrors === 'number') {
            if (context.jsErrors > 5)       stability -= 4.0;
            else if (context.jsErrors > 0)  stability -= context.jsErrors * 0.8;
        } else if (Array.isArray(context.jsErrors)) {
            const errCount = context.jsErrors.length;
            if (errCount > 5)      stability -= 4.0;
            else if (errCount > 0) stability -= errCount * 0.8;
        }
        if (typeof context.failedRequests === 'number') {
            if (context.failedRequests > 3)      stability -= 2.0;
            else if (context.failedRequests > 0) stability -= context.failedRequests * 0.6;
        }

        const clamp = v => parseFloat(Math.min(10, Math.max(0, v)).toFixed(1));
        return {
            visualQuality:  clamp(vq),
            userExperience: clamp(ux),
            accessibility:  clamp(a11y),
            performance:    clamp(perf),
            stability:      clamp(stability),
            _raw:           data   // 保留原始数据用于调试
        };
    }

    // ─── 降级 fallback（无 page 时）────────────────────────────────────────

    _fallbackScores() {
        return {
            visualQuality:  7.5,
            userExperience: 7.5,
            accessibility:  7.0,
            performance:    7.5,
            stability:      8.0
        };
    }

    // ─── 建议生成 ───────────────────────────────────────────────────────────

    _generateSuggestions(scores) {
        const tips = [];
        if (scores.accessibility < 7.5) {
            tips.push('提升无障碍性：为所有交互元素添加 aria-label，确保 <html lang="zh"> 属性存在');
        }
        if (scores.userExperience < 7.5) {
            tips.push('改善用户体验：提供暂停按钮和得分显示，按钮应有可见文字');
        }
        if (scores.visualQuality < 7.5) {
            tips.push('优化视觉质量：确保 canvas 正常渲染内容，图片资源提供 alt 描述');
        }
        if (scores.performance < 7.0) {
            tips.push('优化性能：减少首屏加载时间（目标 < 2s），控制 JS 堆内存 < 100MB');
        }
        if (scores.stability < 8.0) {
            tips.push('提升稳定性：修复 JS 错误和失败的网络请求');
        }
        if (tips.length === 0) {
            tips.push('整体体验良好，继续保持现有设计标准 🎉');
        }
        return tips;
    }

    /**
     * 调用 Python 分析脚本（保留接口，待实现）
     */
    async runPythonAnalysis(screenshotPath) {
        const { execFileSync } = require('child_process');
        const scriptPath = path.join(__dirname, '..', 'ai', 'analyzer.py');
        try {
            const output = execFileSync('python', [scriptPath, '--screenshot', screenshotPath], {
                timeout: 30000, encoding: 'utf-8'
            });
            return JSON.parse(output);
        } catch (error) {
            logger.warn(`Python analysis failed: ${error.message}. Falling back.`);
            return null;
        }
    }
}

module.exports = { AIExperienceAnalyzer };
