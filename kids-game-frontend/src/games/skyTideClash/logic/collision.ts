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

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}