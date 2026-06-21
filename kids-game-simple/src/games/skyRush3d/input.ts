import type { InputSnapshot } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGame3dCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'
import { isMobileDevice } from '../../utils/mobileEnv'

export interface InputController {
  snapshot: InputSnapshot
  dispose: () => void
}

const emptySnap = (): InputSnapshot => ({
  moveX: 0,
  moveZ: 0,
  pointerActive: false,
  pointerX: 0,
  pointerY: 0,
  clearScreen: false,
  pause: false,
  reset: false,
})

/** 屏幕摇杆 Y 与 world Z 反向 */
function mapStickToWorld(stickX: number, stickY: number): { moveX: number; moveZ: number } {
  return { moveX: stickX, moveZ: -stickY }
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  applyCanvasMobileStyles(canvas)
  const mobile = isMobileDevice()
  const snapshot = emptySnap()

  const w = canvas.width || canvas.clientWidth || 800
  const h = canvas.height || canvas.clientHeight || 600

  let controls: MobileControlRuntime | null = null
  controls = bindGame3dCanvasControls(canvas, {
    gameId: 'skyRush3d',
    preset: 'joystick_dynamic',
    viewWidth: w,
    viewHeight: h,
    onScreenControls: 'auto',
    layout: { buttons: [] },
    onAction: (action, payload) => {
      if (action === 'move') {
        const mapped = mapStickToWorld(payload.stickX ?? 0, payload.stickY ?? 0)
        snapshot.moveX = mapped.moveX
        snapshot.moveZ = mapped.moveZ
      }
    },
  })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyC' || e.code === 'KeyK') snapshot.clearScreen = true
    if (e.code === 'KeyP' || e.code === 'Escape') snapshot.pause = true
    if (e.code === 'KeyR') snapshot.reset = true
  }

  let dragId: number | null = null

  const normPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1
    return { nx, ny }
  }

  const inStickZone = (lx: number, ly: number) => lx < 0.45 && ly > 0.35
  const inAimZone = (lx: number, ly: number) => lx >= 0.45 && ly > 0.35

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) / rect.width
    const ly = (e.clientY - rect.top) / rect.height

    if (mobile && inStickZone(lx, ly)) return

    if (mobile && !inAimZone(lx, ly)) return

    e.preventDefault()
    dragId = e.pointerId
    canvas.setPointerCapture(e.pointerId)
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    snapshot.pointerActive = true
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
  }

  const onPointerMove = (e: PointerEvent) => {
    if (dragId !== e.pointerId) return
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
  }

  const endPointer = (e: PointerEvent) => {
    if (dragId !== e.pointerId) return
    dragId = null
    snapshot.pointerActive = false
    snapshot.pointerX = 0
    snapshot.pointerY = 0
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', endPointer)
  canvas.addEventListener('pointercancel', endPointer)

  return {
    snapshot,
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endPointer)
      canvas.removeEventListener('pointercancel', endPointer)
      controls?.dispose()
      controls = null
    },
  }
}

export function consumeFrameFlags(snapshot: InputSnapshot): {
  clearScreen: boolean
  pause: boolean
  reset: boolean
} {
  const flags = {
    clearScreen: snapshot.clearScreen,
    pause: snapshot.pause,
    reset: snapshot.reset,
  }
  snapshot.clearScreen = false
  snapshot.pause = false
  snapshot.reset = false
  return flags
}