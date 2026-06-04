/**
 * 配置加载器
 * 功能：
 *   - 加载并验证 test-config.json
 *   - 支持环境变量覆盖（GAME_URL_* / TEST_TIMEOUT / BROWSER_ENGINE 等）
 *   - 支持 .env 文件（项目根目录）
 *   - 配置合并优先级：环境变量 > 自定义 config 路径 > 默认 config
 *
 * 环境变量示例：
 *   GAME_URL_SNAKE=http://localhost:3001/snake
 *   TEST_TIMEOUT=90000
 *   BROWSER_ENGINE=firefox
 *   TEST_HEADLESS=true
 *   TEST_RECORD=false
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// 项目根目录（src/config → ../../ = 项目根）
const PROJECT_ROOT = path.join(__dirname, '..', '..');

class ConfigLoader {

    /**
     * 加载配置
     * @param {string|null} configPath 自定义配置文件路径
     * @returns {Object} 合并后的配置对象
     */
    static load(configPath = null) {
        // 1. 加载 .env 文件（如果存在）
        this._loadDotEnv();

        // 2. 确定配置文件路径
        const defaultPath = path.join(PROJECT_ROOT, 'config', 'test-config.json');
        const configFilePath = configPath || defaultPath;

        logger.info(`Loading config: ${configFilePath}`);

        // 3. 读取并解析 JSON
        if (!fs.existsSync(configFilePath)) {
            throw new Error(`Configuration file not found: ${configFilePath}`);
        }

        let config;
        try {
            config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
        } catch (err) {
            throw new Error(`Failed to parse config file: ${err.message}`);
        }

        // 4. 验证基本结构
        this.validate(config);

        // 5. 环境变量覆盖
        config = this._applyEnvOverrides(config);

        logger.info(`✓ Config loaded: ${Object.keys(config.games).length} games, engine=${config.browser?.engine || 'chromium'}`);
        return config;
    }

    // ─── 环境变量覆盖 ──────────────────────────────────────────────────────────

    static _applyEnvOverrides(config) {
        const env = process.env;

        // 浏览器引擎：BROWSER_ENGINE=firefox
        if (env.BROWSER_ENGINE) {
            config.browser = config.browser || {};
            config.browser.engine = env.BROWSER_ENGINE;
            logger.info(`  Env override: browser.engine = ${env.BROWSER_ENGINE}`);
        }

        // 超时：TEST_TIMEOUT=90000
        if (env.TEST_TIMEOUT) {
            const t = parseInt(env.TEST_TIMEOUT, 10);
            if (!isNaN(t) && t > 0) {
                config.browser = config.browser || {};
                config.browser.timeout = t;
                logger.info(`  Env override: browser.timeout = ${t}ms`);
            }
        }

        // 视频录制：TEST_RECORD=true
        if (env.TEST_RECORD !== undefined) {
            config.browser = config.browser || {};
            config.browser.recordVideo = env.TEST_RECORD === 'true';
            logger.info(`  Env override: browser.recordVideo = ${config.browser.recordVideo}`);
        }

        // 游戏 URL：GAME_URL_SNAKE=http://localhost:3001/snake
        for (const [key, value] of Object.entries(env)) {
            const match = key.match(/^GAME_URL_([A-Z0-9_]+)$/);
            if (!match) continue;

            const gameName = match[1].toLowerCase().replace(/_/g, '-');
            // 尝试匹配 game key（下划线 / 连字符 均可）
            const gameKey = Object.keys(config.games || {}).find(k =>
                k.toLowerCase() === gameName ||
                k.toLowerCase().replace(/-/g, '_') === gameName
            );
            if (gameKey) {
                config.games[gameKey].url = value;
                logger.info(`  Env override: games.${gameKey}.url = ${value}`);
            }
        }

        // 性能阈值：PERF_LOAD_TIME=8000
        const perfThresholdMap = {
            PERF_LOAD_TIME:    'loadTime',
            PERF_FRAME_RATE:   'frameRate',
            PERF_MEMORY_LIMIT: 'memoryUsage',
            PERF_LCP_TIME:     'lcpTime',
        };
        for (const [envKey, confKey] of Object.entries(perfThresholdMap)) {
            if (env[envKey]) {
                const v = parseFloat(env[envKey]);
                if (!isNaN(v)) {
                    config.performance = config.performance || {};
                    config.performance.thresholds = config.performance.thresholds || {};
                    config.performance.thresholds[confKey] = v;
                    logger.info(`  Env override: performance.thresholds.${confKey} = ${v}`);
                }
            }
        }

        // AI 启用：AI_ENABLED=true
        if (env.AI_ENABLED !== undefined) {
            config.ai = config.ai || {};
            config.ai.enabled = env.AI_ENABLED === 'true';
            logger.info(`  Env override: ai.enabled = ${config.ai.enabled}`);
        }

        return config;
    }

    // ─── .env 文件加载 ────────────────────────────────────────────────────────

    static _loadDotEnv() {
        const dotEnvPath = path.join(PROJECT_ROOT, '.env');
        if (!fs.existsSync(dotEnvPath)) return;

        try {
            const content = fs.readFileSync(dotEnvPath, 'utf-8');
            let count = 0;
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx < 1) continue;
                const key = trimmed.slice(0, eqIdx).trim();
                const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) {          // 不覆盖已有的系统环境变量
                    process.env[key] = val;
                    count++;
                }
            }
            if (count > 0) {
                logger.info(`Loaded ${count} variable(s) from .env`);
            }
        } catch (err) {
            logger.warn(`.env file read error: ${err.message}`);
        }
    }

    // ─── 配置验证 ─────────────────────────────────────────────────────────────

    static validate(config) {
        if (!config.games || typeof config.games !== 'object') {
            throw new Error('Config must have a "games" object');
        }
        for (const [name, gameConfig] of Object.entries(config.games)) {
            this._validateGameConfig(name, gameConfig);
        }
        if (config.performance) {
            this._validatePerformanceConfig(config.performance);
        }
    }

    static _validateGameConfig(gameName, config) {
        if (!config.url) {
            throw new Error(`Game "${gameName}" is missing required field: url`);
        }
        try {
            new URL(config.url);
        } catch {
            throw new Error(`Game "${gameName}" has invalid URL: ${config.url}`);
        }
    }

    static _validatePerformanceConfig(config) {
        const VALID_METRICS = [
            'load_time', 'first_paint', 'first_contentful_paint',
            'time_to_interactive', 'frame_rate', 'memory_usage'
        ];
        if (Array.isArray(config.metrics)) {
            for (const m of config.metrics) {
                if (!VALID_METRICS.includes(m)) {
                    logger.warn(`Unknown performance metric in config: ${m}`);
                }
            }
        }
    }

    // ─── 便捷方法 ─────────────────────────────────────────────────────────────

    static getGameConfig(config, gameName) {
        if (!config.games[gameName]) {
            throw new Error(`Game config not found: "${gameName}". Available: ${Object.keys(config.games).join(', ')}`);
        }
        return config.games[gameName];
    }

    static getAllGames(config) {
        return Object.keys(config.games);
    }
}

module.exports = { ConfigLoader };
