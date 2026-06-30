export class PowerupEffect {
  type: string
  x: number
  y: number
  life: number
  maxLife: number
  color: string
  rings: Array<{ radius: number; speed: number; alpha: number; lineWidth: number }>
  particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }>
  scale: number
  rotation: number
  
  constructor(type: string, x: number, y: number, color: string) {
    this.type = type
    this.x = x
    this.y = y
    this.life = 1.0
    this.maxLife = 1.0
    this.color = color
    this.scale = 0
    this.rotation = 0
    
    // ⭐ 性能优化：减少光环层数（从4层降到2层）
    this.rings = [
      { radius: 5, speed: 5, alpha: 1.0, lineWidth: 4 },     // 内层快速
      { radius: 3, speed: 3, alpha: 0.8, lineWidth: 3 }      // 外层慢速
    ]
    
    // ⭐ 性能优化：减少爆炸粒子数量
    this.particles = []
    const particleCount = type === 'bomb' || type === 'mega_bomb' ? 15 : 10 // 从30/20降到15/10
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 2 + Math.random() * 3 // ⭐ 降低速度范围
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5, // ⭐ 减小大小
        alpha: 1.0,
        color: this.getRandomColor(color)
      })
    }
  }
  
  private getRandomColor(baseColor: string): string {
    // 生成相近颜色的变体
    const colors = [baseColor]
    if (baseColor.includes('255')) {
      colors.push('rgb(255, 200, 100)', 'rgb(255, 150, 150)')
    } else if (baseColor.includes('100')) {
      colors.push('rgb(150, 200, 255)', 'rgb(100, 255, 200)')
    }
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  update() {
    this.life -= 0.022 // ⭐ 性能优化：加快消失速度（约0.7秒持续时间）
    
    // 缩放动画（从小到大再到正常）
    if (this.scale < 1.0) {
      this.scale += 0.18 // ⭐ 加快缩放速度
      if (this.scale > 1.0) this.scale = 1.0
    }
    
    // 旋转动画
    this.rotation += 0.08 // ⭐ 降低旋转速度
    
    // 更新光环
    this.rings.forEach(ring => {
      ring.radius += ring.speed
      ring.alpha *= 0.91 // ⭐ 加快衰减
      ring.lineWidth *= 0.97 // ⭐ 加快线宽衰减
    })
    
    // 更新粒子
    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.94 // ⭐ 增加阻力
      p.vy *= 0.94
      p.alpha *= 0.90 // ⭐ 加快衰减
      p.size *= 0.96 // ⭐ 加快缩小
    })
    
    return this.life > 0
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.scale, this.scale)
    ctx.rotate(this.rotation)
    
    // 绘制中心光晕
    const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30)
    centerGlow.addColorStop(0, this.color.replace('rgb', 'rgba').replace(')', ', 0.8)'))
    centerGlow.addColorStop(0.5, this.color.replace('rgb', 'rgba').replace(')', ', 0.3)'))
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = centerGlow
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制光环
    this.rings.forEach((ring, index) => {
      if (ring.alpha <= 0.01) return
      
      ctx.globalAlpha = ring.alpha * this.life
      ctx.strokeStyle = this.color
      ctx.lineWidth = ring.lineWidth
      ctx.shadowColor = this.color
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
      ctx.stroke()
      
      // 添加第二层描边（更亮）
      ctx.globalAlpha = ring.alpha * this.life * 0.5
      ctx.lineWidth = ring.lineWidth * 0.5
      ctx.strokeStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
      ctx.stroke()
    })
    
    // 绘制粒子
    ctx.rotate(-this.rotation) // 粒子不跟随旋转
    this.particles.forEach(p => {
      if (p.alpha <= 0.01) return
      
      ctx.globalAlpha = p.alpha * this.life
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    
    ctx.restore()
  }
}

export class PowerupEffectSystem {
  private effects: PowerupEffect[] = []
  
  // 道具颜色映射
  private readonly POWERUP_COLORS: Record<string, string> = {
    'bomb': 'rgb(255, 107, 107)',        // 红色 - 炸弹
    'shuffle': 'rgb(155, 89, 182)',      // 紫色 - 洗牌
    'hammer': 'rgb(255, 142, 83)',       // 橙色 - 锤子
    'freeze': 'rgb(78, 205, 196)',       // 青色 - 冰冻
    'color_bomb': 'rgb(255, 217, 61)',   // 黄色 - 颜色炸弹
    'line_h': 'rgb(77, 150, 255)',       // 蓝色 - 横排
    'line_v': 'rgb(107, 203, 119)',      // 绿色 - 竖排
    'rainbow': 'rgb(255, 105, 180)',     // 粉色 - 彩虹
    'mega_bomb': 'rgb(255, 0, 0)',       // 深红 - 超级炸弹
    'time_plus': 'rgb(0, 255, 255)',     //  cyan - 时间延长
    'double_score': 'rgb(255, 215, 0)'   // 金色 - 双倍分数
  }
  
  createEffect(type: string, x: number, y: number) {
    const color = this.POWERUP_COLORS[type] || 'rgb(255, 255, 255)'
    this.effects.push(new PowerupEffect(type, x, y, color))
  }
  
  update() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      if (!this.effects[i].update()) {
        this.effects.splice(i, 1)
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    this.effects.forEach(effect => {
      effect.render(ctx)
    })
  }
  
  clear() {
    this.effects = []
  }
}
