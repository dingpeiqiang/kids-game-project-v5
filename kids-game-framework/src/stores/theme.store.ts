/**
 * 📊 主题状态 Store
 * 
 * 管理当前游戏主题：从后端加载、切换、应用到 CSS 变量。
 * 存储已校验通过的 GTRS 原始 JSON，供 GameEngine 复用。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validateGTRSTheme } from '../utils/gtrs-validator'
import type { GTRSTheme } from '../types/gtrs.types'

// ============================================================================
// 📝 UI 层主题配置（与 GTRS 解耦）
// ============================================================================

export interface ThemeColors {
  primary:       string
  secondary:     string
  background:    string
  surface:       string
  text:          string
  textSecondary: string
  accent:        string
  success:       string
  warning:       string
  error:         string
}

export interface ThemeConfig {
  id:          string
  name:        string
  description: string
  colors:      ThemeColors
  effects: {
    shadow:       string
    glow:         string
    border:       string
    borderRadius: string
  }
}

// ============================================================================
// 🎨 Store 定义
// ============================================================================

const THEME_STORAGE_KEY = 'kids-game-theme-id'

export const useThemeStore = defineStore('kids-theme', () => {

  // 当前主题 ID
  const currentThemeId = ref<string>('')

  // 游戏 ID（用于拉取主题列表）
  const currentGameId = ref<number | null>(null)

  // 自定义主题配置（UI 层）
  const customTheme = ref<ThemeConfig | null>(null)

  // ⭐ 已校验通过的 GTRS 原始 JSON（供 GameEngine 复用，避免重复请求）
  const gtrsRawJson = ref<string>('')

  // 主题列表
  const themeList = ref<Array<{
    id: string; name: string; description: string; colors: any
  }>>([])

  const isThemeListLoaded = ref(false)

  // ============================================================================
  // 🔧 方法
  // ============================================================================

  /**
   * 设置游戏 ID（必须在加载主题前调用）
   */
  function setGameId(gameId: number): void {
    currentGameId.value = gameId
    console.log('[ThemeStore] 🎮 设置游戏 ID:', gameId)
  }

  /**
   * ⭐ 从后端加载主题（GTRS 严格校验）
   */
  async function loadThemeFromBackend(themeId: number | string): Promise<boolean> {
    const baseUrl = localStorage.getItem('platformUrl') || 'http://localhost:8080'
    const token   = localStorage.getItem('token')
    if (!token) {
      console.warn('[ThemeStore] ⚠️ 用户未登录，无法加载主题')
      return false
    }

    try {
      const response = await fetch(`${baseUrl}/api/theme/download?id=${themeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === 401) {
        console.warn('[ThemeStore] ⚠️ Token 已过期')
        handleTokenExpired()
        return false
      }

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        console.error('[ThemeStore] ❌ 后端响应异常:', result.code, result.message)
        return false
      }

      const data = result.data
      let configJsonStr: string
      if (data.config !== undefined) {
        configJsonStr = typeof data.config === 'string' ? data.config : JSON.stringify(data.config)
      } else if (typeof data === 'string') {
        configJsonStr = data
      } else if (data.configJson !== undefined) {
        configJsonStr = typeof data.configJson === 'string' ? data.configJson : JSON.stringify(data.configJson)
      } else {
        configJsonStr = JSON.stringify(data)
      }

      // GTRS 校验
      const validation = validateGTRSTheme(configJsonStr)
      if (!validation.valid) {
        console.error('[ThemeStore] ❌ GTRS 校验失败:', validation.message)
        return false
      }

      const gtrsTheme: GTRSTheme = JSON.parse(configJsonStr)
      const backendThemeInfo     = data.themeInfo ?? {}
      const style                = gtrsTheme.globalStyle ?? {}
      const themeName            = backendThemeInfo.themeName ?? `主题 ${themeId}`

      // 注入 themeInfo（兼容 PhaserGame 读取）
      const gtrsWithInfo = {
        ...gtrsTheme,
        themeInfo: {
          themeId:     String(themeId),
          themeName,
          isDefault:   backendThemeInfo.isDefault ?? false,
          author:      backendThemeInfo.author,
          description: backendThemeInfo.description
        }
      }

      gtrsRawJson.value = JSON.stringify(gtrsWithInfo)

      // 构建 UI 层主题配置
      const primary   = style.primaryColor   ?? '#4ade80'
      const secondary = style.secondaryColor ?? '#22c55e'
      const bg        = style.bgColor        ?? '#1a1a2e'
      const text      = style.textColor      ?? '#ffffff'

      customTheme.value = {
        id: String(themeId), name: themeName, description: backendThemeInfo.description ?? '',
        colors: {
          primary, secondary, background: bg, surface: '#334155',
          text, textSecondary: '#94a3b8', accent: '#fbbf24',
          success: '#22c55e', warning: '#f59e0b', error: '#ef4444'
        },
        effects: {
          shadow: '0 4px 6px rgba(0,0,0,0.3)',
          glow:   `0 0 10px ${primary}`,
          border: `2px solid ${bg}`,
          borderRadius: style.borderRadius ?? '8px'
        }
      }

      currentThemeId.value = String(themeId)
      applyThemeToDocument(customTheme.value)

      console.log('[ThemeStore] ✅ 主题加载成功:', themeName, '(id =', themeId, ')')
      return true
    } catch (error) {
      console.error('[ThemeStore] ❌ 主题加载失败:', error)
      return false
    }
  }

  /**
   * 加载主题列表
   */
  async function loadThemeList(forceRefresh = false): Promise<void> {
    if (!forceRefresh && isThemeListLoaded.value) return

    const baseUrl = localStorage.getItem('platformUrl') || 'http://localhost:8080'
    const token   = localStorage.getItem('token')
    if (!token) { themeList.value = []; isThemeListLoaded.value = true; return }

    try {
      const params = new URLSearchParams({
        status: 'on_sale', ownerType: 'GAME',
        ownerId: String(currentGameId.value ?? ''),
        page: '1', pageSize: '100'
      })

      const response = await fetch(`${baseUrl}/api/theme/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === 401) { handleTokenExpired(); return }

      const result = await response.json()
      if (result.code === 200 && result.data) {
        const themes = result.data.list ?? result.data ?? []
        themeList.value = themes.map((t: any) => ({
          id:          String(t.themeId ?? t.id),
          name:        t.themeName ?? t.name,
          description: t.description ?? '',
          colors:      t.config?.default?.colors ?? {}
        }))
        isThemeListLoaded.value = true
        console.log('[ThemeStore] ✅ 主题列表加载成功:', themeList.value.length, '个')
      }
    } catch (error) {
      console.error('[ThemeStore] ❌ 加载主题列表失败:', error)
      themeList.value = []
      isThemeListLoaded.value = true
    }
  }

  /**
   * 切换主题
   */
  async function switchTheme(themeId: string): Promise<boolean> {
    const success = await loadThemeFromBackend(themeId)
    if (success) localStorage.setItem(THEME_STORAGE_KEY, themeId)
    return success
  }

  /**
   * ⭐ 从后端加载并切换主题（贪吃蛇使用）
   * 返回 Promise<boolean>，成功返回 true，失败返回 false
   */
  async function switchToBackendTheme(themeId: string): Promise<boolean> {
    return await switchTheme(themeId)
  }

  /**
   * ⭐ 从后端重新加载主题列表（贪吃蛇使用）
   * @param forceRefresh 是否强制刷新
   */
  async function loadThemeListFromBackend(forceRefresh = false): Promise<void> {
    return await loadThemeList(forceRefresh)
  }

  /**
   * ⭐ 重置为默认主题（贪吃蛇使用）
   */
  async function resetTheme(): Promise<void> {
    if (themeList.value.length > 0) {
      await switchTheme(themeList.value[0].id)
    }
  }

  /**
   * 初始化：加载主题列表 + 默认主题
   */
  async function init(): Promise<void> {
    await loadThemeList()

    const savedId = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedId) {
      const success = await loadThemeFromBackend(savedId)
      if (!success) throw new Error(`上次选择的主题 ${savedId} 加载失败`)
      return
    }

    if (themeList.value.length > 0) {
      const success = await loadThemeFromBackend(themeList.value[0].id)
      if (!success) throw new Error('默认主题加载失败')
    } else {
      throw new Error('后端没有可用的主题')
    }
  }

  /**
   * 将主题颜色写入 CSS 变量（供 Vue 组件使用）
   */
  function applyThemeToDocument(theme: ThemeConfig): void {
    const root = document.documentElement
    root.style.setProperty('--theme-primary',       theme.colors.primary)
    root.style.setProperty('--theme-secondary',     theme.colors.secondary)
    root.style.setProperty('--theme-background',    theme.colors.background)
    root.style.setProperty('--theme-surface',       theme.colors.surface)
    root.style.setProperty('--theme-text',          theme.colors.text)
    root.style.setProperty('--theme-text-secondary',theme.colors.textSecondary)
    root.style.setProperty('--theme-accent',        theme.colors.accent)
    root.style.setProperty('--theme-success',       theme.colors.success)
    root.style.setProperty('--theme-warning',       theme.colors.warning)
    root.style.setProperty('--theme-error',         theme.colors.error)
    root.style.setProperty('--theme-shadow',        theme.effects.shadow)
    root.style.setProperty('--theme-glow',          theme.effects.glow)
    root.style.setProperty('--theme-border',        theme.effects.border)
    root.style.setProperty('--theme-border-radius', theme.effects.borderRadius)
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
  }

  // ============================================================================
  // 🔧 私有工具
  // ============================================================================

  function handleTokenExpired(): void {
    console.warn('[ThemeStore] ⚠️ Token 已过期，清除登录状态')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // ============================================================================
  // 🔌 导出
  // ============================================================================

  const currentTheme = computed<ThemeConfig | null>(() => customTheme.value)

  /**
   * ⭐ 是否为自定义主题（贪吃蛇 ThemeSelector 用来控制选中样式）
   * 当前实现中，从后端加载的主题都视为预设主题
   */
  const isCustomTheme = computed<boolean>(() => false)

  return {
    currentThemeId,
    currentGameId,
    customTheme,
    gtrsRawJson,
    themeList,
    isThemeListLoaded,
    currentTheme,
    isCustomTheme,
    setGameId,
    loadThemeFromBackend,
    loadThemeList,
    loadThemeListFromBackend,
    switchTheme,
    switchToBackendTheme,
    resetTheme,
    init,
    applyThemeToDocument
  }
})
