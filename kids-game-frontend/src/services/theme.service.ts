/**
 * 主题管理服务
 * 负责应用主题到 DOM 和 localStorage 持久化
 */

import type { ThemeConfig } from '../types/theme.types';
import { getThemeById, getDefaultTheme } from '../configs/preset-themes';

const THEME_STORAGE_KEY = 'app-theme';
const CUSTOM_THEME_STORAGE_KEY = 'app-custom-theme';

/**
 * 主题管理服务类
 */
class ThemeService {
  private currentTheme: ThemeConfig | null = null;
  private customThemes: Record<string, ThemeConfig> = {};

  /**
   * 初始化主题
   */
  init(): void {
    this.loadCustomThemes();
    this.loadSavedTheme();
  }

  /**
   * 加载保存的主题
   */
  private loadSavedTheme(): void {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      // 检查是否是自定义主题
      const customTheme = this.customThemes[savedThemeId];
      if (customTheme) {
        this.applyTheme(customTheme);
        return;
      }

      // 检查预设主题
      const presetTheme = getThemeById(savedThemeId);
      if (presetTheme) {
        this.applyTheme(presetTheme);
        return;
      }
    }

    // 如果没有保存的主题，使用默认主题
    this.applyTheme(getDefaultTheme());
  }

  /**
   * 加载自定义主题
   */
  private loadCustomThemes(): void {
    const saved = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (saved) {
      try {
        this.customThemes = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load custom themes:', e);
        this.customThemes = {};
      }
    }
  }

  /**
   * 保存自定义主题
   */
  private saveCustomThemes(): void {
    localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(this.customThemes));
  }

  /**
   * 应用主题到 DOM
   */
  applyTheme(theme: ThemeConfig): void {
    console.log('应用主题:', theme.name, theme.id);
    this.currentTheme = theme;

    const root = document.documentElement;

    if (!root) {
      console.error('无法找到 document.documentElement');
      return;
    }

    // 应用主题色
    root.style.setProperty('--kid-primary', theme.colors.primary);
    root.style.setProperty('--kid-secondary', theme.colors.secondary);
    root.style.setProperty('--kid-yellow', theme.colors.yellow);
    root.style.setProperty('--kid-blue', theme.colors.blue);
    root.style.setProperty('--kid-purple', theme.colors.purple);
    root.style.setProperty('--kid-white', theme.colors.white);

    // 应用中性色
    root.style.setProperty('--kid-gray-50', theme.colors.gray[50]);
    root.style.setProperty('--kid-gray-100', theme.colors.gray[100]);
    root.style.setProperty('--kid-gray-200', theme.colors.gray[200]);
    root.style.setProperty('--kid-gray-300', theme.colors.gray[300]);
    root.style.setProperty('--kid-gray-400', theme.colors.gray[400]);
    root.style.setProperty('--kid-gray-500', theme.colors.gray[500]);
    root.style.setProperty('--kid-gray-600', theme.colors.gray[600]);
    root.style.setProperty('--kid-gray-700', theme.colors.gray[700]);
    root.style.setProperty('--kid-gray-800', theme.colors.gray[800]);
    root.style.setProperty('--kid-gray-900', theme.colors.gray[900]);

    // 应用功能色
    root.style.setProperty('--kid-success', theme.colors.success);
    root.style.setProperty('--kid-warning', theme.colors.warning);
    root.style.setProperty('--kid-error', theme.colors.error);
    root.style.setProperty('--kid-info', theme.colors.info);

    // 应用字体大小
    root.style.setProperty('--kid-text-xs', theme.typography.fontSizes.xs);
    root.style.setProperty('--kid-text-sm', theme.typography.fontSizes.sm);
    root.style.setProperty('--kid-text-base', theme.typography.fontSizes.base);
    root.style.setProperty('--kid-text-lg', theme.typography.fontSizes.lg);
    root.style.setProperty('--kid-text-xl', theme.typography.fontSizes.xl);
    root.style.setProperty('--kid-text-2xl', theme.typography.fontSizes['2xl']);
    root.style.setProperty('--kid-text-3xl', theme.typography.fontSizes['3xl']);
    root.style.setProperty('--kid-text-4xl', theme.typography.fontSizes['4xl']);
    root.style.setProperty('--kid-text-5xl', theme.typography.fontSizes['5xl']);

    // 应用圆角
    root.style.setProperty('--kid-radius-sm', theme.radius.sm);
    root.style.setProperty('--kid-radius-base', theme.radius.base);
    root.style.setProperty('--kid-radius-md', theme.radius.md);
    root.style.setProperty('--kid-radius-lg', theme.radius.lg);
    root.style.setProperty('--kid-radius-xl', theme.radius.xl);
    root.style.setProperty('--kid-radius-2xl', theme.radius['2xl']);
    root.style.setProperty('--kid-radius-full', theme.radius.full);

    // 应用阴影
    root.style.setProperty('--kid-shadow-sm', theme.shadow.sm);
    root.style.setProperty('--kid-shadow-base', theme.shadow.base);
    root.style.setProperty('--kid-shadow-md', theme.shadow.md);
    root.style.setProperty('--kid-shadow-lg', theme.shadow.lg);
    root.style.setProperty('--kid-shadow-xl', theme.shadow.xl);

    // 应用间距
    root.style.setProperty('--kid-spacing-xs', theme.spacing.xs);
    root.style.setProperty('--kid-spacing-sm', theme.spacing.sm);
    root.style.setProperty('--kid-spacing-md', theme.spacing.md);
    root.style.setProperty('--kid-spacing-lg', theme.spacing.lg);
    root.style.setProperty('--kid-spacing-xl', theme.spacing.xl);
    root.style.setProperty('--kid-spacing-2xl', theme.spacing['2xl']);

    // 应用过渡
    root.style.setProperty('--kid-transition-fast', theme.transition.fast);
    root.style.setProperty('--kid-transition-base', theme.transition.base);
    root.style.setProperty('--kid-transition-slow', theme.transition.slow);

    // 保存当前主题 ID
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);

    // 触发主题变更事件
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
  }

  /**
   * 切换主题
   */
  switchTheme(themeId: string): void {
    // 先检查自定义主题
    const customTheme = this.customThemes[themeId];
    if (customTheme) {
      this.applyTheme(customTheme);
      return;
    }

    // 检查预设主题
    const presetTheme = getThemeById(themeId);
    if (presetTheme) {
      this.applyTheme(presetTheme);
      return;
    }

    // 如果找不到主题，使用默认主题
    this.applyTheme(getDefaultTheme());
  }

  /**
   * 创建自定义主题
   */
  createCustomTheme(theme: Omit<ThemeConfig, 'id'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customTheme: ThemeConfig = {
      ...theme,
      id,
      name: theme.name || '自定义主题',
    };

    this.customThemes[id] = customTheme;
    this.saveCustomThemes();

    return id;
  }

  /**
   * 更新自定义主题
   */
  updateCustomTheme(id: string, theme: Partial<ThemeConfig>): boolean {
    const customTheme = this.customThemes[id];
    if (!customTheme) {
      return false;
    }

    this.customThemes[id] = {
      ...customTheme,
      ...theme,
      id, // 保持 ID 不变
    };

    this.saveCustomThemes();

    // 如果是当前主题，重新应用
    if (this.currentTheme?.id === id) {
      this.applyTheme(this.customThemes[id]);
    }

    return true;
  }

  /**
   * 删除自定义主题
   */
  deleteCustomTheme(id: string): boolean {
    const customTheme = this.customThemes[id];
    if (!customTheme) {
      return false;
    }

    delete this.customThemes[id];
    this.saveCustomThemes();

    // 如果删除的是当前主题，切换到默认主题
    if (this.currentTheme?.id === id) {
      this.applyTheme(getDefaultTheme());
    }

    return true;
  }

  /**
   * 获取所有自定义主题
   */
  getCustomThemes(): ThemeConfig[] {
    return Object.values(this.customThemes);
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig | null {
    return this.currentTheme;
  }

  /**
   * 导出主题配置
   */
  exportTheme(themeId: string): string | null {
    const theme = this.getThemeById(themeId);
    if (!theme) {
      return null;
    }

    return JSON.stringify(theme, null, 2);
  }

  /**
   * 导入主题配置
   */
  importTheme(config: string): string | null {
    try {
      const theme: ThemeConfig = JSON.parse(config);

      // 验证主题配置
      if (!theme.colors || !theme.colors.primary) {
        throw new Error('Invalid theme config');
      }

      const id = this.createCustomTheme(theme);
      return id;
    } catch (e) {
      console.error('Failed to import theme:', e);
      return null;
    }
  }

  /**
   * 根据 ID 获取主题（包括自定义主题）
   */
  private getThemeById(id: string): ThemeConfig | null {
    // 先检查自定义主题
    const customTheme = this.customThemes[id];
    if (customTheme) {
      return customTheme;
    }

    // 检查预设主题
    return getThemeById(id) || null;
  }
}

// 导出单例实例
export const themeService = new ThemeService();

// 自动初始化
if (typeof window !== 'undefined') {
  themeService.init();
}

export default themeService;
