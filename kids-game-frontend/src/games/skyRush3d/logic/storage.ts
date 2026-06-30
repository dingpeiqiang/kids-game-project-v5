import { STORAGE_KEY } from '../config'
import type { RunStats } from '../types'

const DEFAULT_STATS: RunStats = {
  bestScore: 0,
  bestClearMs: 0,
  maxCombo: 0,
  flawlessClears: 0,
  bossKills: 0,
}

export function loadRunStats(): RunStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    const parsed = JSON.parse(raw) as Partial<RunStats>
    return {
      bestScore: parsed.bestScore ?? 0,
      bestClearMs: parsed.bestClearMs ?? 0,
      maxCombo: parsed.maxCombo ?? 0,
      flawlessClears: parsed.flawlessClears ?? 0,
      bossKills: parsed.bossKills ?? 0,
    }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveRunStats(stats: RunStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    /* ignore quota */
  }
}

export function mergeRunStats(prev: RunStats, run: {
  score: number
  clearMs: number
  maxCombo: number
  flawless: boolean
  bossKill: boolean
}): RunStats {
  const next: RunStats = {
    bestScore: Math.max(prev.bestScore, run.score),
    maxCombo: Math.max(prev.maxCombo, run.maxCombo),
    bossKills: prev.bossKills + (run.bossKill ? 1 : 0),
    flawlessClears: prev.flawlessClears + (run.flawless ? 1 : 0),
    bestClearMs:
      run.clearMs > 0 && (prev.bestClearMs === 0 || run.clearMs < prev.bestClearMs)
        ? run.clearMs
        : prev.bestClearMs,
  }
  saveRunStats(next)
  return next
}