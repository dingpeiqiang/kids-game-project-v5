/**
 * 主题状态管理
 * 
 * 使用 Pinia 管理当前主题状态
 * 支持主题切换、持久化、动态应用
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  ThemeConfig, 
  PRESET_THEMES, 
  DEFAULT_THEME,
  getThemeById,
  extendPvZTheme
} from '@/config/theme.config'

const THEME_STORAGE_KEY = 'pvz-game-theme'
const THEME_CUSTOM_KEY = 'pvz-custom-theme'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题
  const currentThemeId = ref<string>(DEFAULT_THEME.id)
  
  // 自定义主题
  const customTheme = ref<ThemeConfig | null>(null)
  
  // 当前完整主题配置
  const currentTheme = computed<ThemeConfig>(() => {
    if (customTheme.value) {
      return customTheme.value
    }
    return getThemeById(currentThemeId.value)
  })
  
  // 是否使用自定义主题
  const isCustomTheme = computed(() => !!customTheme.value)
  
  // 主题列表
  const themeList = computed(() => PRESET_THEMES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    colors: t.colors
  })))

  // 加载保存的主题
  function loadTheme() {
    try {
      const savedId = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedId && PRESET_THEMES.some(t => t.id === savedId)) {
        currentThemeId.value = savedId
      }
      
      const savedCustom = localStorage.getItem(THEME_CUSTOM_KEY)
      if (savedCustom) {
        customTheme.value = JSON.parse(savedCustom)
      }
    } catch (e) {
      console.warn('Failed to load theme:', e)
    }
  }

  // 保存主题设置
  function saveTheme() {
    try {
      if (customTheme.value) {
        localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(customTheme.value))
        localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, currentThemeId.value)
        localStorage.removeItem(THEME_CUSTOM_KEY)
      }
    } catch (e) {
      console.warn('Failed to save theme:', e)
    }
  }

  // 切换到预设主题
  function switchTheme(themeId: string) {
    const theme = getThemeById(themeId)
    if (theme) {
      currentThemeId.value = themeId
      customTheme.value = null
      saveTheme()
      applyThemeToDocument(theme)
    }
  }

  // 应用自定义主题
  function applyCustomTheme(theme: ThemeConfig) {
    customTheme.value = theme
    saveTheme()
    applyThemeToDocument(theme)
  }

  // 重置为默认主题
  function resetTheme() {
    customTheme.value = null
    currentThemeId.value = DEFAULT_THEME.id
    saveTheme()
    applyThemeToDocument(DEFAULT_THEME)
  }

  // 将主题应用到文档（CSS变量）
  function applyThemeToDocument(theme: ThemeConfig) {
    const root = document.documentElement
    
    // 颜色
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-surface', theme.colors.surface)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-success', theme.colors.success)
    root.style.setProperty('--theme-warning', theme.colors.warning)
    root.style.setProperty('--theme-error', theme.colors.error)
    
    // 效果
    root.style.setProperty('--theme-shadow', theme.effects.shadow)
    root.style.setProperty('--theme-glow', theme.effects.glow)
    root.style.setProperty('--theme-border', theme.effects.border)
    root.style.setProperty('--theme-border-radius', theme.effects.borderRadius)
    
    // 触发自定义事件，通知游戏主题已更改
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: theme 
    }))
  }

  // 初始化
  function init() {
    loadTheme()
    applyThemeToDocument(currentTheme.value)
  }

  // 获取扩展后的 PvZ 主题（包含植物、僵尸等资源）
  function getPvZTheme(): ThemeConfig {
    return extendPvZTheme(currentTheme.value)
  }

  return {
    currentThemeId,
    customTheme,
    currentTheme,
    isCustomTheme,
    themeList,
    switchTheme,
    applyCustomTheme,
    resetTheme,
    init,
    getPvZTheme
  }
})
