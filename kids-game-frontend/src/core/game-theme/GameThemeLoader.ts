/**
 * 游戏主题加载器
 * 负责在游戏运行时加载和应用主题资源
 */

import { themeApi } from '@/services/theme-api.service';
import { API_CONSTANTS } from '@/services/api.types';
import type { ThemeConfig } from '@/core/theme/ThemeManager';

const API_BASE = '/api';

/**
 * 游戏主题配置
 */
export interface GameThemeConfig {
  themeId: number;
  themeName: string;
  applicableScope: 'all' | 'specific';
  gameCode?: string;
  config: ThemeConfig;
}

/**
 * 缓存的主题列表
 */
interface CachedThemeList {
  themes: GameThemeConfig[];
  timestamp: number;
  gameCode: string;
}

/**
 * 游戏主题加载器
 */
export class GameThemeLoader {
  private static instance: GameThemeLoader;
  private currentTheme: GameThemeConfig | null = null;
  private resourceCache: Map<string, any> = new Map();
  
  // 主题列表缓存：key = gameCode, value = CachedThemeList
  private themeListCache: Map<string, CachedThemeList> = new Map();
  
  // 缓存过期时间：5分钟（单位：毫秒）
  private readonly CACHE_EXPIRE_TIME = 5 * 60 * 1000;

  private constructor() {}

  public static getInstance(): GameThemeLoader {
    if (!GameThemeLoader.instance) {
      GameThemeLoader.instance = new GameThemeLoader();
    }
    return GameThemeLoader.instance;
  }

  /**
   * 通过 gameCode 获取 gameId
   */
  private async getGameIdByCode(gameCode: string): Promise<number | null> {
    try {
      // ⭐ 使用统一 API 服务
      const { gameApi } = await import('@/services');
      const game = await gameApi.getByCode(gameCode);
          
      if (game && game.gameId) {
        console.log(`[GameThemeLoader] gameCode=${gameCode} -> gameId=${game.gameId}`);
        return game.gameId;
      }
          
      return null;
    } catch (error) {
      console.warn(`[GameThemeLoader] 获取游戏 ID 失败:`, error);
      return null;
    }
  }

  /**
   * 获取游戏的主题列表（带缓存）
   * @param gameCode 游戏代码
   * @param forceRefresh 是否强制刷新（忽略缓存）
   * @returns 主题列表
   */
  async getGameThemes(gameCode: string, forceRefresh: boolean = false): Promise<GameThemeConfig[]> {
    try {
      // 检查缓存是否存在且未过期
      if (!forceRefresh) {
        const cached = this.themeListCache.get(gameCode);
        if (cached) {
          const now = Date.now();
          const isExpired = (now - cached.timestamp) > this.CACHE_EXPIRE_TIME;
          
          if (!isExpired) {
            console.log(`[GameThemeLoader] 使用缓存的主题列表: gameCode=${gameCode}, 数量=${cached.themes.length}`);
            return cached.themes;
          } else {
            console.log(`[GameThemeLoader] 缓存已过期，重新加载: gameCode=${gameCode}`);
          }
        }
      }

      console.log(`[GameThemeLoader] 从后端加载主题列表: gameCode=${gameCode}`);
      
      // ⭐ 先获取 gameId
      const gameId = await this.getGameIdByCode(gameCode);
      
      // ⭐ 使用新的参数格式调用 API - 返回 PageData 格式
      const response = await themeApi.getList({
        ownerType: 'GAME',
        ownerId: gameId || undefined,
        status: 'on_sale',
      });

      if (response) {
        // 使用 PageData 的 list 字段
        const themeList = response.list || [];
        const themes = themeList.map((theme: any) => ({
          themeId: theme.themeId || theme.id,
          themeName: theme.themeName || theme.name,
          applicableScope: theme.applicableScope,
          gameCode: theme.gameCode,
          config: theme.config || {},
        }));

        // 缓存结果
        this.themeListCache.set(gameCode, {
          themes,
          timestamp: Date.now(),
          gameCode,
        });

        console.log(`[GameThemeLoader] 主题列表已缓存: gameCode=${gameCode}, 数量=${themes.length}`);
        return themes;
      }

      return [];
    } catch (error) {
      console.error('[GameThemeLoader] 获取游戏主题列表失败:', error);
      
      // 如果请求失败，尝试返回过期的缓存（降级策略）
      const cached = this.themeListCache.get(gameCode);
      if (cached) {
        console.warn('[GameThemeLoader] 请求失败，使用过期缓存作为降级');
        return cached.themes;
      }
      
      return [];
    }
  }
  
