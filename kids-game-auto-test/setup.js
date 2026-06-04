#!/usr/bin/env node
/**
 * Kids Game Auto Test - 环境安装脚本
 *
 * 功能：
 *   1. 检测 Node.js / npm 版本
 *   2. 安装 npm 依赖（npm install）
 *   3. 安装 Playwright 浏览器（chromium / all）
 *   4. 验证安装结果（实际启动浏览器冒烟测试）
 *   5. 检测 Python 环境（AI 分析模块可选）
 *
 * 用法：
 *   node setup.js                    # 安装依赖 + chromium（推荐）
 *   node setup.js --all-browsers     # 安装依赖 + chromium/firefox/webkit
 *   node setup.js --skip-browsers    # 仅安装 npm 依赖
 *   node setup.js --check-only       # 仅检测环境，不安装
 *   node setup.js --force            # 强制重新安装浏览器
 *   node setup.js --skip-verify      # 安装后跳过冒烟测试验证
 *   node setup.js --mirror           # 使用 npmmirror.com 镜像（中国加速）
 */

'use strict';

const { execSync, spawnSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─── 颜色 & 图标（零依赖）────────────────────────────────────────────────────

const c = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    blue:   '\x1b[34m',
    magenta:'\x1b[35m',
    gray:   '\x1b[90m'
};

const ICONS = {
    ok:      `${c.green}✓${c.reset}`,
    warn:    `${c.yellow}⚠${c.reset}`,
    fail:    `${c.red}✗${c.reset}`,
    info:    `${c.cyan}→${c.reset}`,
    bullet:  `${c.gray}·${c.reset}`,
    rocket:  '🚀',
    check:   '✅',
    cross:   '❌',
    clock:   '⏱',
    gear:    '⚙',
    browser: '🌐'
};

function ok(msg)      { console.log(`  ${ICONS.ok} ${msg}`); }
function warn(msg)    { console.log(`  ${ICONS.warn} ${c.yellow}${msg}${c.reset}`); }
function fail(msg)    { console.log(`  ${ICONS.fail} ${c.red}${msg}${c.reset}`); }
function info(msg)    { console.log(`  ${ICONS.info} ${msg}`); }
function step(msg)    { console.log(`${c.bold}${c.blue}${msg}${c.reset}`); }
function sub(msg)     { console.log(`     ${c.gray}${msg}${c.reset}`); }
function blank()      { console.log(''); }
function divider()    { console.log(`  ${c.gray}${'─'.repeat(50)}${c.reset}`); }

// ─── 参数解析 ─────────────────────────────────────────────────────────────────

const args         = process.argv.slice(2);
const allBrowsers  = args.includes('--all-browsers');
const skipBrowsers = args.includes('--skip-browsers');
const checkOnly    = args.includes('--check-only');
const forceInstall = args.includes('--force');
const skipVerify   = args.includes('--skip-verify');
const useMirror    = args.includes('--mirror');
const verbose      = args.includes('--verbose');

// 计时工具
const timer = { start: Date.now() };
function elapsed() {
    return `${c.gray}(+${((Date.now() - timer.start) / 1000).toFixed(1)}s)${c.reset}`;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
    printBanner();

    // ── 阶段 1：环境检测 ──────────────────────────────────────────
    const checks = await runChecks();
    printCheckSummary(checks);

    if (checkOnly) {
        info(`--check-only mode, installation skipped.`);
        process.exit(checks.critical ? 1 : 0);
    }

    if (checks.critical) {
        fail('Critical environment issues found. Please fix them before continuing.');
        blank();
        process.exit(1);
    }

    // ── 阶段 2：安装 npm 依赖 ─────────────────────────────────────
    await installDependencies();

    // ── 阶段 3：安装 Playwright 浏览器 ───────────────────────────
    if (!skipBrowsers) {
        await installPlaywrightBrowsers();
    } else {
        blank();
        step('[ 3/5 ] Installing Playwright Browsers');
        warn('Skipped (--skip-browsers)');
    }

    // ── 阶段 4：验证 Playwright 可用性（冒烟测试）────────────────
    if (!skipBrowsers && !skipVerify) {
        await verifyPlaywright();
    }

    // ── 阶段 5：检测 Python（可选）───────────────────────────────
    await checkPython();

    printSetupComplete();
}

// ─── 阶段 1：环境检测 ─────────────────────────────────────────────────────────

