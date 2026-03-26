/**
 * 测试协调器 - 核心引擎
 * 功能：协调所有测试模块，管理测试流程
 */

const { GameSimulator } = require('./game-simulator');
const { PerformanceMonitor } = require('./performance-monitor');
const { LogAnalyzer } = require('./log-analyzer');
const { AIExperienceAnalyzer } = require('./ai-experience-analyzer');
const { ReportGenerator } = require('./report-generator');
const { logger } = require('./utils/logger');

class TestOrchestrator {
    constructor(config, options) {
        this.config = config;
        this.options = options;
        this.results = {
            startTime: new Date(),
            endTime: null,
            games: [],
            overall: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
    }

    async run() {
        const games = this.options.game 
            ? [this.options.game] 
            : Object.keys(this.config.games);

        for (const gameName of games) {
            await this.testGame(gameName);
        }

        this.results.endTime = new Date();
        
        // 清理：关闭所有浏览器
        await this.cleanup();
        
        this.generateFinalReport();
    }

    async testGame(gameName) {
        logger.info(`\n${'='.repeat(60)}`);
        logger.info(`Testing Game: ${gameName}`);
        logger.info('='.repeat(60));

        const gameResult = {
            name: gameName,
            startTime: new Date(),
            tests: [],
            issues: [],
            metrics: {}
        };

        try {
            // 1. 功能测试
            logger.info('\n[1/4] Running Functional Tests...');
            const functionalResult = await this.runFunctionalTests(gameName);
            gameResult.tests.push(...functionalResult.tests);
            gameResult.issues.push(...functionalResult.issues);

            // 2. 性能测试
            logger.info('\n[2/4] Running Performance Tests...');
            const performanceResult = await this.runPerformanceTests(gameName);
            gameResult.metrics = performanceResult.metrics;

            // 3. 日志分析
            logger.info('\n[3/4] Analyzing Logs...');
            const logResult = await this.analyzeLogs(gameName);
            gameResult.issues.push(...logResult.issues);

            // 4. AI 游戏体验分析（如果有 Python）
            if (this.config.ai.enabled) {
                logger.info('\n[4/4] AI Experience Analysis...');
                const aiResult = await this.analyzeAIExperience(gameName);
                gameResult.tests.push(...aiResult.tests);
            }

            gameResult.endTime = new Date();
            gameResult.status = gameResult.issues.filter(i => i.severity === 'critical').length > 0 ? 'FAILED' : 'PASSED';

        } catch (error) {
            logger.error(`Game ${gameName} test failed:`, error);
            gameResult.status = 'ERROR';
            gameResult.issues.push({
                type: 'test_error',
                severity: 'critical',
                message: error.message,
                stack: error.stack
            });
        }

        this.results.games.push(gameResult);
        this.updateOverallStats(gameResult);
        
        logger.info(`\n✓ Game ${gameName} completed: ${gameResult.status}`);
    }

    async runFunctionalTests(gameName) {
        const simulator = new GameSimulator(this.config.games[gameName], this.options);
        const result = await simulator.runAllTests();
        // 保存 simulator 引用以便后续使用 page
        this.currentSimulator = simulator;
        return result;
    }

    async runPerformanceTests(gameName) {
        const monitor = new PerformanceMonitor(this.config.games[gameName]);
        // 使用 functional test 中创建的 page
        if (this.currentSimulator && this.currentSimulator.page) {
            return await monitor.measure(this.currentSimulator.page);
        } else {
            logger.warn('No page available for performance measurement');
            return { metrics: {}, issues: [] };
        }
    }

    async analyzeLogs(gameName) {
        const analyzer = new LogAnalyzer();
        return await analyzer.analyze(gameName);
    }

    async analyzeAIExperience(gameName) {
        const aiAnalyzer = new AIExperienceAnalyzer(this.config.games[gameName]);
        return await aiAnalyzer.analyze();
    }

    updateOverallStats(gameResult) {
        this.results.overall.total++;
        if (gameResult.status === 'PASSED') {
            this.results.overall.passed++;
        } else if (gameResult.status === 'FAILED') {
            this.results.overall.failed++;
        }
    }

    generateFinalReport() {
        const generator = new ReportGenerator(this.results);
        generator.generate();
    }

    async cleanup() {
        logger.info('Cleaning up resources...');
        if (this.currentSimulator) {
            await this.currentSimulator.closeBrowser();
            logger.info('✓ Browser closed');
        }
    }
}

module.exports = { TestOrchestrator };