  /**
   * 清除指定游戏的主题列表缓存
   * @param gameCode 游戏代码（可选，不传则清除所有）
   */
  clearThemeListCache(gameCode?: string): void {
    if (gameCode) {
      this.themeListCache.delete(gameCode);
      console.log(`[GameThemeLoader] 已清除主题列表缓存: gameCode=${gameCode}`);
    } else {
      this.themeListCache.clear();
      console.log('[GameThemeLoader] 已清除所有主题列表缓存');
    }
  }
  
  /**
   * 刷新指定游戏的主题列表（强制重新加载）
   * @param gameCode 游戏代码
   * @returns 主题列表
   */
  async refreshGameThemes(gameCode: string): Promise<GameThemeConfig[]> {
    console.log(`[GameThemeLoader] 强制刷新主题列表: gameCode=${gameCode}`);
    return this.getGameThemes(gameCode, true);
  }

  /**
   * 加载指定主题
   * @param themeId 主题ID
   * @param userId 用户ID（已废弃，不再校验）
   * @returns 主题配置
   */
  async loadTheme(themeId: number, userId?: number): Promise<GameThemeConfig | null> {
    try {
      // 下载主题配置
      const downloadResponse = await themeApi.download(themeId.toString());

      if (downloadResponse) {
        const config = downloadResponse.config || downloadResponse;

        const themeConfig: GameThemeConfig = {
          themeId,
          themeName: '',
          applicableScope: 'specific',
          config,
        };

        this.currentTheme = themeConfig;
        await this.cacheThemeResources(themeConfig);

        console.log('[GameThemeLoader] 主题加载成功:', themeConfig);
        return themeConfig;
      }

      return null;
    } catch (error) {
      console.error('[GameThemeLoader] 加载主题失败:', error);
      return null;
    }
  }

  /**
   * 缓存主题资源
   * @param themeConfig 主题配置
   */
  private async cacheThemeResources(themeConfig: GameThemeConfig): Promise<void> {
    const { config } = themeConfig;

    // 主题配置处理
    if (!config || !config.default) return;

    const themeData = config.default;
    const { assets, audio } = themeData;

    // 缓存图片资源
    if (assets) {
      Object.entries(assets).forEach(([key, asset]: [string, any]) => {
        if (asset.type === 'image' && asset.url) {
          // 预加载图片
          const img = new Image();
          img.src = asset.url;
          this.resourceCache.set(`image_${key}`, img);
        }
      });
    }

    // 缓存音频资源
    if (audio) {
      Object.entries(audio).forEach(([key, audioItem]: [string, any]) => {
        if (audioItem.type === 'audio' && audioItem.url) {
          // 预加载音频
          const audio = new Audio(audioItem.url);
          audio.load();
          this.resourceCache.set(`audio_${key}`, audio);
        }
      });
    }

    console.log('[GameThemeLoader] 资源缓存完成:', this.resourceCache.size);
  }

  /**
   * 获取主题资源
   * @param resourceKey 资源键
   * @returns 资源对象
   */
  getResource(resourceKey: string): any {
    if (!this.currentTheme || !this.currentTheme.config || !this.currentTheme.config.default) {
      return null;
    }

    const themeData = this.currentTheme.config.default;
    const { assets, audio } = themeData;

    // 查找资源
    if (assets && assets[resourceKey]) {
      return assets[resourceKey];
    }

    if (audio && audio[resourceKey]) {
      return audio[resourceKey];
    }

    return null;
  }

