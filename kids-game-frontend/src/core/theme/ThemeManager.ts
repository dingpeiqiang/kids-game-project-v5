/**
 * Phaser3 Theme Manager
 * Core theme management for Vue3 + Phaser3 hybrid project
 */

// Phaser 从 CDN 加载为全局变量
import { themeApi, type ThemeListParams } from '@/services/theme-api.service';

/**
 * Theme asset configuration
 */
export interface ThemeAssets {
  [key: string]: string;
}

/**
 * Theme style configuration
 */
export interface ThemeStyles {
  [key: string]: string;
}

/**
 * Theme configuration structure
 */
export interface ThemeConfig {
  key: string;
  name: string;
  author: string;
  isBase?: boolean;
  path?: string;
  assets: ThemeAssets;
  styles: ThemeStyles;
  description?: string;
  price?: number;
  thumbnail?: string;
  createdAt?: number;
  updatedAt?: number;
  
  // 新增字段，支持按应用/游戏查询
  applicableScope?: 'all' | 'specific';
  gameId?: number;
  gameCode?: string;
  themeId?: number | string;
}

/**
 * DIY theme data (incremental changes only)
 */
export interface DiyThemeData {
  baseThemeKey: string;
  name: string;
  author: string;
  description?: string; // 添加描述字段
  assetOverrides?: ThemeAssets;
  styleOverrides?: ThemeStyles;
  createdAt: number;
  updatedAt: number;
}

/**
 * Cloud theme info
 */
export interface CloudThemeInfo {
  id: string;
  key: string;
  name: string;
  author: string;
  price: number;
  thumbnail?: string;
  description?: string;
  downloadCount: number;
  rating?: number;
  status: 'on_sale' | 'offline' | 'pending';
  createdAt: number;
}

/**
 * Theme Manager Singleton
 * Handles theme loading, switching, and DIY theme management
 */
class ThemeManager {
  private static instance: ThemeManager;

  private baseThemeConfig: Record<string, ThemeConfig> = {};
  private localDiyThemes: Record<string, DiyThemeData> = {};
  private currentThemeKey: string = 'default';
  private activeScene: Phaser.Scene | null = null;
  private themeCache: Map<string, ThemeConfig> = new Map();

  private readonly LOCAL_STORAGE_KEY = 'phaser_diy_themes';
  private readonly BASE_THEME_PATH = '/themes/theme-default/config.json';

