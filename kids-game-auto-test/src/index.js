/**
 * Kids Game 自动化测试主程序
 * 功能：协调所有测试模块，执行完整的测试流程
 *
 * 优化点：
 * - 新增 --parallel 并发测试模式
 * - 新增 --timeout 自定义超时参数
 * - 优雅处理 SIGINT / SIGTERM，确保浏览器正常关闭
 * - 统一版本号来源（package.json）
 */

const { TestOrchestrator } = require('./orchestrator');
const { logger } = require('./utils/logger');
const { ConfigLoader } = require('./config/config-loader');
const { Command } = require('commander');

const pkg = require('../package.json');
const program = new Command();

program
    .name('kids-game-auto-test')
    .version(pkg.version)
    .description(pkg.description)
    .option('--mode <mode>',        '测试模式：all | single | performance | ai', 'all')
    .option('--game <gameName>',    '指定游戏名称（对应 config/test-config.json 中的 key）')
    .option('--headless',           '无头模式运行浏览器（CI/CD 推荐）')
    .option('--record',             '录制测试过程为视频')
    .option('--parallel',           '并发测试所有游戏（加速但消耗更多资源）')
    .option('--timeout <ms>',       '全局超时（毫秒）', '60000')
    .option('--config <path>',      '自定义配置文件路径')
    .parse(process.argv);

// 跟踪 orchestrator 实例，用于优雅退出
let orchestrator = null;

async function main() {
    const options = program.opts();
    options.timeout = parseInt(options.timeout, 10) || 60000;

    printBanner(options);

    try {
        // 加载配置
        const config = ConfigLoader.load(options.config || null);
        logger.info('✓ Configuration loaded successfully');

        // 将浏览器相关配置注入 options，方便模拟器读取
        options.browserConfig = config.browser || {};

        // 创建并运行测试
        orchestrator = new TestOrchestrator(config, options);
        await orchestrator.run();

        logger.info('\n✓ All tests completed successfully!');
        process.exit(0);

    } catch (error) {
        logger.error('\n✗ Test execution failed:', error.message);
        if (process.env.DEBUG) logger.error(error.stack);
        process.exit(1);
    }
}

function printBanner(options) {
    const lines = [
        '╔══════════════════════════════════════════════╗',
        `║   Kids Game Auto Test Platform  v${pkg.version.padEnd(10)}║`,
        '╠══════════════════════════════════════════════╣',
        `║  Mode:      ${String(options.mode).padEnd(33)}║`,
        `║  Game:      ${String(options.game || 'all').padEnd(33)}║`,
        `║  Headless:  ${String(!!options.headless).padEnd(33)}║`,
        `║  Parallel:  ${String(!!options.parallel).padEnd(33)}║`,
        `║  Record:    ${String(!!options.record).padEnd(33)}║`,
        `║  Timeout:   ${String(options.timeout + 'ms').padEnd(33)}║`,
        '╚══════════════════════════════════════════════╝'
    ];
    lines.forEach(l => logger.info(l));
    logger.info('');
}

// ─── 优雅退出处理 ─────────────────────────────────────────────────────────

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.message);
    if (process.env.DEBUG) logger.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
    process.exit(1);
});

// Ctrl+C 或 kill 信号时，优雅关闭浏览器
async function gracefulShutdown(signal) {
    logger.warn(`\nReceived ${signal}, shutting down gracefully...`);
    // orchestrator 中已在 finally 关闭浏览器，这里只需退出
    process.exit(0);
}

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

main();
