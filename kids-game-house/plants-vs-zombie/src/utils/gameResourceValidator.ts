/**
 * 游戏资源验证工具 - 植物保卫战
 * 在游戏启动前检查主题是否包含游戏运行所需的资源
 *
 * ⭐ 设计原则：
 * - 游戏自己定义需要的资源
 * - 不依赖任何硬编码的配置
 * - 通用工具，可被任何游戏使用
 */

import type { GTRSTheme } from '@/core/GTRSThemeLoader'
import { GTRSValidationError } from '@/core/GTRSThemeLoader'

/**
 * 游戏资源需求配置
 * 由每个游戏自己定义需要的资源
 */
export interface GameResourceRequirement {
  gameId: string
  gameName: string
  requiredResources: {
    images: {
      scene: string[]
      ui: string[]
      login: string[]
      icon: string[]
      effect: string[]
    }
    audio: {
      bgm: string[]
      effect: string[]
      voice: string[]
    }
  }
}

/**
 * 资源检查结果
 */
export interface ResourceCheckResult {
  passed: boolean
  missingResources: string[]
  themeInfo?: {
    themeId: string
    themeName: string
  }
}

/**
 * 植物保卫战的资源需求
 */
export const PVA_GAME_REQUIREMENTS: GameResourceRequirement = {
  gameId: 'game_pva',
  gameName: '植物保卫战',
  requiredResources: {
    images: {
      scene: ['bg_main'],
      ui: [],
      login: [],
      icon: [],
      effect: []
    },
    audio: {
      bgm: [],
      effect: [],
      voice: []
    }
  }
}

/**
 * 检查主题是否包含游戏所需的资源
 *
 * @param theme GTRS 主题配置
 * @param requirements 游戏资源需求
 * @returns 检查结果
 */
export function checkGameResources(
  theme: GTRSTheme,
  requirements: GameResourceRequirement
): ResourceCheckResult {
  const missingResources: string[] = []

  // 获取主题提供的资源
  const providedImages = theme.themeInfo.providedResources?.images || {
    scene: [],
    ui: [],
    login: [],
    icon: [],
    effect: []
  }
  const providedAudio = theme.themeInfo.providedResources?.audio || {
    bgm: [],
    effect: [],
    voice: []
  }

  // 检查图片资源
  for (const [category, keys] of Object.entries(requirements.requiredResources.images)) {
    for (const key of keys) {
      if (!providedImages[category]?.includes(key)) {
        missingResources.push(`images.${category}.${key}`)
      }
    }
  }

  // 检查音频资源
  for (const [category, keys] of Object.entries(requirements.requiredResources.audio)) {
    for (const key of keys) {
      if (!providedAudio[category]?.includes(key)) {
        missingResources.push(`audio.${category}.${key}`)
      }
    }
  }

  return {
    passed: missingResources.length === 0,
    missingResources,
    themeInfo: {
      themeId: theme.themeInfo.themeId,
      themeName: theme.themeInfo.themeName
    }
  }
}

/**
 * 验证游戏资源，如果检查失败则抛出错误
 *
 * @param theme GTRS 主题配置
 * @param requirements 游戏资源需求
 * @throws GTRSValidationError 如果缺少必需资源
 */
export function validateGameResources(
  theme: GTRSTheme,
  requirements: GameResourceRequirement
): void {
  const result = checkGameResources(theme, requirements)

  if (!result.passed) {
    throw new GTRSValidationError([
      `游戏 "${requirements.gameName}" 运行必需资源缺失:`,
      ...result.missingResources.map(r => `  • ${r}`),
      '',
      `当前主题: ${result.themeInfo?.themeName}`,
      `主题ID: ${result.themeInfo?.themeId}`,
      '',
      `请确保主题包含游戏运行所需的所有资源。`,
      `如果是开发者，请检查主题的 providedResources 字段是否正确配置。`
    ])
  }

  console.log(`[GameResourceValidator] ✅ "${requirements.gameName}" 资源检查通过`)
}

/**
 * 从后端加载并验证游戏资源
 *
 * @param themeId 主题 ID
 * @param requirements 游戏资源需求
 * @returns 验证结果
 */
export async function loadAndValidateGameResources(
  themeId: string,
  requirements: GameResourceRequirement
): Promise<ResourceCheckResult> {
  try {
    console.log(`[GameResourceValidator] 开始加载并验证主题: ${themeId}`)

    // 获取 token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('用户未登录，无法加载主题')
    }

    // 从后端加载主题
    const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      throw new Error('Token 已过期，请重新登录')
    }

    if (!response.ok) {
      throw new Error(`加载主题失败: HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code !== 200 || !result.data) {
      throw new Error(`后端返回数据异常: code=${result.code}`)
    }

    // 提取 GTRS JSON
    let gtrsJson: unknown
    const data = result.data

    if (typeof data === 'string') {
      gtrsJson = JSON.parse(data)
    } else if (data.configJson !== undefined) {
      gtrsJson = typeof data.configJson === 'string' ? JSON.parse(data.configJson) : data.configJson
    } else if (data.config !== undefined) {
      gtrsJson = data.config
    } else {
      gtrsJson = data
    }

    // 基本校验
    if (!gtrsJson || typeof gtrsJson !== 'object') {
      throw new Error('主题 JSON 格式不正确')
    }

    const theme = gtrsJson as GTRSTheme

    // 验证资源
    const checkResult = checkGameResources(theme, requirements)

    console.log(`[GameResourceValidator] 主题 "${theme.themeInfo.themeName}" 资源检查完成:`, {
      passed: checkResult.passed,
      missingCount: checkResult.missingResources.length
    })

    return checkResult
  } catch (error: any) {
    console.error('[GameResourceValidator] 加载并验证主题失败:', error)
    throw error
  }
}
