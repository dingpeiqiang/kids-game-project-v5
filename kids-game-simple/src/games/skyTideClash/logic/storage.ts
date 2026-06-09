import { GAME_CONFIG } from '../config'
import type { PersistedStats } from '../types'

const DEFAULT: PersistedStats = {
  version: 1,
  bestScore: 0,
  bestClearMs: 0,
  maxCombo: 0,
  noDamageWins: 0,
  bossKills: 0,
}

export function loadStats(): PersistedStats {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.storageKey)
    if (!raw) return { ...DEFAULT }
    const data = JSON.parse(raw) as PersistedStats
    if (data.version !== 1) return { ...DEFAULT }
    return { ...DEFAULT, ...data }
  } catch {
    return { ...DEFAULT }
  }
}

export function mergeSessionIntoStats(
  prev: PersistedStats,
  session: {
    score: number
    clearMs: number
    maxCombo: number
    noDamageWin: boolean
    bossKills: number
  },
): PersistedStats {
  const next: PersistedStats = {
    version: 1,
    bestScore: Math.max(prev.bestScore, session.score),
    bestClearMs:
      session.clearMs > 0
        ? prev.bestClearMs === 0
          ? session.clearMs
          : Math.min(prev.bestClearMs, session.clearMs)
        : prev.bestClearMs,
    maxCombo: Math.max(prev.maxCombo, session.maxCombo),
    noDamageWins: prev.noDamageWins + (session.noDamageWin ? 1 : 0),
    bossKills: prev.bossKills + session.bossKills,
  }
  localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(next))
  return next
}