import type { Particle, FloatingText } from '../types'
import { generateId } from '../config'

export function createExplosion(x: number, y: number, color: string = '#FF6B6B', count: number = 20): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const speed = 2 + Math.random() * 4
    
    particles.push({
      id: generateId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: 3 + Math.random() * 5,
    })
  }
  
  return particles
}

export function createSunPickupEffect(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const speed = 3 + Math.random() * 2
    
    particles.push({
      id: generateId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: '#FFD700',
      life: 20 + Math.random() * 10,
      maxLife: 30,
      size: 4 + Math.random() * 4,
    })
  }
  
  return particles
}

export function createZombieDeathEffect(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  
  for (let i = 0; i < 25; i++) {
    const angle = (i / 25) * Math.PI * 2
    const speed = 1.5 + Math.random() * 3
    
    particles.push({
      id: generateId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      color: ['#8D6E63', '#795548', '#5D4037'][Math.floor(Math.random() * 3)],
      life: 25 + Math.random() * 15,
      maxLife: 40,
      size: 2 + Math.random() * 6,
    })
  }
  
  return particles
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15
    p.life--
    return p.life > 0
  })
}

export function createFloatingText(x: number, y: number, text: string, color: string = '#FFFFFF'): FloatingText {
  return {
    x,
    y,
    text,
    color,
    life: 60,
    dy: -1.5,
  }
}

export function updateFloatingTexts(texts: FloatingText[]): FloatingText[] {
  return texts.filter(t => {
    t.y += t.dy
    t.life--
    return t.life > 0
  })
}