  private constructor() {
    this.loadLocalDiyThemes();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Load base theme configuration from assets
   */
  public async loadBaseConfig(): Promise<void> {
    try {
      const response = await fetch(this.BASE_THEME_PATH);
      if (!response.ok) {
        throw new Error(`Failed to load base theme config: ${response.status}`);
      }
      const config = await response.json();
      this.baseThemeConfig = config;
      console.log('[ThemeManager] Base theme config loaded:', Object.keys(this.baseThemeConfig));
    } catch (error) {
      console.error('[ThemeManager] Failed to load base theme config:', error);
      this.baseThemeConfig = {
        default: {
          key: 'default',
          name: '官方基础主题',
          author: '游戏官方',
          isBase: true,
          path: '/themes/theme-default',
          assets: {
            bg_main: 'images/bg_main.png',
            player_1: 'images/player.png',
            btn_start: 'images/btn_start.png',
            bgm_main: 'audio/bgm_main.mp3',
            sound_click: 'audio/click.mp3',
          },
          styles: {
            color_text: '#ffffff',
            color_primary: '#42b983',
            color_btn_bg: '#333333',
            font_size_title: '40px',
            border_radius_btn: '8px',
          },
        },
      };
    }
  }

  /**
   * Get current theme configuration (merged base + DIY)
   */
  public getCurrentTheme(): ThemeConfig {
    const baseTheme = this.baseThemeConfig[this.currentThemeKey];
    if (!baseTheme) {
      return this.baseThemeConfig['default'] || this.getDefaultTheme();
    }

    const diyTheme = this.localDiyThemes[this.currentThemeKey];
    if (!diyTheme) {
      return baseTheme;
    }

    return this.mergeTheme(baseTheme, diyTheme);
  }

  /**
   * Get asset URL by key from current theme
   */
  public getAsset(key: string): string | undefined {
    const theme = this.getCurrentTheme();
    return theme.assets[key];
  }

  /**
   * Get style value by key from current theme
   */
  public getStyle(key: string): string | undefined {
    const theme = this.getCurrentTheme();
    return theme.styles[key];
  }

  /**
   * Switch to a different theme
   */
  public async switchTheme(themeKey: string): Promise<boolean> {
    try {
      const baseTheme = this.baseThemeConfig[themeKey];
      if (!baseTheme && !this.localDiyThemes[themeKey]) {
        console.warn('[ThemeManager] Theme not found:', themeKey);
        return false;
      }

      this.currentThemeKey = themeKey;
      localStorage.setItem('phaser_current_theme', themeKey);

      console.log('[ThemeManager] Switched to theme:', themeKey);

      if (this.activeScene) {
        await this.applyThemeToScene(this.activeScene);
      }

      window.dispatchEvent(
        new CustomEvent('phaser-theme-change', {
          detail: { themeKey, theme: this.getCurrentTheme() },
        })
      );

      return true;
    } catch (error) {
      console.error('[ThemeManager] Failed to switch theme:', error);
      return false;
    }
  }

  /**
   * Add local DIY theme (incremental changes)
   */
  public addLocalDiyTheme(data: DiyThemeData): string {
    const themeKey = `diy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const themeData: DiyThemeData = {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.localDiyThemes[themeKey] = themeData;
    this.saveLocalDiyThemes();

    console.log('[ThemeManager] Added local DIY theme:', themeKey);
    return themeKey;
  }

  /**
   * Update existing DIY theme
   */
  public updateLocalDiyTheme(themeKey: string, data: Partial<DiyThemeData>): boolean {
    if (!this.localDiyThemes[themeKey]) {
      return false;
    }

    this.localDiyThemes[themeKey] = {
      ...this.localDiyThemes[themeKey],
      ...data,
      updatedAt: Date.now(),
    };

    this.saveLocalDiyThemes();
    console.log('[ThemeManager] Updated DIY theme:', themeKey);
    return true;
  }

  /**
   * Upload DIY theme to cloud platform
   */
  public async uploadDiyToCloud(
    themeData: DiyThemeData,
    price: number
  ): Promise<CloudThemeInfo | null> {
    try {
      const mergedTheme = this.mergeTheme(
        this.baseThemeConfig[themeData.baseThemeKey],
        themeData
      );

      const result = await themeApi.upload({
        name: themeData.name,
        author: themeData.author,
        price,
        config: mergedTheme,
      });

      if (result) {
        console.log('[ThemeManager] Uploaded theme to cloud:', result.id);
        return result;
      }

      return null;
    } catch (error) {
      console.error('[ThemeManager] Failed to upload theme:', error);
      return null;
    }
  }

  /**
   * Download theme from cloud
   */
  public async downloadCloudTheme(themeId: string): Promise<boolean> {
    try {
      const result = await themeApi.download(themeId);
      if (!result) {
        throw new Error('Failed to download theme');
      }

      const themeConfig = result.config || result;
      const themeKey = `cloud_${themeId}`;

      this.localDiyThemes[themeKey] = {
        baseThemeKey: 'default',
        name: themeConfig.name,
        author: themeConfig.author,
        assetOverrides: themeConfig.assets,
        styleOverrides: themeConfig.styles,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.saveLocalDiyThemes();
      console.log('[ThemeManager] Downloaded cloud theme:', themeKey);
      return true;
    } catch (error) {
      console.error('[ThemeManager] Failed to download cloud theme:', error);
      return false;
    }
  }

  /**
   * Get all available themes (base + local DIY + cloud)
   */
  public async getAllThemes(): Promise<ThemeConfig[]> {
    return this.getThemesByScope({ status: 'on_sale' });
  }

  /**
   * Get themes by owner type
   * @param params 查询参数（ownerType, ownerId, status, page, pageSize）
   * @returns 主题列表
   */
  public async getThemesByScope(params: ThemeListParams): Promise<ThemeConfig[]> {
    const themes: ThemeConfig[] = [];

    try {
      // 获取云端主题 - 现在返回统一的 PageData 格式
      const cloudThemes = await themeApi.getList(params);
      
      // 使用 list 字段
      const themeList = cloudThemes.list || [];
      
      themeList.forEach((cloud: any) => {
        themes.push({
          key: `cloud_${cloud.themeId || cloud.id}`,
          name: cloud.themeName || cloud.name,
          author: cloud.authorName || cloud.author,
          price: cloud.price || 0,
          thumbnail: cloud.thumbnailUrl || cloud.thumbnail,
          description: cloud.description,
          assets: {},
          styles: {},
          // 添加额外信息
          applicableScope: cloud.applicableScope,
          gameId: cloud.gameId,
          gameCode: cloud.gameCode,
          themeId: cloud.themeId || cloud.id,
        });
      });
    } catch (error) {
      console.error('[ThemeManager] Failed to fetch themes by scope:', error);
    }

    return themes;
  }

  /**
   * Get application themes (ownerType = 'APPLICATION')
   */
  public async getApplicationThemes(status?: string): Promise<ThemeConfig[]> {
    return this.getThemesByScope({
      ownerType: 'APPLICATION',
      status: status || 'on_sale',
    });
  }

  /**
   * Get game-specific themes
   * @param ownerId 游戏ID（对应后端的 ownerId）
   * @param status 状态筛选
   */
  public async getGameThemes(
    ownerId?: number,
    status?: string
  ): Promise<ThemeConfig[]> {
    return this.getThemesByScope({
      ownerType: 'GAME',
      ownerId: ownerId,
      status: status || 'on_sale',
    });
  }

  /**
   * Get base asset keys
   */
  public getBaseAssetKeys(): string[] {
    const baseTheme = this.baseThemeConfig['default'];
    if (!baseTheme) return [];
    return Object.keys(baseTheme.assets);
  }

  /**
   * Get base style keys
   */
  public getBaseStyleKeys(): string[] {
    const baseTheme = this.baseThemeConfig['default'];
    if (!baseTheme) return [];
    return Object.keys(baseTheme.styles);
  }

  /**
   * Set active Phaser scene for theme application
   */
  public setActiveScene(scene: Phaser.Scene): void {
    this.activeScene = scene;
    this.applyThemeToScene(scene);
  }

  /**
   * Apply current theme to Phaser scene
   */
  public async applyThemeToScene(scene: Phaser.Scene): Promise<void> {
    const theme = this.getCurrentTheme();

    scene.registry.set('theme', theme);

    Object.entries(theme.styles).forEach(([key, value]) => {
      scene.registry.set(key, value);
    });

    console.log('[ThemeManager] Applied theme to scene:', theme.name);
  }

  /**
   * Load theme assets into Phaser loader
   */
  public loadThemeAssets(scene: Phaser.Scene): void {
    const theme = this.getCurrentTheme();
    const basePath = theme.path || '/themes/theme-default';

    Object.entries(theme.assets).forEach(([key, path]) => {
      const fullPath = `${basePath}/${path}`;

      if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.webp')) {
        if (!scene.textures.exists(key)) {
          scene.load.image(key, fullPath);
        }
      } else if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg')) {
        if (!scene.sound.exists(key)) {
          scene.load.audio(key, fullPath);
        }
      } else if (path.endsWith('.json')) {
        scene.load.json(key, fullPath);
      }
    });

    console.log('[ThemeManager] Loading theme assets for:', theme.name);
  }

  /**
   * Get my uploaded cloud themes
   */
  public async getMyCloudThemes(): Promise<CloudThemeInfo[]> {
    try {
      const themes = await themeApi.getMyThemes();
      return themes || [];
    } catch (error) {
      console.error('[ThemeManager] Failed to get my cloud themes:', error);
      return [];
    }
  }

  /**
   * Get creator earnings
   */
  public async getCreatorEarnings(): Promise<{ total: number; pending: number; withdrawn: number }> {
    try {
      const earnings = await themeApi.getEarnings();
      return earnings || { total: 0, pending: 0, withdrawn: 0 };
    } catch (error) {
      console.error('[ThemeManager] Failed to get earnings:', error);
      return { total: 0, pending: 0, withdrawn: 0 };
    }
  }

  /**
   * Toggle theme sale status
   */
  public async toggleThemeSale(themeId: string, onSale: boolean): Promise<boolean> {
    try {
      const result = await themeApi.toggleSale(themeId, onSale);
      // toggleSale 返回 { success: boolean }
      return result?.success || false;
    } catch (error) {
      console.error('[ThemeManager] Failed to toggle sale status:', error);
      return false;
    }
  }

  /**
   * Merge base theme with DIY overrides
   */
  private mergeTheme(base: ThemeConfig, diy: DiyThemeData): ThemeConfig {
    return {
      ...base,
      key: diy.baseThemeKey === 'default' ? `diy_${Date.now()}` : base.key,
      name: diy.name,
      author: diy.author,
      assets: {
        ...base.assets,
        ...(diy.assetOverrides || {}),
      },
      styles: {
        ...base.styles,
        ...(diy.styleOverrides || {}),
      },
    };
  }

  /**
   * Get default theme fallback
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      key: 'default',
      name: '默认主题',
      author: '系统',
      isBase: true,
      assets: {},
      styles: {},
    };
  }

  /**
   * Load DIY themes from localStorage
   */
  private loadLocalDiyThemes(): void {
    try {
      const saved = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (saved) {
        this.localDiyThemes = JSON.parse(saved);
        console.log(
          '[ThemeManager] Loaded local DIY themes:',
          Object.keys(this.localDiyThemes).length
        );
      }
    } catch (error) {
      console.error('[ThemeManager] Failed to load local DIY themes:', error);
      this.localDiyThemes = {};
    }

    const savedCurrent = localStorage.getItem('phaser_current_theme');
    if (savedCurrent) {
      this.currentThemeKey = savedCurrent;
    }
  }

  /**
   * Save DIY themes to localStorage
   */
  private saveLocalDiyThemes(): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.localDiyThemes));
    } catch (error) {
      console.error('[ThemeManager] Failed to save local DIY themes:', error);
    }
  }
}

export const themeManager = ThemeManager.getInstance();
export default themeManager;
