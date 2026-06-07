import type { Particle, Shockwave, FloatText, ScreenShake } from '../types'
import * as C from '../config'

// ============ 粒子系统 ============
export function createHitParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 300 + Math.random() * 200,
      maxLife: 500,
      color,
      size: 2 + Math.random() * 4,
      shape: Math.random() > 0.5 ? 'spark' : 'circle',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    })
  }
  return particles
}

export function createFloatText(x: number, y: number, text: string, color: string, type: FloatText['type'] = 'damage'): FloatText {
  return {
    text,
    x,
    y,
    life: 800,
    maxLife: 800,
    color,
    size: type === 'combo' ? 24 : 16,
    vy: -2,
    type,
  }
}

export function createShockwave(x: number, y: number, color: string): Shockwave {
  return {
    x, y,
    radius: 5,
    maxRadius: 40,
    life: 300,
    color,
  }
}

export function createSkillEffect(x: number, y: number, color: string, size: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const speed = 2 + Math.random() * 2
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400,
      maxLife: 400,
      color,
      size: 3 + Math.random() * 3,
      shape: 'star',
      rotation: 0,
      rotationSpeed: 5,
    })
  }
  return particles
}

export function createLevelUpParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 600 + Math.random() * 400,
      maxLife: 1000,
      color: '#FFD700',
      size: 3 + Math.random() * 4,
      shape: 'star',
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
    })
  }
  return particles
}

// ============ 更新函数 ============
export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.05,
      life: p.life - dt,
      rotation: p.rotation !== undefined ? p.rotation + (p.rotationSpeed || 0) : p.rotation,
    }))
    .filter(p => p.life > 0)
}

export function updateShockwaves(shockwaves: Shockwave[], dt: number): Shockwave[] {
  return shockwaves
    .map(s => ({
      ...s,
      radius: s.radius + 2,
      life: s.life - dt,
    }))
    .filter(s => s.life > 0)
}

export function updateFloatTexts(floatTexts: FloatText[], dt: number): FloatText[] {
  return floatTexts
    .map(f => ({
      ...f,
      y: f.y + f.vy,
      life: f.life - dt,
    }))
    .filter(f => f.life > 0)
}

export function updateDrops(drops: import('../types').DropItem[], dt: number): import('../types').DropItem[] {
  return drops
    .map(d => ({
      ...d,
      x: d.x, // 不掉出平台
      vy: Math.min(d.vy + C.GRAVITY, 3),
      y: d.y + d.vy,
      life: d.life - dt,
    }))
    .map(d => {
      // 掉到地面
      if (d.y >= C.GROUND_Y - d.height) {
        return { ...d, y: C.GROUND_Y - d.height, vy: 0 }
      }
      return d
    })
    .filter(d => d.life > 0)
}

// ============ 屏幕震动 ============
export function createScreenShake(amount: number = 5, duration: number = 200): ScreenShake {
  return { amount, duration }
}

export function updateScreenShake(shake: ScreenShake | null, dt: number): ScreenShake | null {
  if (!shake) return null
  return {
    ...shake,
    duration: shake.duration - dt,
  }
}

// 获取屏幕震动偏移
export function getShakeOffset(shake: ScreenShake | null): { x: number; y: number } {
  if (!shake || shake.duration <= 0) return { x: 0, y: 0 }
  return {
    x: (Math.random() - 0.5) * 2 * shake.amount,
    y: (Math.random() - 0.5) * 2 * shake.amount,
  }
}