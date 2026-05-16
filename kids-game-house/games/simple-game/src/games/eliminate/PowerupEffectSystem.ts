export class PowerupEffect {
  type: string
  x: number
  y: number
  life: number
  maxLife: number
  color: string
  rings: Array<{ radius: number; speed: number; alpha: number }>
  
  constructor(type: string, x: number, y: number, color: string) {
    this.type = type
    this.x = x
    this.y = y
    this.life = 1.0
    this.maxLife = 1.0
    this.color = color
    
    // 创建双层光环
    this.rings = [
      { radius: 10, speed: 8, alpha: 1.0 },   // 内层快速扩散
      { radius: 5, speed: 5, alpha: 0.8 }     // 外层慢速扩散
    ]
  }
  
  update() {
    this.life -= 0.02 // 约0.7秒持续时间
    
    // 更新光环
    this.rings.forEach(ring => {
      ring.radius += ring.speed
      ring.alpha *= 0.95
    })
    
    return this.life > 0
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    
    // 绘制光环
    this.rings.forEach((ring, index) => {
      if (ring.alpha <= 0.01) return
      
      ctx.globalAlpha = ring.alpha * this.life
      ctx.strokeStyle = this.color
      ctx.lineWidth = index === 0 ? 4 : 3
      ctx.beginPath()
      ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2)
      ctx.stroke()
      
      // 添加发光效果
      ctx.shadowColor = this.color
      ctx.shadowBlur = 15
      ctx.stroke()
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
