/**
 * 游戏自动化测试完整流水线
 *
 * 功能链路：
 *   扫描游戏代码路径 → 生成测试用例 → 创建测试任务 → 监控任务执行
 *
 * 使用方式：
 *   node src/pipeline.js [options]
 *
 * 选项：
 *   --games-root <path>     游戏代码根目录（默认 ../kids-game-house/games）
 *   --game <name>           只处理指定游戏（支持多次，逗号分隔）
 *   --headless              无头模式（CI 推荐）
 *   --concurrency <n>       并发执行任务数（默认 1）
 *   --priority <p>          只执行指定优先级 P0/P1/P2（默认全部）
 *   --scan-only             只扫描，不执行测试
 *   --generate-only         只扫描+生成用例，不执行测试
 *   --no-deep               跳过源码深度分析（更快但特性检测不准）
 *   --clear-tasks           执行前清空已完成任务
 *   --report                执行后生成 HTML 报告
 *   --api-mode              开启后端 API 对接模式（UI测试 + API测试）
 *   --api-only              只执行后端 API 测试（跳过 UI Playwright 测试）
 *   --backend-url <url>     后端 Base URL（默认 http://localhost:8080）
 *   --backend-user <user>   后端登录用户名（默认 admin）
 *   --backend-pass <pass>   后端登录密码（默认 admin123）
 *   --dashboard             启动 Web 监控面板（默认端口 9090）
 *   --dashboard-port <n>    监控面板端口（默认 9090）
 *   --dashboard-open        启动面板后自动打开浏览器
 *   --report-backend        执行完毕后将结果上报至后端 API
 *   --junit                 生成 JUnit XML 报告（供 CI 使用）
 *   --csv                   生成 CSV 格式测试结果
 */

'use strict';

const path = require('path');
const { Command } = require('commander');
const { CodeScanner }       = require('./code-scanner');
const { TestCaseGenerator } = require('./test-case-generator');
const { TaskManager }       = require('./task-manager');
const { TaskMonitor }       = require('./task-monitor');
const { ApiClient }         = require('./api-client');
const { ApiTestRunner }     = require('./api-test-runner');
const { DashboardServer }   = require('./dashboard-server');
const { ResultReporter }    = require('./result-reporter');
const { ConfigLoader }      = require('./config/config-loader');
const { ReportGenerator }   = require('./report-generator');
const { logger }            = require('./utils/logger');
const { ensureDir }         = require('./utils/helpers');

const pkg = require('../package.json');

// ── CLI ───────────────────────────────────────────────────────────────────────

const program = new Command();

