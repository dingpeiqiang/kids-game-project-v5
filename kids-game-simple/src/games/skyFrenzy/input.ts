export interface InputSnapshot {
  moveX: number
  moveY: number
  dragging: boolean
}

export function createInputController(canvas: HTMLCanvasElement): {
  getSnapshot: () => InputSnapshot
  dispose: () => void
} {
  const keys = new Set<string>()
  let pointerDown = false
  let lastX = 0
  let lastY = 0
  let moveX = 0
  let moveY = 0

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.key.toLowerCase())
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase())
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    pointerDown = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerDown) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    const sens = 0.028
    moveX += dx * sens
    moveY -= dy * sens
  }

  const onPointerUp = (e: PointerEvent) => {
    pointerDown = false
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
  canvas.addEventListener('pointerup', onPointerUp, { passive: true })
  canvas.addEventListener('pointercancel', onPointerUp, { passive: true })

  const getSnapshot = (): InputSnapshot => {
    let kx = 0
    let kz = 0
    if (keys.has('arrowleft') || keys.has('a')) kx -= 1
    if (keys.has('arrowright') || keys.has('d')) kx += 1
    if (keys.has('arrowup') || keys.has('w')) kz -= 1
    if (keys.has('arrowdown') || keys.has('s')) kz += 1

    let mx = kx + moveX
    let mz = kz + moveY
    moveX *= 0.82
    moveY *= 0.82

    return { moveX: mx, moveY: mz, dragging: pointerDown }
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
  }

  return { getSnapshot, dispose }
}