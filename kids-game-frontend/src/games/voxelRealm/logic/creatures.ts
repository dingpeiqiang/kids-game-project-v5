import { GAME_CONFIG } from '../config'
import type { BiomeId, CreatureState } from '../types'
import { hash2 } from './noise'

let nextId = 1

export function spawnCreatures(biome: BiomeId, seed: number, count: number): CreatureState[] {
  const out: CreatureState[] = []
  const kinds: CreatureState['kind'][] =
    biome === 'forest'
      ? ['deer', 'bunny', 'bird']
      : biome === 'plains'
        ? ['bunny', 'bird']
        : biome === 'snow'
          ? ['bird']
          : ['deer', 'bird', 'fish']

  for (let i = 0; i < count && out.length < GAME_CONFIG.creatureCap; i++) {
    const k = kinds[i % kinds.length]!
    const x = 4 + hash2(seed, i, 1) * (GAME_CONFIG.worldSizeX - 8)
    const z = 4 + hash2(seed, i, 2) * (GAME_CONFIG.worldSizeZ - 8)
    const y = k === 'bird' ? 12 + hash2(seed, i, 3) * 8 : k === 'fish' ? 2 : 8
    out.push({
      id: nextId++,
      kind: k,
      x,
      y,
      z,
      dir: hash2(seed, i, 4) * Math.PI * 2,
      timer: 0,
    })
  }
  return out
}

export function updateCreatures(creatures: CreatureState[], dt: number, playerX: number, playerZ: number): void {
  for (const c of creatures) {
    c.timer += dt
    if (c.timer > 2 + (c.id % 3)) {
      c.dir += (hash2(c.id, Math.floor(c.timer), 0) - 0.5) * 1.2
      c.timer = 0
    }
    const speed = c.kind === 'bird' ? 3.5 : c.kind === 'fish' ? 1.2 : 1.8
    c.x += Math.cos(c.dir) * speed * dt
    c.z += Math.sin(c.dir) * speed * dt

    const dx = c.x - playerX
    const dz = c.z - playerZ
    const dist = Math.hypot(dx, dz)
    if (dist < 2.5 && dist > 0.01) {
      c.x += (dx / dist) * dt * 2
      c.z += (dz / dist) * dt * 2
    }

    c.x = Math.max(2, Math.min(GAME_CONFIG.worldSizeX - 2, c.x))
    c.z = Math.max(2, Math.min(GAME_CONFIG.worldSizeZ - 2, c.z))
    if (c.kind === 'bird') {
      c.y = 14 + Math.sin(performance.now() * 0.001 + c.id) * 2
    }
  }
}