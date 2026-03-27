/**
 * 测试协调器 - 核心引擎
 * 功能：协调所有测试模块，管理测试流程
 *
 * Playwright 迁移 & 优化点：
 * - GameSimulator 已迁移至 Playwright（三层模型：browser → context → page）
 * - 收集视频录制路径并写入 gameResult
 * - 修复日志分析器未绑定页面的 Bug
 * - 修复性能监控重复导航的 Bug
 * - 支持并发测试模式（--parallel）
 * - 统一资源生命周期管理
 * - 增强整体统计（WARNED 状态、总耗时）
 */

const { GameSimulator } = require('./game-simulator');
const { PerformanceMonitor } = require('./performance-monitor');
const { LogAnalyzer } = require('./log-analyzer');
const { AIExperienceAnalyzer } = require('./ai-experience-analyzer');
const { ReportGenerator } = require('./report-generator');
const { ConsoleReporter } = require('./reporters/console-reporter');
const { logger } = require('./utils/logger');
const { calcDuration, formatDuration, checkUrlReachable, withTimeout } = require('./utils/helpers');

class TestOrchestrator {
    constructor(config, options) {
        this.config = config;
        this.options = options;
        this.results = {
            startTime: new Date(),
            endTime: null,
            duration: 0,
            games: [],
            overall: {
                total: 0,
                passed: 0,
                failed: 0,
                warned: 0,
                errored: 0
            }
        };
    }

    /**
     * 入口：根据 mode 执行不同策略
     */
    async run() {
        const mode = this.options.mode || 'all';

        // 解析要测试的游戏列表
        let gameNames;
        if (this.options.game) {
            if (!this.config.games[this.options.game]) {
                throw new Error(`Unknown game: "${this.options.game}". Available: ${Object.keys(this.config.games).join(', ')}`);
            }
            gameNames = [this.options.game];
        } else {
            gameNames = Object.keys(this.config.games);
        }

        const total = gameNames.length;
        logger.info(`\n${'━'.repeat(60)}`);
        logger.info(`🎮  Kids Game Auto Test  |  mode: ${mode}  |  games: ${total}`);
        logger.info(`${'━'.repeat(60)}`);
        logger.info(`Games: ${gameNames.join(', ')}`);

        // ── 连通性预检（并发 ping 所有游戏 URL）──────────────────────────
        const reachableSet = await this._preflightCheck(gameNames);

        // 并发模式（--parallel）
        if (this.options.parallel) {
            logger.info(`⚡ Running ${total} games in PARALLEL...\n`);
            const promises = gameNames.map((name, i) => this.testGame(name, i + 1, total, reachableSet));
            await Promise.allSettled(promises);
        } else {
            for (let i = 0; i < gameNames.length; i++) {
                await this.testGame(gameNames[i], i + 1, total, reachableSet);
            }
        }

        this.results.endTime = new Date();
        this.results.duration = calcDuration(this.results.startTime, this.results.endTime);

        this.generateFinalReport();
    }

    /**
     * 并发检测所有游戏 URL 是否可访问
     * 返回一个 Set，包含可达的 gameName
     * @private
     */
    async _preflightCheck(gameNames) {
        logger.info('\n🔍 Preflight connectivity check...');
        const reachable = new Set();
        const results = await Promise.all(
            gameNames.map(async (name) => {
                const url = this.config.games[name]?.url;
                if (!url) return { name, ok: false, reason: 'no URL configured' };
                const r = await checkUrlReachable(url, 5000);
                return { name, url, ...r };
            })
        );

        for (const r of results) {
            if (r.ok) {
                logger.info(`  ✅ ${r.name}: ${r.url} → reachable (HTTP ${r.status})`);
                reachable.add(r.name);
            } else {
                logger.warn(`  ⚠️  ${r.name}: ${r.url} → UNREACHABLE (${r.error || r.status})`);
            }
        }

        const unreachable = gameNames.filter(n => !reachable.has(n));
        if (unreachable.length > 0) {
            logger.warn(`\n  ⚠️  ${unreachable.length} game(s) unreachable, will be marked SKIPPED: ${unreachable.join(', ')}`);
        }
        logger.info('');
        return reachable;
    }

