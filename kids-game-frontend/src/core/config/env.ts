/**
 * 环境配置
 */
import type { EnvConfig } from './types';

const envConfigs: Record<string, EnvConfig> = {
  development: {
    environment: 'development',
    // 优先从环境变量读取，支持 Vite 的 .env 文件
    apiBaseUrl: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8080/api',
    wsBaseUrl: import.meta.env.VITE_WS_URL ? `${import.meta.env.VITE_WS_URL}/ws` : 'ws://localhost:8080/ws',
    resourceBaseUrl: import.meta.env.VITE_RESOURCE_URL || 'http://localhost:8080/resources',
  },
  test: {
    environment: 'test',
    apiBaseUrl: 'https://test-api.kidsgame.com/api',
    wsBaseUrl: 'wss://test-api.kidsgame.com/ws',
    resourceBaseUrl: 'https://test-cdn.kidsgame.com',
  },
  production: {
    environment: 'production',
    apiBaseUrl: 'https://api.kidsgame.com/api',
    wsBaseUrl: 'wss://api.kidsgame.com/ws',
    resourceBaseUrl: 'https://cdn.kidsgame.com',
  },
};

// 获取当前环境模式
const mode = import.meta.env?.MODE || 'development';

export const envConfig = envConfigs[mode as keyof typeof envConfigs] || envConfigs.development;


