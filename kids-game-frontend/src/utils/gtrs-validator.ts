/**
 * GTRS v1.0.0 前端校验工具
 * 提供主题JSON的Schema校验、格式检测等功能
 */

import Ajv from 'ajv'
import gtrsSchema from '../schemas/gtrs-schema.json'
// 使用本地定义的 GTRSTheme 接口，避免循环导入

const ajv = new Ajv({ allErrors: true })

/**
 * GTRS主题数据类型
 */
export interface GTRSTheme {
  specMeta: {
    specName: 'GTRS'
    specVersion: string
    compatibleVersion: string
  }
  themeInfo: {
    themeId: string
    gameId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
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
  type: 'mp3' | 'wav' | 'ogg'
  volume: number
  alias: string
}

/**
 * 校验结果类型
 */
export interface ValidationResult {
  valid: boolean
  message: string
  errors?: Array<{
    path: string
    message: string
  }>
}

/**
 * 完整校验主题JSON是否符合GTRS规范
 * @param themeJson 主题JSON字符串
 * @returns 校验结果
 */
export function validateGTRSTheme(themeJson: string): ValidationResult {
  try {
    const theme = JSON.parse(themeJson)

    // 1. 检查基础结构
    if (!theme.specMeta || !theme.themeInfo || !theme.globalStyle || !theme.resources) {
      return {
        valid: false,
        message: '缺少必需的顶级字段：specMeta、themeInfo、globalStyle、resources'
      }
    }

    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为: GTRS'
      }
    }

    // 3. 检查版本兼容性
    if (!isVersionCompatible(theme.specMeta.specVersion, '1.0.0')) {
      return {
        valid: false,
        message: `规范版本 ${theme.specMeta.specVersion} 不兼容，当前支持版本: 1.0.0`
      }
    }

    // 4. Schema 校验
    const validate = ajv.compile(gtrsSchema)
    const valid = validate(theme)
    
    if (!valid) {
      // 构建详细的错误信息
      const errorDetails = validate.errors?.map((err, idx) => {
        const path = err.instancePath || 'root'
        const msg = err.message || '未知错误'
        const keyword = err.keyword
        const params = Object.entries(err.params || {})
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ')
    
        // 获取更详细的路径信息
        let detailedPath = path
        if (err.params?.missingProperty) {
          detailedPath = path ? `${path}.${err.params.missingProperty}` : err.params.missingProperty
        }
    
        return `${idx + 1}. [${keyword}] ${detailedPath || 'root'}\n   ${msg}${params ? ` (${params})` : ''}`
      }).join('\n\n') || '未知错误'
    
      return {
        valid: false,
        message: `Schema 校验失败:\n\n${errorDetails}`,
        errors: validate.errors?.map(err => ({
          path: err.instancePath || 'root',
          message: err.message || '未知错误'
        }))
      }
    }
    
    // 5. 额外校验：检查资源 URL 格式
    const urlValidationErrors = validateResourceUrls(theme)
    if (urlValidationErrors.length > 0) {
      return {
        valid: false,
        message: `资源 URL 格式错误:\n\n${urlValidationErrors.join('\n')}`,
        errors: urlValidationErrors.map(msg => ({ path: 'resources', message: msg }))
      }
    }

    return {
      valid: true,
      message: '校验通过'
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 验证资源 URL 格式
 */
function validateResourceUrls(theme: any): string[] {
  const errors: string[] = []
  
  // 检查图片资源
  if (theme.resources?.images) {
    for (const [category, resources] of Object.entries<any>(theme.resources.images)) {
      for (const [key, resource] of Object.entries<any>(resources)) {
        if (resource.src && !isValidResourceUrl(resource.src)) {
          errors.push(`图片资源 ${category}.${key} 的 src 不是有效的 URL: ${resource.src}`)
        }
      }
    }
  }
  
  // 检查音频资源
  if (theme.resources?.audio) {
    for (const [category, resources] of Object.entries<any>(theme.resources.audio)) {
      for (const [key, resource] of Object.entries<any>(resources)) {
        if (resource.src && !isValidResourceUrl(resource.src)) {
          errors.push(`音频资源 ${category}.${key} 的 src 不是有效的 URL: ${resource.src}`)
        }
      }
    }
  }
  
  return errors
}

/**
 * 判断是否为有效的资源 URL
 * 支持：http://, https://, 相对路径 (./, ../), assets/, /resources/
 */
function isValidResourceUrl(url: string): boolean {
  if (!url) return false
  
  // 完整 URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }
  
  // 相对路径
  if (url.startsWith('./') || url.startsWith('../')) {
    return true
  }
  
  // assets 目录
  if (url.startsWith('assets/')) {
    return true
  }
  
  // 后端资源接口
  if (url.startsWith('/resources/')) {
    return true
  }

  // 游戏主题资源目录（如 /themes/default/images/...）
  if (url.startsWith('/themes/')) {
    return true
  }

  return false
}

/**
 * 检测主题JSON是否为GTRS规范
 * @param themeJson 主题JSON字符串
 * @returns 是否为GTRS规范
 */
export function isGTRSFormat(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return theme.specMeta?.specName === 'GTRS'
  } catch {
    return false
  }
}

/**
 * 快速校验（仅检查关键字段，用于前端实时预览）
 * @param themeJson 主题JSON字符串
 * @returns 是否通过
 */
export function quickValidate(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return !!(
      theme.specMeta &&
      theme.themeInfo &&
      theme.globalStyle &&
      theme.resources
    )
  } catch {
    return false
  }
}

/**
 * 检查版本兼容性
 * @param themeVersion 主题版本
 * @param currentVersion 当前支持版本
 * @returns 是否兼容
 */
function isVersionCompatible(themeVersion: string, currentVersion: string): boolean {
  try {
    const themeMajor = parseInt(themeVersion.split('.')[0])
    const currentMajor = parseInt(currentVersion.split('.')[0])
    return themeMajor <= currentMajor
  } catch {
    return false
  }
}

/**
 * 生成英文Key（自动生成唯一标识）
 * @param category 分类名称
 * @param type 资源类型（img/audio）
 * @returns 生成的Key
 */
export function generateResourceKey(category: string, type: 'img' | 'audio'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const prefix = type === 'img' ? 'img' : 'audio'
  return `${category}_${prefix}_${timestamp}_${random}`
}

/**
 * 创建新的图片资源对象
 * @param alias 中文名称
 * @returns 图片资源对象
 */
export function createImageResource(alias: string): ImageResource {
  return {
    src: '',
    type: 'png',
    alias
  }
}

/**
 * 创建新的音频资源对象
 * @param alias 中文名称
 * @returns 音频资源对象
 */
export function createAudioResource(alias: string): AudioResource {
  return {
    src: '',
    type: 'mp3',
    volume: 0.5,
    alias
  }
}

/**
 * 将英文key转换为中文别名（用于迁移或默认生成）
 * @param key 英文key
 * @returns 中文别名
 */
export function keyToAlias(key: string): string {
  const mappings: Record<string, string> = {
    'login_bg': '登录背景图',
    'login_logo': '登录Logo',
    'login_btn': '登录按钮',
    'scene_bg': '场景背景',
    'ui_panel': 'UI面板',
    'ui_button': 'UI按钮',
    'icon_play': '播放图标',
    'icon_pause': '暂停图标',
    'icon_settings': '设置图标',
    'effect_explosion': '爆炸特效',
    'bgm_main': '主背景音乐',
    'bgm_battle': '战斗音乐',
    'effect_click': '点击音效',
    'effect_success': '成功音效',
    'effect_failure': '失败音效'
  }

  return mappings[key] || key
}
