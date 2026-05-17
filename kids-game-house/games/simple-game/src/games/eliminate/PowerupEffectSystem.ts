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
    
    // 创建多层光环（3-4层）
    this.rings = [
      { radius: 5, speed: 6, alpha: 1.0, lineWidth: 5 },     // 内层快速
      { radius: 3, speed: 4, alpha: 0.9, lineWidth: 4 },     // 中层
      { radius: 2, speed: 3, alpha: 0.7, lineWidth: 3 },     // 外层慢速
      { radius: 1, speed: 2, alpha: 0.5, lineWidth: 2 }      // 最外层
    ]
    
    // 创建爆炸粒子
    this.particles = []
    const particleCount = type === 'bomb' || type === 'mega_bomb' ? 30 : 20
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 3 + Math.random() * 5
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
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
    this.life -= 0.018 // 约0.9秒持续时间
    
    // 缩放动画（从小到大再到正常）
    if (this.scale < 1.0) {
      this.scale += 0.15
      if (this.scale > 1.0) this.scale = 1.0
    }
    
    // 旋转动画
    this.rotation += 0.1
    
    // 更新光环
    this.rings.forEach(ring => {
      ring.radius += ring.speed
      ring.alpha *= 0.93
      ring.lineWidth *= 0.98
    })
    
    // 更新粒子
    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.95 // 阻力
      p.vy *= 0.95
      p.alpha *= 0.92
      p.size *= 0.97
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
