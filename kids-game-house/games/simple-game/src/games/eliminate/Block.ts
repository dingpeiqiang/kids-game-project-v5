export class Block {
  private r: number
  private c: number
  private color: string
  private scale: number = 1
  private alpha: number = 1
  private exploding: boolean = false
  private rainbow: boolean = false
  private item: string | null = null
  
  constructor(r: number, c: number, color: string, scale: number = 1) {
    this.r = r
    this.c = c
    this.color = color
    this.scale = scale
  }
  
  // Getters
  getR(): number { return this.r }
  getC(): number { return this.c }
  getColor(): string { return this.color }
  getScale(): number { return this.scale }
  getAlpha(): number { return this.alpha }
  isExploding(): boolean { return this.exploding }
  isRainbow(): boolean { return this.rainbow }
  getItem(): string | null { return this.item }
  
  // Setters
  setR(r: number) { this.r = r }
  setC(c: number) { this.c = c }
  setColor(color: string) { this.color = color }
  setScale(scale: number) { this.scale = scale }
  setAlpha(alpha: number) { this.alpha = alpha }
  setExploding(exploding: boolean) { this.exploding = exploding }
  setRainbow(rainbow: boolean) { this.rainbow = rainbow }
  setItem(item: string | null) { this.item = item }
  
  // 方块抖动动画
  shake() {
    let shakeCount = 0
    const originalScale = this.scale
    const shake = () => {
      if (shakeCount < 10) {
        this.scale = shakeCount % 2 === 0 ? 0.6 : 1.2
        shakeCount++
        setTimeout(shake, 25)
      } else {
        this.scale = originalScale
      }
    }
    shake()
  }
  
  // 方块放大动画（用于特殊效果）
  pulse() {
    let pulseCount = 0
    const originalScale = this.scale
    const pulse = () => {
      if (pulseCount < 6) {
        this.scale = originalScale * (1 + Math.sin(pulseCount * Math.PI / 3) * 0.3)
        pulseCount++
        setTimeout(pulse, 50)
      } else {
        this.scale = originalScale
      }
    }
    pulse()
  }
}