program
    .name('pipeline')
    .version(pkg.version)
    .description('游戏代码扫描 → 用例生成 → 任务创建 → 监控执行 全流水线')
    .option('--games-root <path>',    '游戏代码根目录')
    .option('--game <names>',         '指定游戏（逗号分隔），如 plane-shooter,snake')
    .option('--headless',             '无头浏览器（CI 推荐）')
    .option('--concurrency <n>',      '并发任务数', '1')
    .option('--priority <p>',         '只执行指定优先级 P0,P1,P2', 'P0,P1,P2')
    .option('--scan-only',            '只扫描代码，不执行测试')
    .option('--generate-only',        '扫描 + 生成用例，不执行测试')
    .option('--no-deep',              '跳过深度源码分析')
    .option('--clear-tasks',          '执行前清空已完成任务')
    .option('--report',               '执行后生成 HTML 报告')
    .option('--config <path>',        '自定义配置文件路径')
    // API 模式相关
    .option('--api-mode',             '开启后端 API 对接（扫描 + UI测试 + API测试）')
    .option('--api-only',             '只执行后端 API 测试（跳过 Playwright UI 测试）')
    .option('--backend-url <url>',    '后端 Base URL', 'http://localhost:8080')
    .option('--backend-user <user>',  '后端登录用户名', 'admin')
    .option('--backend-pass <pass>',  '后端登录密码',   'admin123')
    .option('--backend-type <type>',  '用户类型 ADMIN|PARENT|KID', 'ADMIN')
    // 监控面板
    .option('--dashboard',            '启动 Web 监控面板（默认端口 9090）')
    .option('--dashboard-port <n>',   '监控面板端口', '9090')
    .option('--dashboard-open',       '自动打开浏览器访问监控面板')
    // 结果上报
    .option('--report-backend',       '将测试结果上报至后端 API')
    .option('--junit',                '生成 JUnit XML 报告（供 CI 使用）')
    .option('--csv',                  '生成 CSV 测试结果')
    .parse(process.argv);

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
    const opts = program.opts();

    printBanner(opts);

    // 1. 加载测试配置
    let config;
    try {
        config = ConfigLoader.load(opts.config || null);
        logger.info('✅ Configuration loaded');
    } catch (e) {
        logger.error(`Failed to load config: ${e.message}`);
        process.exit(1);
    }

    const targetGames    = opts.game
        ? opts.game.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const priorityFilter = opts.priority
        ? opts.priority.split(',').map(s => s.trim())
        : ['P0', 'P1', 'P2'];

    // API 模式配置
    const apiMode    = opts.apiMode || opts.apiOnly;
    const apiOnly    = !!opts.apiOnly;
    const apiOptions = {
        baseUrl:  opts.backendUrl  || process.env.BACKEND_BASE_URL || 'http://localhost:8080',
        username: opts.backendUser || process.env.BACKEND_USERNAME  || 'admin',
        password: opts.backendPass || process.env.BACKEND_PASSWORD  || 'admin123',
        userType: opts.backendType || process.env.BACKEND_USER_TYPE || 'ADMIN',
    };

    const runStartTime = Date.now();

    // API 客户端（apiMode 时初始化）
    let apiClient = null;
    if (apiMode) {
        logger.info(`\n🔌 API Mode: connecting to ${apiOptions.baseUrl}...`);
        apiClient = new ApiClient({ ...apiOptions, autoLogin: false });
        const reachable = await apiClient.isReachable();
        if (reachable) {
            try {
                await apiClient.login();
                logger.info(`✅ Backend connected & authenticated (${apiOptions.username})`);
            } catch (e) {
                logger.warn(`⚠️  Backend login failed: ${e.message}. Continuing without auth.`);
            }
        } else {
            logger.warn(`⚠️  Backend not reachable at ${apiOptions.baseUrl}. API tests will be skipped.`);
            apiClient = null;
        }
    }

    // ── Web 监控面板（可选）─────────────────────────────────────────────────
    let dashboard = null;
    let dashboardUrl = null;
    // Dashboard 需要在 TaskManager 创建后启动，但这里先准备好占位变量
    // 实际启动在 Step 3 之后（taskManager 初始化完成后）

    // ── Step 1：扫描游戏代码 ─────────────────────────────────────────────────
    logger.info('\n' + '━'.repeat(60));
    logger.info('📂 Step 1 / 4 — Scan game source code');
    logger.info('━'.repeat(60));

    const scanner = new CodeScanner({
        gamesRoot:   opts.gamesRoot || undefined,
        targetGames,
        deep:        opts.deep !== false,
        apiMode:     !!apiClient,
        apiClient,
    });

    const scanReport = await scanner.scan();

    // 输出扫描摘要
    printScanSummary(scanReport);

    if (opts.scanOnly) {
        logger.info('\n✅ Scan-only mode, stopping here.\n');
        writeScanReport(scanReport);
        return;
    }

    // ── Step 2：生成测试用例 ─────────────────────────────────────────────────
    logger.info('\n' + '━'.repeat(60));
    logger.info('📝 Step 2 / 4 — Generate test cases');
    logger.info('━'.repeat(60));

    const generator = new TestCaseGenerator({ priorityFilter, includeApi: apiMode });

    // UI 测试用例套件
    const uiSuites = apiOnly ? [] : generator.generate(scanReport, config.games || {});
    if (!apiOnly) printSuitesSummary(uiSuites);

    // API 测试用例套件（apiMode 时生成）
    let apiSuite = null;
    if (apiMode) {
        apiSuite = generator.generateApiSuite(scanReport, apiOptions);
        if (apiSuite) {
            logger.info(`\n  🌐 API Suite: ${apiSuite.testCases.length} API test case(s)  P0=${apiSuite.stats.byPriority.P0||0}  P1=${apiSuite.stats.byPriority.P1||0}  P2=${apiSuite.stats.byPriority.P2||0}`);
        }
    }

    if (opts.generateOnly) {
        logger.info('\n✅ Generate-only mode, stopping here.\n');
        writeSuitesReport([...uiSuites, ...(apiSuite ? [apiSuite] : [])]);
        return;
    }

    // ── Step 3：创建测试任务 ─────────────────────────────────────────────────
    logger.info('\n' + '━'.repeat(60));
    logger.info('📋 Step 3 / 4 — Create test tasks');
    logger.info('━'.repeat(60));

    const taskManager = new TaskManager();

    if (opts.clearTasks) {
        const cleared = taskManager.clearFinished();
        if (cleared > 0) logger.info(`🗑  Cleared ${cleared} finished task(s)`);
    }

    // 创建 UI 任务
    let uiTasks = [];
    if (!apiOnly && uiSuites.length > 0) {
        uiTasks = taskManager.createTasks(uiSuites, {
            triggeredBy: 'pipeline',
            priority:    priorityFilter,
            headless:    !!opts.headless,
            taskType:    'ui',
        });
        taskManager.enqueue(uiTasks.map(t => t.taskId));
        printTasksSummary(uiTasks, 'UI');
    }

    // 创建 API 任务
    let apiTasks = [];
    if (apiMode && apiSuite) {
        apiTasks = taskManager.createTasks([apiSuite], {
            triggeredBy: 'pipeline-api',
            priority:    priorityFilter,
            taskType:    'api',
        });
        taskManager.enqueue(apiTasks.map(t => t.taskId));
        printTasksSummary(apiTasks, 'API');
    }

    const allTasks = [...uiTasks, ...apiTasks];

    // ── 启动 Web 监控面板（可选）─────────────────────────────────────────────
    if (opts.dashboard) {
        try {
            dashboard = new DashboardServer(taskManager, {
                port:     parseInt(opts.dashboardPort, 10) || 9090,
                autoOpen: !!opts.dashboardOpen,
            });
            dashboardUrl = await dashboard.start();
            logger.info(`🖥️  Dashboard: ${dashboardUrl}`);
        } catch (e) {
            logger.warn(`⚠️  Dashboard failed to start: ${e.message}`);
            dashboard = null;
        }
    }

    // ── Step 4：监控执行 ─────────────────────────────────────────────────────
    logger.info('\n' + '━'.repeat(60));
    logger.info('🖥️  Step 4 / 4 — Execute & monitor tasks');
    logger.info('━'.repeat(60));

    let uiStats   = null;
    let apiStats  = null;
    const startTime = Date.now();

    // 4a. 执行 UI 任务（Playwright）
    if (uiTasks.length > 0) {
        logger.info('\n  ▶ Running UI (Playwright) tasks...\n');

        // 创建只包含 UI 任务的独立 TaskManager 视图
        const uiTaskManager = _createSubManager(taskManager, uiTasks);

        const monitor = new TaskMonitor(uiTaskManager, {
            headless:    !!opts.headless,
            concurrency: parseInt(opts.concurrency, 10) || 1,
        });
        const res = await monitor.start();
        uiStats = res.stats;
    }

    // 4b. 执行 API 任务（ApiTestRunner）
    if (apiTasks.length > 0) {
        logger.info('\n  ▶ Running Backend API tests...\n');

        const apiTaskManager = _createSubManager(taskManager, apiTasks);

        const runner = new ApiTestRunner(apiTaskManager, {
            ...apiOptions,
            concurrency: Math.max(parseInt(opts.concurrency, 10) || 1, CONCURRENCY_DEF),
        });
        const res = await runner.start();
        apiStats = res.stats;
    }

    const elapsed = Date.now() - startTime;

    // ── 合并统计 ──────────────────────────────────────────────────────────────
    printCombinedSummary(uiStats, apiStats, elapsed);

    // ── 可选：生成 HTML 报告 ──────────────────────────────────────────────────
    if (opts.report) {
        logger.info('\n📊 Generating HTML report...');
        generateReport(allTasks, taskManager, config, elapsed);
    }

    // ── 可选：结果上报（JUnit XML / CSV / 后端 API）──────────────────────────
    const needsReport = opts.junit || opts.csv || opts.reportBackend;
    if (needsReport) {
        logger.info('\n📤 Generating result artifacts...');
        const reporter = new ResultReporter({
            apiClient:     opts.reportBackend ? apiClient : null,
            enableJunit:   !!opts.junit,
            enableCsv:     !!opts.csv,
            enableBackend: !!opts.reportBackend && !!apiClient,
        });
        await reporter.report(allTasks, taskManager, {
            triggeredBy: 'pipeline',
            startTime:   new Date(runStartTime).toISOString(),
            duration:    elapsed,
        });
    }

    // ── 关闭监控面板（若需要保持开启可去掉此行）───────────────────────────────
    if (dashboard) {
        // 面板保持运行，用户手动 Ctrl+C 退出
        if (dashboardUrl) {
            logger.info(`\n🖥️  Dashboard still running at ${dashboardUrl} — press Ctrl+C to exit\n`);
        }
        // 注册退出时关闭
        const cleanupDashboard = async () => {
            try { await dashboard.stop(); } catch (_) {}
        };
        process.on('SIGINT',  cleanupDashboard);
        process.on('SIGTERM', cleanupDashboard);

        // 若没有面板就直接退出，有面板则等待手动停止
        const totalFailed2 = (uiStats?.failed || 0) + (uiStats?.error || 0)
                           + (apiStats?.failed || 0) + (apiStats?.error || 0);
        // 不调用 process.exit，让进程保持
        // 用一个永不 resolve 的 Promise 阻塞（等用户 Ctrl+C）
        await new Promise(() => {});
    }

    // 退出码
    const totalFailed = (uiStats?.failed || 0) + (uiStats?.error || 0)
                      + (apiStats?.failed || 0) + (apiStats?.error || 0);
    process.exit(totalFailed > 0 ? 1 : 0);
}