async function runChecks() {
    blank();
    step('[ 1/5 ] Environment Checks');
    divider();

    const checks = { critical: false, items: [] };

    // Node.js 版本
    const nodeVersion = process.version;
    const nodeMajor   = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (nodeMajor >= 18) {
        ok(`Node.js ${nodeVersion} ${c.gray}(required ≥18)${c.reset}`);
        checks.items.push({ name: 'Node.js', status: 'ok', value: nodeVersion });
    } else {
        fail(`Node.js ${nodeVersion} — need ≥18`);
        sub('→ Download: https://nodejs.org');
        checks.items.push({ name: 'Node.js', status: 'fail', value: nodeVersion });
        checks.critical = true;
    }

    // npm 版本
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const npmMajor   = parseInt(npmVersion.split('.')[0], 10);
        if (npmMajor >= 9) {
            ok(`npm ${npmVersion} ${c.gray}(required ≥9)${c.reset}`);
            checks.items.push({ name: 'npm', status: 'ok', value: npmVersion });
        } else {
            warn(`npm ${npmVersion} — recommend ≥9`);
            sub('→ Run: npm install -g npm@latest');
            checks.items.push({ name: 'npm', status: 'warn', value: npmVersion });
        }
    } catch {
        fail('npm not found');
        checks.items.push({ name: 'npm', status: 'fail', value: 'not found' });
        checks.critical = true;
    }

    // package.json 存在性
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        ok(`package.json found ${c.gray}(v${pkg.version})${c.reset}`);
        checks.items.push({ name: 'package.json', status: 'ok', value: pkg.version });
    } else {
        fail('package.json not found — run setup.js from project root');
        checks.items.push({ name: 'package.json', status: 'fail' });
        checks.critical = true;
    }

    // playwright npm 包检测
    const pwInstalled = isPackageInstalled('playwright');
    if (pwInstalled && !forceInstall) {
        // 读取实际版本
        try {
            const pwPkg = JSON.parse(fs.readFileSync(
                path.join(__dirname, 'node_modules', 'playwright', 'package.json'), 'utf8'
            ));
            ok(`playwright ${pwPkg.version} ${c.gray}(npm package)${c.reset}`);
        } catch {
            ok('playwright npm package installed');
        }
        checks.items.push({ name: 'playwright npm', status: 'ok', value: 'installed' });
    } else if (forceInstall) {
        info('playwright will be reinstalled (--force)');
        checks.items.push({ name: 'playwright npm', status: 'pending' });
    } else {
        info('playwright not in node_modules — will install');
        checks.items.push({ name: 'playwright npm', status: 'pending' });
    }

    // Playwright 浏览器检测
    const chromiumPath = getChromiumPath();
    if (chromiumPath) {
        ok(`Chromium binary found ${c.gray}(${chromiumPath.slice(0, 60)}...)${c.reset}`);
        checks.items.push({ name: 'Chromium binary', status: 'ok' });
    } else {
        info('Chromium binary not found — will download');
        checks.items.push({ name: 'Chromium binary', status: 'pending' });
    }

    // 网络连通性（可选检测）
    blank();
    info(`OS: ${c.bold}${os.type()} ${os.release()}${c.reset} (${os.arch()}, ${Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10} GB free RAM)`);
    info(`Proxy: ${process.env.HTTPS_PROXY || process.env.HTTP_PROXY || c.gray + 'none' + c.reset}`);
    if (useMirror) {
        info(`Mirror: ${c.cyan}npmmirror.com${c.reset} (--mirror mode)`);
    }

    return checks;
}

function getChromiumPath() {
    // 检测 ms-playwright 目录下是否有 chromium
    const dirs = [
        path.join(process.env.LOCALAPPDATA  || '', 'ms-playwright'),
        path.join(process.env.HOME || os.homedir(), '.cache', 'ms-playwright'),
        path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
    ];
    for (const d of dirs) {
        if (!fs.existsSync(d)) continue;
        try {
            const entries = fs.readdirSync(d).filter(n => n.startsWith('chromium'));
            if (entries.length > 0) return path.join(d, entries[entries.length - 1]);
        } catch { /* ignore */ }
    }
    return null;
}

function printCheckSummary(checks) {
    const okC   = checks.items.filter(i => i.status === 'ok').length;
    const failC = checks.items.filter(i => i.status === 'fail').length;
    const warnC = checks.items.filter(i => i.status === 'warn').length;
    const pendC = checks.items.filter(i => i.status === 'pending').length;
    blank();
    console.log(
        `  ${c.bold}Summary:${c.reset}  ` +
        `${c.green}${okC} OK${c.reset}  ` +
        (warnC ? `${c.yellow}${warnC} WARN${c.reset}  ` : '') +
        (failC ? `${c.red}${failC} FAIL${c.reset}  ` : '') +
        (pendC ? `${c.cyan}${pendC} PENDING${c.reset}` : '')
    );
}

