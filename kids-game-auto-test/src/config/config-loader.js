/**
 * 配置加载器
 * 功能：加载和验证测试配置
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class ConfigLoader {
    static load(configPath = null) {
        // config 目录在项目根目录，不是 src 下
        const projectRoot = path.join(__dirname, '..', '..');
        const defaultPath = path.join(projectRoot, 'config', 'test-config.json');
        const configFilePath = configPath || defaultPath;
        
        logger.info(`Project root: ${projectRoot}`);
        logger.info(`Config path: ${configFilePath}`);

        logger.info(`Loading configuration from: ${configFilePath}`);

        try {
            if (!fs.existsSync(configFilePath)) {
                throw new Error(`Configuration file not found: ${configFilePath}`);
            }

            const configContent = fs.readFileSync(configFilePath, 'utf-8');
            const config = JSON.parse(configContent);

            // 验证配置
            this.validate(config);

            logger.info('✓ Configuration loaded and validated');
            return config;

        } catch (error) {
            logger.error('Failed to load configuration:', error);
            throw error;
        }
    }

    static validate(config) {
        logger.info('Validating configuration...');

        // 验证 games 配置
        if (!config.games || typeof config.games !== 'object') {
            throw new Error('Configuration must have a "games" object');
        }

        for (const [gameName, gameConfig] of Object.entries(config.games)) {
            this.validateGameConfig(gameName, gameConfig);
        }

        // 验证 performance 配置
        if (config.performance) {
            this.validatePerformanceConfig(config.performance);
        }

        // 验证 ai 配置
        if (config.ai && config.ai.enabled) {
            this.validateAIConfig(config.ai);
        }

        logger.info('✓ Configuration validation passed');
    }

    static validateGameConfig(gameName, config) {
        const requiredFields = ['url'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Game "${gameName}" is missing required field: ${field}`);
            }
        }

        // 验证 URL 格式
        try {
            new URL(config.url);
        } catch (error) {
            throw new Error(`Game "${gameName}" has invalid URL: ${config.url}`);
        }
    }

    static validatePerformanceConfig(config) {
        const validMetrics = [
            'load_time',
            'first_paint',
            'first_contentful_paint',
            'time_to_interactive',
            'frame_rate',
            'memory_usage'
        ];

        if (config.metrics) {
            for (const metric of config.metrics) {
                if (!validMetrics.includes(metric)) {
                    logger.warn(`Unknown performance metric: ${metric}`);
                }
            }
        }
    }

    static validateAIConfig(config) {
        if (config.pythonPath && typeof config.pythonPath !== 'string') {
            throw new Error('AI pythonPath must be a string');
        }

        if (config.analyzerScript && typeof config.analyzerScript !== 'string') {
            throw new Error('AI analyzerScript must be a string');
        }
    }

    static getGameConfig(config, gameName) {
        if (!config.games[gameName]) {
            throw new Error(`Game configuration not found: ${gameName}`);
        }
        return config.games[gameName];
    }

    static getAllGames(config) {
        return Object.keys(config.games);
    }
}

module.exports = { ConfigLoader };