// ── 工具：创建子集 TaskManager 视图（只包含指定任务）────────────────────────

const CONCURRENCY_DEF = 3;

/**
 * 创建一个只包含指定任务集合的 TaskManager 包装器
 * 它代理原始 taskManager，但 getQueuedTasks / queryTasks 只返回指定任务
 */
function _createSubManager(original, tasks) {
    const taskIds = new Set(tasks.map(t => t.taskId));

    return new Proxy(original, {
        get(target, prop) {
            if (prop === 'getQueuedTasks') {
                return () => target.getQueuedTasks().filter(t => taskIds.has(t.taskId));
            }
            if (prop === 'queryTasks') {
                return (q) => target.queryTasks(q).filter(t => taskIds.has(t.taskId));
            }
            const val = target[prop];
            return typeof val === 'function' ? val.bind(target) : val;
        }
    });
}

// ── 辅助输出函数 ─────────────────────────────────────────────────────────────

function printBanner(opts) {
    const apiModeStr = opts.apiMode ? 'API+UI' : opts.apiOnly ? 'API Only' : 'UI Only';
    const extras = [];
    if (opts.dashboard)    extras.push('Dashboard');
    if (opts.junit)        extras.push('JUnit');
    if (opts.csv)          extras.push('CSV');
    if (opts.reportBackend)extras.push('UploadBackend');
    const lines = [
        '╔══════════════════════════════════════════════════╗',
        `║  Kids Game Pipeline  v${require('../package.json').version.padEnd(27)}║`,
        '╠══════════════════════════════════════════════════╣',
        `║  Scan → Generate → Create Tasks → Monitor        ║`,
        `║  Headless  : ${String(!!opts.headless).padEnd(35)}║`,
        `║  Priority  : ${String(opts.priority || 'P0,P1,P2').padEnd(35)}║`,
        `║  Concurrency: ${String(opts.concurrency || '1').padEnd(34)}║`,
        `║  Mode      : ${apiModeStr.padEnd(35)}║`,
        ...(opts.apiMode || opts.apiOnly ? [
        `║  Backend   : ${String(opts.backendUrl || 'http://localhost:8080').padEnd(35)}║`,
        ] : []),
        ...(extras.length ? [
        `║  Features  : ${extras.join(', ').padEnd(35)}║`,
        ] : []),
        '╚══════════════════════════════════════════════════╝',
    ];
    lines.forEach(l => logger.info(l));
    logger.info('');
}

