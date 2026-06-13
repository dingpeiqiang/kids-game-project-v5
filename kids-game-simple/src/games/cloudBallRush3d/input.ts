import type { InputSnapshot } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'

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

export function createInputController(canvas: HTMLCanvasElement): InputController {
  applyCanvasMobileStyles(canvas)
  const snapshot = emptySnap()
  const keys = new Set<string>()

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code)
    if (e.code === 'Space') snapshot.jump = true
    if (e.code === 'KeyP' || e.code === 'Escape') snapshot.pause = true
    if (e.code === 'KeyR') snapshot.reset = true
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.code)
  }

  let stickId: number | null = null
  let stickOx = 0
  let stickOy = 0
  const STICK_R = 52

  const onPointerDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    if (lx >= rect.width * 0.58 && ly > rect.height * 0.42) {
      e.preventDefault()
      snapshot.jump = true
      return
    }
    if (lx < rect.width * 0.45 && ly > rect.height * 0.35) {
      e.preventDefault()
      stickId = e.pointerId
      stickOx = lx
      stickOy = ly
      canvas.setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (stickId !== e.pointerId) return
    const rect = canvas.getBoundingClientRect()
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    let dx = lx - stickOx
    let dy = ly - stickOy
    const d = Math.hypot(dx, dy)
    if (d > STICK_R) {
      dx = (dx / d) * STICK_R
      dy = (dy / d) * STICK_R
    }
    // 摇杆上推 = 前进（与第三人称视角一致，屏幕 Y 与 world Z 反向）
    snapshot.moveX = dx / STICK_R
    snapshot.moveZ = -dy / STICK_R
  }

  const endStick = (e: PointerEvent) => {
    if (stickId !== e.pointerId) return
    stickId = null
    snapshot.moveX = 0
    snapshot.moveZ = 0
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  let pollRaf = 0
  let disposed = false
  const pollKeys = () => {
    if (disposed) return
    if (stickId == null) {
      let mx = 0
      let mz = 0
      if (keys.has('ArrowLeft') || keys.has('KeyA')) mx -= 1
      if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1
      if (keys.has('ArrowUp') || keys.has('KeyW')) mz += 1
      if (keys.has('ArrowDown') || keys.has('KeyS')) mz -= 1
      const len = Math.hypot(mx, mz)
      if (len > 1) {
        mx /= len
        mz /= len
      }
      snapshot.moveX = mx
      snapshot.moveZ = mz
    }
    pollRaf = requestAnimationFrame(pollKeys)
  }
  pollRaf = requestAnimationFrame(pollKeys)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', endStick)
  canvas.addEventListener('pointercancel', endStick)

  return {
    snapshot,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(pollRaf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endStick)
      canvas.removeEventListener('pointercancel', endStick)
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