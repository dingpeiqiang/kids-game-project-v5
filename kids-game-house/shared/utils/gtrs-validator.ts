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

export function validateGTRSTheme(themeJson: string): ValidationResult {
  try {
    const theme = JSON.parse(themeJson)

    if (!theme.specMeta || !theme.globalStyle || !theme.resources) {
      return {
        valid: false,
        message: '缺少必需的顶级字段：specMeta、globalStyle、resources'
      }
    }

    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为：GTRS'
      }
    }

    return {
      valid: true,
      message: '基本格式检查通过，建议调用后端 API 进行完整校验'
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

export function isGTRSFormat(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return theme.specMeta?.specName === 'GTRS'
  } catch {
    return false
  }
}

export function quickValidate(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return !!(
      theme.specMeta &&
      theme.globalStyle &&
      theme.resources
    )
  } catch {
    return false
  }
}