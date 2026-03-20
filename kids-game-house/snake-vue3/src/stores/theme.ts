/**
 * 主题状态管理
 *
 * 使用 Pinia 管理当前主题状态
 * 支持主题切换、持久化、动态应用
 *
 * 注意：不再使用前端预设主题，所有主题从后端获取
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { GAME_CODE } from '@/config/game.config'

/**
 * 主题配置类型定义
 * 注意：此类型仅用于类型检查，实际主题数据从后端获取
 */
export interface ThemeConfig {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    accent: string
    success: string
    warning: string
    error: string
  }
  effects: {
    shadow: string
    glow: string
    border: string
    borderRadius: string
  }
  assets: {
    snakeHead: { type: 'emoji' | 'image'; value: string }
    snakeBody: { type: 'color' | 'image'; value: string }
    snakeTail: { type: 'color' | 'image'; value: string }
    food: { type: 'emoji' | 'image'; value: string }
    specialFood: { type: 'emoji' | 'image'; value: string }
    background: { type: 'color' | 'image'; value: string }
    grid: { type: 'color' | 'image'; value: string }
    button: { type: 'color' | 'image'; value: string }
    panel: { type: 'color' | 'image'; value: string }
  }
  sounds: {
    bgm: { enabled: boolean; volume: number }
    eat: { enabled: boolean; volume: number }
    die: { enabled: boolean; volume: number }
    victory: { enabled: boolean; volume: number }
    ui: { enabled: boolean; volume: number }
  }
}

const THEME_STORAGE_KEY = 'snake-game-theme'
const THEME_CUSTOM_KEY = 'snake-custom-theme'
// 不再使用 DEFAULT_THEME_ID，直接从后端加载

