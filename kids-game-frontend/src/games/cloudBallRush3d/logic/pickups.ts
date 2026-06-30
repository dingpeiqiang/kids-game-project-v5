import { GAME_CONFIG } from '../config'
import type { GameState } from '../types'

const PICK_RADIUS = 0.85

export function tickPickups(state: GameState): void {
  const { ball, level } = state
  const r = GAME_CONFIG.ballRadius

  for (const star of level.stars) {
    if (star.collected) continue
    const d = Math.hypot(ball.x - star.x, ball.z - star.z)
    if (d <= PICK_RADIUS + r) {
      star.collected = true
      state.levelStarsCollected += 1
      const pts = star.hidden ? GAME_CONFIG.hiddenStarScore : GAME_CONFIG.starScore
      state.sessionScore += pts
    }
  }

  for (const pu of level.powerUps) {
    if (pu.collected) continue
    const d = Math.hypot(ball.x - pu.x, ball.z - pu.z)
    if (d <= PICK_RADIUS + r) {
      pu.collected = true
      const dur = GAME_CONFIG.powerUpDuration[pu.kind]
      if (pu.kind === 'shield') ball.shieldT = dur
      if (pu.kind === 'speed') ball.speedBoostT = dur
      if (pu.kind === 'guide') ball.guideT = dur
      state.sessionScore += 80
    }
  }
}

export function checkFinish(state: GameState): boolean {
  const { ball, level } = state
  const f = level.finish
  return (
    Math.abs(ball.x - f.x) <= f.halfW &&
    Math.abs(ball.z - f.z) <= f.halfD &&
    ball.onGround
  )
}

export function starRating(collected: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0) return 3
  const ratio = collected / total
  if (ratio >= GAME_CONFIG.threeStarRatio) return 3
  if (ratio >= GAME_CONFIG.twoStarRatio) return 2
  if (collected > 0) return 1
  return 0
}