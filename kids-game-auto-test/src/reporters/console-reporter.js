/**
 * ConsoleReporter - 彩色终端摘要报告器
 * 在测试结束后输出一份可读性强的 ASCII 表格到控制台
 *
 * 用法：
 *   const { ConsoleReporter } = require('./reporters/console-reporter');
 *   ConsoleReporter.print(results);
 */

'use strict';

const { formatDuration } = require('../utils/helpers');

// ANSI 颜色代码（Node.js 终端）
const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    yellow: '\x1b[33m',
    blue:   '\x1b[34m',
    cyan:   '\x1b[36m',
    white:  '\x1b[37m',
    bgGreen:  '\x1b[42m',
    bgRed:    '\x1b[41m',
    bgYellow: '\x1b[43m'
};

/** 给字符串着色 */
function color(str, ...codes) {
    if (!process.stdout.isTTY) return str; // CI 环境不着色
    return codes.map(c => C[c] || c).join('') + str + C.reset;
}

/** 右对齐填充 */
function rpad(str, len) {
    return String(str).padEnd(len);
}

/** 状态对应颜色和图标 */
function statusLabel(status) {
    switch (status) {
        case 'PASSED':  return color(' PASSED ', 'bgGreen',  'bold');
        case 'FAILED':  return color(' FAILED ', 'bgRed',    'bold');
        case 'WARNED':  return color(' WARNED ', 'bgYellow', 'bold');
        case 'ERROR':   return color('  ERROR ', 'red',      'bold');
        case 'SKIPPED': return color('SKIPPED ', 'blue',     'bold');
        default:        return color(status.padEnd(8), 'dim');
    }
}

class ConsoleReporter {
    /**
     * 打印完整测试摘要
     * @param {Object} results - orchestrator 生成的 results 对象
     */
    static print(results) {
        const o   = results.overall || {};
        const dur = formatDuration(results.duration || 0);
        const W   = 68; // 表格宽度

        const line  = color('─'.repeat(W), 'dim');
        const dline = color('═'.repeat(W), 'cyan');

        console.log('\n' + dline);
        console.log(color(` 📊  Kids Game Auto Test — Report`, 'bold', 'cyan'));
        console.log(dline);

        // ── 总体统计 ────────────────────────────────────────────────────────
        const passRate = o.total > 0
            ? `${((o.passed / o.total) * 100).toFixed(1)}%` : '—';
        const overallColor = o.failed > 0 || o.errored > 0 ? 'red' : o.warned > 0 ? 'yellow' : 'green';
        const skippedStr = (o.skipped || 0) > 0 ? `  ⏭ ${color(o.skipped, 'blue', 'bold')}` : '';
        console.log(
            ` Total: ${color(o.total, 'bold')}` +
            `  ✅ ${color(o.passed, 'green', 'bold')}` +
            `  ❌ ${color(o.failed, 'red',   'bold')}` +
            `  ⚠️  ${color(o.warned, 'yellow', 'bold')}` +
            `  💥 ${color(o.errored || 0, 'red')}` +
            skippedStr +
            `  │  Pass Rate: ${color(passRate, overallColor, 'bold')}` +
            `  ⏱  ${color(dur, 'dim')}`
        );
        console.log(line);

        // ── 游戏详细表格 ────────────────────────────────────────────────────
        const colName    = 28;
        const colStatus  = 10;
        const colTests   = 10;
        const colIssues  = 8;
        const colTime    = 10;

        // 表头
        console.log(
            ' ' +
            color(rpad('Game', colName), 'bold', 'dim') +
            color(rpad('Status', colStatus), 'bold', 'dim') +
            color(rpad('Tests', colTests),  'bold', 'dim') +
            color(rpad('Issues', colIssues), 'bold', 'dim') +
            color(rpad('Time', colTime),    'bold', 'dim')
        );
        console.log(line);

        for (const g of (results.games || [])) {
            const passedTests = g.tests ? g.tests.filter(t => t.status === 'PASSED').length : 0;
            const totalTests  = g.tests ? g.tests.length : 0;
            const critCount   = g.issues ? g.issues.filter(i => i.severity === 'critical').length : 0;
            const warnCount   = g.issues ? g.issues.filter(i => i.severity === 'warning').length : 0;
            const issueStr    = critCount > 0
                ? color(`${critCount}C/${warnCount}W`, 'red')
                : warnCount > 0
                    ? color(`0C/${warnCount}W`, 'yellow')
                    : color('none', 'green');
            const testStr = g.status === 'SKIPPED'
                ? color('–/–', 'blue')
                : passedTests === totalTests
                    ? color(`${passedTests}/${totalTests}`, 'green')
                    : color(`${passedTests}/${totalTests}`, 'red');
            const name = (g.displayName || g.name || '').slice(0, colName - 2);
            const timeStr = g.status === 'SKIPPED' ? color('skipped', 'blue', 'dim') : color(rpad(formatDuration(g.duration || 0), colTime), 'dim');

            console.log(
                ' ' +
                rpad(name, colName) +
                statusLabel(g.status) + ' '.repeat(colStatus - 8) +
                rpad(testStr.replace(/\x1b\[[0-9;]*m/g, ''), colTests).replace(/(\d+\/\d+|-\/-)/, testStr) +
                rpad(issueStr.replace(/\x1b\[[0-9;]*m/g, ''), colIssues).replace(/(.+)/, issueStr) +
                timeStr
            );

            // SKIPPED 游戏：打印跳过原因
            if (g.status === 'SKIPPED') {
                const reason = g.issues && g.issues[0] ? g.issues[0].message : 'server not reachable';
                console.log(color(`   └─ ⏭ ${reason}`, 'blue', 'dim'));
                continue;
            }

            // 打印该游戏的 FAILED 测试（最多 3 条）
            if (g.tests) {
                const failedTests = g.tests.filter(t => t.status === 'FAILED' || t.status === 'ERROR');
                failedTests.slice(0, 3).forEach(t => {
                    console.log(color(`   └─ ✗ ${t.name}: ${(t.error || t.details || '').slice(0, 60)}`, 'red', 'dim'));
                });
                if (failedTests.length > 3) {
                    console.log(color(`   └─ ... and ${failedTests.length - 3} more failed tests`, 'dim'));
                }
            }
        }

        // ── AI 分数行（如果有） ──────────────────────────────────────────────
        const gamesWithAI = (results.games || []).filter(g => g.aiScores || g.aiScore);
        if (gamesWithAI.length > 0) {
            console.log(line);
            console.log(color(' 🤖  AI Quality Scores', 'bold', 'cyan'));
            for (const g of gamesWithAI) {
                const ai = g.aiScores || g.aiScore || {};
                const overall = ai.overall || '—';
                const parts = Object.entries(ai)
                    .filter(([k]) => k !== 'overall' && k !== '_raw')
                    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}:${v}`)
                    .join('  ');
                console.log(` ${(g.displayName || g.name).padEnd(colName)} overall=${color(overall, 'bold')}  ${color(parts, 'dim')}`);
            }
        }

        // ── 底部 ─────────────────────────────────────────────────────────────
        console.log(dline);
        console.log(color(` Reports saved to: reports/`, 'dim'));
        console.log(dline + '\n');
    }
}

module.exports = { ConsoleReporter };
