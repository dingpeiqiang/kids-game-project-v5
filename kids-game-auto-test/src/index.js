/**
 * Kids Game 自动化测试主程序
 * 功能：协调所有测试模块，执行完整的测试流程
 */

const { TestOrchestrator } = require('./orchestrator');
const { logger } = require('./utils/logger');
const { ConfigLoader } = require('./config/config-loader');
const { Command } = require('commander');
const program = new Command();

program
    .version('1.0.0')
    .description('Kids Game 自动化测试平台')
    .option('--mode <mode>', '测试模式：all, single, performance, ai', 'all')
    .option('--game <gameName>', '指定游戏名称')
    .option('--headless', '无头模式运行浏览器')
    .option('--record', '录制测试过程')
    .parse(process.argv);

async function main() {
    const options = program.opts();
    
    logger.info('========================================');
    logger.info('  Kids Game Auto Test Platform v1.0.0');
    logger.info('========================================');
    logger.info(`Mode: ${options.mode}`);
    logger.info(`Game: ${options.game || 'all'}`);
    logger.info(`Headless: ${options.headless || false}`);
    logger.info(`Record: ${options.record || false}`);
    logger.info('========================================\n');

    try {
        // 加载配置
        const config = ConfigLoader.load();
        logger.info('✓ Configuration loaded successfully');

        // 创建测试协调器
        const orchestrator = new TestOrchestrator(config, options);

        // 执行测试
        await orchestrator.run();

        logger.info('\n✓ All tests completed successfully!');
        process.exit(0);
    } catch (error) {
        logger.error('\n✗ Test execution failed:', error);
        process.exit(1);
    }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
