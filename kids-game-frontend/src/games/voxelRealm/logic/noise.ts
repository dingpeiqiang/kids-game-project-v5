/** 轻量可复现伪噪声（无外部依赖） */
export function hash2(seed: number, x: number, z: number): number {
  let h = seed ^ (x * 374761393) ^ (z * 668265263)
  h = (h ^ (h >>> 13)) * 1274126177
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

export function smoothNoise(seed: number, x: number, z: number): number {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const fx = x - x0
  const fz = z - z0
  const a = hash2(seed, x0, z0)
  const b = hash2(seed, x0 + 1, z0)
  const c = hash2(seed, x0, z0 + 1)
  const d = hash2(seed, x0 + 1, z0 + 1)
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz
}

export function fbm(seed: number, x: number, z: number, octaves = 4): number {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(seed + i * 101, x * freq, z * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}