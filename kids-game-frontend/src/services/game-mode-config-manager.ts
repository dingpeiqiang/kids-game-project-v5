/**
 * 游戏模式配置管理器
 * 负责加载和管理游戏的模式配置
 */
import { gameModeApi } from '@/services/game-mode-api.service';
import type { GameModeConfiguration, ParsedModeConfig } from '@/modules/game/types/game.types';
import { GameModeType} from '@/modules/game/core/interfaces/GameModeInterface';

export class GameModeConfigManager {
  private static instance: GameModeConfigManager;
  
  // 缓存的模式配置：gameId -> modeType -> ParsedModeConfig
  private modeConfigCache: Map<number, Map<string, ParsedModeConfig>> = new Map();

  private constructor() {}

  static getInstance(): GameModeConfigManager {
  if (!GameModeConfigManager.instance) {
   GameModeConfigManager.instance = new GameModeConfigManager();
    }
    return GameModeConfigManager.instance;
  }

  /**
   * 加载游戏的模式配置
   */
  async loadGameModeConfigs(gameId: number): Promise<ParsedModeConfig[]> {
    try {
   const configs = await gameModeApi.getModeConfigs(gameId);
      
   const parsedConfigs = configs.map(config => this.parseModeConfig(config));
      
      // 更新缓存
   const configMap = new Map<string, ParsedModeConfig>();
      parsedConfigs.forEach(config => configMap.set(config.modeType, config));
      this.modeConfigCache.set(gameId, configMap);
      
   console.log(`[GameModeConfigManager] 加载了 ${configs.length} 个模式配置`, parsedConfigs);
      
      return parsedConfigs;
    } catch (error) {
   console.error('[GameModeConfigManager] 加载模式配置失败:', error);
      return [];
    }
  }

  /**
   * 获取游戏支持的可用模式
   */
  getAvailableModes(gameId: number): string[] {
  const configMap = this.modeConfigCache.get(gameId);
  if (!configMap) {
      return [];
    }
    
    return Array.from(configMap.values())
      .filter(config => config.enabled)
      .map(config => config.modeType);
  }

  /**
   * 获取指定模式的配置
   */
  getModeConfig(gameId: number, modeType: string): ParsedModeConfig | null {
  const configMap = this.modeConfigCache.get(gameId);
  if (!configMap) {
      return null;
    }
    
    return configMap.get(modeType) || null;
  }

  /**
   * 检查模式是否可用
   */
  isModeEnabled(gameId: number, modeType: string): boolean {
  const config = this.getModeConfig(gameId, modeType);
    return config?.enabled ?? false;
  }

  /**
   * 获取默认模式
   */
  getDefaultMode(gameId: number): string | null {
  const availableModes = this.getAvailableModes(gameId);
  if (availableModes.length === 0) {
      return null;
    }
    
    // 优先返回单机模式
  if (availableModes.includes(GameModeType.SINGLE_PLAYER)) {
      return GameModeType.SINGLE_PLAYER;
    }
    
    // 否则返回第一个可用的模式
    return availableModes[0];
  }

  /**
   * 清除缓存
   */
  clearCache(gameId?: number): void {
  if (gameId !== undefined) {
      this.modeConfigCache.delete(gameId);
    } else {
      this.modeConfigCache.clear();
    }
  }

  /**
   * 解析模式配置
   */
  private parseModeConfig(config: GameModeConfiguration): ParsedModeConfig {
    let parsedConfig: Record<string, any> = {};
    
    try {
   if (config.configJson) {
      parsedConfig = JSON.parse(config.configJson);
      }
    } catch (error) {
   console.error('[GameModeConfigManager] 解析配置 JSON 失败:', error);
    }
    
    return {
     modeType: config.modeType,
     modeName: config.modeName,
     enabled: config.enabled,
   config: parsedConfig,
      sortOrder: config.sortOrder || 0,
    };
  }
}

export const gameModeConfigManager = GameModeConfigManager.getInstance();
