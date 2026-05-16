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
  
  update() {
    for (let i = this.comboTexts.length - 1; i >= 0; i--) {
      const ct = this.comboTexts[i]
      ct.life -= 0.02
      ct.y -= 1.5
      ct.scale += 0.02
      
      if (ct.life <= 0) {
        this.comboTexts.splice(i, 1)
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    this.comboTexts.forEach(ct => {
      ctx.save()
      ctx.globalAlpha = ct.life
      ctx.translate(ct.x, ct.y)
      ctx.scale(ct.scale, ct.scale)
      
      // 文字描边（更粗）
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.lineWidth = 4
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(ct.text, 0, 0)
      
      // 文字填充（更鲜艳的渐变色）
      const grad = ctx.createLinearGradient(-35, -18, 35, 18)
      grad.addColorStop(0, '#FFD93D')
      grad.addColorStop(0.5, '#FF6B6B')
      grad.addColorStop(1, '#9B59B6')
      ctx.fillStyle = grad
      ctx.fillText(ct.text, 0, 0)
      
      // 添加发光效果
      ctx.shadowColor = '#FFD93D'
      ctx.shadowBlur = 10
      ctx.fillText(ct.text, 0, 0)
      
      ctx.restore()
    })
  }
  
  addText(text: string, x: number, y: number) {
    this.comboTexts.push(new ComboText(text, x, y))
  }
  
  clear() {
    this.comboTexts = []
  }
}
