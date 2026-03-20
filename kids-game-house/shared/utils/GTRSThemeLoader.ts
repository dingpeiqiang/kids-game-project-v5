/**
 * GTRS v1.0.0 游戏端主题加载器
 * 提供主题校验、资源预加载、样式应用、兜底保护功能
 */

import Ajv from 'ajv'
import defaultTheme from '../../../kids-game-frontend/src/configs/default-gtrs-theme.json'
import gtrsSchema from '../../../kids-game-frontend/src/schemas/gtrs-schema.json'
import type { GTRSTheme } from '../../../kids-game-frontend/src/types/gtrs-theme'

const ajv = new Ajv()

/**
 * 加载结果类型
 */
export interface LoadResult {
  success: boolean
  themeName: string
  message?: string
  errors?: string[]
}

/**
 * 校验主题JSON是否合法
 * @param themeJson 主题JSON字符串
 * @returns 是否合法
 */
function isValidTheme(themeJson: string | object): boolean {
  try {
    const theme = typeof themeJson === 'string' ? JSON.parse(themeJson) : themeJson

    // 1. 检查基础结构
    if (!theme.specMeta || !theme.themeInfo || !theme.globalStyle || !theme.resources) {
      return false
    }

    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return false
    }

    // 3. 检查版本兼容性
    const specVersion = theme.specMeta.specVersion
    if (!isVersionCompatible(specVersion, '1.0.0')) {
      return false
    }

    // 4. Schema校验
    const validate = ajv.compile(gtrsSchema)
    return validate(theme)
  } catch (e) {
    console.error('主题JSON解析失败', e)
    return false
  }
}

/**
 * 检查版本兼容性
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
 * 资源预加载
 * @param resources 资源对象
 * @returns Promise
 */
async function preloadResources(resources: GTRSTheme['resources']): Promise<void> {
  const promises: Promise<void>[] = []

  // 加载图片
  Object.values(resources.images).forEach(category => {
    Object.values(category).forEach(img => {
      const p = new Promise<void>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve()
        i.onerror = () => {
          console.warn(`图片加载失败: ${img.src}`)
          resolve() // 继续加载其他资源
        }
        i.src = img.src
      })
      promises.push(p)
    })
  })

  // 加载音频
  Object.values(resources.audio).forEach(category => {
    Object.values(category).forEach(aud => {
      const p = new Promise<void>((resolve, reject) => {
        const a = new Audio()
        a.volume = aud.volume || 0.5
        a.oncanplaythrough = () => resolve()
        a.onerror = () => {
          console.warn(`音频加载失败: ${aud.src}`)
          resolve() // 继续加载其他资源
        }
        a.src = aud.src
      })
      promises.push(p)
    })
  })

  await Promise.all(promises)
}

/**
 * 应用全局样式
 * @param style 样式对象
 */
function applyGlobalStyle(style: GTRSTheme['globalStyle']): void {
  const root = document.documentElement

  if (style.primaryColor) {
    root.style.setProperty('--theme-primary-color', style.primaryColor)
  }
  if (style.secondaryColor) {
    root.style.setProperty('--theme-secondary-color', style.secondaryColor)
  }
  if (style.bgColor) {
    root.style.setProperty('--theme-bg-color', style.bgColor)
  }
  if (style.textColor) {
    root.style.setProperty('--theme-text-color', style.textColor)
  }
  if (style.fontFamily) {
    root.style.setProperty('--theme-font-family', style.fontFamily)
  }
  if (style.borderRadius) {
    root.style.setProperty('--theme-border-radius', style.borderRadius)
  }
}

/**
 * 获取图片资源路径
 * @param category 分类
 * @param key 资源key
 * @param theme 主题对象（默认使用当前加载的主题）
 * @returns 图片路径
 */
