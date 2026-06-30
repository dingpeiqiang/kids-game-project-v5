import type { RunRecords } from '../types'

const KEY = 'skyFrenzy_records_v1'

const DEFAULT: RunRecords = {
  bestScore: 0,
  fastestClearSec: 999999,
  bestCombo: 0,
  flawlessClears: 0,
  bossKills: 0,
}

export function loadRecords(): RunRecords {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<RunRecords>
    return {
      bestScore: parsed.bestScore ?? 0,
      fastestClearSec: parsed.fastestClearSec ?? 999999,
      bestCombo: parsed.bestCombo ?? 0,
      flawlessClears: parsed.flawlessClears ?? 0,
      bossKills: parsed.bossKills ?? 0,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveRecords(records: RunRecords): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    /* ignore */
  }
}

export function mergeRecords(state: {
  score: number
  combo: number
  records: RunRecords
  flawless: boolean
  phase: string
  elapsedSec: number
  bossKilledThisRun: boolean
}): void {
  const r = state.records
  if (state.score > r.bestScore) r.bestScore = state.score
  if (state.combo > r.bestCombo) r.bestCombo = state.combo
  if (state.phase === 'victory' && state.elapsedSec < r.fastestClearSec) {
    r.fastestClearSec = state.elapsedSec
  }
  if (state.phase === 'victory' && state.flawless) r.flawlessClears += 1
  if (state.bossKilledThisRun) r.bossKills += 1
  saveRecords(r)
}