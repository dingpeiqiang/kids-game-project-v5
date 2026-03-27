/**
 * TrendAnalyzer - 历史测试趋势分析器
 * 功能：
 *   1. 读取历史 JSON 报告，解析时序数据
 *   2. 检测性能回归（指标变差超过阈值）
 *   3. 生成趋势摘要（pass rate、load time、FPS 趋势）
 *   4. 供 ReportGenerator 生成图表数据
 */

const fs   = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// 默认回归检测阈值（相对变化率）
const REGRESSION_DEFAULTS = {
    loadTime:             0.20,   // 加载时间恶化 > 20%
    frameRate:            0.15,   // 帧率下降   > 15%
    memoryUsage:          0.25,   // 内存增加   > 25%
    firstContentfulPaint: 0.20,   // FCP 恶化   > 20%
};

class TrendAnalyzer {
    /**
     * @param {string} reportsDir - 报告目录（默认 reports/）
     * @param {number} maxHistory - 最多读取多少份历史报告（默认 10）
     */
    constructor(reportsDir, maxHistory = 10) {
        this.reportsDir = reportsDir || path.resolve(__dirname, '../../reports');
        this.maxHistory = maxHistory;
        this._cache     = null;
    }

    // ─── 读取历史报告 ────────────────────────────────────────────

    /**
     * 加载并排序历史 JSON 报告（最新在前）
     * @returns {Array<Object>} 报告数组
     */
    loadHistory() {
        if (this._cache) return this._cache;

        if (!fs.existsSync(this.reportsDir)) {
            logger.info('[TrendAnalyzer] No reports directory found, skipping trend analysis');
            this._cache = [];
            return [];
        }

        const files = fs.readdirSync(this.reportsDir)
            .filter(f => f.startsWith('report-') && f.endsWith('.json'))
            .sort()
            .reverse()            // 最新在前
            .slice(0, this.maxHistory);

        const reports = [];
        for (const file of files) {
            try {
                const raw  = fs.readFileSync(path.join(this.reportsDir, file), 'utf-8');
                const data = JSON.parse(raw);
                // 统一：用报告文件名时间戳 或 meta.generatedAt
                data._file = file;
                data._ts   = data.meta?.generatedAt || this._extractTimestampFromFilename(file);
                reports.push(data);
            } catch (e) {
                logger.warn(`[TrendAnalyzer] Failed to parse ${file}: ${e.message}`);
            }
        }

        logger.info(`[TrendAnalyzer] Loaded ${reports.length} historical reports`);
        this._cache = reports;
        return reports;
    }

