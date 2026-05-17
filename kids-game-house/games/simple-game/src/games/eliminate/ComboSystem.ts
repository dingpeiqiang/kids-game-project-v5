export class ComboText {
  text: string
  x: number
  y: number
  life: number
  scale: number
  
  constructor(text: string, x: number, y: number) {
    this.text = text
    this.x = x
    this.y = y
    this.life = 1
    this.scale = 0.5
  }
}

export class ComboSystem {
  private comboTexts: ComboText[] = []
  private textGradient: CanvasGradient | null = null
  private gradientContext: CanvasRenderingContext2D | null = null
  
  update() {
    const texts = this.comboTexts
    for (let i = texts.length - 1; i >= 0; i--) {
      const ct = texts[i]
      ct.life -= 0.02
      ct.y -= 1.5
      ct.scale += 0.02
      
      if (ct.life <= 0) {
        texts[i] = texts[texts.length - 1]
        texts.pop()
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    const texts = this.comboTexts
    const len = texts.length
    if (len === 0) return
    
    if (!this.textGradient) {
      this.textGradient = ctx.createLinearGradient(-35, -18, 35, 18)
      this.textGradient.addColorStop(0, '#FFD93D')
      this.textGradient.addColorStop(0.5, '#FF6B6B')
      this.textGradient.addColorStop(1, '#9B59B6')
    }
    
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 4
    ctx.shadowColor = '#FFD93D'
    ctx.shadowBlur = 10
    
    for (let i = 0; i < len; i++) {
      const ct = texts[i]
      ctx.save()
      ctx.globalAlpha = ct.life
      ctx.translate(ct.x, ct.y)
      ctx.scale(ct.scale, ct.scale)
      
      ctx.strokeText(ct.text, 0, 0)
      ctx.fillStyle = this.textGradient!
      ctx.fillText(ct.text, 0, 0)
      
      ctx.restore()
    }
    
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }
  
  addText(text: string, x: number, y: number) {
    this.comboTexts.push(new ComboText(text, x, y))
  }
  
  clear() {
    this.comboTexts = []
  }
}
