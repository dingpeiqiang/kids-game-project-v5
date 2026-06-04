/**
 * 🎨 主题状态管理
 *
 * 功能：
 * - 从后端加载 GTRS 主题列表和主题数据
 * - GTRS 格式校验
 * - 主题切换 / 持久化
 * - CSS 变量注入（供 Vue 层样式使用）
 *
 * 使用：
 * ```ts
 * const themeStore = useThemeStore()
 * await themeStore.init()             // 在 main.ts 中调用
 * await themeStore.switchTheme('123') // 切换主题
 * const url = themeStore.getImageUrl('bg') // 获取资源 URL
 * ```
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GAME_CODE, API_BASE_URL } from '@/config/game.config'
import { validateGTRSTheme } from '@/utils/gtrs-validator'

// ── localStorage keys ──────────────────────────────────────────────────────
const THEME_STORAGE_KEY = '__GAME_ID__-theme-id'

// ── 类型 ───────────────────────────────────────────────────────────────────

export interface ThemeListItem {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useThemeStore = defineStore('theme', () => {

  // ─── 状态 ──────────────────────────────────────────────────────────────
  /** 当前选中的主题 ID */
  const currentThemeId  = ref<string>('')
  /** 当前游戏的数据库 ID（从 URL 参数传入） */
  const currentGameId   = ref<number | null>(null)
  /** 已校验的原始 GTRS JSON 字符串（供 StartView 和 PhaserGame 读取） */
  const gtrsRawJson     = ref<string>('')
  /** 解析后的 GTRS 数据对象 */
  const gtrsData        = ref<any>(null)
  /** 主题列表（用于 ThemeSelector） */
  const themeList       = ref<ThemeListItem[]>([])
  /** 主题列表是否已加载 */
  const isThemeListLoaded = ref(false)
  /** 加载中状态 */
  const loading         = ref(false)
  /** 错误信息 */
  const error           = ref<string | null>(null)

  // ─── computed ──────────────────────────────────────────────────────────

  const isLoaded = computed(() => !!gtrsData.value)
  const themeInfo = computed(() => gtrsData.value?.themeInfo)
  const resources = computed(() => gtrsData.value?.resources)
  const globalStyle = computed(() => gtrsData.value?.globalStyle)

  const currentTheme = computed(() => ({
    id  : currentThemeId.value,
    name: gtrsData.value?.themeInfo?.themeName || '默认主题',
  }))

  // ─── 工具函数 ─────────────────────────────────────────────────────────

  function _getToken(): string | null {
    return localStorage.getItem('token')
  }

  function _getHeaders(): HeadersInit {
    const token = _getToken()
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  /** 处理 401 响应：清除 token 并跳转登录 */
  function _handleUnauthorized() {
    console.warn('⚠️ Token 已过期，清除登录状态')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const currentPath = window.location.href
    window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
  }

  // ─── 主题列表加载 ──────────────────────────────────────────────────────

  /**
   * 从后端加载当前游戏的主题列表
   * @param forceRefresh 是否强制刷新（默认不重复加载）
   */
  async function loadThemeListFromBackend(forceRefresh = false): Promise<void> {
    if (!forceRefresh && isThemeListLoaded.value) {
      console.log('📋 主题列表已加载，跳过')
      return
    }

    if (!_getToken()) {
      console.warn('⚠️ 用户未登录，无法加载主题列表')
      themeList.value = []
      isThemeListLoaded.value = true
      return
    }

    try {
      console.log('📋 从后端加载主题列表...')
      const queryParams = new URLSearchParams({
        status  : 'on_sale',
        ownerType: 'GAME',
        ownerId : String(currentGameId.value ?? 0),
        gameCode: GAME_CODE,
        page    : '1',
        pageSize: '100',
      })

      const response = await fetch(`${API_BASE_URL}/api/theme/list?${queryParams}`, {
        headers: _getHeaders(),
      })

      if (response.status === 401) { _handleUnauthorized(); return }

      const result = await response.json()

      if (result.code === 200 && result.data) {
        const themes = result.data.list || result.data || []
        themeList.value = themes.map((t: any) => ({
          id         : String(t.themeId || t.id),
          name       : t.themeName || t.name || '未知主题',
          description: t.description || '',
          colors: {
            primary  : t.config?.default?.colors?.primary   || '#6366f1',
            secondary: t.config?.default?.colors?.secondary || '#8b5cf6',
            accent   : t.config?.default?.colors?.accent    || '#fbbf24',
          },
        }))
        console.log('✅ 主题列表加载成功:', themeList.value.length, '个主题')
      } else {
        console.warn('⚠️ 主题列表响应异常:', result.code, result.message)
        themeList.value = []
      }
    } catch (err: any) {
      console.error('❌ 主题列表加载失败:', err.message || err)
      themeList.value = []
    } finally {
      isThemeListLoaded.value = true
    }
  }

  // ─── 主题数据加载 ──────────────────────────────────────────────────────

  /**
   * 从后端加载指定主题的完整 GTRS 数据
   * @returns 是否成功
   */
  async function loadThemeFromBackend(themeId: number | string): Promise<boolean> {
    if (!_getToken()) {
      console.warn('⚠️ 用户未登录，无法加载主题')
      return false
    }

    try {
      console.log('🎨 从后端加载 GTRS 主题:', themeId)
      const response = await fetch(`${API_BASE_URL}/api/theme/download?id=${themeId}`, {
        headers: _getHeaders(),
      })

      if (response.status === 401) { _handleUnauthorized(); return false }

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        console.error('❌ 后端返回数据异常:', result.code, result.message)
        return false
      }

      // ── 提取 configJson（支持多种包装格式） ─────────────────────────────
      const data = result.data
      let configJsonStr: string

      if (data.config !== undefined) {
        configJsonStr = typeof data.config === 'string'
          ? data.config : JSON.stringify(data.config)
      } else if (typeof data === 'string') {
        configJsonStr = data
      } else if (data.configJson !== undefined) {
        configJsonStr = typeof data.configJson === 'string'
          ? data.configJson : JSON.stringify(data.configJson)
      } else {
        configJsonStr = JSON.stringify(data)
      }

      // ── GTRS 校验 ───────────────────────────────────────────────────────
      const validation = validateGTRSTheme(configJsonStr)
      if (!validation.valid) {
        console.error(`❌ 主题 ${themeId} GTRS 校验失败:`, validation.message)
        return false
      }

      // ── 解析并存储 ──────────────────────────────────────────────────────
      const gtrs = JSON.parse(configJsonStr)

      // 将后端返回的 themeInfo 合并进 GTRS 对象
      const backendThemeInfo = data.themeInfo || {}
      const themeName = backendThemeInfo.themeName || `主题 ${themeId}`
      const gtrsWithInfo = {
        ...gtrs,
        themeInfo: {
          themeId  : String(themeId),
          themeName,
          isDefault: backendThemeInfo.isDefault || false,
          author   : backendThemeInfo.author,
          description: backendThemeInfo.description,
        },
      }

      gtrsRawJson.value    = JSON.stringify(gtrsWithInfo)
      gtrsData.value       = gtrsWithInfo
      currentThemeId.value = String(themeId)
      error.value          = null

      // 将主题颜色注入 CSS 变量
      _applyThemeToCSSVars(gtrs.globalStyle || {})

      console.log('✅ GTRS 主题加载成功:', themeName)
      return true

    } catch (err: any) {
      console.error('❌ 后端主题加载失败:', err.message || err)
      return false
    }
  }

  // ─── 默认主题加载 ──────────────────────────────────────────────────────

  async function loadDefaultTheme(): Promise<void> {
    // 🎯 开发环境 fallback: 从本地加载 GTRS.json
    // @ts-ignore - Vite 会在运行时注入 import.meta.env
    const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development'
    if (isDev) {
      console.log('🎨 [DEV] 使用本地 GTRS.json 作为默认主题')
      try {
        const response = await fetch('/themes/puzzle_animal_default/GTRS.json')
        const gtrsJson = await response.json()
        
        // ✅ 设置所有必要字段
        gtrsRawJson.value = JSON.stringify(gtrsJson)
        gtrsData.value = gtrsJson
        currentThemeId.value = 'local_dev_theme'
        isThemeListLoaded.value = true
        
        console.log('✅ 本地 GTRS 加载成功:', gtrsJson.themeInfo?.themeName)
        return
      } catch (err) {
        console.error('❌ 本地 GTRS 加载失败:', err)
        // 继续尝试后端加载
      }
    }
    
    // 🔵 生产环境或本地失败后：从后端加载
    if (!_getToken()) {
      console.warn('⚠️ 用户未登录，跳过默认主题加载')
      return
    }

    try {
      const queryParams = new URLSearchParams({
        status  : 'on_sale',
        ownerType: 'GAME',
        ownerId : String(currentGameId.value ?? 0),
        gameCode: GAME_CODE,
        page    : '1',
        pageSize: '1',
      })
      const response = await fetch(`${API_BASE_URL}/api/theme/list?${queryParams}`, {
        headers: _getHeaders(),
      })

      if (response.status === 401) { _handleUnauthorized(); return }

      const result = await response.json()
      if (result.code === 200 && result.data) {
        const themes = result.data.list || result.data || []
        if (themes.length > 0) {
          const firstId = String(themes[0].themeId || themes[0].id)
          const success = await loadThemeFromBackend(firstId)
          if (!success) throw new Error('默认主题加载失败')
          return
        }
      }
      throw new Error('没有可用的主题')
    } catch (err: any) {
      console.error('❌ 默认主题加载失败:', err.message || err)
      throw err
    }
  }

  // ─── 持久化 ────────────────────────────────────────────────────────────

  function _saveThemeId(id: string) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {}
  }

  function _loadSavedThemeId(): string | null {
    return localStorage.getItem(THEME_STORAGE_KEY)
  }

  // ─── 公开方法 ──────────────────────────────────────────────────────────

  /**
   * 设置游戏 ID（从 URL 参数传入，在 main.ts 中调用）
   */
  function setGameId(gameId: number) {
    currentGameId.value = gameId
    console.log('🎮 已设置游戏 ID:', gameId)
  }

  /**
   * 切换到指定主题
   */
  async function switchTheme(themeId: string): Promise<boolean> {
    return await switchToBackendTheme(themeId)
  }

  /**
   * 从后端切换主题（主要入口）
   */
  async function switchToBackendTheme(themeId: string): Promise<boolean> {
    const success = await loadThemeFromBackend(themeId)
    if (success) _saveThemeId(themeId)
    return success
  }

  /**
   * 重置为默认主题
   */
  async function resetTheme(): Promise<void> {
    gtrsData.value       = null
    gtrsRawJson.value    = ''
    currentThemeId.value = ''
    await loadDefaultTheme()
  }

  /**
   * 初始化（在 main.ts 中调用）
   * 自动加载主题列表 + 上次保存的主题或默认主题
   */
  async function init(): Promise<void> {
    try {
      loading.value = true
      await loadThemeListFromBackend()

      const savedId = _loadSavedThemeId()
      if (savedId) {
        const success = await loadThemeFromBackend(savedId)
        if (!success) {
          console.warn('⚠️ 上次保存的主题加载失败，尝试默认主题')
          localStorage.removeItem(THEME_STORAGE_KEY)
          await loadDefaultTheme()
        }
      } else {
        await loadDefaultTheme()
      }
    } catch (err: any) {
      error.value = err.message || '主题初始化失败'
      console.error('❌ 主题初始化失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ─── 资源访问 ──────────────────────────────────────────────────────────

  /**
   * 获取图片资源 URL
   * @param key  资源键名（对应 GTRS.resources.images.scene[key]）
   * @returns URL 字符串，未找到时返回 undefined
   */
  function getImageUrl(key: string): string | undefined {
    const scene = resources.value?.images?.scene
    if (!scene) return undefined
    const res = scene[key]
    if (!res?.src) return undefined
    // 归一化路径（去除 /public/ 前缀）
    let src = res.src as string
    if (src.startsWith('/public/')) src = src.replace('/public/', '/')
    return src
  }

  /**
   * 获取音频资源 URL
   * @param key   资源键名
   * @param type  'bgm' 或 'effect'
   */
  function getAudioUrl(key: string, type: 'bgm' | 'effect' = 'effect'): string | undefined {
    const audio = resources.value?.audio?.[type]
    if (!audio) return undefined
    return audio[key]?.src
  }

  // ─── CSS 变量注入 ──────────────────────────────────────────────────────

  function _applyThemeToCSSVars(style: any) {
    const root = document.documentElement
    if (style.primaryColor)   root.style.setProperty('--theme-primary',    style.primaryColor)
    if (style.secondaryColor) root.style.setProperty('--theme-secondary',  style.secondaryColor)
    if (style.bgColor)        root.style.setProperty('--theme-background', style.bgColor)
    if (style.textColor)      root.style.setProperty('--theme-text',       style.textColor)
    if (style.borderRadius)   root.style.setProperty('--theme-border-radius', style.borderRadius)
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: style }))
  }

  // ─── 清理 ──────────────────────────────────────────────────────────────

  function clear() {
    currentThemeId.value    = ''
    gtrsRawJson.value       = ''
    gtrsData.value          = null
    error.value             = null
  }

  // ─── 返回 ─────────────────────────────────────────────────────────────

  return {
    // 状态
    currentThemeId,
    currentGameId,
    gtrsRawJson,
    gtrsData,
    themeList,
    isThemeListLoaded,
    loading,
    error,

    // computed
    isLoaded,
    themeInfo,
    resources,
    globalStyle,
    currentTheme,

    // 方法
    init,
    setGameId,
    switchTheme,
    switchToBackendTheme,
    resetTheme,
    loadThemeListFromBackend,
    loadThemeFromBackend,
    getImageUrl,
    getAudioUrl,
    clear,
  }
})
