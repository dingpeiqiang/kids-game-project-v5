/**
 * 游戏 ↔ GTRS 主题桥接（启动时由 gameRegistry.initGame 调用）
 * 完整加载链：themeService → gtrsThemeLoader → GTRSThemeApplier（逐步接入各游戏）
 */

export interface PreparedGameTheme {
  gameId: string
  themeId: string | null
  loaded: boolean
}

const ACTIVE_THEME_KEY = 'kidgame_selected_theme_id'

let lastPrepared: PreparedGameTheme | null = null

export function getSelectedThemeId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_THEME_KEY)
  } catch {
    return null
  }
}

export function setSelectedThemeId(themeId: string | null): void {
  try {
    if (themeId) localStorage.setItem(ACTIVE_THEME_KEY, themeId)
    else localStorage.removeItem(ACTIVE_THEME_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * 进入游戏前加载 GTRS 主题（失败不阻断游戏）
 */
export async function prepareGameTheme(gameId: string, themeId?: string | null): Promise<PreparedGameTheme> {
  const resolvedThemeId = themeId ?? getSelectedThemeId()

  try {
    const { loadThemeGTRS } = await import('../services/gtrsThemeLoader')
    const result = await loadThemeGTRS(gameId, resolvedThemeId ?? undefined)
    if (result.success) {
      const { applyCachedThemeToDocument } = await import('../utils/GTRSThemeApplier')
      applyCachedThemeToDocument(gameId)
    }
    lastPrepared = {
      gameId,
      themeId: result.themeId ?? resolvedThemeId,
      loaded: result.success,
    }
    return lastPrepared
  } catch (err) {
    console.warn('[gameThemeBridge] gtrsThemeLoader unavailable, skip theme prep', err)
    lastPrepared = { gameId, themeId: resolvedThemeId, loaded: false }
    return lastPrepared
  }
}

export function getLastPreparedTheme(): PreparedGameTheme | null {
  return lastPrepared
}

/** Phaser 纹理 key：gtrs_{gameId}_{category}_{name} */
export function getPhaserTextureKey(gameId: string, category: string, name: string): string {
  return `gtrs_${gameId}_${category}_${name}`
}