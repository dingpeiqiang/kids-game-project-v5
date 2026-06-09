export function circleHit(
  ax: number,
  az: number,
  ar: number,
  bx: number,
  bz: number,
  br: number,
): boolean {
  const dx = ax - bx
  const dz = az - bz
  const r = ar + br
  return dx * dx + dz * dz <= r * r
}

export function clampArena(x: number, z: number, halfW: number, halfZ: number): { x: number; z: number } {
  return {
    x: Math.max(-halfW, Math.min(halfW, x)),
    z: Math.max(-halfZ, Math.min(halfZ, z)),
  }
}