/**
 * 环境配置
 *
 * 说明：
 * - 开发环境：读 import.meta.env（Vite dev server 注入）
 * - 生产/Docker 环境：全部走相对路径，Nginx 代理转发
 *   用户浏览器 → Nginx → 后端，前端无需知道后端地址
 */
import type { EnvConfig } from './types';

const envConfigs: Record<string, EnvConfig> = {
  development: {
    environment: 'development',
    apiBaseUrl: import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : 'http://localhost:8080/api',
    wsBaseUrl: import.meta.env.VITE_WS_URL
      ? `${import.meta.env.VITE_WS_URL}/ws`
      : 'ws://localhost:8080/ws',
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
    // 全部使用相对路径，baseURL 为空字符串避免双前缀 /api/api
    apiBaseUrl: '',
    wsBaseUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
    resourceBaseUrl: '/resources',
    gameCdnUrl: '',
  },
};

const mode = import.meta.env?.MODE || 'development';
export const envConfig = envConfigs[mode as keyof typeof envConfigs] || envConfigs.development;
