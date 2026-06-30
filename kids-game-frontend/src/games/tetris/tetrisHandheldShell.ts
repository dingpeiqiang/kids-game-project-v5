/**
 * 竖屏移动端排版：上 HUD + 棋盘(~65%屏) + 底栏操作（无掌机外壳）
 */

export type TetrisHandheldButtonId =
  | 'left'
  | 'right'
  | 'rotate'
  | 'soft_drop'
  | 'hard_drop'
  | 'hold'

export interface HandheldShellFrame {
  W: number
  H: number
  shell: { x: number; y: number; w: number; h: number; r: number }
  /** 整块游玩区（含顶栏+棋盘） */
  lcd: { x: number; y: number; w: number; h: number; r: number }
  /** 仅棋盘网格区域 */
  boardRect: { x: number; y: number; w: number; h: number; r: number }
  hud: { x: number; y: number; w: number; h: number; r: number }
  previewNext: { x: number; y: number; w: number; h: number; r: number }
  previewHold: { x: number; y: number; w: number; h: number; r: number }
  deckTop: number
  dpad: { cx: number; cy: number; arm: number; keySize: number; gap: number }
  btnA: { cx: number; cy: number; r: number; label: string }
  btnB: { cx: number; cy: number; r: number; label: string }
}

const UI = {
  dpadKey: '#2a3142',
  dpadKeyHi: '#3d465c',
  dpadPress: '#4ECDC4',
  btnA: '#66BB6A',
  btnB: '#EF5350',
  btnLabel: '#0d1117',
}

const SAFE_BOTTOM = 60

export function mobileDeckHeight(H: number): number {
  const base = Math.min(260, Math.max(180, H * 0.28))
  return base + SAFE_BOTTOM * 0.35
}

export function computeHandheldShellFrame(W: number, H: number): HandheldShellFrame {
  const sidePad = Math.max(6, W * 0.02)
  const deckH = mobileDeckHeight(H)
  const deckTop = H - deckH
  const lcd = {
    x: sidePad,
    y: 2,
    w: W - sidePad * 2,
    h: deckTop - 4,
    r: 12,
  }

  const headerH = Math.max(36, Math.min(44, lcd.w * 0.1))
  const previewW = Math.min(68, lcd.w * 0.19)
  const previewGap = 6
  const previewRight = lcd.x + lcd.w - 6
  const previewNext = {
    x: previewRight - previewW,
    y: lcd.y + 2,
    w: previewW,
    h: headerH,
    r: 8,
  }
  const previewHold = {
    x: previewNext.x - previewGap - previewW,
    y: lcd.y + 2,
    w: previewW,
    h: headerH,
    r: 8,
  }

  const hud = {
    x: lcd.x + 4,
    y: lcd.y + 2,
    w: Math.max(80, previewHold.x - lcd.x - 10),
    h: headerH,
    r: 8,
  }

  const boardTop = lcd.y + headerH + 4
  const boardBottom = deckTop - 2
  const boardH = boardBottom - boardTop
  const boardPadX = 4
  const boardW = lcd.w - boardPadX * 2
  const boardRect = {
    x: lcd.x + boardPadX,
    y: boardTop,
    w: boardW,
    h: boardH,
    r: 10,
  }

  const shell = { x: 0, y: 0, w: W, h: H, r: 0 }

  const deckInnerTop = deckTop + 16
  const deckInnerH = deckH - SAFE_BOTTOM - 20
  const dpadCx = W * 0.25
  const dpadCy = deckInnerTop + deckInnerH * 0.5
  const keySize = Math.min(62, Math.max(44, W * 0.15, deckInnerH * 0.25))
  const gap = Math.max(6, keySize * 0.12)
  const arm = keySize + gap

  const clusterCx = W * 0.75
  const abStackGap = 14
  const maxRFromDeck = Math.floor((deckInnerH - abStackGap) / 4)
  const btnR = Math.min(44, Math.max(32, keySize * 0.72), maxRFromDeck)
  const stackHalf = btnR + abStackGap / 2
  const clusterCy = dpadCy

  const btnA = { cx: clusterCx, cy: clusterCy - stackHalf, r: btnR, label: 'A' }
  const btnB = { cx: clusterCx, cy: clusterCy + stackHalf, r: btnR, label: 'B' }

  return {
    W,
    H,
    shell,
    lcd,
    boardRect,
    hud,
    previewNext,
    previewHold,
    deckTop,
    dpad: { cx: dpadCx, cy: dpadCy, arm, keySize, gap },
    btnA,
    btnB,
  }
}

function roundRectPath(
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

function drawCard(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.fillStyle = 'rgba(12, 16, 28, 0.72)'
  roundRectPath(g, x, y, w, h, r)
  g.fill()
  g.strokeStyle = 'rgba(255,255,255,0.08)'
  g.lineWidth = 1
  g.stroke()
}

export function drawHandheldShellAndLcd(g: CanvasRenderingContext2D, frame: HandheldShellFrame) {
  const { W, H, lcd, boardRect, hud, previewNext, previewHold, deckTop } = frame
  const deckH = H - deckTop

  g.save()
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#1a1a2e')
  bg.addColorStop(0.5, '#16213e')
  bg.addColorStop(1, '#12182a')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  drawCard(g, hud.x, hud.y, hud.w, hud.h, hud.r)
  drawCard(g, previewHold.x, previewHold.y, previewHold.w, previewHold.h, previewHold.r)
  drawCard(g, previewNext.x, previewNext.y, previewNext.w, previewNext.h, previewNext.r)

  g.fillStyle = '#1e2433'
  roundRectPath(g, boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r)
  g.fill()
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.45)'
  g.shadowBlur = 12
  g.shadowOffsetY = 4
  g.strokeStyle = 'rgba(255,255,255,0.06)'
  g.lineWidth = 1
  roundRectPath(g, boardRect.x, boardRect.y, boardRect.w, boardRect.h, boardRect.r)
  g.stroke()
  g.restore()

  g.fillStyle = 'rgba(8, 10, 18, 0.92)'
  g.fillRect(0, deckTop, W, deckH)
  g.strokeStyle = 'rgba(255,255,255,0.1)'
  g.beginPath()
  g.moveTo(0, deckTop)
  g.lineTo(W, deckTop)
  g.stroke()
  g.restore()
}

