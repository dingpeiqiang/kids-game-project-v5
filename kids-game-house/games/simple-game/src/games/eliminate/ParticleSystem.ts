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
  private readonly MAX_PARTICLES = 150 // ⭐ 限制最大粒子数量，防止卡顿
  
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
    
    // ⭐ 如果粒子数量超过限制，移除最早的粒子
    if (this.particles.length > this.MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - this.MAX_PARTICLES)
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
    // ⭐ 优化：减少粒子数量，提升性能
    const particleCount = Math.min(8 + intensity * 2, 25) // 从40降到25
    for (let j = 0; j < particleCount; j++) {
      const angle = (Math.PI * 2 * j) / particleCount
      const speed = 3 + Math.random() * 6 // 降低速度
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        1,
        color,
        3 + Math.random() * 4, // 减小尺寸
        'normal'
      ))
    }
    
    // ⭐ 优化：减少闪光粒子数量
    for (let j = 0; j < 4; j++) { // 从8降到4
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 8, // 降低速度
        (Math.random() - 0.5) * 8 - 2,
        0.8, // 缩短生命周期
        '#FFD93D',
        2 + Math.random() * 2, // 减小尺寸
        'sparkle'
      ))
    }
    
    // ⭐ 优化：减少小颗粒飞溅
    for (let j = 0; j < 6; j++) { // 从12降到6
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 15,
        y + (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10, // 降低速度
        (Math.random() - 0.5) * 10 - 2,
        0.7, // 缩短生命周期
        '#FFF',
        2 + Math.random() * 2, // 减小尺寸
        'normal'
      ))
    }
    
    // ⭐ 优化：减少彩色光晕
    for (let j = 0; j < 4; j++) { // 从8降到4
      this.particles.push(new Particle(
        x, y,
        (Math.random() - 0.5) * 3, // 降低速度
        (Math.random() - 0.5) * 3,
        0.5, // 缩短生命周期
        color,
        15 + Math.random() * 10, // 减小尺寸
        'normal'
      ))
    }
    
    // ⭐ 优化：只在高强度时添加环形冲击波，且数量减半
    if (intensity >= 6) { // 提高触发阈值
      for (let j = 0; j < 3; j++) { // 从6降到3
        const angle = (Math.PI * 2 * j) / 3
        const speed = 6 + Math.random() * 3 // 降低速度
        this.particles.push(new Particle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.6, // 缩短生命周期
          '#FFD93D',
          6 + Math.random() * 3, // 减小尺寸
          'ring'
        ))
      }
    }
  }
  
  createFullScreenExplosion(width: number, height: number, colors: string[]) {
    // ⭐ 优化：减少全屏爆炸粒子数量
    for (let i = 0; i < 40; i++) { // 从100降到40
      this.particles.push(new Particle(
        Math.random() * width,
        Math.random() * height,
        (Math.random() - 0.5) * 10, // 降低速度
        (Math.random() - 0.5) * 10,
        0.8, // 缩短生命周期
        colors[Math.floor(Math.random() * colors.length)],
        4 + Math.random() * 5 // 减小尺寸
      ))
    }
  }
  
  clear() {
    this.particles = []
  }
}
