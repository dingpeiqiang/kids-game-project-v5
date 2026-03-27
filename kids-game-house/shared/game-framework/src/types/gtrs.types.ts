/**
 * 📝 GTRS 主题类型定义
 */

// ============================================================================
// 🎨 GTRS 主题配置
// ============================================================================

export interface GTRSTheme {
  /** 主题信息 */
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
  
  /** 全局样式 */
  globalStyle?: {
    primaryColor?: string
    secondaryColor?: string
    bgColor?: string
    textColor?: string
    [key: string]: string | undefined
  }
  
  /** 资源配置 */
  resources?: Array<{
    key: string
    src: string
    type?: 'image' | 'audio' | 'sprite'
  }>
  
  /** 背景音乐 */
  bgm?: {
    main?: {
      src: string
      volume?: number
      loop?: boolean
    }
    gameplay?: {
      src: string
      volume?: number
      loop?: boolean
    }
    gameover?: {
      src: string
      volume?: number
      loop?: boolean
    }
  }
  
  /** 音效 */
  sound?: {
    eat?: {
      src: string
      volume?: number
    }
    crash?: {
      src: string
      volume?: number
    }
    prop?: {
      src: string
      volume?: number
    }
    [key: string]: {
      src: string
      volume?: number
    } | undefined
  }
}

// ============================================================================
// ✅ GTRS 校验结果
// ============================================================================

export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean
  
  /** 校验消息 */
  message: string
  
  /** 原始数据（如果解析成功） */
  data?: any
}

// ============================================================================
// 🔧 GTRS 加载器配置
// ============================================================================

export interface GTRSLoaderConfig {
  /** API 基础 URL */
  baseUrl?: string
  
  /** 是否启用缓存 */
  enableCache?: boolean
  
  /** 超时时间（毫秒） */
  timeout?: number
}