function drawDpadKey(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  label: string,
  pressed: boolean,
) {
  g.save()
  const scale = pressed ? 0.94 : 1
  const cx = x + size / 2
  const cy = y + size / 2
  g.translate(cx, cy)
  g.scale(scale, scale)
  g.translate(-cx, -cy)
  g.fillStyle = pressed ? UI.dpadPress : UI.dpadKey
  roundRectPath(g, x, y, size, size, 8)
  g.fill()
  g.fillStyle = pressed ? '#fff' : 'rgba(255,255,255,0.75)'
  g.font = `bold ${Math.round(size * 0.38)}px sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(label, x + size / 2, y + size / 2)
  g.restore()
}

export function drawHandheldControls(
  g: CanvasRenderingContext2D,
  frame: HandheldShellFrame,
  pressedIds: Set<string>,
) {
  const { dpad, btnA, btnB } = frame
  const { cx, cy, keySize, gap } = dpad
  const half = keySize / 2
  drawDpadKey(g, cx - half, cy - gap - keySize, keySize, '▲', pressedIds.has('rotate'))
  drawDpadKey(g, cx - gap - keySize, cy - half, keySize, '◀', pressedIds.has('left'))
  drawDpadKey(g, cx + gap, cy - half, keySize, '▶', pressedIds.has('right'))
  drawDpadKey(g, cx - half, cy + gap, keySize, '▼', pressedIds.has('soft_drop'))

  drawActionButton(g, btnA.cx, btnA.cy, btnA.r, btnA.label, UI.btnA, pressedIds.has('hard_drop'))
  drawActionButton(g, btnB.cx, btnB.cy, btnB.r, btnB.label, UI.btnB, pressedIds.has('hold'))

  g.fillStyle = 'rgba(255,255,255,0.35)'
  g.font = '9px sans-serif'
  g.textAlign = 'center'
  g.fillText('A 硬降', btnA.cx, btnA.cy + btnA.r + 12)
  g.fillText('B 暂存', btnB.cx, btnB.cy + btnB.r + 12)
}

function drawActionButton(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  label: string,
  fill: string,
  pressed: boolean,
) {
  g.save()
  const scale = pressed ? 0.92 : 1
  cy += pressed ? 2 : 0
  g.translate(cx, cy)
  g.scale(scale, scale)
  g.translate(-cx, -cy)
  if (!pressed) {
    g.shadowColor = 'rgba(0,0,0,0.35)'
    g.shadowBlur = 8
    g.shadowOffsetY = 3
  }
  const grad = g.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.2, cx, cy, r)
  grad.addColorStop(0, lighten(fill, 0.15))
  grad.addColorStop(1, fill)
  g.fillStyle = grad
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  g.shadowBlur = 0
  g.strokeStyle = 'rgba(255,255,255,0.45)'
  g.lineWidth = 2
  g.stroke()
  g.lineWidth = 3
  g.strokeStyle = 'rgba(255,255,255,0.9)'
  g.font = `bold ${Math.round(r * 0.55)}px sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.strokeText(label, cx, cy)
  g.fillStyle = UI.btnLabel
  g.fillText(label, cx, cy)
  g.restore()
}

function lighten(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const r = Math.min(255, ((n >> 16) & 255) + amt * 255)
  const g = Math.min(255, ((n >> 8) & 255) + amt * 255)
  const b = Math.min(255, (n & 255) + amt * 255)
  return `rgb(${r},${g},${b})`
}

export function handheldTouchLayout(frame: HandheldShellFrame) {
  const { dpad, btnA, btnB } = frame
  const { cx, cy, keySize, gap } = dpad
  const hit = keySize * 0.55
  const half = keySize / 2
  return {
    viewWidth: frame.W,
    viewHeight: frame.H,
    buttons: [
      { id: 'rotate', label: '▲', cx, cy: cy - gap - half, r: hit },
      { id: 'left', label: '◀', cx: cx - gap - half, cy, r: hit },
      { id: 'right', label: '▶', cx: cx + gap + half, cy, r: hit },
      { id: 'soft_drop', label: '▼', cx, cy: cy + gap + half, r: hit },
      { id: 'hard_drop', label: 'A', cx: btnA.cx, cy: btnA.cy, r: btnA.r * 1.08 },
      { id: 'hold', label: 'B', cx: btnB.cx, cy: btnB.cy, r: btnB.r * 1.08 },
    ],
  }
}

export function drawHandheldChrome(
  g: CanvasRenderingContext2D,
  frame: HandheldShellFrame,
  pressedIds: Set<string>,
) {
  drawHandheldShellAndLcd(g, frame)
  drawHandheldControls(g, frame, pressedIds)
}

export function tryHapticLight() {
  try {
    navigator.vibrate?.(8)
  } catch {
    /* ignore */
  }
}