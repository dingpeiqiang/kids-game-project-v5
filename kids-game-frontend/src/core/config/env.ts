/**
 * 环境配置
 *
 * 说明：
 * - 开发环境：读 import.meta.env（Vite dev server 注入）
 * - 生产 Web（Nginx 同源）：apiBaseUrl 为空，请求走相对路径 /api
 * - 生产 Capacitor（页面源 https://localhost）：必须用绝对后端地址，否则 /api 会被当本地资源
 */
import type { EnvConfig } from './types';

const CAPACITOR_DEFAULT_API_ORIGIN = 'https://kidsgame.dingpq.cn';

function isBundledCapacitorWebView(): boolean {
  if (typeof window === 'undefined' || import.meta.env.DEV) return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/** 从 VITE_API_BASE（可含 /api）或 VITE_API_URL 解析出 axios/rsa 用的「源」：不含 /api 后缀 */
function apiOriginFromViteEnv(): string | null {
  const raw =
    (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
    (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const u = new URL(raw);
      return u.origin;
    } catch {
      return null;
    }
  }
  return null;
}

function resolveProductionApiBaseUrl(): string {
  if (isBundledCapacitorWebView()) {
    const origin = apiOriginFromViteEnv() || CAPACITOR_DEFAULT_API_ORIGIN;
    console.log('[env] Capacitor bundled origin — apiBaseUrl:', origin);
    return origin;
  }
  const origin = apiOriginFromViteEnv();
  if (origin) {
    return origin;
  }
  return '';
}

function resolveProductionWsBaseUrl(): string {
  if (isBundledCapacitorWebView()) {
    const origin = apiOriginFromViteEnv() || CAPACITOR_DEFAULT_API_ORIGIN;
    return origin.replace(/^http/, 'ws') + '/ws';
  }
  if (typeof location !== 'undefined') {
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  }
  return 'wss://kidsgame.dingpq.cn/ws';
}

function resolveProductionResourceBaseUrl(): string {
  if (isBundledCapacitorWebView()) {
    const origin = apiOriginFromViteEnv() || CAPACITOR_DEFAULT_API_ORIGIN;
    return `${origin}/resources`;
  }
  return '/resources';
}

const envConfigs: Record<string, EnvConfig> = {
  development: {
    environment: 'development',
    apiBaseUrl: import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}`
      : 'http://localhost:8080',
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
    apiBaseUrl: resolveProductionApiBaseUrl(),
    wsBaseUrl: resolveProductionWsBaseUrl(),
    resourceBaseUrl: resolveProductionResourceBaseUrl(),
    gameCdnUrl: '',
  },
};

const mode = import.meta.env?.MODE || 'development';
export const envConfig = envConfigs[mode as keyof typeof envConfigs] || envConfigs.development;