export const useThemeStore = defineStore('theme', () => {
  // 当前主题
  const currentThemeId = ref<string>('') // 初始为空，等待从后端加载
  
  // 当前游戏 ID（从路由参数获取）
  const currentGameId = ref<number | null>(null)
  
  // 自定义主题
  const customTheme = ref<ThemeConfig | null>(null)
  
  // 当前完整主题配置
  const currentTheme = computed<ThemeConfig>(() => {
    if (customTheme.value) {
      return customTheme.value
    }
    // 如果没有自定义主题，返回空主题配置（需要从后端加载）
    // 注意：不会提供预设值，必须从后端加载
    return {
      id: currentThemeId.value,
      name: '加载中...',
      description: '',
      colors: {
        primary: '#000000',
        secondary: '#000000',
        background: '#000000',
        surface: '#000000',
        text: '#000000',
        textSecondary: '#000000',
        accent: '#000000',
        success: '#000000',
        warning: '#000000',
        error: '#000000'
      },
      effects: {
        shadow: 'none',
        glow: 'none',
        border: 'none',
        borderRadius: '0px'
      },
      assets: {
        snakeHead: { type: 'emoji' as const, value: '' },
        snakeBody: { type: 'color' as const, value: '' },
        snakeTail: { type: 'color' as const, value: '' },
        food: { type: 'emoji' as const, value: '' },
        specialFood: { type: 'emoji' as const, value: '' },
        background: { type: 'color' as const, value: '' },
        grid: { type: 'color' as const, value: '' },
        button: { type: 'color' as const, value: '' },
        panel: { type: 'color' as const, value: '' }
      },
      sounds: {
        bgm: { enabled: false, volume: 0 },
        eat: { enabled: false, volume: 0 },
        die: { enabled: false, volume: 0 },
        victory: { enabled: false, volume: 0 },
        ui: { enabled: false, volume: 0 }
      }
    }
  })
  
  // 是否使用自定义主题
  const isCustomTheme = computed(() => !!customTheme.value)
  
  // 主题列表（从后端加载）
  const themeList = ref<Array<{
    id: string
    name: string
    description: string
    colors: any
  }>>([])
  
  // 是否已加载主题列表
  const isThemeListLoaded = ref(false)

  // 从后端加载主题列表
  async function loadThemeListFromBackend(forceRefresh: boolean = false): Promise<void> {
    // 如果不是强制刷新且已加载过，则跳过
    if (!forceRefresh && isThemeListLoaded.value) {
      console.log('📋 主题列表已加载，跳过')
      return
    }
    
    try {
      console.log('📋 从后端加载主题列表...', forceRefresh ? '(强制刷新)' : '')
      
      // 获取本地存储的 token
      const token = localStorage.getItem('token')
      
      // 如果没有 token，说明未登录，路由守卫应该已经处理了跳转
      // 这里只是防御性检查
      if (!token) {
        console.warn('⚠️ 用户未登录，无法加载主题列表')
        themeList.value = []
        isThemeListLoaded.value = true
        return
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      // 构建查询参数：优先使用 gameId，如果没有则使用 gameCode
      const queryParams = new URLSearchParams({
        status: 'on_sale',
        ownerType: 'GAME',
        ownerId:  String(currentGameId.value),
        page: '1',
        pageSize: '100'
      })
      
      console.log('📋 使用 gameId 查询主题:', currentGameId.value)
    
      // 调用后端 API 获取主题列表
      const response = await fetch(`http://localhost:8080/api/theme/list?${queryParams.toString()}`, {
        headers
      })
      
      // 检查是否返回 401 未授权（token 过期）
      if (response.status === 401) {
        console.warn('⚠️ Token 已过期，清除登录状态')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 跳转到登录页
        const currentPath = window.location.href
        window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
        return
      }
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        const themes = result.data.list || result.data || []
        
        // 转换为前端主题列表格式
        themeList.value = themes.map((theme: any) => ({
          id: String(theme.themeId || theme.id),
          name: theme.themeName || theme.name,
          description: theme.description || '',
          colors: {
            primary: theme.config?.default?.colors?.primary || '#4ade80',
            secondary: theme.config?.default?.colors?.secondary || '#22c55e',
            accent: theme.config?.default?.colors?.accent || '#fbbf24'
          }
        }))
        
        isThemeListLoaded.value = true
        console.log('✅ 主题列表加载成功:', themeList.value.length, '个主题')
        
        if (themeList.value.length === 0) {
          console.warn('⚠️ 后端返回的主题列表为空')
        }
      } else {
        console.warn('⚠️ 后端返回数据异常：code=', result.code, 'message=', result.message)
        themeList.value = []
        isThemeListLoaded.value = true
      }
    } catch (error: any) {
      console.error('❌ 主题列表加载失败:', error.message || error)
      themeList.value = []
      isThemeListLoaded.value = true
    }
  }
  
  // 从后端加载主题配置
  async function loadThemeFromBackend(themeId: number | string): Promise<boolean> {
    try {
      console.log('🎨 从后端加载主题:', themeId)
      
      // 获取本地存储的 token
      const token = localStorage.getItem('token')
      
      // 如果没有 token，说明未登录
      if (!token) {
        console.warn('⚠️ 用户未登录，无法加载主题')
        return false
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
        headers
      })
      
      // 检查是否返回 401 未授权（token 过期）
      if (response.status === 401) {
        console.warn('⚠️ Token 已过期，清除登录状态')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 跳转到登录页
        const currentPath = window.location.href
        window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
        return false
      }

      const result = await response.json()

      console.log('📦 后端返回的原始数据:', result)

      if (result.code !== 200 || !result.data) {
        console.error('❌ 后端返回数据异常：code=', result.code, 'message=', result.message)
        return false
      }

      // 提取主题配置
      let themeConfig: unknown
      const data = result.data

      if (typeof data === 'string') {
        themeConfig = JSON.parse(data)
      } else if (data.configJson !== undefined) {
        themeConfig = typeof data.configJson === 'string' ? JSON.parse(data.configJson) : data.configJson
      } else if (data.config !== undefined) {
        themeConfig = data.config
      } else {
        themeConfig = data
      }

      // 提取主题信息
      const themeData = themeConfig as any
      const themeName = themeData.themeInfo?.themeName || themeData.themeName || '未命名主题'
      const primaryColor = themeData.globalStyle?.primaryColor || themeData.colors?.primary || '#4ade80'
      const secondaryColor = themeData.globalStyle?.secondaryColor || themeData.colors?.secondary || '#22c55e'
      const bgColor = themeData.globalStyle?.bgColor || themeData.colors?.background || '#1e293b'
      const textColor = themeData.globalStyle?.textColor || themeData.colors?.text || '#ffffff'

      // 从主题配置提取主题信息（仅用于 UI 层）
      customTheme.value = {
        id: themeId,
        name: themeName,
        description: themeData.themeInfo?.description || themeData.description || '',
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          background: bgColor,
          surface: '#334155',
          text: textColor,
          textSecondary: '#94a3b8',
          accent: '#fbbf24',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444'
        },
        effects: {
          shadow: '0 4px 6px rgba(0,0,0,0.3)',
          glow: `0 0 10px ${primaryColor}`,
          border: `2px solid ${bgColor}`,
          borderRadius: '8px'
        },
        assets: {
          snakeHead: { type: 'emoji' as const, value: '🐍' },
          snakeBody: { type: 'color' as const, value: primaryColor },
          snakeTail: { type: 'color' as const, value: secondaryColor },
          food: { type: 'emoji' as const, value: '🍎' },
          specialFood: { type: 'emoji' as const, value: '⭐' },
          background: { type: 'color' as const, value: bgColor },
          grid: { type: 'color' as const, value: '#334155' },
          button: { type: 'color' as const, value: '#fbbf24' },
          scorePanel: { type: 'color' as const, value: 'rgba(26, 26, 46, 0.9)' },
          pauseOverlay: { type: 'color' as const, value: 'rgba(26, 26, 46, 0.95)' }
        },
        audio: {
          bgm: { enabled: true, volume: 0.5 },
          eat: { enabled: true, volume: 0.3 },
          move: { enabled: true, volume: 0.2 },
          pause: { enabled: true, volume: 0.2 },
          resume: { enabled: true, volume: 0.2 },
          gameOver: { enabled: true, volume: 0.4 },
          levelUp: { enabled: true, volume: 0.6 }
        },
        gameSpecific: {
          resourceUrls: {}
        }
      } as ThemeConfig

      currentThemeId.value = String(themeId)
      applyThemeToDocument(customTheme.value!)

      console.log('✅ 后端主题加载成功:', customTheme.value.name)
      return true
    } catch (error) {
      console.error('❌ 后端主题加载失败:', error)
      return false
    }
  }

  // 加载保存的主题
  async function loadTheme(): Promise<void> {
    try {
      const savedId = localStorage.getItem(THEME_STORAGE_KEY)
      
      if (savedId) {
        // 检查是否是有效的数字 ID
        const numericId = Number(savedId)
        if (isNaN(numericId)) {
          console.warn('⚠️ 保存的主题 ID 格式不正确，已清除:', savedId)
          localStorage.removeItem(THEME_STORAGE_KEY)
          await loadDefaultTheme()
          return
        }
        
        // 尝试从后端加载保存的主题
        console.log('🔄 尝试加载上次选择的主题:', numericId)
        const success = await loadThemeFromBackend(numericId)
        
        if (!success) {
          throw new Error(`上次选择的主题 ${numericId} 加载失败`)
        }
      } else {
        // 没有保存的主题，加载默认主题
        await loadDefaultTheme()
      }
    } catch (error: any) {
      console.error('❌ 加载保存的主题失败:', error)
      throw error // 直接抛出错误，不降级
    }
  }
  
  // 加载默认主题
  async function loadDefaultTheme(): Promise<void> {
    try {
      console.log('🎨 加载默认主题...')
      
      // 获取本地存储的 token
      const token = localStorage.getItem('token')
      
      // 如果没有 token，说明未登录，路由守卫应该已经处理了跳转
      // 这里只是防御性检查
      if (!token) {
        console.warn('⚠️ 用户未登录，无法加载默认主题')
        return
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      // 构建查询参数：使用 ownerType=GAME 和 ownerId=游戏ID
      const queryParams = new URLSearchParams({
        status: 'on_sale',
        page: '1',
        pageSize: '1'
      })
      
      // 如果有 gameId，使用 ownerType=GAME 和 ownerId=游戏ID 查询
      if (currentGameId.value) {
        queryParams.set('ownerType', 'GAME')
        queryParams.set('ownerId', String(currentGameId.value))
        console.log('📋 使用 ownerId 查询默认主题:', currentGameId.value)
      } else {
        // 否则使用 gameCode（需要后端支持）
        queryParams.set('gameCode', GAME_CODE)
        console.log('📋 使用 gameCode 查询默认主题:', GAME_CODE)
      }
      
      // 从后端获取主题列表，使用第一个可用的主题作为默认主题
      const response = await fetch(`http://localhost:8080/api/theme/list?${queryParams.toString()}`, {
        headers
      })
      
      // 检查是否返回 401 未授权（token 过期）
      if (response.status === 401) {
        console.warn('⚠️ Token 已过期，清除登录状态')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 跳转到登录页
        const currentPath = window.location.href
        window.location.href = `http://localhost:3000/login?redirect=${encodeURIComponent(currentPath)}`
        return
      }
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        const themes = result.data.list || result.data || []
        
        if (themes.length > 0) {
          const defaultTheme = themes[0]
          const themeId = String(defaultTheme.themeId || defaultTheme.id)
          
          console.log('✅ 使用后端第一个主题作为默认主题:', themeId)
          
          // 尝试加载默认主题的完整资源
          const success = await loadThemeFromBackend(themeId)
          if (!success) {
            throw new Error('后端默认主题加载失败')
          }
          return
        } else {
          throw new Error('后端没有可用的主题')
        }
      } else {
        throw new Error(`后端响应异常：code=${result.code}, message=${result.message}`)
      }
    } catch (error: any) {
      console.error('❌ 默认主题加载失败:', error)
      throw error // 直接抛出错误，不降级
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

  // 切换到后端主题（完整资源包）
  async function switchToBackendTheme(themeId: string): Promise<boolean> {
    const success = await loadThemeFromBackend(themeId)
    if (success) {
      saveTheme()
      return true
    }
    return false
  }
  
  // 切换到主题（兼容方法，优先从后端加载）
  async function switchTheme(themeId: string): Promise<boolean> {
    return await switchToBackendTheme(themeId)
  }

  // 应用自定义主题
  function applyCustomTheme(theme: ThemeConfig) {
    customTheme.value = theme
    saveTheme()
    applyThemeToDocument(theme)
  }

  // 重置为默认主题
  async function resetTheme(): Promise<void> {
    customTheme.value = null
    await loadDefaultTheme()
    saveTheme()
  }

  // 将主题应用到文档（CSS 变量）
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
  async function init() {
    try {
      // 先加载主题列表
      await loadThemeListFromBackend()
      // 再加载用户保存的主题或默认主题
      await loadTheme()
    } catch (error: any) {
      console.error('❌ 主题初始化失败:', error)
      // 不再自动降级，由调用方决定如何处理
      throw error
    }
  }

  // 设置游戏 ID
  function setGameId(gameId: number) {
    currentGameId.value = gameId
    console.log('🎮 设置游戏 ID:', gameId)
  }

  return {
    currentThemeId,
    currentGameId,
    customTheme,
    currentTheme,
    isCustomTheme,
    themeList,
    switchTheme,
    switchToBackendTheme,
    applyCustomTheme,
    resetTheme,
    init,
    loadThemeListFromBackend, // 导出加载方法，允许外部调用强制刷新
    setGameId // 导出设置游戏ID的方法
  }
})