    /**
     * 单个游戏完整测试流程
     * @param {string} gameName
     * @param {number} [index=1]  - 当前第几个游戏
     * @param {number} [total=1]  - 总共几个游戏
     * @param {Set}    [reachableSet] - 预检可达游戏集合
     */
    async testGame(gameName, index = 1, total = 1, reachableSet = null) {
        const progressPrefix = `[${index}/${total}]`;
        logger.info(`\n${'═'.repeat(60)}`);
        logger.info(`${progressPrefix} 🎯 Testing: ${gameName}`);
        logger.info('═'.repeat(60));

        const gameConfig = this.config.games[gameName];
        if (!gameConfig) {
            logger.error(`Game config not found: ${gameName}`);
            return;
        }

        const gameResult = {
            name: gameName,
            displayName: gameConfig.name || gameName,
            startTime: new Date(),
            endTime: null,
            duration: 0,
            tests: [],
            issues: [],
            metrics: {},
            screenshots: []
        };

        // ── 连通性检查：不可达直接标记 SKIPPED ───────────────────────────
        if (reachableSet && !reachableSet.has(gameName)) {
            gameResult.status = 'SKIPPED';
            gameResult.endTime = new Date();
            gameResult.duration = 0;
            gameResult.issues.push({
                type: 'connectivity',
                severity: 'critical',
                message: `Game server unreachable: ${gameConfig.url}`
            });
            this.results.games.push(gameResult);
            this.updateOverallStats(gameResult);
            logger.warn(`${progressPrefix} ⏭  ${gameName}: SKIPPED (server not running at ${gameConfig.url})`);
            return;
        }

        // 创建本次游戏测试的共享模拟器实例
        const simulator = new GameSimulator(gameConfig, this.options);
        // 日志分析器 —— 在浏览器启动后立即绑定
        const logAnalyzer = new LogAnalyzer();

        // 全局超时守卫（防止单个游戏测试永久卡住）
        const gameTimeout = (this.options.timeout || 120000) + 30000; // 给额外 30s 宽限

        try {
            await withTimeout(
                this._runGameTests(simulator, logAnalyzer, gameConfig, gameResult),
                gameTimeout,
                `game test ${gameName}`
            );
        } catch (error) {
            logger.error(`Game ${gameName} test threw unhandled error:`, error);
            gameResult.status = 'ERROR';
            gameResult.endTime = new Date();
            gameResult.duration = calcDuration(gameResult.startTime, gameResult.endTime);
            gameResult.issues.push({
                type: 'test_error',
                severity: 'critical',
                message: error.message,
                stack: error.stack
            });
        } finally {
            // 统一关闭浏览器
            try {
                await simulator.closeBrowser();
            } catch (e) {
                logger.warn(`Failed to close browser for ${gameName}: ${e.message}`);
            }
        }

        this.results.games.push(gameResult);
        this.updateOverallStats(gameResult);

        const statusIcon = { PASSED: '✅', FAILED: '❌', WARNED: '⚠️', ERROR: '💥', SKIPPED: '⏭' }[gameResult.status] || '?';
        const passedTests = gameResult.tests.filter(t => t.status === 'PASSED').length;
        const totalTests  = gameResult.tests.length;
        const issueCount  = gameResult.issues.length;
        logger.info(`\n${progressPrefix} ${statusIcon} ${gameName}: ${gameResult.status}  tests=${passedTests}/${totalTests}  issues=${issueCount}  time=${formatDuration(gameResult.duration)}`);
    }

    /**
     * 内部：执行单个游戏的完整测试流程（被 withTimeout 包裹）
     * @private
     */
    async _runGameTests(simulator, logAnalyzer, gameConfig, gameResult) {
        try {
            // 1. 功能测试（含浏览器启动 & 日志收集绑定）
            logger.info('\n[1/4] Running Functional Tests...');
            const funcResult = await this.runFunctionalTests(simulator, logAnalyzer);
            gameResult.tests.push(...funcResult.tests);
            gameResult.issues.push(...funcResult.issues);
            gameResult.screenshots.push(...(funcResult.screenshots || []));
            if (funcResult.videoPath) {
                gameResult.videoPath = funcResult.videoPath;
                logger.info(`Video recorded: ${funcResult.videoPath}`);
            }

            // 2. 性能测试（复用已打开的 page，不重复导航）
            logger.info('\n[2/4] Running Performance Tests...');
            const perfResult = await this.runPerformanceTests(gameConfig, simulator.page);
            gameResult.metrics = perfResult.metrics || {};
            if (perfResult.issues && perfResult.issues.length > 0) {
                gameResult.issues.push(...perfResult.issues);
            }

            // 3. 日志分析（分析已收集的日志）
            logger.info('\n[3/4] Analyzing Logs...');
            const logResult = await logAnalyzer.analyze(gameResult.name);
            gameResult.issues.push(...logResult.issues);

            // 4. AI 游戏体验分析
            if (this.config.ai && this.config.ai.enabled) {
                logger.info('\n[4/4] AI Experience Analysis...');
                // 传入 logResult 数据用于 stability 维度真实评分
                const aiResult = await this.runAIAnalysis(gameConfig, simulator.page, {
                    jsErrors:       logResult.errors,
                    failedRequests: logResult.issues.filter(i => i.type === 'request_failed').length
                });
                if (aiResult.tests) gameResult.tests.push(...aiResult.tests);
                if (aiResult.aiScores) gameResult.aiScores = aiResult.aiScores;
            } else {
                logger.info('\n[4/4] AI Experience Analysis... SKIPPED (disabled)');
            }

            gameResult.endTime = new Date();
            gameResult.duration = calcDuration(gameResult.startTime, gameResult.endTime);

            // 判断游戏整体状态（只有 FAILED tests 才算 FAILED）
            const failedTests   = gameResult.tests.filter(t => t.status === 'FAILED' || t.status === 'ERROR').length;
            const criticalCount = gameResult.issues.filter(i => i.severity === 'critical').length;
            const warningCount  = gameResult.issues.filter(i => i.severity === 'warning').length;

            if (failedTests > 0 || criticalCount > 0) {
                gameResult.status = 'FAILED';
            } else if (warningCount > 0) {
                gameResult.status = 'WARNED';
            } else {
                gameResult.status = 'PASSED';
            }

        } catch (error) {
            gameResult.status = 'ERROR';
            gameResult.endTime = new Date();
            gameResult.duration = calcDuration(gameResult.startTime, gameResult.endTime);
            gameResult.issues.push({
                type: 'test_error',
                severity: 'critical',
                message: error.message
            });
            throw error; // 让上层 withTimeout 感知
        }
    }

