/**
 * 切饼干游戏 - 输入处理
 */

import type { GameEngine } from '../../services/gameEngine'

export interface InputState {
  isSlicing: boolean
  lastX: number
  lastY: number
}

/**
 * 获取鼠标/触摸位置（考虑画布缩放）
 */
export function getPos(
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvasWidth / rect.width
  const scaleY = canvasHeight / rect.height
  
  if ('touches' in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    }
  }
  
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

/**
 * 设置输入事件监听
 */
export function setupInputListeners(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  onSliceMove: (x1: number, y1: number, x2: number, y2: number) => void
): void {
  const handleStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    inputState.isSlicing = true
    const pos = getPos(e as any, canvas, 400, 600)
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!inputState.isSlicing) return
    e.preventDefault()
    
    const pos = getPos(e as any, canvas, 400, 600)
    onSliceMove(inputState.lastX, inputState.lastY, pos.x, pos.y)
    
    inputState.lastX = pos.x
    inputState.lastY = pos.y
  }

  const handleEnd = () => {
    inputState.isSlicing = false
  }

  canvas.onmousedown = handleStart
  canvas.ontouchstart = handleStart
  canvas.onmousemove = handleMove
  canvas.ontouchmove = handleMove
  canvas.onmouseup = handleEnd
  canvas.ontouchend = handleEnd
  canvas.onmouseleave = handleEnd
  canvas.ontouchcancel = handleEnd
}
