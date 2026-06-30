import { GAME_CONFIG } from '../config'

export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

export function circleHit(
  ax: number,
  az: number,
  ar: number,
  bx: number,
  bz: number,
  br: number,
): boolean {
  const r = ar + br
  return dist2(ax, az, bx, bz) <= r * r
}

export function segmentArenaExit(x: number, z: number): boolean {
  return (
    x < -GAME_CONFIG.arenaHalfW - 1 ||
    x > GAME_CONFIG.arenaHalfW + 1 ||
    z < -GAME_CONFIG.arenaHalfD - 2 ||
    z > GAME_CONFIG.arenaHalfD + 2
  )
}