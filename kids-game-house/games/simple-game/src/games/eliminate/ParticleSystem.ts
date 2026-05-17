export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  type: 0 | 1 | 2 = 0 // 0=normal, 1=sparkle, 2=ring - 使用数字代替字符串提升性能
  
  constructor(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type: 0 | 1 | 2 = 0) {
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
  private readonly MAX_PARTICLES = 100 // 进一步减少最大粒子数量
  private readonly SIN_CACHE: number[] = []
  private readonly COS_CACHE: number[] = []
  
  constructor() {
    // 预计算三角函数缓存
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180
      this.SIN_CACHE[i] = Math.sin(rad)
      this.COS_CACHE[i] = Math.cos(rad)
    }
  }
  
  update() {
    const particles = this.particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= p.size > 10 ? 0.03 : 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += p.size > 10 ? 0.05 : 0.2
      p.vx *= 0.98
      
      if (p.life <= 0) {
        particles[i] = particles[particles.length - 1]
        particles.pop()
      }
    }
    
    if (particles.length > this.MAX_PARTICLES) {
      particles.splice(0, particles.length - this.MAX_PARTICLES)
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    const particles = this.particles
    const len = particles.length
    for (let i = 0; i < len; i++) {
      const p = particles[i]
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      
      const type = p.type
      if (type === 1) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.beginPath()
        const lifeSize = p.size * p.life
        for (let j = 0; j < 5; j++) {
          const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2
          const x = Math.cos(angle) * lifeSize
          const y = Math.sin(angle) * lifeSize
          if (j === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else if (type === 2) {
        ctx.globalAlpha = p.life * 0.6
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        if (p.size > 10) {
          ctx.globalAlpha = p.life * 0.4
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }
  
  createExplosion(x: number, y: number, color: string, intensity: number) {
    const particleCount = Math.min(4 + intensity, 15)
    const particles = this.particles
    
    for (let j = 0; j < particleCount; j++) {
      const angle = (Math.PI * 2 * j) / particleCount
      const speed = 2 + Math.random() * 4
      particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.8,
        color,
        2 + Math.random() * 3,
        0
      ))
    }
    
    if (intensity >= 4) {
      for (let j = 0; j < 2; j++) {
        particles.push(new Particle(
          x + (Math.random() - 0.5) * 15,
          y + (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6 - 1.5,
          0.6,
          '#FFD93D',
          2 + Math.random() * 2,
          1
        ))
      }
    }
    
    for (let j = 0; j < 3; j++) {
      particles.push(new Particle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8 - 1,
        0.5,
        '#FFF',
        1.5 + Math.random() * 1.5,
        0
      ))
    }
    
    if (intensity >= 6) {
      for (let j = 0; j < 2; j++) {
        const angle = (Math.PI * 2 * j) / 3
        const speed = 4 + Math.random() * 2
        particles.push(new Particle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.5,
          '#FFD93D',
          4 + Math.random() * 2,
          2
        ))
      }
    }
  }
  
  createFullScreenExplosion(width: number, height: number, colors: string[]) {
    const particles = this.particles
    const colorCount = colors.length
    for (let i = 0; i < 25; i++) {
      particles.push(new Particle(
        Math.random() * width,
        Math.random() * height,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        0.6,
        colors[Math.floor(Math.random() * colorCount)],
        3 + Math.random() * 4,
        0
      ))
    }
  }
  
  clear() {
    this.particles = []
  }
}