    _extractTimestampFromFilename(filename) {
        // report-2026-03-27T10-30-00.json
        const match = filename.match(/report-(.+)\.json$/);
        if (match) {
            return match[1].replace(/-(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
        }
        return new Date().toISOString();
    }

    // ─── 趋势数据提取 ────────────────────────────────────────────

    /**
     * 提取所有游戏的通过率时序数据
     * @returns {Array<{ts, passRate, passed, failed, total}>}
     */
    getPassRateTrend() {
        return this.loadHistory().map(r => ({
            ts:       r._ts,
            passRate: this._calcPassRate(r.overall),
            passed:   r.overall?.passed   ?? 0,
            failed:   r.overall?.failed   ?? 0,
            warned:   r.overall?.warned   ?? 0,
            total:    r.overall?.total    ?? 0
        })).reverse(); // 按时间正序
    }

    /**
     * 提取指定游戏的某个性能指标时序数据
     * @param {string} gameName
     * @param {string} metric  - 如 'loadTime' | 'frameRate' | 'memoryUsage' | 'firstContentfulPaint'
     * @returns {Array<{ts, value}>}
     */
    getMetricTrend(gameName, metric) {
        return this.loadHistory().map(r => {
            const game = (r.games || []).find(g => g.name === gameName);
            return {
                ts:    r._ts,
                value: game?.metrics?.[metric] ?? null
            };
        }).filter(d => d.value !== null).reverse();
    }

    /**
     * 获取所有游戏的所有关键指标趋势（用于报告图表）
     * @returns {Object} { [gameName]: { [metric]: [{ts, value}] } }
     */
    getAllGameMetricTrends() {
        const history = this.loadHistory();
        if (history.length === 0) return {};

        // 取第一份报告的游戏列表作为参考
        const gameNames  = (history[0].games || []).map(g => g.name);
        const keyMetrics = ['loadTime', 'frameRate', 'memoryUsage', 'firstContentfulPaint', 'largestContentfulPaint'];

        const result = {};
        for (const game of gameNames) {
            result[game] = {};
            for (const metric of keyMetrics) {
                result[game][metric] = this.getMetricTrend(game, metric);
            }
        }
        return result;
    }

    // ─── 回归检测 ────────────────────────────────────────────────

    /**
     * 将最新报告与前一份对比，检测性能回归
     * @param {Object} [overrides] - 自定义阈值 { loadTime: 0.3, ... }
     * @returns {Array<RegressionItem>}
     */
    detectRegressions(overrides = {}) {
        const history = this.loadHistory();
        if (history.length < 2) {
            logger.info('[TrendAnalyzer] Not enough history for regression detection (need ≥ 2 reports)');
            return [];
        }

        const [latest, prev] = history; // 最新, 前一份
        const thresholds = Object.assign({}, REGRESSION_DEFAULTS, overrides);
        const regressions = [];

        for (const latestGame of (latest.games || [])) {
            const prevGame = (prev.games || []).find(g => g.name === latestGame.name);
            if (!prevGame) continue;

            const lm = latestGame.metrics || {};
            const pm = prevGame.metrics   || {};

            for (const [metric, threshold] of Object.entries(thresholds)) {
                const lv = lm[metric];
                const pv = pm[metric];
                if (lv == null || pv == null || pv === 0) continue;

                const delta   = (lv - pv) / pv;      // 正值=变差，负值=改善
                const isWorse = metric === 'frameRate'
                    ? delta < -threshold              // 帧率降低才是变差
                    : delta > threshold;              // 其他指标增大才是变差

                if (isWorse) {
                    regressions.push({
                        game:      latestGame.name,
                        metric,
                        prevValue: pv,
                        newValue:  lv,
                        changePct: (delta * 100).toFixed(1),
                        threshold: (threshold * 100).toFixed(0) + '%',
                        severity:  Math.abs(delta) > threshold * 2 ? 'critical' : 'warning',
                        message:   `${latestGame.name} [${metric}]: ${pv} → ${lv} (${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}%)`
                    });
                }
            }

            // 检测游戏状态变化（PASSED → FAILED）
            if (prevGame.status === 'PASSED' && (latestGame.status === 'FAILED' || latestGame.status === 'ERROR')) {
                regressions.push({
                    game:     latestGame.name,
                    metric:   'status',
                    prevValue: prevGame.status,
                    newValue:  latestGame.status,
                    changePct: 'N/A',
                    threshold: 'N/A',
                    severity:  'critical',
                    message:   `${latestGame.name}: status regression ${prevGame.status} → ${latestGame.status}`
                });
            }
        }

        if (regressions.length > 0) {
            logger.warn(`[TrendAnalyzer] Detected ${regressions.length} regression(s):`);
            regressions.forEach(r => logger.warn(`  ⚠ ${r.message}`));
        } else {
            logger.info('[TrendAnalyzer] No regressions detected ✓');
        }

        return regressions;
    }

    // ─── 综合摘要 ────────────────────────────────────────────────

    /**
     * 生成完整趋势摘要（用于嵌入报告）
     * @returns {Object}
     */
    getSummary() {
        const history      = this.loadHistory();
        const passRateTrend = this.getPassRateTrend();
        const regressions  = this.detectRegressions();
        const gameTrends   = this.getAllGameMetricTrends();

        // 近 N 次平均通过率
        const avgPassRate  = passRateTrend.length > 0
            ? (passRateTrend.reduce((s, d) => s + d.passRate, 0) / passRateTrend.length).toFixed(1)
            : null;

        // 通过率趋势方向
        const trend = this._calcTrendDirection(passRateTrend.map(d => d.passRate));

        return {
            historyCount:   history.length,
            avgPassRate,
            passRateTrend,
            gameTrends,
            regressions,
            regressionCount: regressions.length,
            criticalRegressions: regressions.filter(r => r.severity === 'critical').length,
            trendDirection: trend,   // 'improving' | 'stable' | 'degrading' | 'insufficient_data'
            generatedAt:    new Date().toISOString()
        };
    }

    // ─── 私有工具 ────────────────────────────────────────────────

    _calcPassRate(overall) {
        if (!overall || !overall.total) return 0;
        return parseFloat(((overall.passed / overall.total) * 100).toFixed(1));
    }

    /**
     * 简单线性回归判断趋势方向
     * @param {number[]} values
     * @returns {string}
     */
    _calcTrendDirection(values) {
        if (values.length < 3) return 'insufficient_data';
        const n = values.length;
        // 用后半段均值 vs 前半段均值
        const mid  = Math.floor(n / 2);
        const old  = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const recent = values.slice(mid).reduce((a, b) => a + b, 0) / (n - mid);
        const diff = recent - old;
        if (diff > 5)  return 'improving';
        if (diff < -5) return 'degrading';
        return 'stable';
    }
}

module.exports = { TrendAnalyzer };
