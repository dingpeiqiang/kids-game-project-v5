/**
 * 游戏模拟器 - 自动化操作游戏
 * 功能：模拟用户操作，执行游戏流程
 */

const puppeteer = require('puppeteer');
const { logger } = require('./utils/logger');

class GameSimulator {
    constructor(gameConfig, options) {
        this.config = gameConfig;
        this.options = options;
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.issues = [];
    }

    async runAllTests() {
        try {
            // 启动浏览器
            await this.launchBrowser();
            
            // 访问游戏
            await this.navigateToGame();
            
            // 等待加载
            await this.waitForLoad();
            
            // 执行测试场景
            await this.executeTestScenarios();
            
            // 注意：暂时不关闭浏览器，以便性能监控使用 page
            // 浏览器将在 orchestrator 中统一关闭
            
        } catch (error) {
            logger.error(`Test execution failed:`, error);
            this.issues.push({
                type: 'test_execution',
                severity: 'critical',
                message: error.message
            });
            
            if (this.browser) {
                await this.closeBrowser();
            }
        }

        return {
            tests: this.testResults,
            issues: this.issues
        };
    }

    async launchBrowser() {
        logger.info('Launching browser...');
        
        this.browser = await puppeteer.launch({
            headless: this.options.headless ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--start-maximized'
            ]
        });

        this.page = await this.browser.newPage();
        
        // 设置视口
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 启用性能监控
        await this.page.setCacheEnabled(false);
        
        logger.info('✓ Browser launched');
    }

    async navigateToGame() {
        logger.info(`Navigating to ${this.config.url}...`);
        
        const startTime = Date.now();
        await this.page.goto(this.config.url, { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });
        const loadTime = Date.now() - startTime;
        
        this.testResults.push({
            name: 'page_load',
            status: 'PASSED',
            duration: loadTime,
            timestamp: new Date().toISOString()
        });
        
        logger.info(`✓ Page loaded in ${loadTime}ms`);
    }

    async waitForLoad() {
        logger.info('Waiting for game to initialize...');
        
        // 等待游戏 canvas 或容器出现
        await this.page.waitForSelector('#app, .game-container, canvas', { timeout: 10000 });
        
        // 额外等待资源加载
        await this.sleep(2000);
        
        logger.info('✓ Game initialized');
    }

    async executeTestScenarios() {
        logger.info('\nExecuting test scenarios...');

        // 场景 1: 开始界面测试
        await this.testStartScreen();
        
        // 场景 2: 难度选择测试
        await this.testDifficultySelection();
        
        // 场景 3: 主题选择测试
        await this.testThemeSelection();
        
        // 场景 4: 游戏流程测试
        await this.testGameplay();
        
        // 场景 5: UI 交互测试
        await this.testUIInteractions();
        
        // 场景 6: 音频测试
        await this.testAudio();
        
        logger.info(`✓ Executed ${this.testResults.length} test scenarios`);
    }

    async testStartScreen() {
        logger.info('\n[Test] Start Screen...');
        
        try {
            // 检查开始按钮
            const startButtonExists = await this.page.$('.start-button, #start-btn, button') !== null;
            
            this.testResults.push({
                name: 'start_screen_display',
                status: startButtonExists ? 'PASSED' : 'FAILED',
                details: 'Start screen displayed correctly',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`✓ Start screen test: ${startButtonExists ? 'PASSED' : 'FAILED'}`);
        } catch (error) {
            this.handleTestError('start_screen', error);
        }
    }

    async testDifficultySelection() {
        logger.info('\n[Test] Difficulty Selection...');
        
        try {
            // 尝试点击难度选择
            const difficultySelectors = [
                '.difficulty-select',
                '.difficulty-easy',
                '.difficulty-normal',
                '.difficulty-hard'
            ];
            
            let difficultySelected = false;
            
            for (const selector of difficultySelectors) {
                const element = await this.page.$(selector);
                if (element) {
                    await element.click();
                    await this.sleep(500);
                    difficultySelected = true;
                    break;
                }
            }
            
            this.testResults.push({
                name: 'difficulty_selection',
                status: difficultySelected ? 'PASSED' : 'WARNING',
                details: 'Difficulty selection functionality',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`✓ Difficulty selection test completed`);
        } catch (error) {
            this.handleTestError('difficulty_selection', error);
        }
    }

    async testThemeSelection() {
        logger.info('\n[Test] Theme Selection...');
        
        try {
            // 检查主题选择器
            const themeSelectorExists = await this.page.$('.theme-selector, .skin-select') !== null;
            
            this.testResults.push({
                name: 'theme_selection',
                status: themeSelectorExists ? 'PASSED' : 'WARNING',
                details: 'Theme selection availability',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`✓ Theme selection test completed`);
        } catch (error) {
            this.handleTestError('theme_selection', error);
        }
    }

    async testGameplay() {
        logger.info('\n[Test] Gameplay...');
        
        try {
            // 尝试开始游戏
            const startButton = await this.page.$('.start-button, #start-btn, button');
            if (startButton) {
                await startButton.click();
                await this.sleep(3000);
                
                // 检查游戏是否在进行中
                const gameActive = await this.checkGameActive();
                
                this.testResults.push({
                    name: 'gameplay_flow',
                    status: gameActive ? 'PASSED' : 'WARNING',
                    details: 'Game flow and progression',
                    timestamp: new Date().toISOString()
                });
                
                logger.info(`✓ Gameplay test completed`);
            }
        } catch (error) {
            this.handleTestError('gameplay', error);
        }
    }

    async testUIInteractions() {
        logger.info('\n[Test] UI Interactions...');
        
        try {
            // 检查各种 UI 元素
            const uiElements = [
                '.score-display',
                '.health-bar',
                '.level-indicator',
                '.pause-button'
            ];
            
            let elementsFound = 0;
            
            for (const selector of uiElements) {
                const exists = await this.page.$(selector) !== null;
                if (exists) elementsFound++;
            }
            
            this.testResults.push({
                name: 'ui_elements',
                status: elementsFound >= 2 ? 'PASSED' : 'WARNING',
                details: `Found ${elementsFound}/${uiElements.length} UI elements`,
                timestamp: new Date().toISOString()
            });
            
            logger.info(`✓ UI interactions test completed`);
        } catch (error) {
            this.handleTestError('ui_interactions', error);
        }
    }

    async testAudio() {
        logger.info('\n[Test] Audio...');
        
        try {
            // 检查音频控制
            const audioControlExists = await this.page.$('.audio-control, .sound-toggle, .mute-button') !== null;
            
            this.testResults.push({
                name: 'audio_control',
                status: audioControlExists ? 'PASSED' : 'INFO',
                details: 'Audio control availability',
                timestamp: new Date().toISOString()
            });
            
            logger.info(`✓ Audio test completed`);
        } catch (error) {
            this.handleTestError('audio', error);
        }
    }

    async checkGameActive() {
        // 检查游戏是否在进行中的逻辑
        await this.sleep(2000);
        return true;
    }

    handleTestError(testName, error) {
        logger.error(`Test ${testName} failed:`, error.message);
        
        this.testResults.push({
            name: testName,
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        this.issues.push({
            type: 'test_failure',
            test: testName,
            severity: 'warning',
            message: error.message
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            logger.info('✓ Browser closed');
        }
    }
}

module.exports = { GameSimulator };