    /**
     * 功能测试：启动浏览器 + 绑定日志收集 + 执行场景
     */
    async runFunctionalTests(simulator, logAnalyzer) {
        // 先启动浏览器
        await simulator.launchBrowser();
        // 绑定日志分析器到页面（修复：必须在导航前绑定）
        logAnalyzer.startCollecting(simulator.page);
        // 导航并执行测试
        return await simulator.runTests();
    }

    /**
     * 性能测试：复用已存在的 page，不重新导航
     */
    async runPerformanceTests(gameConfig, page) {
        if (!page) {
            logger.warn('No page available for performance measurement, skipping...');
            return { metrics: {}, issues: [] };
        }
        const monitor = new PerformanceMonitor(gameConfig, this.config.performance || {});
        return await monitor.measure(page);
    }

    /**
     * AI 分析：传入 page 进行截图等分析
     */
    async runAIAnalysis(gameConfig, page, context = {}) {
        const aiAnalyzer = new AIExperienceAnalyzer(gameConfig);
        const result = await aiAnalyzer.analyze(page, context);
        return {
            tests: result.enabled ? [{
                name: 'ai_experience_analysis',
                status: 'PASSED',
                details: `Overall AI Score: ${result.overall || 'N/A'} (mode: ${result.mode || '?'})`,
                timestamp: new Date().toISOString()
            }] : [],
            aiScores: result.scores || null
        };
    }

    /**
     * 更新整体统计
     */
    updateOverallStats(gameResult) {
        this.results.overall.total++;
        switch (gameResult.status) {
            case 'PASSED':  this.results.overall.passed++;  break;
            case 'FAILED':  this.results.overall.failed++;  break;
            case 'WARNED':  this.results.overall.warned++;  break;
            case 'ERROR':   this.results.overall.errored++; break;
            case 'SKIPPED':
                if (!this.results.overall.skipped) this.results.overall.skipped = 0;
                this.results.overall.skipped++;
                break;
        }
    }

    /**
     * 生成最终报告
     */
    generateFinalReport() {
        const o = this.results.overall;
        const statusIcon = o.failed > 0 || o.errored > 0 ? '❌' : o.warned > 0 ? '⚠️' : '✅';

        logger.info('\n' + '━'.repeat(60));
        logger.info('📊  FINAL RESULTS');
        logger.info('━'.repeat(60));

        // 每个游戏一行摘要
        for (const g of this.results.games) {
            const icon  = { PASSED: '✅', FAILED: '❌', WARNED: '⚠️', ERROR: '💥', SKIPPED: '⏭' }[g.status] || '?';
            const pass  = g.tests.filter(t => t.status === 'PASSED').length;
            const total = g.tests.length;
            const iss   = g.issues.length;
            const dur   = g.status === 'SKIPPED' ? 'skipped' : formatDuration(g.duration);
            logger.info(`  ${icon} ${(g.displayName || g.name).padEnd(30)} ${g.status.padEnd(8)} tests:${pass}/${total}  issues:${iss}  ${dur}`);
        }

        logger.info('━'.repeat(60));
        logger.info(`  ${statusIcon} Total: ${o.total}  ✅ ${o.passed}  ❌ ${o.failed}  ⚠️ ${o.warned}  💥 ${o.errored}  ⏭ ${o.skipped || 0}`);
        logger.info(`  ⏱  Total duration: ${formatDuration(this.results.duration)}`);

        // 错误聚合摘要
        const allIssues = this.results.games.flatMap(g =>
            g.issues.filter(i => i.severity === 'critical').map(i => ({ ...i, game: g.displayName || g.name }))
        );
        if (allIssues.length > 0) {
            logger.info('\n🔴  Critical Issues:');
            allIssues.slice(0, 8).forEach(i => logger.info(`   • [${i.game}] ${i.message}`));
            if (allIssues.length > 8) logger.info(`   ... and ${allIssues.length - 8} more`);
        }

        logger.info('━'.repeat(60) + '\n');

        const generator = new ReportGenerator(this.results, this.config);
        generator.generate();

        // 彩色终端摘要（生成文件报告之后输出，不影响日志流）
        ConsoleReporter.print(this.results);
    }
}

module.exports = { TestOrchestrator };