// ─── 阶段 2：安装 npm 依赖 ────────────────────────────────────────────────────

async function installDependencies() {
    blank();
    step('[ 2/5 ] Installing npm Dependencies');
    divider();

    // 是否已安装（快速检测）
    if (isPackageInstalled('playwright') && isPackageInstalled('winston') && !forceInstall) {
        ok('Dependencies already installed, running npm install to verify...');
    } else {
        info('Running npm install...');
    }

    // 构造 npm install 命令
    const npmArgs = ['install'];
    if (useMirror) {
        npmArgs.push('--registry', 'https://registry.npmmirror.com');
        info(`Using mirror: ${c.cyan}https://registry.npmmirror.com${c.reset}`);
    }
    if (!verbose) npmArgs.push('--prefer-offline');

    const result = spawnSync('npm', npmArgs, {
        cwd:   __dirname,
        stdio: verbose ? 'inherit' : 'pipe',
        shell: true
    });

    if (result.status === 0) {
        ok(`npm install completed ${elapsed()}`);
        if (!verbose && result.stdout) {
            const lines = result.stdout.toString().split('\n').filter(l => l.includes('warn') || l.includes('error'));
            lines.slice(0, 5).forEach(l => sub(l.trim()));
        }
    } else {
        fail(`npm install failed (exit code ${result.status})`);
        if (result.stderr) {
            console.log(result.stderr.toString().slice(0, 500));
        }
        blank();
        warn('Tips: If you are in China, retry with --mirror flag:');
        sub('node setup.js --mirror');
        process.exit(1);
    }
}

// ─── 阶段 3：安装 Playwright 浏览器 ──────────────────────────────────────────

async function installPlaywrightBrowsers() {
    blank();
    step('[ 3/5 ] Installing Playwright Browsers');
    divider();

    const browsers = allBrowsers ? ['chromium', 'firefox', 'webkit'] : ['chromium'];
    info(`Browsers: ${c.bold}${browsers.join(' + ')}${c.reset}`);
    info('This may take several minutes on first run (binary download)...');
    blank();

    // 设置 Playwright 下载镜像（如果需要）
    const env = { ...process.env };
    if (useMirror) {
        env.PLAYWRIGHT_DOWNLOAD_HOST = 'https://npmmirror.com/mirrors/playwright/';
        info(`Playwright mirror: ${c.cyan}npmmirror.com${c.reset}`);
    }

    for (const browser of browsers) {
        info(`Installing ${c.bold}${browser}${c.reset}...`);
        const t0 = Date.now();

        const result = spawnSync(
            'npx',
            ['playwright', 'install', browser],
            {
                cwd:   __dirname,
                stdio: 'inherit',
                shell: true,
                env
            }
        );

        const took = ((Date.now() - t0) / 1000).toFixed(1);
        if (result.status === 0) {
            ok(`${browser} installed ${c.gray}(${took}s)${c.reset}`);
        } else {
            warn(`${browser} installation returned code ${result.status}`);
            sub('If download failed, retry with --mirror flag:');
            sub('node setup.js --mirror');
            sub(`Or install manually: npx playwright install ${browser}`);
        }
    }
}

// ─── 阶段 4：冒烟测试（验证 Playwright 可用） ────────────────────────────────

async function verifyPlaywright() {
    blank();
    step('[ 4/5 ] Verifying Playwright (Smoke Test)');
    divider();
    info('Launching Chromium headless → loading test page...');

    const smokeScript = `
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx     = await browser.newContext();
    const page    = await ctx.newPage();
    await page.goto('data:text/html,<title>OK</title><h1 id="t">Playwright Smoke Test</h1>');
    const h = await page.textContent('#t');
    await browser.close();
    if (h !== 'Playwright Smoke Test') process.exit(2);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
`.trim();

    const t0 = Date.now();
    const result = spawnSync(process.execPath, ['-e', smokeScript], {
        cwd:    __dirname,
        stdio:  'pipe',
        timeout: 30000
    });

    const took = ((Date.now() - t0) / 1000).toFixed(1);

    if (result.status === 0) {
        ok(`${c.bold}${c.green}Smoke test PASSED${c.reset} — Chromium launches and renders correctly ${c.gray}(${took}s)${c.reset}`);
    } else {
        warn(`Smoke test FAILED (exit ${result.status}) after ${took}s`);
        if (result.stderr) {
            const msg = result.stderr.toString().trim().slice(0, 300);
            sub(msg);
        }
        blank();
        sub('Possible fixes:');
        sub('1. Reinstall browser: npx playwright install chromium');
        sub('2. Check system dependencies: npx playwright install-deps chromium');
        sub('3. Run: node setup.js --force');
    }
}

