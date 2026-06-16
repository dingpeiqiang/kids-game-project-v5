export class Block {
  private r: number
  private c: number
  private color: string
  private scale: number = 1
  private alpha: number = 1
  private exploding: boolean = false
  private rainbow: boolean = false
  private item: string | null = null
  private hasStarFlag: boolean = false // 是否有星星
  
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
  hasStar(): boolean { return this.hasStarFlag }
  
  // Setters
  setR(r: number) { this.r = r }
  setC(c: number) { this.c = c }
  setColor(color: string) { this.color = color }
  setScale(scale: number) { this.scale = scale }
  setAlpha(alpha: number) { this.alpha = alpha }
  private explodeTicks = 0

  setExploding(exploding: boolean) {
    this.exploding = exploding
    if (exploding) {
      this.explodeTicks = 7
    }
  }
  setRainbow(rainbow: boolean) { this.rainbow = rainbow }
  setItem(item: string | null) { this.item = item }
  setStar(hasStar: boolean) { this.hasStarFlag = hasStar }
  
  // 方块抖动动画（由 EliminateGame.updateBlockAnimations 驱动，避免连点堆 setTimeout）
  private shakeTicks = 0
  private shakeBaseScale = 1

  shake() {
    this.shakeBaseScale = this.scale
    this.shakeTicks = 4
  }

  tickShake(): boolean {
    if (this.shakeTicks <= 0) return false
    this.shakeTicks--
    this.scale = this.shakeTicks % 2 === 0 ? this.shakeBaseScale * 1.08 : this.shakeBaseScale * 0.92
    if (this.shakeTicks === 0) {
      this.scale = this.shakeBaseScale
    }
    return true
  }

  /** 消除前缩放+淡出，返回 true 表示动画仍在播放 */
  tickExplode(): boolean {
    if (this.explodeTicks <= 0) return false
    this.explodeTicks--
    const progress = 1 - this.explodeTicks / 7
    this.scale = 1 + progress * 0.35
    this.alpha = 1 - progress * 0.92
    if (this.explodeTicks === 0) {
      this.exploding = false
      this.alpha = 0
      this.scale = 0.15
    }
    return this.explodeTicks > 0
  }

  /** 消除动画播完、尚未从棋盘移除 */
  isVanished(): boolean {
    return !this.exploding && this.alpha <= 0.05 && this.scale < 0.5
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
