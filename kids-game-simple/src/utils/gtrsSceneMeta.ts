import type { GTRSTheme } from '../types/gtrs-theme'

/** 从 GTRS scene 读取颜色 / rgba 元数据（非图片 URL） */
export function readGtrsSceneMeta(theme: GTRSTheme | undefined, key: string): string | undefined {
  const raw = theme?.resources?.images?.scene?.[key]
  if (!raw || typeof raw !== 'object' || !('src' in raw)) return undefined
  const src = String(raw.src)
  if (src.startsWith('[')) return undefined
  if (/\.(png|jpg|jpeg|webp|gif|svg|mp3)$/i.test(src)) return undefined
  if (src.startsWith('#') || src.startsWith('rgb')) return src
  return undefined
}

/** 从 GTRS scene 读取 JSON 字符串数组（如色板） */
export function readGtrsSceneList(theme: GTRSTheme | undefined, key: string): string[] | undefined {
  const raw = theme?.resources?.images?.scene?.[key]
  if (!raw || typeof raw !== 'object' || !('src' in raw)) return undefined
  const src = String(raw.src)
  if (!src.startsWith('[')) return undefined
  try {
    const arr = JSON.parse(src) as unknown
    if (Array.isArray(arr) && arr.every(x => typeof x === 'string')) return arr as string[]
  } catch {
    /* ignore */
  }
  return undefined
}