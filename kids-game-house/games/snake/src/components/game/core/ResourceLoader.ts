// ============================================================================
// 🔧【可复用框架层】资源加载器 - 所有游戏通用
// ============================================================================
// 📌 说明：负责 GTRS 资源的加载、校验和缓存管理
// ============================================================================

import { validateGTRSTheme, type GTRSTheme as BaseGTRSTheme } from '@/utils/gtrs-validator'
import { useThemeStore } from '@/stores/theme'

/**
 * ⭐ GTRSTheme 扩展类型（兼容旧代码）
 * 📌 说明：所有游戏通用，直接复制
 */
export interface GTRSTheme extends BaseGTRSTheme {
  themeInfo?: {
    themeId: string
    themeName: string
    isDefault: boolean
    author?: string
    description?: string
  }
}

// ⭐ 运行时主题对象
let GTRS: GTRSTheme | null = null

// ⭐ 全局图片资源缓存 Map，避免重复加载相同资源（跨游戏共享）
export const imageCache = new Map<string, HTMLImageElement | HTMLCanvasElement>()

/**
 * Hex 颜色字符串转数字
 * 📌 说明：所有游戏通用，直接复制
 */
export function hexToNumber(hex: string): number {
  if (!hex) return 0x000000
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0x000000
  const num = parseInt(clean, 16)
  return isNaN(num) ? 0x000000 : num
}

/**
 * ⭐ 将单个资源 src 路径归一化为根路径（/ 开头）
 * 📌 说明：所有游戏通用，直接复制
 */
function normalizeOneSrc(src: string): string {
  if (!src || typeof src !== 'string') return src

  // 完整 URL（http/https）：直接返回
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  // 已经是 / 开头：直接返回
  if (src.startsWith('/')) {
    if (src.startsWith('/public/')) return src.replace('/public/', '/')
    return src
  }

  // Vite 别名：@/xxx → /xxx
  if (src.startsWith('@/')) return src.replace(/^@\\/, '/')

  // 不带 / 前缀的相对路径 → 补充 / 前缀
  return '/' + src
}

/**
 * ⭐ 递归遍历 GTRS 对象，对所有 src 字段执行路径归一化
 * 📌 说明：所有游戏通用，直接复制
 */
