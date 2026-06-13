import { getVisualViewportSize } from './mobileEnv'

export interface CanvasLogicalSize {
  width: number
  height: number
}

export interface CanvasDisplaySize {
  displayW: number
  displayH: number
}

/** 竖屏游戏画布在视口中的等比缩放尺寸 */
export function computePortraitCanvasDisplaySize(
  gameW: number,
  gameH: number,
  heightRatio = 0.88,
): CanvasDisplaySize {
  const { width: vw, height: vh } = getVisualViewportSize()
  const widthRatio = vw / gameW
  const heightRatioScaled = (vh * heightRatio) / gameH
  const scale = Math.min(widthRatio, heightRatioScaled, 1.5)
  return {
    displayW: Math.floor(gameW * scale * 100) / 100,
    displayH: Math.floor(gameH * scale * 100) / 100,
  }
}

/** 横屏设计分辨率游戏在视口中的等比缩放 */
export function computeLandscapeCanvasDisplaySize(
  gameW: number,
  gameH: number,
): CanvasDisplaySize {
  const { width: vw, height: vh } = getVisualViewportSize()
  const scale = Math.min(vw / gameW, vh / gameH)
  return {
    displayW: Math.floor(gameW * scale * 100) / 100,
    displayH: Math.floor(gameH * scale * 100) / 100,
  }
}

export function applyCanvasMobileStyles(canvas: HTMLCanvasElement): void {
  canvas.style.touchAction = 'none'
  canvas.style.webkitUserSelect = 'none'
  canvas.style.userSelect = 'none'
  ;(canvas.style as CSSStyleDeclaration & { webkitTouchCallout?: string }).webkitTouchCallout =
    'none'
}

export function clientToCanvas(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

export type CanvasPointerHandler = (x: number, y: number, rawEvent: PointerEvent | TouchEvent | MouseEvent) => void

/**
 * 统一指针/触摸：preventDefault、坐标映射、避免双击缩放。
 * 返回清理函数，在游戏结束或重开时调用。
 */
export function bindCanvasPointerInput(
  canvas: HTMLCanvasElement,
  onDown: CanvasPointerHandler,
): () => void {
  applyCanvasMobileStyles(canvas)

  const handle = (clientX: number, clientY: number, ev: PointerEvent | TouchEvent | MouseEvent) => {
    if ('cancelable' in ev && ev.cancelable) {
      ev.preventDefault()
    }
    const { x, y } = clientToCanvas(canvas, clientX, clientY)
    onDown(x, y, ev)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    handle(e.clientX, e.clientY, e)
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    handle(t.clientX, t.clientY, e)
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    handle(e.clientX, e.clientY, e)
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('mousedown', onMouseDown)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('mousedown', onMouseDown)
  }
}

/** 左右分屏点击（跑酷类） */
export function bindCanvasLaneTap(
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  onLeft: () => void,
  onRight: () => void,
): () => void {
  return bindCanvasPointerInput(canvas, (x) => {
    if (x < logicalWidth / 3) onLeft()
    else if (x > (logicalWidth * 2) / 3) onRight()
  })
}

export type CanvasMoveHandler = (x: number, y: number) => void

/** 点击 + 移动（弹珠、瞄准类） */
export function bindCanvasPointerTapAndMove(
  canvas: HTMLCanvasElement,
  onMove: CanvasMoveHandler,
  onTap: CanvasMoveHandler,
): () => void {
  applyCanvasMobileStyles(canvas)

  const toCanvas = (clientX: number, clientY: number) =>
    clientToCanvas(canvas, clientX, clientY)

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onTap(x, y)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onMove(x, y)
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const { x, y } = toCanvas(t.clientX, t.clientY)
    onTap(x, y)
  }

  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const { x, y } = toCanvas(t.clientX, t.clientY)
    onMove(x, y)
  }

  const onMouseMove = (e: MouseEvent) => {
    if ((e.buttons & 1) === 0) return
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onMove(x, y)
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onTap(x, y)
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mousemove', onMouseMove)
  }
}

/** 水平拖拽（躲避、切水果等） */
export function bindCanvasHorizontalDrag(
  canvas: HTMLCanvasElement,
  onDragDeltaX: (deltaX: number, canvasX: number) => void,
  onDragStart?: (canvasX: number) => void,
  onDragEnd?: () => void,
): () => void {
  applyCanvasMobileStyles(canvas)
  let lastClientX = 0
  let dragging = false

  const start = (clientX: number) => {
    dragging = true
    lastClientX = clientX
    const { x } = clientToCanvas(canvas, clientX, 0)
    onDragStart?.(x)
  }

  const move = (clientX: number) => {
    if (!dragging) return
    const dx = clientX - lastClientX
    lastClientX = clientX
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const { x } = clientToCanvas(canvas, clientX, rect.top + rect.height / 2)
    onDragDeltaX(dx * scaleX, x)
  }

  const end = () => {
    if (!dragging) return
    dragging = false
    onDragEnd?.()
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    start(e.clientX)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    e.preventDefault()
    move(e.clientX)
  }
  const onPointerUp = () => end()

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    start(t.clientX)
  }
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    move(t.clientX)
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', end)
  canvas.addEventListener('touchcancel', end)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', end)
    canvas.removeEventListener('touchcancel', end)
  }
}