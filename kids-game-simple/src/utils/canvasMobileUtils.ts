import { DEFAULT_PORTRAIT_HEIGHT_RATIO } from '../games/gameLayout'
import { getLandscapePlayViewportSize, getVisualViewportSize } from './mobileEnv'

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
  heightRatio = DEFAULT_PORTRAIT_HEIGHT_RATIO,
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

/**
 * 横屏设计分辨率游戏在视口中的等比缩放。
 * portraitHeldForceLandscape：竖屏持机 + CSS 旋转模拟横屏时，可用宽高与物理视口对调。
 */
export function computeLandscapeCanvasDisplaySize(
  gameW: number,
  gameH: number,
  portraitHeldForceLandscape = false,
): CanvasDisplaySize {
  const { width: vw, height: vh } = getVisualViewportSize()
  const availW = portraitHeldForceLandscape ? vh : vw
  const availH = portraitHeldForceLandscape ? vw : vh
  const scale = Math.min(availW / gameW, availH / gameH)
  return {
    displayW: Math.floor(gameW * scale * 100) / 100,
    displayH: Math.floor(gameH * scale * 100) / 100,
  }
}

/** 将横屏主画布设为等比显示尺寸（逻辑分辨率不变） */
export function applyLandscapeMainCanvasDisplaySize(
  canvas: HTMLCanvasElement,
  gameW: number,
  gameH: number,
  portraitHeldForceLandscape = false,
): void {
  const { displayW, displayH } = computeLandscapeCanvasDisplaySize(
    gameW,
    gameH,
    portraitHeldForceLandscape,
  )
  canvas.style.width = `${displayW}px`
  canvas.style.height = `${displayH}px`
  applyCanvasMobileStyles(canvas)
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

export interface BindCanvasPointerTapAndMoveOptions {
  /** 按下后滑出画布仍跟手（切水果等） */
  trackOutsideCanvas?: boolean
}

/** 点击 + 移动（弹珠、瞄准类） */
export function bindCanvasPointerTapAndMove(
  canvas: HTMLCanvasElement,
  onMove: CanvasMoveHandler,
  onTap: CanvasMoveHandler,
  options?: BindCanvasPointerTapAndMoveOptions,
): () => void {
  applyCanvasMobileStyles(canvas)
  const trackOutside = options?.trackOutsideCanvas ?? false

  const toCanvas = (clientX: number, clientY: number) =>
    clientToCanvas(canvas, clientX, clientY)

  let dragging = false

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    dragging = true
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onTap(x, y)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) return
    if (!dragging && e.pointerType === 'mouse') return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onMove(x, y)
  }

  const onPointerUp = () => {
    dragging = false
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    dragging = true
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

  const onTouchEnd = () => {
    dragging = false
  }

  const onMouseMove = (e: MouseEvent) => {
    if ((e.buttons & 1) === 0) return
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onMove(x, y)
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging = true
    const { x, y } = toCanvas(e.clientX, e.clientY)
    onTap(x, y)
  }

  const onMouseUp = () => {
    dragging = false
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)

  if (trackOutside) {
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mousemove', onMouseMove)
    if (trackOutside) {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }
}

/** 瞄准发射模式：按下移动瞄准，释放时发射（泡泡龙、弹弓类游戏） */
export interface AimState {
  x: number
  y: number
  chargeTime: number
}

export function bindCanvasAimAndShoot(
  canvas: HTMLCanvasElement,
  onAim: (x: number, y: number, chargeTime: number) => void,
  onShoot: (x: number, y: number, chargeTime: number) => void,
  onCancel?: () => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  const toCanvas = (clientX: number, clientY: number) =>
    clientToCanvas(canvas, clientX, clientY)

  let aiming = false
  let lastX = 0
  let lastY = 0
  let chargeStartTime = 0
  let chargeInterval: number | null = null

  const startAim = (x: number, y: number) => {
    aiming = true
    lastX = x
    lastY = y
    chargeStartTime = Date.now()
    
    chargeInterval = window.setInterval(() => {
      if (aiming) {
        const chargeTime = Date.now() - chargeStartTime
        onAim(lastX, lastY, chargeTime)
      }
    }, 16)
    
    onAim(x, y, 0)
  }

  const updateAim = (x: number, y: number) => {
    if (!aiming) return
    lastX = x
    lastY = y
    const chargeTime = Date.now() - chargeStartTime
    onAim(x, y, chargeTime)
  }

  const endAim = () => {
    if (!aiming) return
    aiming = false
    
    if (chargeInterval) {
      clearInterval(chargeInterval)
      chargeInterval = null
    }
    
    const chargeTime = Date.now() - chargeStartTime
    onShoot(lastX, lastY, chargeTime)
  }

  const cancelAim = () => {
    if (!aiming) return
    aiming = false
    
    if (chargeInterval) {
      clearInterval(chargeInterval)
      chargeInterval = null
    }
    
    onCancel?.()
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    startAim(x, y)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    updateAim(x, y)
  }

  const onPointerUp = () => endAim()
  const onPointerCancel = () => cancelAim()

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const { x, y } = toCanvas(t.clientX, t.clientY)
    startAim(x, y)
  }

  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const { x, y } = toCanvas(t.clientX, t.clientY)
    updateAim(x, y)
  }

  const onTouchEnd = () => endAim()
  const onTouchCancel = () => cancelAim()

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const { x, y } = toCanvas(e.clientX, e.clientY)
    startAim(x, y)
  }

  const onMouseMove = (e: MouseEvent) => {
    if ((e.buttons & 1) === 0) return
    const { x, y } = toCanvas(e.clientX, e.clientY)
    updateAim(x, y)
  }

  const onMouseUp = () => endAim()

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerCancel)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)
  canvas.addEventListener('touchcancel', onTouchCancel)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)

  return () => {
    if (chargeInterval) {
      clearInterval(chargeInterval)
    }
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerCancel)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchCancel)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseup', onMouseUp)
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

