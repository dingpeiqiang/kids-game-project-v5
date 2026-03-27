/**
 * 🔧【可复用组件】GTRS 主题加载器
 * 
 * 封装 GTRS 主题的加载、校验、路径归一化逻辑。
 * 支持从 themeStore 缓存复用，避免重复请求。
 * 
 * ⚠️ 注意：此组件需要运行在 Vue 组件的 setup 上下文中（或 Pinia 已激活的环境），
 *          因为它内部调用了 useThemeStore()。
 */

import { validateGTRSTheme } from '../utils/gtrs-validator'
import type { GTRSTheme } from '../types/gtrs.types'

export type { GTRSTheme }

/**
 * GTRS 加载器配置
 */
export interface GTRSLoaderConfig {
  /** API 基础 URL，默认 http://localhost:8080 */
  baseUrl?: string
}

/**
 * ⭐ GTRS 主题加载器
 * 
 * @example
 * const loader = new GTRSLoader()
 * const theme = await loader.loadTheme('theme_id', themeStore)
 * const assetKey = loader.getImageSrc('scene', 'snake_head')
 */
export class GTRSLoader {
  private GTRS: GTRSTheme | null = null
  private readonly baseUrl: string

  /** 图片资源缓存 Map（供 Phaser 使用） */
  public readonly imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

  constructor(config: GTRSLoaderConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:8080'
  }

  // ============================================================================
  // 🚀 主入口
  // ============================================================================

  /**
   * ⭐ 加载主题
   * 
   * @param themeId      主题 ID
   * @param gtrsRawJson  可选：themeStore 中已缓存的 GTRS JSON（优先复用）
   */
  async loadTheme(themeId: string, gtrsRawJson?: string): Promise<GTRSTheme> {
    let configJsonStr: string

    if (gtrsRawJson) {
      console.log('[GTRSLoader] ♻️ 复用缓存的 GTRS 主题')
      configJsonStr = gtrsRawJson
    } else {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('[GTRSLoader] 用户未登录，无法加载主题。')
      }

      console.log('[GTRSLoader] 🔄 从后端加载 GTRS 主题:', themeId)
      const response = await fetch(`${this.baseUrl}/api/theme/download?id=${themeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`[GTRSLoader] 主题加载失败：HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        throw new Error(`[GTRSLoader] 主题加载失败：code=${result.code}, message=${result.message}`)
      }

      const raw = result.data
      if (typeof raw === 'string') {
        configJsonStr = raw
      } else if (raw.configJson !== undefined) {
        configJsonStr = typeof raw.configJson === 'string'
          ? raw.configJson
          : JSON.stringify(raw.configJson)
      } else if (raw.config !== undefined) {
        configJsonStr = typeof raw.config === 'string'
          ? raw.config
          : JSON.stringify(raw.config)
      } else {
        configJsonStr = JSON.stringify(raw)
      }
    }

    // GTRS 校验
    const result = validateGTRSTheme(configJsonStr)
    if (!result.valid) {
      throw new Error(`[GTRSLoader] 主题 ${themeId} GTRS 校验失败：\n${result.message}`)
    }

    const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
    this.GTRS = this.normalizeSrcPaths(themeConfig) as GTRSTheme

    console.log(`[GTRSLoader] ✅ 主题加载完成：${this.GTRS.themeInfo?.themeName ?? '未命名'} (id=${themeId})`)
    return this.GTRS
  }

  // ============================================================================
  // 🔍 资源访问
  // ============================================================================

  /**
   * ⭐ 断言主题已加载（未加载则 throw）
   */
  assertGTRS(): GTRSTheme {
    if (!this.GTRS) {
      throw new Error('[GTRSLoader] 主题未加载！请先调用 loadTheme()。')
    }
    return this.GTRS
  }

  /**
   * 获取当前 GTRS（可能为 null）
   */
  getGTRS(): GTRSTheme | null {
    return this.GTRS
  }

  /**
   * ⭐ 获取场景图片资源 src（type=scene）
   * @param key GTRS key，如 'snake_head'
   */
  getImageSrc(category: keyof GTRSTheme['resources']['images'], key: string): string | undefined {
    return this.GTRS?.resources?.images?.[category]?.[key]?.src
  }

  /**
   * ⭐ 获取音频资源 src
   * @param category 'bgm' | 'effect' | 'voice'
   * @param key      GTRS key，如 'bgm_gameplay'
   */
  getAudioSrc(category: keyof GTRSTheme['resources']['audio'], key: string): string | undefined {
    return this.GTRS?.resources?.audio?.[category]?.[key]?.src
  }

  /**
   * ⭐ 获取音频音量
   */
  getAudioVolume(category: keyof GTRSTheme['resources']['audio'], key: string): number {
    return this.GTRS?.resources?.audio?.[category]?.[key]?.volume ?? 0.5
  }

  // ============================================================================
  // 🔧 私有方法
  // ============================================================================

  /**
   * 路径归一化（将旧格式路径统一为标准格式）
   * /public/xxx → /xxx
   */
  private normalizeSrcPaths(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => this.normalizeSrcPaths(item))
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

  private normalizeOneSrc(src: string): string {
    if (!src) return src
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('/')) {
      return src.startsWith('/public/') ? src.replace('/public/', '/') : src
    }
    if (src.startsWith('@/')) return '/' + src.slice(2)
    return '/' + src
  }
}
