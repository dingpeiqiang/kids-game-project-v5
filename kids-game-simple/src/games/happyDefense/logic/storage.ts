import type { RunRecords } from '../types'

const STORAGE_KEY = 'happyDefense_records_v1'

const DEFAULT: RunRecords = {
  bestScore: 0,
  fastestClearSec: 0,
  perfectClears: 0,
}

export function loadRecords(): RunRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<RunRecords>
    return {
      bestScore: parsed.bestScore ?? 0,
      fastestClearSec: parsed.fastestClearSec ?? 0,
      perfectClears: parsed.perfectClears ?? 0,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveRecords(records: RunRecords): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* ignore */
  }
}