// ============================================================================
// 🔧【可复用框架层】GTRS 主题加载组件 - 保持原有逻辑不变
// ============================================================================
// 📌 说明：封装原有的 GTRS 加载逻辑，不做任何修改，只是包装成类
// ============================================================================

import type { GTRSTheme as BaseGTRSTheme } from '@/utils/gtrs-validator'
import { validateGTRSTheme } from '@/utils/gtrs-validator'
import { useThemeStore } from '@/stores/theme'

/**
 * ⭐ GTRSTheme 扩展类型（保持原有定义）
 */
export interface GTRSTheme extends BaseGTRSTheme {
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
}

/**
 * ⭐ GTRS 主题加载组件
 * 
 * 📌 说明：封装原有的 preload() 中的 GTRS 加载逻辑
 * 
 * 使用方式:
 * ```typescript
 * const loader = new GTRSLoader()
 * await loader.loadTheme('snake_default')
 * ```
 */
export class GTRSLoader {
  // ⭐ 运行时主题对象（保持原有全局变量）
  private GTRS: GTRSTheme | null = null
  
  // ⭐ 全局图片资源缓存 Map（保持原有实现）
  public readonly imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

  /**
   * ⭐ 加载主题（保持原有 loadTheme() 函数逻辑）
   */
  async loadTheme(themeId: string): Promise<GTRSTheme> {
    const themeStore = useThemeStore()
    let configJsonStr: string

    // ⭐ 优先复用 themeStore 已加载的 GTRS
    if (themeStore.gtrsRawJson) {
      console.log('[GTRSLoader] ♻️ 复用 themeStore 已加载的 GTRS 主题')
      configJsonStr = themeStore.gtrsRawJson
    } else {
      // ⭐ gtrsRawJson 为空，从后端获取
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('[GTRSLoader] 用户未登录，无法加载主题。请先登录后再启动游戏。')
      }

      console.log('[GTRSLoader] 🔄 从后端加载 GTRS 主题')
      const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`[GTRSLoader] 主题加载失败：HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        throw new Error(`[GTRSLoader] 主题加载失败：服务端 code=${result.code}, message=${result.message}`)
      }

      // ⭐ 提取 configJson（支持后端多种包装格式）
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
    }

    // ⭐ GTRS 严格校验（无论从哪里获取都需要校验）
    const validationResult = validateGTRSTheme(configJsonStr)
    if (!validationResult.valid) {
      throw new Error(
        `[GTRSLoader] 主题 ${themeId} GTRS 校验失败，游戏无法启动：\n${validationResult.message}`
      )
    }

    // 校验通过，直接赋值（不兜底合并）
    const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
    this.applyGTRS(themeConfig)
    console.log(`[GTRSLoader] ✅ GTRS 主题已加载：${this.GTRS!.themeInfo?.themeName || '未命名'} (id=${themeId})`)
    
    return this.GTRS!
  }

  /**
   * ⭐ 应用主题配置（保持原有 applyGTRS() 函数逻辑）
   */
  private applyGTRS(theme: GTRSTheme): void {
    this.GTRS = this.normalizeSrcPaths(theme) as GTRSTheme
    console.log('[GTRSLoader] 📦 主题已加载:', this.GTRS.themeInfo?.themeName)
  }

  /**
   * ⭐ 断言 GTRS 已加载（保持原有 assertGTRS() 函数逻辑）
   */
  assertGTRS(): GTRSTheme {
    if (!this.GTRS) {
      throw new Error('[GTRSLoader] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
    }
    return this.GTRS
  }

  /**
   * ⭐ 路径归一化（保持原有 normalizeSrcPaths() 函数逻辑）
   */
  private normalizeSrcPaths(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(this.normalizeSrcPaths.bind(this))
    const result: any = {}
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (key === 'src' && typeof value === 'string') {
        result[key] = this.normalizeOneSrc(value)
      } else if (typeof value === 'object') {
        result[key] = this.normalizeSrcPaths(value)
      } else {
        result[key] = value
      }
    }
    return result
  }

  /**
   * ⭐ 将单个资源 src 路径归一化（保持原有 normalizeOneSrc() 函数逻辑）
   */
  private normalizeOneSrc(src: string): string {
    if (!src || typeof src !== 'string') return src

    // 完整 URL（http/https）：直接返回
    if (src.startsWith('http://') || src.startsWith('https://')) return src

    // 已经是 / 开头：直接返回
    if (src.startsWith('/')) {
      if (src.startsWith('/public/')) return src.replace('/public/', '/')
      return src
    }

    // Vite 别名：@/xxx → /xxx
    if (src.startsWith('@/')) return src.replace(/^@\\/, '/')

    // 不带 / 前缀的相对路径 → 补充 / 前缀
    return '/' + src
  }
}
