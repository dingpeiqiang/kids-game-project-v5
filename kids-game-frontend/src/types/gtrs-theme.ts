/**
 * GTRS v1.0.0 主题数据类型定义
 */

export interface GTRSTheme {
  specMeta: SpecMeta
  themeInfo?: ThemeInfo | null  // ⭐ 可选，用于兼容旧数据，新规范中已废弃
  globalStyle: GlobalStyle
  resources: Resources
}

export interface SpecMeta {
  specName: 'GTRS'
  specVersion: string
  compatibleVersion: string
}

export interface ThemeInfo {
  themeId: string
  ownerType: 'GAME' | 'APPLICATION'  // 所有者类型
  ownerId: number                     // 数据库主键
  themeName: string
  isDefault: boolean
  author?: string
  description?: string
  gameId?: string  // ⭐ 兼容字段，用于生成 gameCode（从 ownerId 转换）
}

export interface GlobalStyle {
  primaryColor?: string
  secondaryColor?: string
  bgColor?: string
  textColor?: string
  fontFamily?: string
  borderRadius?: string
}

export interface Resources {
  images: ImageCategories
  audio: AudioCategories
  video: Record<string, any>
}

export interface ImageCategories {
  login: Record<string, ImageResource>
  scene: Record<string, ImageResource>
  ui: Record<string, ImageResource>
  icon: Record<string, ImageResource>
  effect: Record<string, ImageResource>
}

export interface AudioCategories {
  bgm: Record<string, AudioResource>
  effect: Record<string, AudioResource>
  voice: Record<string, AudioResource>
}

export interface ImageResource {
  src: string
  type: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'
  alias: string
}

export interface AudioResource {
  src: string
  type: 'mp3'
  volume: number
  alias: string
}

export interface ValidationResult {
  valid: boolean
  message: string
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
}
