/**
 * 配置统一导出
 */
import { envConfig } from './env';
import { gameConfig } from './game';
import { uiConfig } from './ui';

export { envConfig, gameConfig, uiConfig };
export type { EnvConfig, GameConfig as GameEnvConfig, UIConfig } from './types';

// 导出首页配置相关
export * from './home.types';
export { homeConfigManager } from './home.config.manager';
export { homeConfigService } from '@/services/home.config.service';

/**
 * 全局配置管理类
 */
export class Config {
  static get env() {
    return envConfig;
  }

  static get game() {
    return gameConfig;
  }

  static get ui() {
    return uiConfig;
  }

  static init(): void {
    console.log('[Config] initialized');
    console.log('[Config] environment:', this.env.environment);
  }
}

