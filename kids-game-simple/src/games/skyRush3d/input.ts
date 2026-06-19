import type { InputSnapshot } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
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

export function createInputController(canvas: HTMLCanvasElement): InputController {
  applyCanvasMobileStyles(canvas)
  const mobile = isMobileDevice()
  const snapshot = emptySnap()
  const keys = new Set<string>()

  const mapKey = (code: string, down: boolean) => {
    if (down) keys.add(code)
    else keys.delete(code)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    mapKey(e.code, true)
    if (e.code === 'KeyC' || e.code === 'KeyK') snapshot.clearScreen = true
    if (e.code === 'KeyP' || e.code === 'Escape') snapshot.pause = true
    if (e.code === 'KeyR') snapshot.reset = true
  }
  const onKeyUp = (e: KeyboardEvent) => mapKey(e.code, false)

  let dragId: number | null = null
  let stickId: number | null = null
  let stickOx = 0
  let stickOy = 0
  const STICK_R = 52

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

    if (mobile) {
      if (inStickZone(lx, ly)) {
        e.preventDefault()
        stickId = e.pointerId
        stickOx = e.clientX - rect.left
        stickOy = e.clientY - rect.top
        canvas.setPointerCapture(e.pointerId)
        return
      }
      if (inAimZone(lx, ly)) {
        e.preventDefault()
        dragId = e.pointerId
        canvas.setPointerCapture(e.pointerId)
        const { nx, ny } = normPointer(e.clientX, e.clientY)
        snapshot.pointerActive = true
        snapshot.pointerX = nx
        snapshot.pointerY = -ny
        return
      }
      return
    }

    dragId = e.pointerId
    canvas.setPointerCapture(e.pointerId)
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    snapshot.pointerActive = true
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
  }

  const onPointerMove = (e: PointerEvent) => {
    if (stickId === e.pointerId) {
      e.preventDefault()
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
      snapshot.moveX = dx / STICK_R
      snapshot.moveZ = -dy / STICK_R
      return
    }
    if (dragId !== e.pointerId) return
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
  }

  const endPointer = (e: PointerEvent) => {
    if (stickId === e.pointerId) {
      stickId = null
      snapshot.moveX = 0
      snapshot.moveZ = 0
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      return
    }
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

  let pollRaf = 0
  let disposed = false
  const pollKeys = () => {
    if (disposed) return
    if (stickId == null) {
      let mx = 0
      let mz = 0
      if (keys.has('ArrowLeft') || keys.has('KeyA')) mx -= 1
      if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1
      if (keys.has('ArrowUp') || keys.has('KeyW')) mz -= 1
      if (keys.has('ArrowDown') || keys.has('KeyS')) mz += 1
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
  canvas.addEventListener('pointerup', endPointer)
  canvas.addEventListener('pointercancel', endPointer)

  return {
    snapshot,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(pollRaf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endPointer)
      canvas.removeEventListener('pointercancel', endPointer)
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