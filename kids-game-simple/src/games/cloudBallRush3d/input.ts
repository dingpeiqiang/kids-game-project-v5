import type { InputSnapshot } from './types'
import { bindGame3dCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'

export interface InputController {
  snapshot: InputSnapshot
  dispose: () => void
}

const emptySnap = (): InputSnapshot => ({
  moveX: 0,
  moveZ: 0,
  jump: false,
  pause: false,
  reset: false,
})

/** 屏幕摇杆 Y 与 world Z 反向（第三人称） */
function mapStickToWorld(stickX: number, stickY: number): { moveX: number; moveZ: number } {
  return { moveX: stickX, moveZ: -stickY }
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  const snapshot = emptySnap()
  let controls: MobileControlRuntime | null = null

  const w = canvas.width || canvas.clientWidth || 800
  const h = canvas.height || canvas.clientHeight || 600

  controls = bindGame3dCanvasControls(canvas, {
    gameId: 'cloudBallRush3d',
    viewWidth: w,
    viewHeight: h,
    onScreenControls: 'auto',
    onAction: (action, payload) => {
      if (action === 'move') {
        const sx = payload.stickX ?? 0
        const sy = payload.stickY ?? 0
        const mapped = mapStickToWorld(sx, sy)
        snapshot.moveX = mapped.moveX
        snapshot.moveZ = mapped.moveZ
      }
      if (action === 'button_down' && payload.id === 'jump') {
        snapshot.jump = true
      }
    },
  })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyP' || e.code === 'Escape') snapshot.pause = true
    if (e.code === 'KeyR') snapshot.reset = true
  }
  window.addEventListener('keydown', onKeyDown)

  return {
    snapshot,
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown)
      controls?.dispose()
      controls = null
    },
  }
}

export function consumeFrameFlags(snapshot: InputSnapshot): {
  jump: boolean
  pause: boolean
  reset: boolean
} {
  const flags = {
    jump: snapshot.jump,
    pause: snapshot.pause,
    reset: snapshot.reset,
  }
  snapshot.jump = false
  snapshot.pause = false
  snapshot.reset = false
  return flags
}