  /**
   * 获取主题样式
   * @param styleKey 样式键
   * @returns 样式值
   */
  getStyle(styleKey: string): string | undefined {
    if (!this.currentTheme || !this.currentTheme.config || !this.currentTheme.config.default) {
      return undefined;
    }

    const themeData = this.currentTheme.config.default;
    const { styles } = themeData;

    if (!styles) return undefined;

    // 支持嵌套访问，如 'colors.primary'
    const keys = styleKey.split('.');
    let value: any = styles;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return undefined;
    }

    return typeof value === 'string' ? value : undefined;
  }

  /**
   * 获取当前主题
   * @returns 当前主题配置
   */
  getCurrentTheme(): GameThemeConfig | null {
    return this.currentTheme;
  }

  /**
   * 获取主题背景
   * @returns 背景资源URL
   */
  getBackground(): string | undefined {
    const bgAsset = this.getResource('bg_main');
    if (bgAsset?.type === 'image') {
      return bgAsset.url;
    }
    return undefined;
  }

  /**
   * 获取角色资源
   * @returns 角色资源
   */
  getPlayerAsset(): any {
    return this.getResource('player') || this.getResource('snakeHead');
  }

  /**
   * 获取食物/道具资源
   * @returns 食物资源
   */
  getFoodAsset(): any {
    return this.getResource('food') || this.getResource('coin');
  }

  /**
   * 获取游戏背景
   * @returns 游戏背景资源
   */
  getGameBackground(): any {
    return this.getResource('gameBg') || this.getResource('bg_main');
  }

  /**
   * 获取背景音乐
   * @returns 背景音乐URL
   */
  getBackgroundMusic(): string | undefined {
    const bgmAsset = this.getResource('bgm_main') || this.getResource('bgm_gameplay');
    if (bgmAsset?.type === 'audio') {
      return bgmAsset.url;
    }
    return undefined;
  }

  /**
   * 获取音效
   * @param effectKey 音效键
   * @returns 音效URL
   */
  getSoundEffect(effectKey: string): string | undefined {
    const sfxAsset = this.getResource(`sfx_${effectKey}`);
    if (sfxAsset?.type === 'audio') {
      return sfxAsset.url;
    }
    return undefined;
  }

  /**
   * 应用主题到游戏
   * @param gameContainer 游戏容器DOM元素
   */
  applyThemeToGame(gameContainer: HTMLElement): void {
    if (!gameContainer) return;

    const themeData = this.currentTheme?.config?.default;
    if (!themeData || !themeData.styles) return;

    const styles = themeData.styles;

    // 应用背景
    const bgUrl = this.getBackground();
    if (bgUrl) {
      gameContainer.style.backgroundImage = `url(${bgUrl})`;
      gameContainer.style.backgroundSize = 'cover';
      gameContainer.style.backgroundPosition = 'center';
    }

    // 应用主色调
    if (styles.colors?.primary) {
      gameContainer.style.setProperty('--theme-primary', styles.colors.primary);
    }

    // 应用次要色调
    if (styles.colors?.secondary) {
      gameContainer.style.setProperty('--theme-secondary', styles.colors.secondary);
    }

    console.log('[GameThemeLoader] 主题已应用到游戏容器');
  }

  /**
   * 清理资源缓存
   */
  clearCache(): void {
    this.resourceCache.clear();
    this.currentTheme = null;
    console.log('[GameThemeLoader] 资源缓存已清理');
  }
  
  /**
   * 清理所有缓存（资源 + 主题列表）
   */
  clearAllCache(): void {
    this.clearCache();
    this.themeListCache.clear();
    console.log('[GameThemeLoader] 所有缓存已清理');
  }
}

export const gameThemeLoader = GameThemeLoader.getInstance();
