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
    let write = 0
    for (let i = 0; i < texts.length; i++) {
      const ct = texts[i]
      ct.life -= 0.025 // ⭐ 性能优化：加快消失速度
      ct.y -= 1.2 // ⭐ 降低上升速度
      ct.scale += 0.018 // ⭐ 降低缩放速度

      if (ct.life > 0) {
        texts[write++] = ct
      }
    }
    texts.length = write
  }
  
  render(ctx: CanvasRenderingContext2D) {
    const texts = this.comboTexts
    const len = texts.length
    if (len === 0) return  // 优化：空时直接返回

    // 复用渐变（如果 context 变了就重建）
    if (!this.textGradient || this.gradientContext !== ctx) {
      this.textGradient = ctx.createLinearGradient(-35, -18, 35, 18)
      this.textGradient.addColorStop(0, '#FFD93D')
      this.textGradient.addColorStop(0.5, '#FF6B6B')
      this.textGradient.addColorStop(1, '#9B59B6')
      this.gradientContext = ctx
    }

    // ⭐ 性能优化：减小字体大小和阴影模糊
    ctx.font = 'bold 32px sans-serif' // 从40降到32
    ctx.textAlign = 'center'
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 3 // 从4降到3
    ctx.shadowColor = '#FFD93D'
    ctx.shadowBlur = 8 // 从10降到8

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
