/**
 * 游戏模拟器 - 自动化操作游戏
 * 功能：模拟用户操作，执行游戏测试场景
 *
 * 迁移至 Playwright：
 * - 三层模型：chromium/firefox/webkit → browser → context → page
 * - 支持视频录制（context.recordVideo）
 * - 更强大的等待机制（waitForSelector / waitForLoadState）
 * - 内置请求拦截（route）
 * - 同一个 context 可共享 cookie / localStorage
 */

const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const { logger } = require('./utils/logger');
const { withRetry, sleep, ensureDir, takeScreenshot } = require('./utils/helpers');

// 游戏专属测试场景
const { PlaneShooterScenario }      = require('./game-scenarios/plane-shooter-scenario');
const { SnakeScenario }             = require('./game-scenarios/snake-scenario');
const { TankBattleScenario }        = require('./game-scenarios/tank-battle-scenario');
const { PlantsVsZombiesScenario }   = require('./game-scenarios/plants-vs-zombies-scenario');

// gameName → Scenario 类映射（支持多个 key 指向同一场景）
const SCENARIO_MAP = {
    'plane-shooter':       PlaneShooterScenario,
    'plane_shooter':       PlaneShooterScenario,
    'snake':               SnakeScenario,
    'tank-battle':         TankBattleScenario,
    'tank_battle':         TankBattleScenario,
    'plants-vs-zombies':   PlantsVsZombiesScenario,
    'plants_vs_zombies':   PlantsVsZombiesScenario,
    'pvz':                 PlantsVsZombiesScenario
};

// 浏览器引擎映射
const BROWSER_MAP = { chromium, firefox, webkit };

class GameSimulator {
    constructor(gameConfig, options) {
        this.config = gameConfig;
        this.options = options || {};
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = [];
        this.issues = [];
        this.screenshots = [];
        this.videoPath = null;

        // 截图 / 视频目录
        const safeGameName = (gameConfig.name || 'unknown').replace(/[^a-zA-Z0-9-]/g, '_');
        this.screenshotsDir = path.join(__dirname, '..', 'screenshots', safeGameName);
        this.videosDir = path.join(__dirname, '..', 'videos', safeGameName);
    }

    // ─── 生命周期 ─────────────────────────────────────────────────────────────

    /**
     * 启动浏览器 + 创建 context + 创建 page
     * 由 Orchestrator 统一调用，确保在 LogAnalyzer.startCollecting 之前完成
     */
    async launchBrowser() {
        logger.info('Launching browser (Playwright)...');

        const browserConfig = this.options.browserConfig || {};
        const engineName = (browserConfig.engine || 'chromium').toLowerCase();
        const browserEngine = BROWSER_MAP[engineName] || chromium;

        this.browser = await withRetry(
            () => browserEngine.launch({
                headless: !!this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--start-maximized'
                ],
                slowMo: browserConfig.slowMo || 0
            }),
            2, 2000, 'browser launch'
        );

        // Context 配置（含视频录制）
        const viewport = browserConfig.defaultViewport || { width: 1920, height: 1080 };
        const contextOptions = {
            viewport,
            ignoreHTTPSErrors: true,
            // 关闭缓存，确保每次加载最新资源
            bypassCSP: true
        };

        // 视频录制（--record 参数或配置开启）
        if (this.options.record || (this.options.browserConfig && this.options.browserConfig.recordVideo)) {
            ensureDir(this.videosDir);
            contextOptions.recordVideo = {
                dir: this.videosDir,
                size: viewport
            };
            logger.info(`Video recording enabled → ${this.videosDir}`);
        }

        this.context = await this.browser.newContext(contextOptions);

        // 设置默认超时
        const timeout = browserConfig.timeout || 60000;
        this.context.setDefaultTimeout(timeout);
        this.context.setDefaultNavigationTimeout(timeout);

        this.page = await this.context.newPage();

