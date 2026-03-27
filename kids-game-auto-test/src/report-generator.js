/**
 * 报告生成器
 * 功能：生成 HTML、Excel、JSON 格式的测试报告
 *
 * 优化点：
 * - 使用 day.js 替代 moment（更轻量，但保持 moment 兼容）
 * - HTML 报告增加性能指标可视化（进度条）、测试耗时、截图链接
 * - 增加测试通过率进度圈（CSS only）
 * - Excel 增加性能工作表
 * - JSON 报告包含完整结构
 * - generateSummary 缓存避免重复计算
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const { ensureDir, formatDuration, calcDuration } = require('./utils/helpers');
const { TrendAnalyzer } = require('./reporters/trend-analyzer');

// 尝试使用 moment，失败则用简易格式化
let formatTime;
try {
    const moment = require('moment');
    formatTime = () => moment().format('YYYY-MM-DD HH:mm:ss');
} catch {
    formatTime = () => new Date().toLocaleString('zh-CN');
}

class ReportGenerator {
    constructor(results, config = {}) {
        this.results = results;
        this.config = config;
        this.outputDir = path.resolve(__dirname, '..', 
            (config.reporting && config.reporting.outputDir) || 'reports');
        ensureDir(this.outputDir);
        this._summary = null; // 缓存
        this._trend   = null; // 趋势数据缓存
        this._trendAnalyzer = new TrendAnalyzer(this.outputDir);
    }

    /** 懒加载趋势摘要（先写 JSON 再读，所以调用时机在 generate() 内） */
    _getTrendSummary() {
        if (this._trend) return this._trend;
        try {
            this._trend = this._trendAnalyzer.getSummary();
        } catch (e) {
            logger.warn(`[ReportGenerator] TrendAnalyzer error: ${e.message}`);
            this._trend = { historyCount: 0, regressionCount: 0, criticalRegressions: 0, trendDirection: 'insufficient_data', passRateTrend: [], gameTrends: {}, regressions: [] };
        }
        return this._trend;
    }

    generate() {
        logger.info('Generating reports...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        try {
            // 先写 JSON（让 TrendAnalyzer 能读到最新报告）
            this.generateJSONReport(timestamp);
            // 重置趋势缓存（因为 JSON 刚写好，需要重新加载）
            this._trend = null;
            this._trendAnalyzer._cache = null;
            this.generateHTMLReport(timestamp);
            this.tryGenerateExcelReport(timestamp);
            logger.info(`✓ All reports saved to: ${this.outputDir}`);
        } catch (error) {
            logger.error('Report generation failed:', error);
            throw error;
        }
    }

    // ─── JSON 报告 ────────────────────────────────────────────────────

    generateJSONReport(timestamp) {
        const filePath = path.join(this.outputDir, `report-${timestamp}.json`);
        const report = {
            meta: {
                generatedAt: new Date().toISOString(),
                version: '1.0.0',
                platform: 'kids-game-auto-test'
            },
            summary: this.getSummary(),
            overall: this.results.overall,
            duration: this.results.duration,
            startTime: this.results.startTime,
            endTime: this.results.endTime,
            games: this.results.games
        };
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
        logger.info(`✓ JSON report: ${filePath}`);
    }

    // ─── HTML 报告 ────────────────────────────────────────────────────

    generateHTMLReport(timestamp) {
        const filePath = path.join(this.outputDir, `report-${timestamp}.html`);
        const html = this.buildHTMLTemplate();
        fs.writeFileSync(filePath, html, 'utf-8');
        logger.info(`✓ HTML report: ${filePath}`);
    }

    buildHTMLTemplate() {
        const summary = this.getSummary();
        const passRateNum = parseFloat(summary.passRate) || 0;

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kids Game Auto Test Report</title>
    <style>
        :root {
            --color-pass:    #22c55e;
            --color-fail:    #ef4444;
            --color-warn:    #f59e0b;
            --color-info:    #3b82f6;
            --color-bg:      #f1f5f9;
            --color-surface: #ffffff;
            --color-border:  #e2e8f0;
            --color-text:    #1e293b;
            --color-muted:   #64748b;
            --radius:        8px;
            --shadow:        0 1px 3px rgba(0,0,0,0.1);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
        }
        .container { max-width: 1280px; margin: 0 auto; padding: 24px 20px; }

        /* ── Header ── */
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 32px 40px;
            border-radius: var(--radius);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .header h1 { font-size: 1.8rem; font-weight: 700; }
        .header .meta { font-size: 0.85rem; opacity: 0.7; margin-top: 4px; }
        .header .logo { font-size: 3rem; }

        /* ── Summary cards ── */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: var(--color-surface);
            border-radius: var(--radius);
            padding: 20px;
            box-shadow: var(--shadow);
            text-align: center;
            border-top: 4px solid var(--color-info);
        }
        .stat-card.green { border-top-color: var(--color-pass); }
        .stat-card.red   { border-top-color: var(--color-fail); }
        .stat-card.amber { border-top-color: var(--color-warn); }
        .stat-card .label { font-size: 0.8rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; }
        .stat-card .value { font-size: 2.2rem; font-weight: 700; margin: 6px 0; }
        .stat-card.green .value { color: var(--color-pass); }
        .stat-card.red   .value { color: var(--color-fail); }
        .stat-card.amber .value { color: var(--color-warn); }

        /* ── Pass Rate Ring ── */
        .pass-rate-card {
            background: var(--color-surface);
            border-radius: var(--radius);
            padding: 20px;
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .ring-wrap { position: relative; width: 90px; height: 90px; }
        .ring-wrap svg { transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: var(--color-border); stroke-width: 8; }
        .ring-fg { fill: none; stroke: var(--color-pass); stroke-width: 8; stroke-linecap: round;
            stroke-dasharray: 251.2; stroke-dashoffset: ${(100 - passRateNum) / 100 * 251.2}; transition: stroke-dashoffset .8s; }
        .ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem; font-weight: 700; color: var(--color-pass); }

        /* ── Performance bar ── */
        .perf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .perf-card { background: var(--color-surface); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
        .perf-card h4 { margin-bottom: 12px; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; }
        .metric-row { margin: 8px 0; }
        .metric-label { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px; }
        .metric-bar-bg { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
        .metric-bar-fill { height: 100%; border-radius: 3px; transition: width .5s; }
        .metric-bar-fill.good  { background: var(--color-pass); }
        .metric-bar-fill.warn  { background: var(--color-warn); }
        .metric-bar-fill.bad   { background: var(--color-fail); }

        /* ── Game section ── */
        .section-title { font-size: 1.2rem; font-weight: 600; margin: 28px 0 16px; color: var(--color-text); }
        .game-card { background: var(--color-surface); border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 20px; overflow: hidden; }
        .game-header {
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--color-border);
            background: #f8fafc;
        }
        .game-header h3 { font-size: 1rem; font-weight: 600; }
        .game-meta { font-size: 0.8rem; color: var(--color-muted); margin-top: 2px; }
        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-PASSED  { background: #dcfce7; color: #15803d; }
        .badge-FAILED  { background: #fee2e2; color: #b91c1c; }
        .badge-WARNED  { background: #fef9c3; color: #92400e; }
        .badge-ERROR   { background: #fef3c7; color: #92400e; }
        .badge-WARNING { background: #fef3c7; color: #92400e; }
        .badge-INFO    { background: #dbeafe; color: #1e40af; }

        .game-body { padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--color-border); }
        th { background: #f8fafc; font-weight: 600; color: var(--color-muted); font-size: 0.8rem; text-transform: uppercase; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }

        /* ── Issues ── */
        .issues-list { margin-top: 16px; }
        .issue-item {
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 0.875rem;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            border-left: 4px solid var(--color-warn);
            background: #fffbeb;
        }
        .issue-item.critical { border-left-color: var(--color-fail); background: #fef2f2; }
        .issue-item.info     { border-left-color: var(--color-info); background: #eff6ff; }
        .issue-icon { flex-shrink: 0; font-size: 1rem; }

        /* ── Footer ── */
        .footer { text-align: center; color: var(--color-muted); font-size: 0.8rem; margin-top: 40px; padding: 20px 0; border-top: 1px solid var(--color-border); }

        /* ── Trend section ── */
        .trend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .trend-card { background: var(--color-surface); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
        .trend-card h4 { margin-bottom: 14px; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: .05em; }
        .trend-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
        .trend-improving { background: #dcfce7; color: #15803d; }
        .trend-degrading  { background: #fee2e2; color: #b91c1c; }
        .trend-stable     { background: #dbeafe; color: #1e40af; }
        .trend-insufficient { background: #f1f5f9; color: #64748b; }
        .regression-list { margin-top: 10px; }
        .regression-item { padding: 7px 10px; border-radius: 5px; font-size: 0.82rem; margin-bottom: 6px; }
        .regression-critical { background: #fef2f2; border-left: 3px solid #ef4444; }
        .regression-warning  { background: #fffbeb; border-left: 3px solid #f59e0b; }
    </style>
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="header">
        <div class="logo">🎮</div>
        <div>
            <h1>Kids Game Auto Test Report</h1>
            <div class="meta">Generated: ${formatTime()} &nbsp;|&nbsp; Duration: ${formatDuration(this.results.duration)} &nbsp;|&nbsp; Platform: kids-game-auto-test v1.0.0</div>
        </div>
    </div>

    <!-- Summary cards -->
    <div class="summary-grid">
        <div class="stat-card">
            <div class="label">Total Games</div>
            <div class="value">${summary.totalGames}</div>
        </div>
        <div class="stat-card green">
            <div class="label">Passed</div>
            <div class="value">${summary.passed}</div>
        </div>
        <div class="stat-card red">
            <div class="label">Failed</div>
            <div class="value">${summary.failed}</div>
        </div>
        <div class="stat-card amber">
            <div class="label">Warned</div>
            <div class="value">${summary.warned || 0}</div>
        </div>
        <div class="stat-card amber">
            <div class="label">Issues</div>
            <div class="value">${summary.totalIssues}</div>
        </div>
        <div class="stat-card red">
            <div class="label">Critical</div>
            <div class="value">${summary.criticalIssues}</div>
        </div>
        <div class="pass-rate-card">
            <div class="label" style="font-size:.75rem;color:var(--color-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Pass Rate</div>
            <div class="ring-wrap">
                <svg viewBox="0 0 90 90" width="90" height="90">
                    <circle class="ring-bg" cx="45" cy="45" r="40"/>
                    <circle class="ring-fg" cx="45" cy="45" r="40"/>
                </svg>
                <div class="ring-text">${summary.passRate}%</div>
            </div>
        </div>
    </div>

    <!-- Performance overview (aggregate across all games) -->
    ${this.buildPerformanceSection()}

    <!-- Trend Analysis -->
    ${this.buildTrendSection()}

    <!-- Game details -->
    <div class="section-title">📋 Game Test Details</div>
    ${this.results.games.map(g => this.buildGameCard(g)).join('\n')}

    <div class="footer">Kids Game Auto Test Platform &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Report generated at ${formatTime()}</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
${this.buildChartScript()}
</script>
</body>
</html>`;
    }

    buildPerformanceSection() {
        const gamesWithMetrics = this.results.games.filter(g => g.metrics && Object.keys(g.metrics).length > 0);
        if (gamesWithMetrics.length === 0) return '';

        const cards = gamesWithMetrics.map(game => {
            const m = game.metrics;
            const rows = [
                { label: 'Load Time', value: m.loadTime != null ? formatDuration(m.loadTime) : 'N/A', ratio: m.loadTime ? Math.min(m.loadTime / 5000, 1) : 0, threshold: 5000, rawValue: m.loadTime },
                { label: 'FCP', value: m.firstContentfulPaint != null ? formatDuration(m.firstContentfulPaint) : 'N/A', ratio: m.firstContentfulPaint ? Math.min(m.firstContentfulPaint / 3000, 1) : 0, threshold: 1800, rawValue: m.firstContentfulPaint },
                { label: 'LCP', value: m.largestContentfulPaint != null ? formatDuration(m.largestContentfulPaint) : 'N/A', ratio: m.largestContentfulPaint ? Math.min(m.largestContentfulPaint / 5000, 1) : 0, threshold: 2500, rawValue: m.largestContentfulPaint },
                { label: 'Frame Rate', value: m.frameRate != null ? `${m.frameRate} FPS` : 'N/A', ratio: m.frameRate ? Math.min(m.frameRate / 60, 1) : 0, threshold: 30, rawValue: m.frameRate, invertedCheck: true },
                { label: 'Memory', value: m.memoryUsage != null ? `${m.memoryUsage} MB` : 'N/A', ratio: m.memoryUsage ? Math.min(m.memoryUsage / 512, 1) : 0, threshold: 512, rawValue: m.memoryUsage }
            ];

            return `
        <div class="perf-card">
            <h4>📊 ${game.displayName || game.name}</h4>
            ${rows.map(r => {
                let cls = 'good';
                if (r.rawValue != null) {
                    if (r.invertedCheck) {
                        cls = r.rawValue >= r.threshold ? 'good' : (r.rawValue >= r.threshold * 0.7 ? 'warn' : 'bad');
                    } else {
                        cls = r.rawValue <= r.threshold ? 'good' : (r.rawValue <= r.threshold * 1.5 ? 'warn' : 'bad');
                    }
                }
                return `
            <div class="metric-row">
                <div class="metric-label"><span>${r.label}</span><span>${r.value}</span></div>
                <div class="metric-bar-bg"><div class="metric-bar-fill ${cls}" style="width:${(r.ratio * 100).toFixed(1)}%"></div></div>
            </div>`;
            }).join('')}
        </div>`;
        }).join('\n');

        return `<div class="section-title">📈 Performance Metrics</div><div class="perf-grid">${cards}</div>`;
    }

    buildGameCard(game) {
        const status = game.status || 'UNKNOWN';
        const duration = game.duration ? formatDuration(game.duration) : 'N/A';
        const totalTests = game.tests ? game.tests.length : 0;
        const passedTests = game.tests ? game.tests.filter(t => t.status === 'PASSED').length : 0;

        return `
    <div class="game-card">
        <div class="game-header">
            <div>
                <h3>${game.displayName || game.name}</h3>
                <div class="game-meta">${totalTests} tests &nbsp;·&nbsp; ${passedTests}/${totalTests} passed &nbsp;·&nbsp; ${duration}</div>
            </div>
            <span class="badge badge-${status}">${status}</span>
        </div>
        <div class="game-body">
            ${this.buildTestTable(game.tests || [])}
            ${this.buildIssuesList(game.issues || [])}
        </div>
    </div>`;
    }

    buildTestTable(tests) {
        if (!tests || tests.length === 0) return '<p style="color:var(--color-muted);font-size:.875rem;">No tests executed.</p>';

        const rows = tests.map(t => `
                <tr>
                    <td>${t.name}</td>
                    <td><span class="badge badge-${t.status}">${t.status}</span></td>
                    <td>${t.duration != null ? formatDuration(t.duration) : 'N/A'}</td>
                    <td style="color:var(--color-muted)">${t.details || t.error || '-'}</td>
                </tr>`).join('');

        return `
        <table>
            <thead><tr><th>Test</th><th>Status</th><th>Duration</th><th>Details</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    buildIssuesList(issues) {
        if (!issues || issues.length === 0) return '';
        const items = issues.map(issue => {
            const cls = issue.severity === 'critical' ? 'critical' : issue.severity === 'info' ? 'info' : '';
            const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
            return `<div class="issue-item ${cls}"><span class="issue-icon">${icon}</span><div><strong>[${(issue.severity || 'info').toUpperCase()}]</strong> ${issue.message || issue.type}</div></div>`;
        }).join('');
        return `<div class="issues-list"><strong style="font-size:.85rem;color:var(--color-muted);">ISSUES FOUND (${issues.length})</strong>${items}</div>`;
    }

    // ─── 趋势分析区块 ─────────────────────────────────────────────────

    buildTrendSection() {
        const trend = this._getTrendSummary();
        if (trend.historyCount < 2) return ''; // 历史数据不足，不显示

        const dirMap = {
            improving:         ['trend-improving', '📈 改善中'],
            degrading:         ['trend-degrading',  '📉 下降中'],
            stable:            ['trend-stable',     '➡️ 稳定'],
            insufficient_data: ['trend-insufficient','— 数据不足']
        };
        const [dirCls, dirLabel] = dirMap[trend.trendDirection] || dirMap.insufficient_data;

        // 回归告警列表
        const regressionHTML = trend.regressions.length > 0
            ? `<div class="regression-list">
                ${trend.regressions.map(r => `
                <div class="regression-item regression-${r.severity}">
                    <strong>${r.game}</strong> &nbsp;[${r.metric}]&nbsp;
                    ${r.prevValue} → <strong>${r.newValue}</strong>
                    &nbsp;<span style="color:#ef4444">(${r.changePct}%)</span>
                </div>`).join('')}
               </div>`
            : '<p style="color:var(--color-pass);font-size:.85rem;">✓ 无性能回归</p>';

        return `
    <div class="section-title">📊 历史趋势分析（最近 ${trend.historyCount} 次）</div>
    <div class="trend-grid">
        <div class="trend-card">
            <h4>通过率趋势</h4>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <span class="trend-badge ${dirCls}">${dirLabel}</span>
                <span style="font-size:.85rem;color:var(--color-muted);">近 ${trend.historyCount} 次平均通过率：<strong>${trend.avgPassRate ?? '—'}%</strong></span>
            </div>
            <canvas id="chart-passrate" height="140"></canvas>
        </div>
        <div class="trend-card">
            <h4>性能回归检测 &nbsp;<span style="font-size:.8rem;color:${trend.criticalRegressions > 0 ? '#ef4444' : '#22c55e'}">${trend.regressionCount} 项回归</span></h4>
            ${regressionHTML}
        </div>
    </div>`;
    }

    buildChartScript() {
        const trend = this._getTrendSummary();
        if (!trend || trend.passRateTrend.length < 2) return '// no trend data';

        const labels = trend.passRateTrend.map(d => {
            try { return new Date(d.ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
            catch { return d.ts; }
        });
        const passRates = trend.passRateTrend.map(d => d.passRate);

        return `
(function() {
    const el = document.getElementById('chart-passrate');
    if (!el || typeof Chart === 'undefined') return;
    new Chart(el.getContext('2d'), {
        type: 'line',
        data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
                label: '通过率 %',
                data: ${JSON.stringify(passRates)},
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#22c55e'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    min: 0, max: 100,
                    ticks: { callback: v => v + '%' },
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        }
    });
})();`;
    }

    // ─── Excel 报告 ───────────────────────────────────────────────────

    tryGenerateExcelReport(timestamp) {
        try {
            this.generateExcelReport(timestamp);
        } catch (error) {
            logger.warn(`Excel report skipped: ${error.message}`);
        }
    }

    generateExcelReport(timestamp) {
        const ExcelJS = require('exceljs');
        const filePath = path.join(this.outputDir, `report-${timestamp}.xlsx`);
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'kids-game-auto-test';
        workbook.created = new Date();

        // 总览工作表
        const summarySheet = workbook.addWorksheet('Summary');
        this.populateSummarySheet(summarySheet);

        // 每个游戏单独工作表
        for (const game of this.results.games) {
            const sheetName = (game.displayName || game.name).substring(0, 31); // Excel 限制 31 字符
            const sheet = workbook.addWorksheet(sheetName);
            this.populateGameSheet(sheet, game);
        }

        // 性能汇总工作表
        const perfSheet = workbook.addWorksheet('Performance');
        this.populatePerformanceSheet(perfSheet);

        workbook.xlsx.writeFile(filePath)
            .then(() => logger.info(`✓ Excel report: ${filePath}`))
            .catch(e => logger.warn(`Excel write failed: ${e.message}`));
    }

    populateSummarySheet(sheet) {
        const summary = this.getSummary();
        sheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value',  key: 'value',  width: 20 }
        ];
        // 标题样式
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        [
            ['Total Games', summary.totalGames],
            ['Passed', summary.passed],
            ['Failed', summary.failed],
            ['Warned', summary.warned || 0],
            ['Pass Rate', `${summary.passRate}%`],
            ['Total Tests', summary.totalTests],
            ['Total Issues', summary.totalIssues],
            ['Critical Issues', summary.criticalIssues],
            ['Duration', formatDuration(this.results.duration)],
            ['Start Time', this.results.startTime],
            ['End Time', this.results.endTime]
        ].forEach(([metric, value]) => sheet.addRow({ metric, value }));
    }

    populateGameSheet(sheet, game) {
        sheet.columns = [
            { header: 'Test Name', key: 'test', width: 30 },
            { header: 'Status',    key: 'status', width: 12 },
            { header: 'Duration',  key: 'duration', width: 16 },
            { header: 'Details',   key: 'details', width: 60 }
        ];
        sheet.getRow(1).font = { bold: true };

        for (const t of (game.tests || [])) {
            sheet.addRow({
                test: t.name,
                status: t.status,
                duration: t.duration != null ? formatDuration(t.duration) : 'N/A',
                details: t.details || t.error || ''
            });
        }
    }

    populatePerformanceSheet(sheet) {
        sheet.columns = [
            { header: 'Game',         key: 'game',     width: 30 },
            { header: 'Load Time',    key: 'loadTime', width: 16 },
            { header: 'FCP',          key: 'fcp',      width: 16 },
            { header: 'LCP',          key: 'lcp',      width: 16 },
            { header: 'TTI',          key: 'tti',      width: 16 },
            { header: 'Frame Rate',   key: 'fps',      width: 16 },
            { header: 'Memory (MB)',  key: 'memory',   width: 16 }
        ];
        sheet.getRow(1).font = { bold: true };

        for (const game of this.results.games) {
            const m = game.metrics || {};
            sheet.addRow({
                game: game.displayName || game.name,
                loadTime:  m.loadTime != null ? formatDuration(m.loadTime) : 'N/A',
                fcp:       m.firstContentfulPaint != null ? formatDuration(m.firstContentfulPaint) : 'N/A',
                lcp:       m.largestContentfulPaint != null ? formatDuration(m.largestContentfulPaint) : 'N/A',
                tti:       m.timeToInteractive != null ? formatDuration(m.timeToInteractive) : 'N/A',
                fps:       m.frameRate != null ? `${m.frameRate} FPS` : 'N/A',
                memory:    m.memoryUsage != null ? m.memoryUsage : 'N/A'
            });
        }
    }

    // ─── 摘要（带缓存）────────────────────────────────────────────────

    getSummary() {
        if (this._summary) return this._summary;

        const games = this.results.games || [];
        const totalTests = games.reduce((s, g) => s + (g.tests ? g.tests.length : 0), 0);
        const passedTests = games.reduce((s, g) => s + (g.tests ? g.tests.filter(t => t.status === 'PASSED').length : 0), 0);
        const totalIssues = games.reduce((s, g) => s + (g.issues ? g.issues.length : 0), 0);
        const criticalIssues = games.reduce((s, g) => s + (g.issues ? g.issues.filter(i => i.severity === 'critical').length : 0), 0);

        this._summary = {
            totalGames:    this.results.overall.total,
            passed:        this.results.overall.passed,
            failed:        this.results.overall.failed,
            warned:        this.results.overall.warned || 0,
            errored:       this.results.overall.errored || 0,
            passRate:      totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0',
            totalTests,
            totalIssues,
            criticalIssues
        };
        return this._summary;
    }
}

module.exports = { ReportGenerator };
