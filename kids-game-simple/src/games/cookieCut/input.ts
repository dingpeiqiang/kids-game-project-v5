/**
 * 切饼干游戏 - 输入处理（移动端 + 桌面）
 */

import { applyCanvasMobileStyles, clientToCanvas } from '../../utils/canvasMobileUtils'

export interface InputState {
  isSlicing: boolean
  lastX: number
  lastY: number
}

function clientFromEvent(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
  }
  const me = e as MouseEvent
  return { clientX: me.clientX, clientY: me.clientY }
}

/**
 * 设置输入事件监听，返回清理函数
 */
export function setupInputListeners(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  onSliceMove: (x1: number, y1: number, x2: number, y2: number) => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  const handleStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    inputState.isSlicing = true
    const { clientX, clientY } = clientFromEvent(e)
    const pos = clientToCanvas(canvas, clientX, clientY)
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!inputState.isSlicing) return
    e.preventDefault()
    const { clientX, clientY } = clientFromEvent(e, canvas)
    const pos = clientToCanvas(canvas, clientX, clientY)
    onSliceMove(inputState.lastX, inputState.lastY, pos.x, pos.y)
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  const handleEnd = () => {
    inputState.isSlicing = false
  }

  const onGlobalMove = (e: MouseEvent) => {
    if (!inputState.isSlicing) return
    const pos = clientToCanvas(canvas, e.clientX, e.clientY)
    onSliceMove(inputState.lastX, inputState.lastY, pos.x, pos.y)
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  const onGlobalTouchMove = (e: TouchEvent) => {
    if (!inputState.isSlicing) return
    const t = e.touches[0]
    if (!t) return
    e.preventDefault()
    const pos = clientToCanvas(canvas, t.clientX, t.clientY)
    onSliceMove(inputState.lastX, inputState.lastY, pos.x, pos.y)
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  canvas.addEventListener('mousedown', handleStart)
  canvas.addEventListener('mousemove', handleMove)
  canvas.addEventListener('mouseup', handleEnd)
  canvas.addEventListener('mouseleave', handleEnd)
  canvas.addEventListener('touchstart', handleStart, { passive: false })
  canvas.addEventListener('touchmove', handleMove, { passive: false })
  canvas.addEventListener('touchend', handleEnd)
  canvas.addEventListener('touchcancel', handleEnd)
  document.addEventListener('mousemove', onGlobalMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
  document.addEventListener('touchend', handleEnd)
  document.addEventListener('touchcancel', handleEnd)

  return () => {
    canvas.removeEventListener('mousedown', handleStart)
    canvas.removeEventListener('mousemove', handleMove)
    canvas.removeEventListener('mouseup', handleEnd)
    canvas.removeEventListener('mouseleave', handleEnd)
    canvas.removeEventListener('touchstart', handleStart)
    canvas.removeEventListener('touchmove', handleMove)
    canvas.removeEventListener('touchend', handleEnd)
    canvas.removeEventListener('touchcancel', handleEnd)
    document.removeEventListener('mousemove', onGlobalMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', onGlobalTouchMove)
    document.removeEventListener('touchend', handleEnd)
    document.removeEventListener('touchcancel', handleEnd)
  }
}