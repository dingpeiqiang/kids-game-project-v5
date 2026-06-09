import type { InputSnapshot } from './types'

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
  let lastPx = 0
  let lastPy = 0

  const normPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1
    return { nx, ny }
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    dragId = e.pointerId
    canvas.setPointerCapture(e.pointerId)
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    lastPx = nx
    lastPy = ny
    snapshot.pointerActive = true
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
  }

  const onPointerMove = (e: PointerEvent) => {
    if (dragId !== e.pointerId) return
    const { nx, ny } = normPointer(e.clientX, e.clientY)
    snapshot.pointerX = nx
    snapshot.pointerY = -ny
    lastPx = nx
    lastPy = ny
  }

  const onPointerUp = (e: PointerEvent) => {
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

  const pollKeys = () => {
    let mx = 0
    let mz = 0
    if (keys.has('ArrowLeft') || keys.has('KeyA')) mx -= 1
    if (keys.has('ArrowRight') || keys.has('KeyD')) mx += 1
    if (keys.has('ArrowUp') || keys.has('KeyW')) mz -= 1
    if (keys.has('ArrowDown') || keys.has('KeyS')) mz += 1
    snapshot.moveX = mx
    snapshot.moveZ = mz
  }

  const raf = () => {
    pollKeys()
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)

  return {
    snapshot,
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
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