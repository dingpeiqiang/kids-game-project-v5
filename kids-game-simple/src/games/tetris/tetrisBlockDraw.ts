/** 方块绘制：圆角、高光描边、内渐变 */

export function drawTetrisCell(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opts?: { ghost?: boolean; powerupGlow?: number },
) {
  const pad = 2
  const w = size - pad * 2
  const h = size - pad * 2
  const r = Math.min(2, w * 0.12)
  if (opts?.ghost) {
    g.save()
    g.globalAlpha = 0.28
    g.fillStyle = '#8899aa'
    roundRect(g, x + pad, y + pad, w, h, r)
    g.fill()
    g.restore()
    return
  }

  g.save()
  const glow = opts?.powerupGlow ?? 0
  if (glow > 0) {
    g.shadowColor = color
    g.shadowBlur = 6 + glow * 10
  }

  const grad = g.createLinearGradient(x, y, x + size, y + size)
  grad.addColorStop(0, lighten(color, 0.22))
  grad.addColorStop(0.45, color)
  grad.addColorStop(1, darken(color, 0.18))
  g.fillStyle = grad
  roundRect(g, x + pad, y + pad, w, h, r)
  g.fill()

  g.strokeStyle = lighten(color, 0.35)
  g.lineWidth = 1
  roundRect(g, x + pad + 0.5, y + pad + 0.5, w - 1, h - 1, r)
  g.stroke()
  g.restore()
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.lineTo(x + w - r, y)
  g.quadraticCurveTo(x + w, y, x + w, y + r)
  g.lineTo(x + w, y + h - r)
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  g.lineTo(x + r, y + h)
  g.quadraticCurveTo(x, y + h, x, y + h - r)
  g.lineTo(x, y + r)
  g.quadraticCurveTo(x, y, x + r, y)
  g.closePath()
}

function lighten(hex: string, amt: number): string {
  const { r, g, b } = parseHex(hex)
  return `rgb(${clamp(r + amt * 255)},${clamp(g + amt * 255)},${clamp(b + amt * 255)})`
}

function darken(hex: string, amt: number): string {
  return lighten(hex, -amt)
}

function parseHex(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)))
}

export const TETRIS_PALETTE = [
  '#FF5252',
  '#FFD54F',
  '#26C6DA',
  '#AB47BC',
  '#FF7043',
  '#42A5F5',
  '#66BB6A',
]