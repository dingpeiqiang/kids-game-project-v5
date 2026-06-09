import type { GameState, InputSnapshot } from '../types'
import { tickBallPhysics } from './physics'
import { applyLevelCompleteScore } from './state'
import { checkFinish, starRating, tickPickups } from './pickups'

export function tickGame(
  state: GameState,
  input: InputSnapshot,
  dt: number,
  timeSec: number,
): { completed: boolean; stars: 0 | 1 | 2 | 3 } | null {
  if (state.phase !== 'playing') return null

  state.elapsedMs += dt * 1000
  tickBallPhysics(state, input, dt, timeSec)

  if (state.phase !== 'playing') return null

  tickPickups(state)

  if (checkFinish(state)) {
    const stars = starRating(state.levelStarsCollected, state.levelStarTotal)
    applyLevelCompleteScore(state, stars)
    state.phase = 'levelComplete'
    return { completed: true, stars }
  }

  return null
}