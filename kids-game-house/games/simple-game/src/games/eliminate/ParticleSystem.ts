export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  type: 'normal' | 'sparkle' | 'ring' = 'normal' // 粒子类型
  
  constructor(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type: 'normal' | 'sparkle' | 'ring' = 'normal') {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.life = life
    this.color = color
    this.size = size
    this.type = type
  }
}

export class ParticleSystem {
  private particles: Particle[] = []
  
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= p.size > 10 ? 0.03 : 0.02 // 大光晕消失更快
      p.x += p.vx
      p.y += p.vy
      p.vy += p.size > 10 ? 0.05 : 0.2 // 重力效果
      p.vx *= 0.98 // 空气阻力
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      
      switch (p.type) {
        case 'sparkle':
          // 闪光粒子 - 星形效果
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(Date.now() * 0.01)
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
            const x = Math.cos(angle) * p.size * p.life
            const y = Math.sin(angle) * p.size * p.life
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
          ctx.restore()
          break
          
        case 'ring':
          // 环形粒子
          ctx.globalAlpha = p.life * 0.6
          ctx.strokeStyle = p.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.stroke()
          break
          
        default:
          // 普通粒子
          if (p.size > 10) {
            ctx.globalAlpha = p.life * 0.4
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
            ctx.fill()
          }
      }
      
      ctx.globalAlpha = 1
    })
  }
  
  createExplosion(x: number, y: number, color: string, intensity: number) {
    // 主爆炸粒子（更多数量）
    const particleCount = Math.min(12 + intensity * 3, 40)
    for (let j = 0; j < particleCount; j++) {
      const angle = (Math.PI * 2 * j) / particleCount
      const speed = 4 + Math.random() * 8
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        1,
        color,
        4 + Math.random() * 6,
        'normal'
      ))
    }
    
    // 闪光粒子效果
    for (let j = 0; j < 8; j++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 - 2,
        0.9,
        '#FFD93D',
        3 + Math.random() * 3,
        'sparkle'
      ))
    }
    
    // 小颗粒飞溅效果
    for (let j = 0; j < 12; j++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 15,
        y + (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15 - 3,
        0.8,
        '#FFF',
        2 + Math.random() * 3,
        'normal'
      ))
    }
    
    // 彩色光晕效果
    for (let j = 0; j < 8; j++) {
      this.particles.push(new Particle(
        x, y,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        0.6,
        color,
        20 + Math.random() * 15,
        'normal'
      ))
    }
    
    // 添加环形冲击波效果
    if (intensity >= 4) {
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI * 2 * j) / 6
        const speed = 8 + Math.random() * 4
        this.particles.push(new Particle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.7,
          '#FFD93D',
          8 + Math.random() * 4,
          'ring'
        ))
      }
    }
  }
  
  createFullScreenExplosion(width: number, height: number, colors: string[]) {
    for (let i = 0; i < 100; i++) {
      this.particles.push(new Particle(
        Math.random() * width,
        Math.random() * height,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        1,
        colors[Math.floor(Math.random() * colors.length)],
        5 + Math.random() * 8
      ))
    }
  }
  
  clear() {
    this.particles = []
  }
}
