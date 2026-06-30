import { bindGame3dCanvasControls } from '@shell/platform/mobileControls'
import type { MobileControlRuntime } from '@shell/platform/mobileControls'

export interface InputSnapshot {
  moveX: number
  moveY: number
  dragging: boolean
}

const SWIPE_SENS = 0.028
const DRAG_DECAY = 0.82

export function createInputController(canvas: HTMLCanvasElement): {
  getSnapshot: () => InputSnapshot
  dispose: () => void
} {
  const w = canvas.width || canvas.clientWidth || 800
  const h = canvas.height || canvas.clientHeight || 600

  let keyMoveX = 0
  let keyMoveY = 0
  let dragMoveX = 0
  let dragMoveY = 0
  let controls: MobileControlRuntime | null = null

  controls = bindGame3dCanvasControls(canvas, {
    gameId: 'skyFrenzy',
    preset: 'swipe_pan',
    viewWidth: w,
    viewHeight: h,
    onScreenControls: 'never',
    onAction: (action, payload) => {
      if (action === 'move' && payload.source === 'keyboard') {
        keyMoveX = payload.stickX ?? 0
        keyMoveY = payload.stickY ?? 0
      }
      if (action === 'swipe') {
        dragMoveX += (payload.dx ?? 0) * SWIPE_SENS
        dragMoveY += (payload.dy ?? 0) * SWIPE_SENS
      }
    },
  })

  const getSnapshot = (): InputSnapshot => {
    const mx = keyMoveX + dragMoveX
    const my = keyMoveY + dragMoveY
    dragMoveX *= DRAG_DECAY
    dragMoveY *= DRAG_DECAY
    if (Math.abs(dragMoveX) < 0.001) dragMoveX = 0
    if (Math.abs(dragMoveY) < 0.001) dragMoveY = 0
    const dragging = Math.hypot(mx, my) > 0.05
    return { moveX: mx, moveY: my, dragging }
  }

  const dispose = () => {
    controls?.dispose()
    controls = null
  }

  return { getSnapshot, dispose }
}