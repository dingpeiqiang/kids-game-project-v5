/**
 * 主题状态管理 Store
 */

import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ThemeConfig } from '../../types/theme.types';
import { presetThemes, getThemeById, getDefaultTheme } from '../../configs/preset-themes';
import { themeService } from '../../services/theme.service';

export const useThemeStore = defineStore('theme', () => {
  // 当前主题
  const currentTheme = ref<ThemeConfig>(getDefaultTheme());

  // 所有可用主题（预设 + 自定义）
  const availableThemes = ref<ThemeConfig[]>([...presetThemes]);

  // 是否正在加载
  const loading = ref(false);

  // 主题变更监听器
  let themeChangeListener: ((event: Event) => void) | null = null;

  /**
   * 初始化
   */
  function init(): void {
    loading.value = true;

    // 加载自定义主题
    loadCustomThemes();

    // 恢复上次选择的主题
    const savedThemeId = localStorage.getItem('app-theme');
    if (savedThemeId) {
      switchTheme(savedThemeId);
    } else {
      currentTheme.value = themeService.getCurrentTheme() || getDefaultTheme();
    }

    // 监听主题变更事件
    themeChangeListener = (event: CustomEvent) => {
      currentTheme.value = event.detail.theme;
    };
    window.addEventListener('theme-change', themeChangeListener);

    loading.value = false;
  }

  /**
   * 加载自定义主题
   */
  function loadCustomThemes(): void {
    const customThemes = themeService.getCustomThemes();
    availableThemes.value = [...presetThemes, ...customThemes];
  }

  /**
   * 切换主题
   */
  function switchTheme(themeId: string): boolean {
    const theme = findThemeById(themeId);
    if (!theme) {
      return false;
    }

    themeService.switchTheme(themeId);
    currentTheme.value = theme;
    localStorage.setItem('app-theme', themeId);

    return true;
  }

  /**
   * 创建自定义主题
   */
  function createCustomTheme(themeConfig: Omit<ThemeConfig, 'id'>): string {
    const themeId = themeService.createCustomTheme(themeConfig);
    loadCustomThemes();
    return themeId;
  }

  /**
   * 更新自定义主题
   */
  function updateCustomTheme(themeId: string, themeConfig: Partial<ThemeConfig>): boolean {
    const success = themeService.updateCustomTheme(themeId, themeConfig);
    if (success) {
      loadCustomThemes();

      // 如果更新的是当前主题，重新设置
      if (currentTheme.value.id === themeId) {
        const updatedTheme = findThemeById(themeId);
        if (updatedTheme) {
          currentTheme.value = updatedTheme;
        }
      }
    }
    return success;
  }

  /**
   * 删除自定义主题
   */
  function deleteCustomTheme(themeId: string): boolean {
    const success = themeService.deleteCustomTheme(themeId);
    if (success) {
      loadCustomThemes();
    }
    return success;
  }

  /**
   * 导出主题
   */
  function exportTheme(themeId: string): string | null {
    return themeService.exportTheme(themeId);
  }

  /**
   * 导入主题
   */
  function importTheme(themeConfig: string): string | null {
    const themeId = themeService.importTheme(themeConfig);
    if (themeId) {
      loadCustomThemes();
    }
    return themeId;
  }

  /**
   * 根据 ID 查找主题
   */
  function findThemeById(themeId: string): ThemeConfig | undefined {
    return availableThemes.value.find(theme => theme.id === themeId);
  }

  /**
   * 获取预设主题
   */
  function getPresetThemes(): ThemeConfig[] {
    return presetThemes;
  }

  /**
   * 获取自定义主题
   */
  function getCustomThemes(): ThemeConfig[] {
    return themeService.getCustomThemes();
  }

  /**
   * 重置为默认主题
   */
  function resetToDefault(): void {
    switchTheme('default');
  }

  /**
   * 检查主题是否为自定义主题
   */
  function isCustomTheme(themeId: string): boolean {
    return !getThemeById(themeId);
  }

  // 清理
  function cleanup(): void {
    if (themeChangeListener) {
      window.removeEventListener('theme-change', themeChangeListener);
      themeChangeListener = null;
    }
  }

  return {
    // 状态
    currentTheme,
    availableThemes,
    loading,

    // 计算属性
    isDefaultTheme: computed(() => currentTheme.value.id === 'default'),
    isDarkTheme: computed(() => currentTheme.value.id === 'dark'),

    // 方法
    init,
    switchTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    findThemeById,
    getPresetThemes,
    getCustomThemes,
    resetToDefault,
    isCustomTheme,
    cleanup,
  };
});