export function normalizeSrcPaths(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeSrcPaths)
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (key === 'src' && typeof value === 'string') {
      result[key] = normalizeOneSrc(value)
    } else if (typeof value === 'object') {
      result[key] = normalizeSrcPaths(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * ⭐ 将后端主题 JSON 赋值给 GTRS（直接替换，不兜底合并）
 * 📌 说明：所有游戏通用，直接复制
 */
export function applyGTRS(theme: GTRSTheme): void {
  GTRS = normalizeSrcPaths(theme) as GTRSTheme
  console.log('[GTRS] ✅ 主题已加载:', GTRS.themeInfo?.themeName)
}

/**
 * ⭐ 断言 GTRS 已加载，否则抛出错误
 * 📌 说明：所有游戏通用，直接复制
 */
export function assertGTRS(): GTRSTheme {
  if (!GTRS) {
    throw new Error('[GTRS] 主题未加载！请先调用 loadTheme() 获取主题后再启动游戏。')
  }
  return GTRS
}

/**
 * ⭐ 加载主题并赋值 GTRS（含严格 GTRS 校验）
 * 📌 说明：所有游戏通用，直接复制
 * 
 * @param themeId 主题 ID
 * @returns 加载后的主题对象
 */
export async function loadTheme(themeId: string): Promise<GTRSTheme> {
  const themeStore = useThemeStore()
  let configJsonStr: string

  // ⭐ 优先复用 themeStore 已加载的 GTRS，避免重复请求
  if (themeStore.gtrsRawJson) {
    console.log('[ResourceLoader] ♻️ 复用 themeStore 已加载的 GTRS 主题')
    configJsonStr = themeStore.gtrsRawJson
  } else {
    // ⭐ gtrsRawJson 为空，从后端获取
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('[ResourceLoader] 用户未登录，无法加载主题。请先登录后再启动游戏。')
    }

    console.log('[ResourceLoader] 🔄 从后端加载 GTRS 主题')
    const response = await fetch(`http://localhost:8080/api/theme/download?id=${themeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      throw new Error(`[ResourceLoader] 主题加载失败：HTTP ${response.status}`)
    }

    const result = await response.json()
    if (result.code !== 200 || !result.data) {
      throw new Error(`[ResourceLoader] 主题加载失败：服务端 code=${result.code}, message=${result.message}`)
    }

    // ⭐ 提取 configJson（支持后端多种包装格式）
    const raw = result.data

    if (typeof raw === 'string') {
      configJsonStr = raw
    } else if (raw.configJson !== undefined) {
      configJsonStr = typeof raw.configJson === 'string'
        ? raw.configJson
        : JSON.stringify(raw.configJson)
    } else {
      configJsonStr = JSON.stringify(raw)
    }
  }

  // ⭐ GTRS 严格校验（无论从哪里获取都需要校验）
  const validationResult = validateGTRSTheme(configJsonStr)
  if (!validationResult.valid) {
    throw new Error(
      `[ResourceLoader] 主题 ${themeId} GTRS 校验失败，游戏无法启动：\n${validationResult.message}`
    )
  }

  // 校验通过，直接赋值（不兜底合并）
  const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
  applyGTRS(themeConfig)
  console.log(`[ResourceLoader] ✅ GTRS 主题已加载：${GTRS!.themeInfo?.themeName || '未命名'} (id=${themeId})`)
  
  return GTRS!  // 断言非空
}

/**
 * ⭐ 统计需要加载的资源数量
 * 📌 说明：所有游戏通用，直接复制
 */
export function countResourcesToLoad(): number {
  let count = 0
  const gtrs = assertGTRS() as any  // 类型断言，兼容旧代码
  const images = gtrs.resources?.images
  const audio = gtrs.resources?.audio

  // 统计 scene 图片
  if (images?.scene) {
    count += Object.keys(images.scene).length
  }

  // 统计音频（仅计 bgm + effect，不计 voice）
  if (audio?.bgm) {
    count += Object.keys(audio.bgm).length
  }
  if (audio?.effect) {
    count += Object.keys(audio.effect).length
  }

  console.log(`📊 待加载资源总数：${count}`)
  return count
}

/**
 * ⭐ 加载 GTRS resources.images.scene 中的全部图片
 * 📌 说明：所有游戏通用，直接复制
 * 
 * @param scene Phaser 场景对象
 */
export function loadGTRSImages(scene: Phaser.Scene): void {
  const gtrs = assertGTRS() as any  // 类型断言，兼容旧代码
  const sceneImages = gtrs.resources?.images?.scene
  if (!sceneImages) {
    console.warn('[ResourceLoader] ⚠️ resources.images.scene 不存在，跳过图片加载')
    return
  }

  for (const [key, resource] of Object.entries(sceneImages)) {
    const res = resource as any  // 类型断言，兼容旧代码
    if (res?.src) {
      // ⭐ 检查是否已在缓存中
      const cachedImage = imageCache.get(res.src)
      if (cachedImage) {
        // 已缓存：直接使用缓存的图片
        console.log(`[ResourceLoader] ♻️ 复用已缓存图片：${key} -> ${res.src}`)
        if (!scene.textures.exists(key)) {
          scene.textures.addImage(key, cachedImage as HTMLImageElement)
        }
      } else {
        // 未缓存：正常加载并保存到缓存
        scene.load.image(key, res.src)
        console.log(`[ResourceLoader] 📷 加载场景图片：${key} (${res.alias || key}) -> ${res.src}`)
            
        // 监听加载完成事件，保存到缓存
        scene.load.once(`filecomplete-image-${key}`, () => {
          const img = scene.textures.get(key).getSourceImage()
          // ⭐ 类型检查：只缓存 Image 或 Canvas 元素
          if (img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) {
            imageCache.set(res.src, img)
            console.log(`[ResourceLoader] 💾 已缓存图片：${res.src}`)
          }
        })
      }
    } else {
      console.warn(`[ResourceLoader] ⚠️ 场景图片 ${key} 无效（src 为空），跳过`)
    }
  }
}