export function getImageResource(
  category: 'login' | 'scene' | 'ui' | 'icon' | 'effect',
  key: string,
  theme?: GTRSTheme
): string {
  const currentTheme = theme || (window as any).GAME_THEME
  if (!currentTheme) {
    console.warn('主题未加载，使用默认主题')
    return defaultTheme.resources.images[category]?.[key]?.src || ''
  }

  const img = currentTheme.resources.images[category]?.[key]
  if (!img) {
    console.warn(`图片资源不存在: ${category}.${key}`)
    return defaultTheme.resources.images[category]?.[key]?.src || ''
  }

  return img.src
}

/**
 * 获取音频资源路径
 * @param category 分类
 * @param key 资源key
 * @param theme 主题对象（默认使用当前加载的主题）
 * @returns 音频资源对象
 */
export function getAudioResource(
  category: 'bgm' | 'effect' | 'voice',
  key: string,
  theme?: GTRSTheme
): { src: string; volume: number } | null {
  const currentTheme = theme || (window as any).GAME_THEME
  if (!currentTheme) {
    console.warn('主题未加载，使用默认主题')
    const defaultAudio = defaultTheme.resources.audio[category]?.[key]
    return defaultAudio ? { src: defaultAudio.src, volume: defaultAudio.volume } : null
  }

  const audio = currentTheme.resources.audio[category]?.[key]
  if (!audio) {
    console.warn(`音频资源不存在: ${category}.${key}`)
    const defaultAudio = defaultTheme.resources.audio[category]?.[key]
    return defaultAudio ? { src: defaultAudio.src, volume: defaultAudio.volume } : null
  }

  return { src: audio.src, volume: audio.volume }
}

/**
 * 主加载函数（游戏入口调用）
 * @param remoteJson 远程主题JSON字符串
 * @returns 加载结果
 */
export async function loadTheme(remoteJson: string): Promise<LoadResult> {
  let theme: GTRSTheme
  let isDefault = false

  // 1. 校验主题JSON
  if (!isValidTheme(remoteJson)) {
    console.warn('主题JSON校验失败，使用默认主题')
    theme = defaultTheme as GTRSTheme
    isDefault = true
  } else {
    try {
      theme = typeof remoteJson === 'string' ? JSON.parse(remoteJson) : remoteJson
    } catch (e) {
      console.error('主题JSON解析失败', e)
      theme = defaultTheme as GTRSTheme
      isDefault = true
    }
  }

  // 2. 应用全局样式
  try {
    applyGlobalStyle(theme.globalStyle)
  } catch (e) {
    console.error('应用全局样式失败', e)
  }

  // 3. 预加载资源
  try {
    await preloadResources(theme.resources)
  } catch (e) {
    console.error('资源预加载失败', e)
    // 资源加载失败不影响主题切换
  }

  // 4. 保存到全局变量
  ;(window as any).GAME_THEME = theme

  const themeName = theme.themeInfo.themeName
  const message = isDefault ? `已切换到默认主题（原因：远程主题校验失败）` : `主题加载成功`

  console.log(message, themeName)

  return {
    success: true,
    themeName,
    message
  }
}

/**
 * 从后端API加载主题
 * @param themeId 主题ID
 * @param token 用户token
 * @returns 加载结果
 */
export async function loadThemeFromAPI(themeId: string, token?: string): Promise<LoadResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api/theme/download?id=${themeId}`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const configJson = data.data?.configJson

    if (!configJson) {
      console.warn('主题配置为空，使用默认主题')
      return await loadTheme(JSON.stringify(defaultTheme))
    }

    return await loadTheme(configJson)
  } catch (e) {
    console.error('从API加载主题失败', e)
    // 终极兜底：使用默认主题
    return await loadTheme(JSON.stringify(defaultTheme))
  }
}

/**
 * 获取当前主题
 * @returns 当前主题对象
 */
export function getCurrentTheme(): GTRSTheme | null {
  return (window as any).GAME_THEME || null
}

/**
 * 重置为默认主题
 * @returns 加载结果
 */
export async function resetToDefaultTheme(): Promise<LoadResult> {
  return await loadTheme(JSON.stringify(defaultTheme))
}