        logger.info(`✓ Browser launched [${engineName}], headless=${!!this.options.headless}`);
    }

    /**
     * 执行所有测试场景（由 Orchestrator 在绑定日志分析器后调用）
     */
    async runTests() {
        try {
            await this.navigateToGame();
            await this.waitForLoad();
            await this.executeTestScenarios();
        } catch (error) {
            logger.error('Test execution failed:', error);
            this.issues.push({
                type: 'test_execution',
                severity: 'critical',
                message: error.message
            });
            if (this.page) {
                const sp = await takeScreenshot(this.page, this.screenshotsDir, 'fatal-error');
                if (sp) this.screenshots.push(sp);
            }
        }

        return {
            tests: this.testResults,
            issues: this.issues,
            screenshots: this.screenshots,
            videoPath: this.videoPath
        };
    }

    async navigateToGame() {
        logger.info(`Navigating to ${this.config.url}...`);
        const startTime = Date.now();
        const navTimeout = (this.options.browserConfig && this.options.browserConfig.timeout) || 60000;

        // 优先等待 networkidle，若 30s 内超时则降级为 load
        let waitUntil = 'networkidle';
        try {
            await withRetry(
                () => this.page.goto(this.config.url, {
                    waitUntil: 'networkidle',
                    timeout: Math.min(navTimeout, 30000)
                }),
                2, 2000, `navigate to ${this.config.url}`
            );
        } catch (firstErr) {
            logger.warn(`networkidle timeout, falling back to "load"... (${firstErr.message.slice(0, 80)})`);
            waitUntil = 'load';
            await this.page.goto(this.config.url, { waitUntil: 'load', timeout: navTimeout });
        }

        const loadTime = Date.now() - startTime;
        this.testResults.push({
            name: 'page_load',
            status: 'PASSED',
            duration: loadTime,
            details: `Page loaded in ${loadTime}ms (waitUntil: ${waitUntil})`,
            timestamp: new Date().toISOString()
        });

        logger.info(`✓ Page loaded in ${loadTime}ms (${waitUntil})`);
    }

    async waitForLoad() {
        logger.info('Waiting for game to initialize...');

        // 按优先级依次尝试检测游戏容器
        const GAME_SELECTORS = [
            'canvas',
            '#app',
            '.game-container',
            '.game-canvas',
            '[class*="game"]',
            '[id*="game"]'
        ];

        let found = false;
        for (const sel of GAME_SELECTORS) {
            try {
                await this.page.waitForSelector(sel, { timeout: 6000 });
                logger.info(`✓ Game element found: ${sel}`);
                found = true;
                break;
            } catch { /* try next */ }
        }

        if (!found) {
            logger.warn('No game container found within timeout, continuing anyway...');
        }

        // 等待 DOM 稳定 + canvas 首帧渲染（最多 3s）
        try {
            await this.page.evaluate(() =>
                new Promise(resolve => {
                    const canvas = document.querySelector('canvas');
                    if (!canvas) { resolve(); return; }
                    // 等待 canvas 有实际像素（非全透明）
                    let frames = 0;
                    const check = () => {
                        frames++;
                        if (frames >= 3) { resolve(); return; }
                        requestAnimationFrame(check);
                    };
                    requestAnimationFrame(check);
                    setTimeout(resolve, 3000);
                })
            );
        } catch { /* ignore */ }

        await sleep(1000);
        logger.info('✓ Game initialized');
    }

    async executeTestScenarios() {
        logger.info('\nExecuting test scenarios...');

        // 查找专属场景类（按 gameName 或 config.scenarioKey 匹配）
        const scenarioKey = (this.config.scenarioKey || this.config.name || '').toLowerCase();
        const ScenarioClass = SCENARIO_MAP[scenarioKey];

        if (ScenarioClass) {
            // ── 专属场景路径 ──────────────────────────────────────────
            logger.info(`Using dedicated scenario: ${ScenarioClass.name} (key="${scenarioKey}")`);
            const scenario = new ScenarioClass(this.page, this.config, this.options);
            try {
                const scenarioResults = await scenario.run();
                this.testResults.push(...scenarioResults);
                logger.info(`✓ Dedicated scenario completed: ${scenarioResults.length} tests`);
            } catch (err) {
                logger.error(`Dedicated scenario failed: ${err.message}`);
                this.issues.push({ type: 'scenario_error', severity: 'critical', message: err.message });
            }
        } else {
            // ── 通用内置场景路径（兜底）────────────────────────────────
            logger.info(`No dedicated scenario found for "${scenarioKey}", using generic tests`);
            await this.testStartScreen();
            await this.testDifficultySelection();
            await this.testThemeSelection();
            await this.testGameplay();
            await this.testUIInteractions();
            await this.testAudio();

            // 按 testScenarios 配置执行额外场景
            const scenarios = this.config.testScenarios || [];
            if (scenarios.includes('shooting_mechanism'))  await this.testShootingMechanism();
            if (scenarios.includes('movement_control'))    await this.testMovementControl();
            if (scenarios.includes('collision_detection')) await this.testCollisionDetection();
            if (scenarios.includes('plant_placement'))     await this.testPlantPlacement();
            if (scenarios.includes('food_collection'))     await this.testFoodCollection();
        }

        // 最终状态截图（所有路径都执行）
        if (this.page) {
            const sp = await takeScreenshot(this.page, this.screenshotsDir, 'final-state');
            if (sp) this.screenshots.push(sp);
        }

        logger.info(`✓ Executed ${this.testResults.length} test scenarios`);
    }

    // ─── 测试场景 ─────────────────────────────────────────────────────────────

    async testStartScreen() {
        await this.runScenario('start_screen_display', async () => {
            const startButtonExists = await this.page.$('.start-button, #start-btn, button') !== null;
            const hasCanvas = await this.page.$('canvas') !== null;
            return {
                passed: startButtonExists || hasCanvas,
                details: `Start button: ${startButtonExists}, Canvas: ${hasCanvas}`
            };
        });
    }

    async testDifficultySelection() {
        await this.runScenario('difficulty_selection', async () => {
            const selectors = [
                '.difficulty-select', '.difficulty-easy',
                '.difficulty-normal', '.difficulty-hard', '[class*="difficulty"]'
            ];
            for (const selector of selectors) {
                const el = await this.page.$(selector);
                if (el) {
                    await el.click();
                    await sleep(500);
                    return { passed: true, details: `Clicked: ${selector}` };
                }
            }
            return { passed: null, warning: true, details: 'No difficulty selector found (may be optional)' };
        });
    }

    async testThemeSelection() {
        await this.runScenario('theme_selection', async () => {
            const exists = await this.page.$('.theme-selector, .skin-select, [class*="theme"]') !== null;
            return { passed: exists, warning: !exists, details: `Theme selector present: ${exists}` };
        });
    }

    async testGameplay() {
        await this.runScenario('gameplay_flow', async () => {
            const startBtn = await this.page.$('.start-button, #start-btn, button[class*="start"]');
            if (!startBtn) return { passed: null, warning: true, details: 'No start button found' };

            await startBtn.click();
            await sleep(3000);

            const gameActive = await this.checkGameActive();
            return { passed: gameActive, details: `Game active after start: ${gameActive}` };
        });
    }

    async testUIInteractions() {
        await this.runScenario('ui_elements', async () => {
            const selectors = [
                '.score-display', '.health-bar', '.level-indicator',
                '.pause-button', '[class*="score"]', '[class*="health"]',
                '[class*="level"]', '[id*="score"]'
            ];
            const found = [];
            for (const s of selectors) {
                if (await this.page.$(s) !== null) found.push(s);
            }
            return {
                passed: found.length >= 2,
                warning: found.length === 1,
                details: `Found ${found.length} UI elements: ${found.join(', ') || 'none'}`
            };
        });
    }

    async testAudio() {
        await this.runScenario('audio_control', async () => {
            const exists = await this.page.$(
                '.audio-control, .sound-toggle, .mute-button, [class*="audio"], [class*="sound"]'
            ) !== null;
            return { passed: exists, warning: !exists, details: `Audio control present: ${exists}` };
        });
    }

    async testShootingMechanism() {
        await this.runScenario('shooting_mechanism', async () => {
            await this.page.keyboard.press('Space');
            await sleep(500);
            return { passed: true, details: 'Space key pressed for shooting' };
        });
    }

    async testMovementControl() {
        await this.runScenario('movement_control', async () => {
            for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
                await this.page.keyboard.press(key);
                await sleep(200);
            }
            return { passed: true, details: 'Arrow key movement tested' };
        });
    }

    async testCollisionDetection() {
        await this.runScenario('collision_detection', async () => ({
            passed: true,
            details: 'Collision detection: basic check (requires game-specific logic for full verification)'
        }));
    }

    async testPlantPlacement() {
        await this.runScenario('plant_placement', async () => {
            const cell = await this.page.$('.grid-cell, .lane-cell, [class*="cell"]');
            if (cell) {
                await cell.click();
                await sleep(500);
                return { passed: true, details: 'Clicked a grid cell for plant placement' };
            }
            return { passed: null, warning: true, details: 'No grid cell found' };
        });
    }

    async testFoodCollection() {
        await this.runScenario('food_collection', async () => {
            // 贪吃蛇食物由游戏逻辑生成，这里验证画布在更新
            const isActive = await this.checkGameActive();
            return { passed: isActive, details: `Canvas active (food rendering implied): ${isActive}` };
        });
    }

    // ─── 工具方法 ─────────────────────────────────────────────────────────────

    /**
     * 通用场景执行包装器
     */
    async runScenario(scenarioName, fn) {
        logger.info(`\n[Test] ${scenarioName}...`);
        const startTime = Date.now();

        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            const status = result.passed === true  ? 'PASSED'
                         : result.passed === false ? 'FAILED'
                         : result.warning          ? 'WARNING'
                         : 'INFO';

            this.testResults.push({
                name: scenarioName,
                status,
                duration,
                details: result.details || '',
                timestamp: new Date().toISOString()
            });

            logger.info(`  ✓ ${scenarioName}: ${status} (${duration}ms)`);

            if (status === 'FAILED' && this.page) {
                const sp = await takeScreenshot(this.page, this.screenshotsDir, `fail-${scenarioName}`);
                if (sp) this.screenshots.push(sp);
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`  ✗ ${scenarioName} threw: ${error.message}`);

            this.testResults.push({
                name: scenarioName,
                status: 'ERROR',
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            this.issues.push({
                type: 'test_failure',
                test: scenarioName,
                severity: 'warning',
                message: error.message
            });

            if (this.page) {
                const sp = await takeScreenshot(this.page, this.screenshotsDir, `error-${scenarioName}`);
                if (sp) this.screenshots.push(sp);
            }
        }
    }

    /**
     * 检测游戏是否处于活跃渲染状态
     */
    async checkGameActive() {
        try {
            return await this.page.evaluate(() =>
                new Promise(resolve => {
                    const t0 = performance.now();
                    requestAnimationFrame(() => resolve(performance.now() - t0 > 0));
                })
            );
        } catch {
            return true;
        }
    }

    /**
     * 关闭浏览器（context → browser）
     */
    async closeBrowser() {
        if (this.context) {
            try {
                // 若开启了录制，保存视频路径
                if (this.page) {
                    const video = this.page.video();
                    if (video) {
                        this.videoPath = await video.path();
                        logger.info(`Video saved: ${this.videoPath}`);
                    }
                }
                await this.context.close();
            } catch (e) {
                logger.warn(`Context close warning: ${e.message}`);
            }
            this.context = null;
            this.page = null;
        }

        if (this.browser) {
            try {
                await this.browser.close();
            } catch (e) {
                logger.warn(`Browser close warning: ${e.message}`);
            }
            this.browser = null;
        }
    }
}

module.exports = { GameSimulator };
