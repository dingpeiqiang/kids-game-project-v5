import { STORAGE_KEY } from '../config'
import type { RunStats } from '../types'

const DEFAULT: RunStats = {
  bestTotalStars: 0,
  levelBestMs: {},
  levelBestStars: {},
  perfectClears: 0,
  totalClears: 0,
  unlockedSkin: 0,
}

function sumLevelStars(levelBestStars: Record<number, number>): number {
  return Object.values(levelBestStars).reduce((a, b) => a + b, 0)
}

export function loadRunStats(): RunStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT, levelBestMs: {}, levelBestStars: {} }
    const p = JSON.parse(raw) as Partial<RunStats>
    const levelBestStars = { ...(p.levelBestStars ?? {}) }
    return {
      bestTotalStars: p.bestTotalStars ?? sumLevelStars(levelBestStars),
      levelBestMs: { ...(p.levelBestMs ?? {}) },
      levelBestStars,
      perfectClears: p.perfectClears ?? 0,
      totalClears: p.totalClears ?? 0,
      unlockedSkin: p.unlockedSkin ?? 0,
    }
  } catch {
    return { ...DEFAULT, levelBestMs: {}, levelBestStars: {} }
  }
}

export function saveRunStats(stats: RunStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    /* quota */
  }
}

export function mergeAfterLevel(
  prev: RunStats,
  run: {
    levelId: number
    clearMs: number
    starsCollected: number
    starRating: number
    flawless: boolean
  },
): RunStats {
  const levelBestMs = { ...prev.levelBestMs }
  if (run.clearMs > 0) {
    const old = levelBestMs[run.levelId]
    if (old == null || run.clearMs < old) levelBestMs[run.levelId] = run.clearMs
  }

  const levelBestStars = { ...prev.levelBestStars }
  const prevStars = levelBestStars[run.levelId] ?? 0
  levelBestStars[run.levelId] = Math.max(prevStars, run.starsCollected)

  const bestTotalStars = sumLevelStars(levelBestStars)
  let unlockedSkin = 0
  if (bestTotalStars >= 4) unlockedSkin = 1
  if (bestTotalStars >= 8) unlockedSkin = 2
  if (bestTotalStars >= 12) unlockedSkin = 3
  if (bestTotalStars >= 16) unlockedSkin = 4
  if (bestTotalStars >= 20) unlockedSkin = 5
  unlockedSkin = Math.max(prev.unlockedSkin, unlockedSkin)

  const next: RunStats = {
    bestTotalStars,
    levelBestMs,
    levelBestStars,
    perfectClears: prev.perfectClears + (run.flawless ? 1 : 0),
    totalClears: prev.totalClears + 1,
    unlockedSkin,
  }
  saveRunStats(next)
  return next
}