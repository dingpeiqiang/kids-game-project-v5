import type { Particle } from './types'
import { W, H, HUD_H } from './config'

export function createParticles(x: number, y: number, color: string, count: number, spread = 3, type: 'normal' | 'explosion' | 'spark' = 'normal'): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread * 2,
      vy: (Math.random() - 0.5) * spread * 2,
      color,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: 2 + Math.random() * 3,
      type,
    })
  }
  return particles
}

export function updateParticle(particle: Particle): boolean {
  particle.x += particle.vx
  particle.y += particle.vy
  particle.vx *= 0.96
  particle.vy *= 0.96
  particle.life--

  if (particle.life <= 0 || particle.x < -50 || particle.x > W + 50 || particle.y < HUD_H - 50 || particle.y > H + 50) {
    return false
  }
  return true
}
