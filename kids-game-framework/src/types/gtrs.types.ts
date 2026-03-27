/**
 * 📝 GTRS v1.0.0 主题规范类型定义
 * 
 * GTRS (Game Theme Resource Specification) 是儿童游戏平台的
 * 主题资源规范，定义了游戏主题的标准数据结构。
 */

// ============================================================================
// 🎨 GTRS 核心类型
// ============================================================================

/**
 * GTRS 规范元信息
 */
export interface GTRSSpecMeta {
  specName: 'GTRS'
  specVersion: string
  compatibleVersion: string
}

/**
 * GTRS 全局样式
 */
export interface GTRSGlobalStyle {
  primaryColor?: string
  secondaryColor?: string
  bgColor?: string
  textColor?: string
  fontFamily?: string
  borderRadius?: string
  [key: string]: string | undefined
}

/**
 * 图片资源
 */
export interface GTRSImageResource {
  src: string
  type: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'
  alias: string
  $comment?: string
}

/**
 * 音频资源
 */
export interface GTRSAudioResource {
  src: string
  type: 'mp3'
  volume: number
  alias: string
  $comment?: string
}

/**
 * GTRS 资源集合
 */
export interface GTRSResources {
  images: {
    login:  Record<string, GTRSImageResource>
    scene:  Record<string, GTRSImageResource>
    ui:     Record<string, GTRSImageResource>
    icon:   Record<string, GTRSImageResource>
    effect: Record<string, GTRSImageResource>
  }
  audio: {
    bgm:    Record<string, GTRSAudioResource>
    effect: Record<string, GTRSAudioResource>
    voice:  Record<string, GTRSAudioResource>
  }
  video: Record<string, any>
}

/**
 * ⭐ GTRS 主题完整结构（v1.0.0）
 */
export interface GTRSTheme {
  /** 规范元信息 */
  specMeta: GTRSSpecMeta

  /** 可选的主题信息（由后端注入，非规范字段） */
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }

  /** 全局样式 */
  globalStyle: GTRSGlobalStyle

  /** 资源配置 */
  resources: GTRSResources
}

// ============================================================================
// ✅ 校验结果类型
// ============================================================================

export interface ValidationResult {
  valid: boolean
  message: string
  data?: any
}

// ============================================================================
// 🔧 加载器配置类型
// ============================================================================

export interface GTRSLoaderConfig {
  /** API 基础 URL，默认 http://localhost:8080 */
  baseUrl?: string
  /** 是否启用缓存（复用 themeStore） */
  enableCache?: boolean
  /** 请求超时（毫秒） */
  timeout?: number
}
