import { GAME_CONFIG, LEVELS } from '../config'
import type { LevelDef, LevelRuntime, PlayMode } from '../types'

let nextEntityId = 1

function bumpId(): number {
  const id = nextEntityId
  nextEntityId += 1
  return id
}

export function resetEntityIds(): void {
  nextEntityId = 1
}

function scaleSegment(
  seg: LevelDef['segments'][0],
  mode: PlayMode,
): LevelDef['segments'][0] {
  const mul =
    mode === 'casual' ? GAME_CONFIG.casualTrackWidthMul : GAME_CONFIG.competeTrackWidthMul
  return { ...seg, halfW: seg.halfW * mul }
}

export function buildLevelRuntime(levelIndex: number, mode: PlayMode): LevelRuntime {
  const def = LEVELS[levelIndex]
  if (!def) throw new Error(`invalid level ${levelIndex}`)

  const barrierSpeedMul =
    mode === 'casual' ? GAME_CONFIG.casualBarrierSpeedMul : 1

  const finish = {
    ...def.finish,
    halfW: def.finish.halfW * (mode === 'casual' ? GAME_CONFIG.casualTrackWidthMul : 1),
  }

  return {
    theme: def.theme,
    segments: def.segments.map(s => scaleSegment(s, mode)),
    finish,
    stars: def.stars.map(s => ({
      id: bumpId(),
      x: s.x,
      z: s.z,
      hidden: s.hidden,
      collected: false,
    })),
    powerUps: def.powerUps.map(p => ({
      id: bumpId(),
      kind: p.kind,
      x: p.x,
      z: p.z,
      collected: false,
    })),
    barriers: def.barriers.map(b => ({
      id: bumpId(),
      ...b,
      speed: b.speed * barrierSpeedMul,
    })),
    slowZones: def.slowZones.map(z => ({
      id: bumpId(),
      ...z,
    })),
    bouncePads: def.bouncePads.map(p => ({
      id: bumpId(),
      ...p,
    })),
  }
}

export function getLevelDef(levelIndex: number): LevelDef {
  const def = LEVELS[levelIndex]
  if (!def) throw new Error(`invalid level ${levelIndex}`)
  return def
}

export function levelCount(): number {
  return LEVELS.length
}