import { GAME_CONFIG } from '../config'
import { buildLevelRuntime, getLevelDef, resetEntityIds } from './levelRuntime'
import type { BallState, GameState, PlayMode, Vec2 } from '../types'

function buildGuideRoute(levelIndex: number): Vec2[] {
  const def = getLevelDef(levelIndex)
  const pts: Vec2[] = [{ x: def.spawn.x, z: def.spawn.z }]
  for (const s of def.segments) {
    pts.push({ x: s.x, z: s.z })
  }
  pts.push({ x: def.finish.x, z: def.finish.z })
  return pts
}

function spawnBall(levelIndex: number): BallState {
  const spawn = getLevelDef(levelIndex).spawn
  return {
    x: spawn.x,
    y: 2,
    z: spawn.z,
    vx: 0,
    vz: 0,
    vy: 0,
    onGround: false,
    shieldT: 0,
    speedBoostT: 0,
    guideT: 0,
  }
}

export function createInitialState(mode: PlayMode, levelIndex = 0): GameState {
  resetEntityIds()
  const level = buildLevelRuntime(levelIndex, mode)
  return {
    phase: 'playing',
    mode,
    levelIndex,
    level,
    ball: spawnBall(levelIndex),
    elapsedMs: 0,
    falls: 0,
    sessionScore: 0,
    levelStarsCollected: 0,
    levelStarTotal: level.stars.length,
    flawlessRun: true,
    guideRoute: buildGuideRoute(levelIndex),
  }
}

export function resetLevel(
  state: GameState,
  levelIndex?: number,
  opts?: { keepSessionScore?: boolean },
): void {
  resetEntityIds()
  const idx = levelIndex ?? state.levelIndex
  const keepScore = opts?.keepSessionScore ?? false
  state.levelIndex = idx
  state.level = buildLevelRuntime(idx, state.mode)
  state.ball = spawnBall(idx)
  state.elapsedMs = 0
  state.falls = 0
  state.levelStarsCollected = 0
  state.levelStarTotal = state.level.stars.length
  state.flawlessRun = true
  state.guideRoute = buildGuideRoute(idx)
  state.phase = 'playing'
  if (!keepScore) state.sessionScore = 0
}

export function respawnAfterFall(state: GameState): void {
  const spawn = getLevelDef(state.levelIndex).spawn
  state.ball = {
    ...state.ball,
    x: spawn.x,
    y: 2,
    z: spawn.z,
    vx: 0,
    vz: 0,
    vy: 0,
    onGround: false,
  }
  state.phase = 'playing'
}

export function applyLevelCompleteScore(state: GameState, stars: 0 | 1 | 2 | 3): number {
  let bonus = GAME_CONFIG.levelCompleteBonus
  bonus += stars * 300
  if (state.flawlessRun && state.falls === 0) bonus += 400
  state.sessionScore += bonus
  return bonus
}