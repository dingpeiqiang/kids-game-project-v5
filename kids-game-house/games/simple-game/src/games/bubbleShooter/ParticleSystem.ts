import { Particle } from './types'

export class ParticleSystem {
  private particles: Particle[] = []

  // 添加单个粒子
  addParticle(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life,
      color,
      size
    })
  }

  // 添加爆炸粒子效果
  addExplosion(x: number, y: number, color: string, count: number = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 3 + Math.random() * 5
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 3 + Math.random() * 4
      })
    }
  }

  // 添加火花粒子效果
  addSparkle(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 0.8 + Math.random() * 0.2,
        color,
        size: 2 + Math.random() * 3
      })
    }
  }

  // 添加轨迹粒子
  addTrail(x: number, y: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 0.5,
      color,
      size: 2
    })
  }

  // 更新所有粒子
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15 // 重力
      p.vx *= 0.98 // 空气阻力

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  // 获取所有粒子
  getParticles(): Particle[] {
    return this.particles
  }

  // 清除所有粒子
  clear() {
    this.particles = []
  }
}