// ─── 阶段 5：Python 检测（可选）──────────────────────────────────────────────

async function checkPython() {
    blank();
    step('[ 5/5 ] Checking Python (optional, AI Analysis)');
    divider();

    let found = null;
    for (const cmd of ['python3', 'python']) {
        try {
            const v = execSync(`${cmd} --version`, {
                encoding: 'utf8',
                stdio:    ['pipe', 'pipe', 'pipe']
            }).trim();
            found = { cmd, version: v };
            break;
        } catch { /* try next */ }
    }

    if (found) {
        ok(`${found.cmd} — ${found.version}`);
        try {
            const pip = execSync(`${found.cmd} -m pip --version`, {
                encoding: 'utf8', stdio: 'pipe'
            }).trim().split(' ').slice(0, 2).join(' ');
            ok(`pip — ${pip}`);
        } catch {
            warn('pip not found (optional for AI module)');
        }
        info('AI analysis will use Python for advanced scoring');
    } else {
        warn('Python not found — AI analysis will use built-in mock scoring');
        sub('Install Python 3.8+ from https://www.python.org (optional)');
    }
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function isPackageInstalled(packageName) {
    return fs.existsSync(path.join(__dirname, 'node_modules', packageName));
}

// ─── 完成输出 ─────────────────────────────────────────────────────────────────

function printSetupComplete() {
    const total = ((Date.now() - timer.start) / 1000).toFixed(1);
    blank();
    console.log(`${c.bold}${c.green}┌─────────────────────────────────────────────────┐
│  ${ICONS.rocket}  Setup Completed!  Total: ${String(total + 's').padEnd(20)} │
└─────────────────────────────────────────────────┘${c.reset}`);
    blank();
    console.log(`${c.bold}  Quick Start Commands:${c.reset}`);
    blank();
    console.log(`  ${c.cyan}npm run test:all:headless${c.reset}        ${c.gray}# run all games (headless, recommended)${c.reset}`);
    console.log(`  ${c.cyan}npm run test:all:parallel${c.reset}        ${c.gray}# parallel mode (fastest)${c.reset}`);
    console.log(`  ${c.cyan}node src/index.js --game=snake${c.reset}   ${c.gray}# single game test${c.reset}`);
    console.log(`  ${c.cyan}node src/index.js --game=snake --record${c.reset}  ${c.gray}# with video recording${c.reset}`);
    console.log(`  ${c.cyan}npm run clean${c.reset}                    ${c.gray}# clean reports/screenshots/videos${c.reset}`);
    blank();
    console.log(`  ${c.gray}Playwright browsers: %LOCALAPPDATA%\\ms-playwright  (Windows)${c.reset}`);
    console.log(`  ${c.gray}                     ~/.cache/ms-playwright          (Linux/Mac)${c.reset}`);
    blank();
}

function printBanner() {
    console.log(`
${c.bold}${c.cyan}  ╔════════════════════════════════════════════════╗
  ║   Kids Game Auto Test  ·  Setup Script        ║
  ║   Powered by Playwright ${c.reset}${c.gray}v1.58+${c.cyan}${c.bold}               ║
  ╚════════════════════════════════════════════════╝${c.reset}
  ${c.gray}Node: ${process.version}   Platform: ${process.platform}   Arch: ${os.arch()}
  Flags: ${[
    allBrowsers  && '--all-browsers',
    skipBrowsers && '--skip-browsers',
    checkOnly    && '--check-only',
    forceInstall && '--force',
    skipVerify   && '--skip-verify',
    useMirror    && '--mirror',
    verbose      && '--verbose',
  ].filter(Boolean).join(' ') || '(default)'}${c.reset}`);
}

// ─── 入口 ─────────────────────────────────────────────────────────────────────

main().catch(err => {
    blank();
    console.error(`${c.red}${c.bold}Setup failed:${c.reset} ${err.message}`);
    if (verbose) console.error(err.stack);
    blank();
    process.exit(1);
});
