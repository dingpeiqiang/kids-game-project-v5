import type { Particle } from '../types'

let particleIdCounter = 0

export function createParticles(x: number, y: number, z: number, color: number, count: number, type: Particle['type']): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const speed = 0.5 + Math.random() * 0.5
    const life = 500 + Math.random() * 500
    
    particles.push({
      id: `particle_${++particleIdCounter}`,
      x,
      y: type === 'explosion' ? 0.5 + Math.random() * 0.3 : y,
      z,
      vx: Math.cos(angle) * speed * 0.01,
      vy: type === 'explosion' ? 0.02 + Math.random() * 0.02 : 0,
      vz: Math.sin(angle) * speed * 0.01,
      color,
      life,
      maxLife: life,
      size: 0.1 + Math.random() * 0.1,
      type
    })
  }
  
  return particles
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles.filter(p => {
    p.life -= deltaTime
    
    if (p.life <= 0) {
      return false
    }
    
    p.x += p.vx * deltaTime
    p.y += p.vy * deltaTime
    p.z += p.vz * deltaTime
    
    if (p.type === 'explosion') {
      p.vy -= 0.001 * deltaTime
    }
    
    return true
  })
}

export function createHitEffect(x: number, y: number, z: number, color: number): Particle[] {
  return createParticles(x, y, z, color, 8, 'normal')
}

export function createExplosion(x: number, z: number, color: number): Particle[] {
  return createParticles(x, 0.1, z, color, 12, 'explosion')
}

export function createSlowEffect(x: number, y: number, z: number): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < 6; i++) {
    particles.push({
      id: `particle_${++particleIdCounter}`,
      x: x + (Math.random() - 0.5) * 0.4,
      y: y + Math.random() * 0.2,
      z: z + (Math.random() - 0.5) * 0.4,
      vx: (Math.random() - 0.5) * 0.005,
      vy: 0.002,
      vz: (Math.random() - 0.5) * 0.005,
      color: 0x44aaff,
      life: 2000,
      maxLife: 2000,
      size: 0.15,
      type: 'slow'
    })
  }
  
  return particles
}