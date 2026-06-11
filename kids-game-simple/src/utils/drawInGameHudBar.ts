/** 局内顶条（不含得分，得分由 CanvasGamePlay 壳层展示） */

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  ctx.lineTo(x + rr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
  ctx.lineTo(x, y + rr)
  ctx.quadraticCurveTo(x, y, x + rr, y)
  ctx.closePath()
}

export interface InGameHudBarOptions {
  canvasWidth: number
  /** 条顶 y，默认 8 */
  top?: number
  /** 条高，默认 44 */
  height?: number
  /** 主文案（如倒计时） */
  primaryText: string
  /** 主色 */
  primaryColor?: string
  /** 居中副文案（如 Buff） */
  centerText?: string
  centerColor?: string
  /** 右对齐副文案（如关卡） */
  rightText?: string
  rightColor?: string
}

export function drawInGameHudBar(ctx: CanvasRenderingContext2D, opts: InGameHudBarOptions) {
  const W = opts.canvasWidth
  const top = opts.top ?? 8
  const h = opts.height ?? 44
  const yMid = top + h / 2

  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  roundRect(ctx, 10, top, W - 20, h, 12)
  ctx.fill()

  ctx.textBaseline = 'middle'
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = opts.primaryColor ?? '#FFD700'
  ctx.textAlign = 'left'
  ctx.fillText(opts.primaryText, 22, yMid)

  if (opts.centerText) {
    ctx.font = 'bold 15px sans-serif'
    ctx.fillStyle = opts.centerColor ?? '#FF6B9D'
    ctx.textAlign = 'center'
    ctx.fillText(opts.centerText, W / 2, yMid)
  }

  if (opts.rightText) {
    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = opts.rightColor ?? '#fff'
    ctx.textAlign = 'right'
    ctx.fillText(opts.rightText, W - 18, yMid)
  }
}