function printScanSummary(report) {
    logger.info(`\n  Scanned ${report.totalGames} game(s) in ${report.duration}ms`);
    for (const g of report.games || []) {
        const featCount = Object.keys(g.detectedFeatures || {}).filter(k => g.detectedFeatures[k]).length;
        const features  = Object.keys(g.detectedFeatures || {}).filter(k => g.detectedFeatures[k]).join(', ') || 'none';
        logger.info(`  🎮 ${g.gameLabel.padEnd(20)}  type=${g.gameType.padEnd(10)}  files=${String(g.sourceFiles.length).padEnd(5)}  features(${featCount}): ${features}`);
    }
    if (!report.games || report.games.length === 0) {
        logger.warn('  ⚠️  No game directories found in scan root. Will use config-based generation.');
    }
}

function printSuitesSummary(suites) {
    logger.info(`\n  Generated ${suites.length} test suite(s):\n`);
    for (const s of suites) {
        logger.info(`  📦 ${s.gameName.padEnd(30)}  cases=${s.testCases.length}  P0=${s.stats.byPriority.P0 || 0}  P1=${s.stats.byPriority.P1 || 0}  P2=${s.stats.byPriority.P2 || 0}`);
    }
}

function printTasksSummary(tasks, label = '') {
    const tag = label ? `[${label}] ` : '';
    logger.info(`\n  Created ${tasks.length} ${tag}task(s):\n`);
    for (const t of tasks) {
        logger.info(`  📋 [${t.taskId.slice(-8)}] ${t.gameName.padEnd(30)} priority=${t.priority}`);
    }
}

