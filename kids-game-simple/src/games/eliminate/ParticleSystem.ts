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
  private readonly MAX_PARTICLES = 80 // ⭐ 性能优化：进一步减少最大粒子数量
  private readonly SIN_CACHE: number[] = []
  private readonly COS_CACHE: number[] = []

  // 优化：预分配粒子对象池，避免运行时分配
  private particlePool: Particle[] = []
  private readonly POOL_SIZE = 120 // ⭐ 性能优化：减少对象池大小

  constructor() {
    // 预计算三角函数缓存
    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180
      this.SIN_CACHE[i] = Math.sin(rad)
      this.COS_CACHE[i] = Math.cos(rad)
    }

    // 预创建粒子对象池
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.particlePool.push(new Particle(0, 0, 0, 0, 0, '#fff', 1, 0))
    }
  }

  // 从对象池获取粒子
  private acquireParticle(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type: 0 | 1 | 2): Particle | null {
    if (this.particlePool.length > 0) {
      const p = this.particlePool.pop()!
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.color = color; p.size = size; p.type = type
      return p
    }
    // 池空时直接创建（不应经常发生）
    return new Particle(x, y, vx, vy, life, color, size, type)
  }

  // 归还粒子到池
  private releaseParticle(p: Particle) {
    if (this.particlePool.length < this.POOL_SIZE) {
      this.particlePool.push(p)
    }
  }

  update() {
    const particles = this.particles
    if (particles.length === 0) return  // 优化：空时直接返回

    let write = 0  // 优化：用写指针代替 splice
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.life -= p.size > 10 ? 0.03 : 0.02
      p.x += p.vx
      p.y += p.vy
      p.vy += p.size > 10 ? 0.05 : 0.2
      p.vx *= 0.98

      if (p.life <= 0) {
        this.releaseParticle(p)  // 归还池
      } else {
        particles[write++] = p  // 就地保留
      }
    }
    particles.length = write  // 直接截断

    // 预防性检查（替代事后处理）
    if (particles.length > this.MAX_PARTICLES) {
      const excess = particles.splice(0, particles.length - this.MAX_PARTICLES)
      excess.forEach(p => this.releaseParticle(p))
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
    const particleCount = Math.min(3 + intensity, 10) // ⭐ 性能优化：减少粒子数量
    const particles = this.particles

    for (let j = 0; j < particleCount; j++) {
      const angle = (Math.PI * 2 * j) / particleCount
      const speed = 2 + Math.random() * 3 // ⭐ 降低速度范围
      const p = this.acquireParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.7, // ⭐ 缩短生命周期
        color,
        1.5 + Math.random() * 2, // ⭐ 减小粒子大小
        0
      )
      if (p) particles.push(p)
    }

    if (intensity >= 4) {
      for (let j = 0; j < 1; j++) { // ⭐ 从2降到1
        const p = this.acquireParticle(
          x + (Math.random() - 0.5) * 10, // ⭐ 减小偏移范围
          y + (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 4, // ⭐ 减小速度
          (Math.random() - 0.5) * 4 - 1,
          0.5, // ⭐ 缩短生命周期
          '#FFD93D',
          1.5 + Math.random() * 1.5, // ⭐ 减小大小
          1
        )
        if (p) particles.push(p)
      }
    }

    for (let j = 0; j < 2; j++) { // ⭐ 从3降到2
      const p = this.acquireParticle(
        x + (Math.random() - 0.5) * 8, // ⭐ 减小偏移范围
        y + (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6, // ⭐ 减小速度
        (Math.random() - 0.5) * 6 - 0.8,
        0.4, // ⭐ 缩短生命周期
        '#FFF',
        1 + Math.random() * 1, // ⭐ 减小大小
        0
      )
      if (p) particles.push(p)
    }

    if (intensity >= 6) {
      for (let j = 0; j < 1; j++) { // ⭐ 从2降到1
        const angle = (Math.PI * 2 * j) / 2
        const speed = 3 + Math.random() * 2 // ⭐ 降低速度
        const p = this.acquireParticle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.4, // ⭐ 缩短生命周期
          '#FFD93D',
          3 + Math.random() * 1.5, // ⭐ 减小大小
          2
        )
        if (p) particles.push(p)
      }
    }
  }

  createFullScreenExplosion(width: number, height: number, colors: string[]) {
    const particles = this.particles
    const colorCount = colors.length
    for (let i = 0; i < 15; i++) { // ⭐ 性能优化：从25降到15
      const p = this.acquireParticle(
        Math.random() * width,
        Math.random() * height,
        (Math.random() - 0.5) * 4, // ⭐ 降低速度
        (Math.random() - 0.5) * 4,
        0.5, // ⭐ 缩短生命周期
        colors[Math.floor(Math.random() * colorCount)],
        2 + Math.random() * 3, // ⭐ 减小大小
        0
      )
      if (p) particles.push(p)
    }
  }
  
  clear() {
    // 归还所有粒子到池
    while (this.particles.length > 0) {
      this.releaseParticle(this.particles.pop()!)
    }
  }
}
