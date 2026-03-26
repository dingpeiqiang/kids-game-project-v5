/**
 * 示例测试脚本 - 演示如何编写自定义测试
 */

const { GameSimulator } = require('./game-simulator');
const { logger } = require('./utils/logger');

async function runCustomTest() {
    logger.info('========================================');
    logger.info('  Running Custom Test Example');
    logger.info('========================================\n');

    // 配置要测试的游戏
    const gameConfig = {
        name: 'Plane Shooter',
        url: 'http://localhost:8081/',
        type: 'shooter'
    };

    const options = {
        headless: true,
        record: false
    };

    try {
        // 创建游戏模拟器实例
        const simulator = new GameSimulator(gameConfig, options);

        // 启动浏览器
        logger.info('Starting browser...');
        await simulator.launchBrowser();

        // 导航到游戏页面
        logger.info('Navigating to game...');
        await simulator.navigateToGame();

        // 等待加载
        logger.info('Waiting for game to load...');
        await simulator.waitForLoad();

        // 执行自定义测试
        logger.info('\nRunning custom test scenarios...\n');

        // 测试 1: 检查开始按钮
        logger.info('[Test 1] Checking start button...');
        const startButton = await simulator.page.$('.start-button, #start-btn, button');
        if (startButton) {
            logger.info('✓ Start button found');
        } else {
            logger.warn('⚠ Start button not found');
        }

        // 测试 2: 截图
        logger.info('\n[Test 2] Taking screenshot...');
        await simulator.page.screenshot({
            path: 'screenshots/example-test.png',
            fullPage: true
        });
        logger.info('✓ Screenshot saved to screenshots/example-test.png');

        // 测试 3: 获取页面标题
        logger.info('\n[Test 3] Getting page title...');
        const title = await simulator.page.title();
        logger.info(`Page title: ${title}`);

        // 测试 4: 收集性能指标
        logger.info('\n[Test 4] Collecting performance metrics...');
        const performanceMetrics = await simulator.page.metrics();
        logger.info('Performance Metrics:');
        logger.info(`  - DOM Content Loaded: ${performanceMetrics.DomContentLoaded}ms`);
        logger.info(`  - Load Complete: ${performanceMetrics.LoadComplete}ms`);

        // 关闭浏览器
        logger.info('\nClosing browser...');
        await simulator.closeBrowser();

        logger.info('\n✓ Custom test completed successfully!');

    } catch (error) {
        logger.error('Test failed:', error);
        process.exit(1);
    }
}

// 运行测试
runCustomTest();
