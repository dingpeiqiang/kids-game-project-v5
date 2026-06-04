/**
 * demo-report.js
 * 无需启动游戏服务器，用模拟数据生成一份完整 HTML/JSON/Excel 报告
 * 用途：快速预览报告效果、CI/CD 环境冒烟验证报告模块
 *
 * 运行：node examples/demo-report.js
 *       node examples/demo-report.js --open     (生成后自动用浏览器打开)
 *       node examples/demo-report.js --multi    (同时写入多份历史数据以触发趋势图)
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { ReportGenerator } = require('../src/report-generator');

// ─── CLI 参数 ────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const OPEN   = args.includes('--open');
const MULTI  = args.includes('--multi');  // 生成 3 份历史数据后再生成本次
const OUTPUT = path.resolve(__dirname, '../reports');

// ─── 模拟数据工厂 ────────────────────────────────────────────────────

function makeGameResult(name, displayName, opts = {}) {
    const pass = opts.pass ?? true;
    const warn = opts.warn ?? false;
    const fps  = opts.fps  ?? (55 + Math.round(Math.random() * 10));
    const mem  = opts.mem  ?? (80  + Math.round(Math.random() * 40));
    const load = opts.load ?? (800 + Math.round(Math.random() * 600));

    const tests = [
        { name: '页面标题检测',      status: 'PASSED', duration: 120,  details: `title="${displayName}"` },
        { name: 'Canvas 元素存在',   status: 'PASSED', duration: 350,  details: 'canvas found' },
        { name: 'Canvas 渲染内容检测', status: pass ? 'PASSED' : 'FAILED', duration: 1500, details: pass ? 'canvas has content' : 'Canvas appears empty', error: pass ? undefined : 'Canvas appears to be empty' },
        { name: '游戏启动', status: 'PASSED', duration: 800, details: 'clicked + Enter' },
        { name: '移动控制测试',      status: 'PASSED', duration: 1200, details: 'arrow keys responded' },
        { name: '游戏持续运行 5 秒', status: warn ? 'WARNED' : 'PASSED', duration: 5000, details: warn ? 'slight lag detected' : 'still rendering after 5s' },
        { name: '帧率采样',          status: fps >= 30 ? 'PASSED' : 'WARNED', duration: 2100, details: `FPS: ${fps}` },
        { name: '内存稳定性',        status: 'PASSED', duration: 3000, details: `delta: +${(Math.random() * 3).toFixed(2)}MB` }
    ];

    const passed = tests.filter(t => t.status === 'PASSED').length;
    const failed = tests.filter(t => t.status === 'FAILED').length;
    const warned = tests.filter(t => t.status === 'WARNED').length;

    const status = failed > 0 ? 'FAILED' : warned > 0 ? 'WARNED' : 'PASSED';

    return {
        name,
        displayName,
        status,
        duration: tests.reduce((s, t) => s + t.duration, 0),
        tests,
        metrics: {
            loadTime:             load,
            firstContentfulPaint: Math.round(load * 0.6),
            largestContentfulPaint: Math.round(load * 0.9),
            timeToInteractive:    load + 200,
            frameRate:            fps,
            memoryUsage:          mem,
            jsCpuTime:            Math.round(load * 0.3)
        },
        issues: failed > 0
            ? [{ severity: 'critical', message: `Canvas rendering failed for ${displayName}`, type: 'render_failure' }]
            : warned > 0
                ? [{ severity: 'warning', message: `FPS below 30 for ${displayName}: ${fps}`, type: 'performance_warn' }]
                : [],
        aiScore: { overall: Math.round(70 + Math.random() * 25), performance: Math.round(60 + Math.random() * 35), stability: Math.round(75 + Math.random() * 20) },
        logs: []
    };
}

function makeFullResult(seed = 0) {
    const games = [
        makeGameResult('plane-shooter',       '飞机大战',       { fps: 58 - seed * 2, mem: 85  + seed * 8,  load: 850  + seed * 100 }),
        makeGameResult('snake',               '贪吃蛇',         { fps: 60 - seed * 1, mem: 70  + seed * 5,  load: 700  + seed * 80  }),
        makeGameResult('tank-battle',         '坦克大战',       { fps: 55 - seed * 3, mem: 100 + seed * 10, load: 950  + seed * 120, warn: seed >= 2 }),
        makeGameResult('plants-vs-zombies',   '植物大战僵尸',   { fps: 50 - seed * 4, mem: 120 + seed * 12, load: 1100 + seed * 150, pass: seed < 3 })
    ];

    const passed = games.filter(g => g.status === 'PASSED').length;
    const failed = games.filter(g => g.status === 'FAILED').length;
    const warned = games.filter(g => g.status === 'WARNED').length;

    return {
        overall: { total: games.length, passed, failed, warned, errored: 0 },
        duration: games.reduce((s, g) => s + g.duration, 0),
        startTime: new Date(Date.now() - games.reduce((s, g) => s + g.duration, 0)).toISOString(),
        endTime:   new Date().toISOString(),
        games
    };
}

// ─── 写入历史 JSON（用于触发趋势图） ─────────────────────────────────

function writeHistoryJSON(seed, outputDir) {
    const data = makeFullResult(seed);
    const ts   = new Date(Date.now() - (3 - seed) * 3600 * 1000)
        .toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(outputDir, `report-${ts}.json`);
    const report = {
        meta: { generatedAt: new Date(Date.now() - (3 - seed) * 3600 * 1000).toISOString(), version: '1.2.0', platform: 'kids-game-auto-test' },
        summary: {},
        overall: data.overall,
        duration: data.duration,
        startTime: data.startTime,
        endTime:   data.endTime,
        games: data.games
    };
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`  [history] written: ${path.basename(file)}`);
}

// ─── 主流程 ─────────────────────────────────────────────────────────

(async () => {
    console.log('\n🎮  Kids Game Auto Test — Demo Report Generator\n');

    fs.mkdirSync(OUTPUT, { recursive: true });

    // 写入历史数据（可选）
    if (MULTI) {
        console.log('📚 Writing historical reports (3 runs)...');
        for (let i = 0; i < 3; i++) writeHistoryJSON(i, OUTPUT);
        console.log();
    }

    // 生成本次报告
    console.log('📝 Generating demo report...');
    const results   = makeFullResult(0);
    const generator = new ReportGenerator(results, {
        reporting: { outputDir: 'reports', formats: ['html', 'json', 'excel'] }
    });
    generator.generate();

    // 找到最新的 HTML
    const htmlFiles = fs.readdirSync(OUTPUT)
        .filter(f => f.startsWith('report-') && f.endsWith('.html'))
        .sort().reverse();

    if (htmlFiles.length > 0) {
        const htmlPath = path.join(OUTPUT, htmlFiles[0]);
        console.log(`\n✅  Report ready: ${htmlPath}`);

        if (OPEN) {
            const { exec } = require('child_process');
            const cmd = process.platform === 'win32' ? `start "" "${htmlPath}"`
                      : process.platform === 'darwin' ? `open "${htmlPath}"`
                      : `xdg-open "${htmlPath}"`;
            exec(cmd, err => {
                if (err) console.warn('  Could not auto-open browser:', err.message);
                else     console.log('  🌐 Opened in default browser');
            });
        } else {
            console.log('  Tip: run with --open to auto-open in browser');
            console.log('  Tip: run with --multi to generate trend chart data');
        }
    }
})().catch(e => {
    console.error('Demo report failed:', e);
    process.exit(1);
});
