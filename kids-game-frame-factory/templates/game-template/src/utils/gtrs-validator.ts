/**
 * GTRS v1.0.0 轻量级校验工具（模板内联版）
 *
 * ⭐ 设计理念：前端只做基本格式检查，完整校验交给后端
 * ⭐ 此文件内联了 shared/utils/gtrs-validator，无需外部依赖
 */

/** GTRS 主题数据类型（简化版，用于类型提示） */
export interface GTRSTheme {
  specMeta: {
    specName: 'GTRS'
    specVersion: string
    compatibleVersion: string
  }
  globalStyle: {
    primaryColor?: string
    secondaryColor?: string
    bgColor?: string
    textColor?: string
    fontFamily?: string
    borderRadius?: string
  }
  resources: {
    images: {
      login: Record<string, ImageResource>
      scene: Record<string, ImageResource>
      ui: Record<string, ImageResource>
      icon: Record<string, ImageResource>
      effect: Record<string, ImageResource>
    }
    audio: {
      bgm: Record<string, AudioResource>
      effect: Record<string, AudioResource>
      voice: Record<string, AudioResource>
    }
    video: Record<string, any>
  }
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
}

/**
 * 完整校验主题 JSON 是否符合 GTRS 规范
 * ⭐ 简化版：只做基本格式检查，完整校验请调用后端接口
 */
export function validateGTRSTheme(themeJson: string): ValidationResult {
  try {
    const theme = JSON.parse(themeJson)

    // 1. 检查基础结构
    if (!theme.specMeta || !theme.globalStyle || !theme.resources) {
      return {
        valid: false,
        message: '缺少必需的顶级字段：specMeta、globalStyle、resources',
      }
    }

    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为：GTRS',
      }
    }

    return {
      valid: true,
      message: '基本格式检查通过',
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/** 检测主题 JSON 是否为 GTRS 规范 */
export function isGTRSFormat(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return theme.specMeta?.specName === 'GTRS'
  } catch {
    return false
  }
}

/** 快速校验（仅检查关键字段） */
export function quickValidate(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return !!(theme.specMeta && theme.globalStyle && theme.resources)
  } catch {
    return false
  }
}
