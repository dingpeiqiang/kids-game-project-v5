/**
 * GTRS v1.0.0 主题加载（kids-game-simple）
 * 支持：本地默认主题 JSON、后端 config_json、TRS 旧格式自动迁移
 */

import type { GTRSTheme } from '../types/gtrs-theme'

export interface LoadThemeGTRSResult {
  success: boolean
  themeId: string | null
  themeName?: string
  theme?: GTRSTheme
  errors?: string[]
}

const DEFAULT_SPEC_VERSION = '1.0.0'

/** 内存缓存：gameId → 已解析 GTRS */
const themeCache = new Map<string, GTRSTheme>()

function isGTRSFormat(json: unknown): json is GTRSTheme {
  if (!json || typeof json !== 'object') return false
  const o = json as Record<string, unknown>
  const spec = o.specMeta as Record<string, unknown> | undefined
  return spec?.specName === 'GTRS'
}

/** TRS / 旧版扁平资源 → GTRS v1.0.0（最小映射） */
export function migrateTRSOrLegacyToGTRS(
  legacy: Record<string, unknown>,
  gameId: string,
  themeName = '默认主题'
): GTRSTheme {
  const images = (legacy.images as Record<string, unknown>) ?? {}
  const audio = (legacy.audio as Record<string, unknown>) ?? {}
  const style = (legacy.globalStyle as Record<string, unknown>) ?? legacy.style ?? {}

  const toImageMap = (src: unknown): GTRSTheme['resources']['images']['scene'] => {
    if (!src || typeof src !== 'object') return {}
    const out: GTRSTheme['resources']['images']['scene'] = {}
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (typeof v === 'string') {
        out[k] = { src: v, type: 'png', alias: k }
      } else if (v && typeof v === 'object' && 'src' in (v as object)) {
        const r = v as { src: string; type?: string; alias?: string }
        out[k] = {
          src: r.src,
          type: (r.type as 'png') ?? 'png',
          alias: r.alias ?? k,
        }
      }
    }
    return out
  }

  return {
    specMeta: {
      specName: 'GTRS',
      specVersion: DEFAULT_SPEC_VERSION,
      compatibleVersion: DEFAULT_SPEC_VERSION,
    },
    themeInfo: {
      themeId: `${gameId}_theme_default`,
      ownerType: 'GAME',
      ownerId: 0,
      themeName,
      isDefault: true,
      gameId,
    },
    globalStyle: {
      primaryColor: (style.primaryColor as string) ?? '#4CAF50',
      bgColor: (style.bgColor as string) ?? (style.backgroundColor as string) ?? '#1a1a2e',
      textColor: (style.textColor as string) ?? '#ffffff',
      fontFamily: (style.fontFamily as string) ?? 'Arial, sans-serif',
    },
    resources: {
      images: {
        login: toImageMap(images.login),
        scene: toImageMap(images.scene ?? images),
        ui: toImageMap(images.ui),
        icon: toImageMap(images.icon),
        effect: toImageMap(images.effect ?? images.effects),
      },
      audio: {
        bgm: {},
        effect: {},
        voice: {},
      },
      video: {},
    },
  }
}

function buildDefaultGTRS(gameId: string): GTRSTheme {
  return migrateTRSOrLegacyToGTRS({}, gameId, `${gameId} 默认主题`)
}

function parseThemeJson(raw: string): GTRSTheme | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isGTRSFormat(parsed)) return parsed
    if (parsed && typeof parsed === 'object') {
      const gameId =
        (parsed as { gameId?: string }).gameId ??
        (parsed as { specMeta?: { gameId?: string } }).specMeta?.gameId ??
        'unknown'
      return migrateTRSOrLegacyToGTRS(parsed as Record<string, unknown>, gameId)
    }
  } catch {
    return null
  }
  return null
}

async function fetchThemeFromApi(gameId: string, themeId?: string): Promise<GTRSTheme | null> {
  try {
    const base = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8080/api'
    const path = themeId
      ? `/theme/${encodeURIComponent(themeId)}`
      : `/theme/default?gameId=${encodeURIComponent(gameId)}`
    const { tokenStore } = await import('./apiClient')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = tokenStore.getAccess()
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${base}${path}`, { headers })
    if (!res.ok) return null
    const json = (await res.json()) as { code?: number; data?: { configJson?: string; config_json?: string } }
    const data = json.data ?? (json as { configJson?: string; config_json?: string })
    const raw = data?.configJson ?? data?.config_json
    if (!raw) return null
    return parseThemeJson(typeof raw === 'string' ? raw : JSON.stringify(raw))
  } catch {
    return null
  }
}

async function fetchLocalDefault(gameId: string): Promise<GTRSTheme | null> {
  const urls = [
    `/themes/${gameId}/gtrs.json`,
    `/resources/${gameId}/GTRS.json`,
    `/gtrs/${gameId}.json`,
  ]
  for (const url of urls) {
    try {
      const r = await fetch(url)
      if (!r.ok) continue
      const text = await r.text()
      const theme = parseThemeJson(text)
      if (theme) return theme
    } catch {
      /* try next */
    }
  }
  return null
}

/**
 * 加载游戏 GTRS 主题（API → 静态 JSON → 内置默认）
 */
export async function loadThemeGTRS(
  gameId: string,
  themeId?: string
): Promise<LoadThemeGTRSResult> {
  const cached = themeCache.get(gameId)
  if (cached && !themeId) {
    return {
      success: true,
      themeId: cached.themeInfo?.themeId ?? null,
      themeName: cached.themeInfo?.themeName,
      theme: cached,
    }
  }

  let theme =
    (await fetchThemeFromApi(gameId, themeId)) ??
    (await fetchLocalDefault(gameId)) ??
    buildDefaultGTRS(gameId)

  themeCache.set(gameId, theme)

  return {
    success: true,
    themeId: theme.themeInfo?.themeId ?? themeId ?? null,
    themeName: theme.themeInfo?.themeName,
    theme,
  }
}

export function getCachedGTRSTheme(gameId: string): GTRSTheme | undefined {
  return themeCache.get(gameId)
}

export function resolveGTRSResourceUrl(
  gameId: string,
  category: keyof GTRSTheme['resources']['images'],
  name: string
): string | null {
  const theme = themeCache.get(gameId)
  const res = theme?.resources?.images?.[category]?.[name]
  return res?.src ?? null
}