function printCombinedSummary(uiStats, apiStats, elapsed) {
    if (!uiStats && !apiStats) return;
    logger.info('\n' + '═'.repeat(60));
    logger.info('📊  PIPELINE COMBINED SUMMARY');
    logger.info('═'.repeat(60));
    if (uiStats) {
        logger.info(`  🖥️  UI Tasks  : passed=${uiStats.passed} failed=${uiStats.failed} skipped=${uiStats.skipped} error=${uiStats.error}`);
    }
    if (apiStats) {
        logger.info(`  🌐 API Tasks : passed=${apiStats.passed} failed=${apiStats.failed} skipped=${apiStats.skipped} error=${apiStats.error}`);
    }
    logger.info(`  ⏱  Total     : ${elapsed}ms`);
    logger.info('═'.repeat(60) + '\n');
}

function writeScanReport(report) {
    const dir  = path.resolve(__dirname, '../reports');
    ensureDir(dir);
    const file = path.join(dir, `scan-report-${Date.now()}.json`);
    require('fs').writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
    logger.info(`📄 Scan report saved: ${file}`);
}

function writeSuitesReport(suites) {
    const dir  = path.resolve(__dirname, '../reports');
    ensureDir(dir);
    const file = path.join(dir, `test-suites-${Date.now()}.json`);
    require('fs').writeFileSync(file, JSON.stringify(suites, null, 2), 'utf8');
    logger.info(`📄 Test suites saved: ${file}`);
}

function generateReport(tasks, taskManager, config, elapsed) {
    try {
        // 将任务结果转换为 orchestrator 兼容的 results 格式
        const results = {
            startTime: new Date(Date.now() - elapsed),
            endTime:   new Date(),
            duration:  elapsed,
            games:     tasks.map(t => {
                const taskData = taskManager.getTask(t.taskId);
                return {
                    name:        t.gameId,
                    displayName: t.gameName,
                    status:      taskData?.status || t.status,
                    duration:    taskData?.duration || 0,
                    tests:       (taskData?.testCases || []).map(tc => ({
                        name:    tc.name,
                        status:  tc.status || 'PENDING',
                        details: tc.result?.details || '',
                    })),
                    issues:      [],
                    metrics:     {},
                    screenshots: [],
                };
            }),
            overall: {
                total:   tasks.length,
                passed:  tasks.filter(t => taskManager.getTask(t.taskId)?.status === 'PASSED').length,
                failed:  tasks.filter(t => taskManager.getTask(t.taskId)?.status === 'FAILED').length,
                warned:  tasks.filter(t => taskManager.getTask(t.taskId)?.status === 'WARNED').length,
                errored: tasks.filter(t => taskManager.getTask(t.taskId)?.status === 'ERROR').length,
                skipped: tasks.filter(t => taskManager.getTask(t.taskId)?.status === 'SKIPPED').length,
            },
        };

        const gen = new ReportGenerator(results, config);
        gen.generate();
    } catch (e) {
        logger.warn(`Report generation failed: ${e.message}`);
    }
}

// ── 错误处理 ──────────────────────────────────────────────────────────────────

process.on('uncaughtException',  e => { logger.error('Uncaught:', e.message); process.exit(1); });
process.on('unhandledRejection', r => { logger.error('Unhandled:', r instanceof Error ? r.message : r); process.exit(1); });

main();
