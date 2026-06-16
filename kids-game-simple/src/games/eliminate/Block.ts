export class Block {
  private r: number
  private c: number
  private color: string
  private scale: number = 1
  private alpha: number = 1
  private exploding: boolean = false
  private rainbow: boolean = false
  private item: string | null = null
  private hasStarFlag: boolean = false
  /** 绘制用：相对格子的纵向偏移（格数），负值表示还在上方 */
  private visualYOffset = 0

  constructor(r: number, c: number, color: string, scale: number = 1) {
    this.r = r
    this.c = c
    this.color = color
    this.scale = scale
  }

  getR(): number { return this.r }
  getC(): number { return this.c }
  getColor(): string { return this.color }
  getScale(): number { return this.scale }
  getAlpha(): number { return this.alpha }
  isExploding(): boolean { return this.exploding }
  isRainbow(): boolean { return this.rainbow }
  getItem(): string | null { return this.item }
  hasStar(): boolean { return this.hasStarFlag }
  getVisualYOffset(): number { return this.visualYOffset }

  setR(r: number) { this.r = r }
  setC(c: number) { this.c = c }
  setColor(color: string) { this.color = color }
  setScale(scale: number) { this.scale = scale }
  setAlpha(alpha: number) { this.alpha = alpha }
  setExploding(exploding: boolean) { this.exploding = exploding }
  setRainbow(rainbow: boolean) { this.rainbow = rainbow }
  setItem(item: string | null) { this.item = item }
  setStar(hasStar: boolean) { this.hasStarFlag = hasStar }

  /**
   * 逻辑格已落到 toRow，画面仍从 fromRow 开始滑（消消乐式下落）
   * fromRow < toRow 表示往下掉（行号越大越靠下）
   */
  snapFallFromRow(fromRow: number, toRow: number) {
    this.r = toRow
    this.visualYOffset = fromRow - toRow
    if (this.visualYOffset < -0.01) {
      this.setScale(0.92)
    }
  }

  /** 新方块从棋盘顶外落入目标行 toRow */
  spawnFallFromAbove(toRow: number, rowsAbove: number) {
    this.r = toRow
    this.visualYOffset = -Math.max(1, rowsAbove)
    this.setScale(0.9)
  }

  isFalling(): boolean {
    return Math.abs(this.visualYOffset) > 0.015
  }

  /** 按秒下落，deltaSec 为帧间隔 */
  tickFall(rowsPerSecond: number, deltaSec: number): boolean {
    if (!this.isFalling()) {
      this.visualYOffset = 0
      return false
    }
    const step = rowsPerSecond * deltaSec
    if (this.visualYOffset < 0) {
      this.visualYOffset = Math.min(0, this.visualYOffset + step)
    } else if (this.visualYOffset > 0) {
      this.visualYOffset = Math.max(0, this.visualYOffset - step)
    }
    if (!this.isFalling()) {
      this.visualYOffset = 0
      this.landBounce = 0.14
    }
    return this.isFalling()
  }

  private landBounce = 0

  /** 落地轻微弹跳，返回是否仍在弹跳 */
  tickLandBounce(deltaSec: number): boolean {
    if (this.landBounce <= 0) return false
    this.landBounce -= deltaSec * 3.2
    if (this.landBounce < 0) this.landBounce = 0
    const t = this.landBounce
    this.setScale(1 + t * 0.35)
    return this.landBounce > 0
  }

  isAnimatingMotion(): boolean {
    return this.isFalling() || this.landBounce > 0
  }

  /** 强制落位，避免浮点残留导致永远 isAnimating */
  forceSettle() {
    this.visualYOffset = 0
    this.landBounce = 0
    if (this.scale > 1.05 || this.scale < 0.95) {
      this.scale = 1
    }
  }

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