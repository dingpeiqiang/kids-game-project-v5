/**
 * 主题状态管理
 */
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    // 当前主题 ID
    currentThemeId: '',
    
    // 原始 GTRS JSON
    gtrsRawJson: null as string | null,
    
    // 解析后的 GTRS 对象
    gtrsData: null as any,
    
    // 主题加载状态
    loading: false,
    
    // 错误信息
    error: null as string | null
  }),

  getters: {
    // 检查是否已加载主题
    isLoaded: (state) => !!state.gtrsData,
    
    // 获取主题信息
    themeInfo: (state) => state.gtrsData?.themeInfo,
    
    // 获取资源
    resources: (state) => state.gtrsData?.resources,
    
    // 获取全局样式
    globalStyle: (state) => state.gtrsData?.globalStyle
  },

  actions: {
    // 设置 GTRS 数据（从外部传入）
    setGTRS(gtrsJson: string) {
      try {
        this.gtrsRawJson = gtrsJson
        this.gtrsData = JSON.parse(gtrsJson)
        this.error = null
      } catch (e) {
        this.error = 'GTRS 解析失败'
        console.error('GTRS 解析失败:', e)
      }
    },
    
    // 从后端加载主题
    async loadTheme(themeId: string) {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('未登录')
        }
        
        const response = await fetch(
          `http://localhost:8080/api/theme/download?id=${themeId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        if (result.code !== 200 || !result.data) {
          throw new Error(result.message || '加载失败')
        }
        
        // 提取 configJson
        let configJsonStr: string
        const raw = result.data
        
        if (typeof raw === 'string') {
          configJsonStr = raw
        } else if (raw.configJson !== undefined) {
          configJsonStr = typeof raw.configJson === 'string'
            ? raw.configJson
            : JSON.stringify(raw.configJson)
        } else {
          configJsonStr = JSON.stringify(raw)
        }
        
        this.setGTRS(configJsonStr)
        this.currentThemeId = themeId
        
      } catch (e: any) {
        this.error = e.message || '加载主题失败'
        console.error('加载主题失败:', e)
      } finally {
        this.loading = false
      }
    },
    
    // 获取图片资源 URL
    getImageUrl(key: string): string | undefined {
      const sceneImages = this.resources?.images?.scene
      if (!sceneImages) return undefined
      
      const resource = sceneImages[key]
      if (!resource?.src) return undefined
      
      // 归一化路径
      let src = resource.src
      if (src.startsWith('/')) {
        src = src.replace('/public/', '/')
      }
      
      return src
    },
    
    // 获取音频资源 URL
    getAudioUrl(key: string, type: 'bgm' | 'effect' = 'effect'): string | undefined {
      const audio = this.resources?.audio?.[type]
      if (!audio) return undefined
      
      const resource = audio[key]
      if (!resource?.src) return undefined
      
      return resource.src
    },
    
    // 清理
    clear() {
      this.currentThemeId = ''
      this.gtrsRawJson = null
      this.gtrsData = null
      this.error = null
    }
  }
})
