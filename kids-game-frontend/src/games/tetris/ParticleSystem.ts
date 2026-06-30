// Tetris 粒子系统 - 增强视觉效果
export class ParticleSystem {
  private particles: any[] = []
  
  // 创建消除行特效
  createLineClearEffect(x: number, y: number, color: string, count: number = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 3,
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        color: color,
        size: 3 + Math.random() * 6,
        type: 'spark'
      })
    }
  }
  
  // 创建方块放置特效
  createPlaceEffect(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color: color,
        size: 2 + Math.random() * 4,
        type: 'dust'
      })
    }
  }
  
  // 创建道具收集特效
  createPowerupCollectEffect(x: number, y: number, color: string = '#FFD700') {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 3 + Math.random() * 3
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        color: color,
        size: 3 + Math.random() * 5,
        type: 'star'
      })
    }
  }
  
  // 创建连击特效
  createComboEffect(x: number, y: number, combo: number) {
    const colors = ['#FF6B6B', '#FFD93D', '#4ECDC4', '#9B59B6', '#FF8E53']
    const color = colors[combo % colors.length]
    
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        life: 1,
        decay: 0.01 + Math.random() * 0.015,
        color: color,
        size: 4 + Math.random() * 8,
        type: 'explosion'
      })
    }
  }
  
  // 创建屏幕震动效果（通过返回参数实现）
  createScreenShake(intensity: number = 5) {
    return {
      shakeX: (Math.random() - 0.5) * intensity,
      shakeY: (Math.random() - 0.5) * intensity,
      duration: 200
    }
  }
  
  // 更新粒子
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= p.decay
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15 // 重力
      
      // 摩擦力
      p.vx *= 0.98
      p.vy *= 0.98
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }
  
  // 渲染粒子
  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      ctx.save()
      ctx.globalAlpha = p.life
      
      switch (p.type) {
        case 'spark':
          ctx.fillStyle = p.color
          ctx.shadowBlur = 10
          ctx.shadowColor = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
          break
          
        case 'dust':
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.life * 0.6
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
          break
          
        case 'star':
          ctx.fillStyle = p.color
          ctx.shadowBlur = 15
          ctx.shadowColor = p.color
          this.drawStar(ctx, p.x, p.y, 5, p.size * p.life, p.size * p.life * 0.5)
          break
          
        case 'explosion':
          ctx.fillStyle = p.color
          ctx.shadowBlur = 20
          ctx.shadowColor = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
          break
      }
      
      ctx.restore()
    })
  }
  
  // 绘制星星形状
  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes
    
    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step
      
      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fill()
  }
  
  // 获取粒子数量
  getParticleCount(): number {
    return this.particles.length
  }
  
  // 清除所有粒子
  clear() {
    this.particles = []
  }
}