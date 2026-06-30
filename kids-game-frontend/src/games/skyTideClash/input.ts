import type { InputSnapshot } from './types'

export interface InputController {
  snapshot: InputSnapshot
  tick: () => void
  consumeEdges: () => {
    clearScreen: boolean
    toggleMode: boolean
    pause: boolean
    restart: boolean
  }
  dispose: () => void
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  const keys = new Set<string>()
  const snapshot: InputSnapshot = {
    moveX: 0,
    moveZ: 0,
    pointerActive: false,
    clearScreen: false,
    toggleMode: false,
    pause: false,
    restart: false,
  }

  let pointerX = 0
  let pointerZ = 0
  let dragActive = false
  let edgeClear = false
  let edgeToggle = false
  let edgePause = false
  let edgeRestart = false

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code)
    if (e.code === 'KeyC') edgeClear = true
    if (e.code === 'KeyM') edgeToggle = true
    if (e.code === 'KeyP' || e.code === 'Escape') edgePause = true
    if (e.code === 'KeyR') edgeRestart = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)

  const updatePointerFromEvent = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect()
    const nx = (clientX - rect.left) / rect.width
    const ny = (clientY - rect.top) / rect.height
    pointerX = (nx - 0.5) * 2
    pointerZ = (ny - 0.5) * 2
    snapshot.pointerActive = true
  }

  const onPointerDown = (e: PointerEvent) => {
    dragActive = true
    canvas.setPointerCapture(e.pointerId)
    updatePointerFromEvent(e.clientX, e.clientY)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragActive) return
    updatePointerFromEvent(e.clientX, e.clientY)
  }
  const onPointerUp = (e: PointerEvent) => {
    dragActive = false
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointerDown, { passive: true })
  canvas.addEventListener('pointermove', onPointerMove, { passive: true })
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)

  const tick = () => {
    let mx = 0
    let mz = 0
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1

    if (dragActive && snapshot.pointerActive) {
      mx = pointerX
      mz = pointerZ
    }

    snapshot.moveX = mx
    snapshot.moveZ = mz
  }

  const consumeEdges = () => {
    const out = {
      clearScreen: edgeClear,
      toggleMode: edgeToggle,
      pause: edgePause,
      restart: edgeRestart,
    }
    edgeClear = false
    edgeToggle = false
    edgePause = false
    edgeRestart = false
    return out
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
  }

  return { snapshot, tick, consumeEdges, dispose }
}