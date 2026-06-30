import type { LevelRecords } from '../types'

const STORAGE_KEY = 'plantZombieDefense_records_v1'

const DEFAULT: LevelRecords = {
  bestScore: 0,
  starsByLevel: {},
  unlockedLevel: 1,
}

export function loadRecords(): LevelRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT, starsByLevel: {} }
    const parsed = JSON.parse(raw) as Partial<LevelRecords>
    return {
      bestScore: parsed.bestScore ?? 0,
      starsByLevel: parsed.starsByLevel ?? {},
      unlockedLevel: Math.max(1, parsed.unlockedLevel ?? 1),
    }
  } catch {
    return { ...DEFAULT, starsByLevel: {} }
  }
}

export function saveRecords(records: LevelRecords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* ignore */
  }
}