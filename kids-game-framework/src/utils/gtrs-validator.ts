/**
 * GTRS v1.0.0 轻量级校验工具
 *
 * ⭐ 设计理念：前端只做基本格式检查，完整校验交给后端
 * ⭐ 所有游戏项目共享此工具库，确保基础检查一致
 */

import type { GTRSTheme, ValidationResult } from '../types/gtrs.types'

export type { GTRSTheme, ValidationResult }
export type { GTRSImageResource, GTRSAudioResource } from '../types/gtrs.types'

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
        message: '缺少必需的顶级字段：specMeta、globalStyle、resources'
      }
    }

    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为：GTRS'
      }
    }

    return {
      valid: true,
      message: '基本格式检查通过'
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 快速校验（仅检查关键字段，用于前端实时预览）
 */
export function quickValidate(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return !!(theme.specMeta && theme.globalStyle && theme.resources)
  } catch {
    return false
  }
}

/**
 * 检测主题 JSON 是否为 GTRS 规范格式
 */
export function isGTRSFormat(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return theme.specMeta?.specName === 'GTRS'
  } catch {
    return false
  }
}
