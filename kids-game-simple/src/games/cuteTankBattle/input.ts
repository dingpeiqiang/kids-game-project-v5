import type { Dir } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'

export interface InputSnapshot {
  moveDir: Dir | null
  /** 本帧是否尝试开火（点击/空格边沿） */
  firePressed: boolean
}

export function createInputController(canvas: HTMLCanvasElement) {
  applyCanvasMobileStyles(canvas)

  let moveDir: Dir | null = null
  let fireQueued = false
  let spaceHeld = false
  let pointerDown = false
  let startX = 0
  let startY = 0
  const SWIPE_THRESHOLD = 28

  const onPointerDown = (e: PointerEvent) => {
    pointerDown = true
    fireQueued = true
    const rect = canvas.getBoundingClientRect()
    startX = e.clientX - rect.left
    startY = e.clientY - rect.top
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerDown) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - startX
    const dy = y - startY
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      moveDir = null
      return
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      moveDir = dx > 0 ? 'right' : 'left'
    } else {
      moveDir = dy > 0 ? 'down' : 'up'
    }
  }

  const onPointerUp = () => {
    pointerDown = false
    moveDir = null
  }

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        moveDir = 'up'
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        moveDir = 'down'
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        moveDir = 'left'
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        moveDir = 'right'
        break
      case ' ':
        if (!spaceHeld) fireQueued = true
        spaceHeld = true
        break
      default:
        break
    }
  }

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'w':
      case 'W':
      case 's':
      case 'S':
      case 'a':
      case 'A':
      case 'd':
      case 'D':
        moveDir = null
        break
      case ' ':
        spaceHeld = false
        break
      default:
        break
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  return {
    getSnapshot(): InputSnapshot {
      const firePressed = fireQueued
      fireQueued = false
      return { moveDir, firePressed }
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    },
  }
}

export function tryVibrate(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}