/** 赛车类：短按半屏变道，拖拽跟手，松手吸附车道 */
export interface CanvasDragFollowLaneOptions {
  logicalWidth: number
  dragThreshold?: number
  onDragMove: (canvasX: number) => void
  /** wasDrag=false 时通常为半屏 tap 变道 */
  onRelease: (canvasX: number, wasDrag: boolean) => void
}

export function bindCanvasDragFollowAndLaneTap(
  canvas: HTMLCanvasElement,
  options: CanvasDragFollowLaneOptions,
): () => void {
  applyCanvasMobileStyles(canvas)
  const threshold = options.dragThreshold ?? 10
  let active = false
  let startX = 0
  let hasMoved = false

  const toX = (clientX: number, clientY: number) =>
    clientToCanvas(canvas, clientX, clientY).x

  const down = (clientX: number, clientY: number) => {
    active = true
    startX = toX(clientX, clientY)
    hasMoved = false
  }

  const move = (clientX: number, clientY: number) => {
    if (!active) return
    const x = toX(clientX, clientY)
    if (Math.abs(x - startX) > threshold) {
      hasMoved = true
      options.onDragMove(x)
    }
  }

  const up = (clientX: number, clientY: number) => {
    if (!active) return
    active = false
    const x = toX(clientX, clientY)
    options.onRelease(x, hasMoved)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    down(e.clientX, e.clientY)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!active) return
    e.preventDefault()
    move(e.clientX, e.clientY)
  }
  const onPointerUp = (e: PointerEvent) => {
    e.preventDefault()
    up(e.clientX, e.clientY)
  }

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    down(t.clientX, t.clientY)
  }
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    move(t.clientX, t.clientY)
  }
  const onTouchEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0]
    if (!t) return
    e.preventDefault()
    up(t.clientX, t.clientY)
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    down(e.clientX, e.clientY)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (!active || (e.buttons & 1) === 0) return
    move(e.clientX, e.clientY)
  }
  const onMouseUp = (e: MouseEvent) => {
    up(e.clientX, e.clientY)
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)
  canvas.addEventListener('touchcancel', onTouchEnd)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
}

/**
 * 消消乐类触屏：按下选中 → 滑动交换相邻格 → 短按连通消除。
 * PC 侧通常另接 `bindMobileControlPreset`（`enableTouch: false`）。
 */
export interface BindCanvasTapDragSwapOptions {
  swipeThreshold?: number
  onActivity?(): void
  canInteract(): boolean
  /** touchstart：尝试选中，返回当前选中 index（无则 null） */
  selectAt(x: number, y: number): number | null
  /** 根据屏幕像素滑动方向解析相邻格 index */
  resolveAdjacent(fromIdx: number, dxClient: number, dyClient: number): number | null
  isValidSwapTarget(fromIdx: number, toIdx: number): boolean
  onSwap(fromIdx: number, toIdx: number, x: number, y: number): void
  onTap(x: number, y: number): void
}

export function bindCanvasTapDragSwap(
  canvas: HTMLCanvasElement,
  options: BindCanvasTapDragSwapOptions,
): () => void {
  applyCanvasMobileStyles(canvas)
  const threshold = options.swipeThreshold ?? 30
  let startClientX = 0
  let startClientY = 0
  let selectedIdx: number | null = null
  let hasSwiped = false

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    if (!options.canInteract()) return
    options.onActivity?.()
    startClientX = t.clientX
    startClientY = t.clientY
    hasSwiped = false
    const { x, y } = clientToCanvas(canvas, t.clientX, t.clientY)
    selectedIdx = options.selectAt(x, y)
  }

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (selectedIdx === null || hasSwiped) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - startClientX
    const dy = t.clientY - startClientY
    if (Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) return
    const toIdx = options.resolveAdjacent(selectedIdx, dx, dy)
    if (toIdx === null || !options.isValidSwapTarget(selectedIdx, toIdx)) return
    const { x, y } = clientToCanvas(canvas, t.clientX, t.clientY)
    hasSwiped = true
    options.onSwap(selectedIdx, toIdx, x, y)
    selectedIdx = null
  }

  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    const t = e.changedTouches[0]
    if (!t) return
    if (hasSwiped || selectedIdx === null) {
      selectedIdx = null
      hasSwiped = false
      return
    }
    const dx = Math.abs(t.clientX - startClientX)
    const dy = Math.abs(t.clientY - startClientY)
    if (dx < threshold && dy < threshold) {
      const { x, y } = clientToCanvas(canvas, t.clientX, t.clientY)
      options.onTap(x, y)
    }
    selectedIdx = null
    hasSwiped = false
  }

  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd, { passive: false })
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

  return () => {
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
    selectedIdx = null
    hasSwiped = false
  }
}