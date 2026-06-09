import type { InputSnapshot } from './types'

export interface InputController {
  snapshot: InputSnapshot
  tick: () => void
  dispose: () => void
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  const keys = new Set<string>()
  const snapshot: InputSnapshot = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    breakBlock: false,
    placeBlock: false,
    hotbarNext: false,
    hotbarPrev: false,
    pointerLocked: false,
  }

  let breakHeld = false
  let placeHeld = false

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code)
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) e.preventDefault()
  }
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) breakHeld = true
    if (e.button === 2) placeHeld = true
  }
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) breakHeld = false
    if (e.button === 2) placeHeld = false
  }
  const onContext = (e: Event) => e.preventDefault()

  const onLockChange = () => {
    snapshot.pointerLocked = document.pointerLockElement === canvas
  }

  const onClick = () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.()
    }
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('contextmenu', onContext)
  document.addEventListener('pointerlockchange', onLockChange)
  canvas.addEventListener('click', onClick)

  const tick = () => {
    snapshot.forward = keys.has('KeyW') || keys.has('ArrowUp')
    snapshot.back = keys.has('KeyS') || keys.has('ArrowDown')
    snapshot.left = keys.has('KeyA') || keys.has('ArrowLeft')
    snapshot.right = keys.has('KeyD') || keys.has('ArrowRight')
    snapshot.jump = keys.has('Space')
    snapshot.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight')
    snapshot.breakBlock = breakHeld
    snapshot.placeBlock = placeHeld
    snapshot.hotbarNext = keys.has('KeyE')
    snapshot.hotbarPrev = keys.has('KeyQ')
  }

  const dispose = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('contextmenu', onContext)
    document.removeEventListener('pointerlockchange', onLockChange)
    canvas.removeEventListener('click', onClick)
    if (document.pointerLockElement === canvas) document.exitPointerLock()
  }

  return { snapshot, tick, dispose }
}