import type { InputSnapshot } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { bindGame3dCanvasControls } from '../../platform/mobileControls'
import type { MobileControlRuntime } from '../../platform/mobileControls'
import { isMobileDevice } from '../../utils/mobileEnv'

export interface InputController {
  snapshot: InputSnapshot
  tick: () => void
  dispose: () => void
}

const STICK_DEAD = 0.2

function stickToBools(sx: number, sy: number) {
  return {
    forward: sy < -STICK_DEAD,
    back: sy > STICK_DEAD,
    left: sx < -STICK_DEAD,
    right: sx > STICK_DEAD,
  }
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  applyCanvasMobileStyles(canvas)
  const mobile = isMobileDevice()

  const w = canvas.width || canvas.clientWidth || 800
  const h = canvas.height || canvas.clientHeight || 600
  const min = Math.min(w, h)

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
    lookYawDelta: 0,
    lookPitchDelta: 0,
  }

  let breakHeld = false
  let placeHeld = false
  let jumpHeld = false
  let platformSx = 0
  let platformSy = 0

  let controls: MobileControlRuntime | null = null

  controls = bindGame3dCanvasControls(canvas, {
    gameId: 'voxelRealm',
    preset: 'joystick_dynamic',
    viewWidth: w,
    viewHeight: h,
    onScreenControls: mobile ? 'auto' : 'never',
    layout: {
      viewWidth: w,
      viewHeight: h,
      buttons: [
        { id: 'break', label: '挖', cx: w * 0.67, cy: h * 0.82, r: min * 0.07 },
        { id: 'place', label: '放', cx: w * 0.88, cy: h * 0.57, r: min * 0.07 },
        { id: 'jump', label: '跳', cx: w * 0.88, cy: h * 0.82, r: min * 0.08 },
      ],
    },
    onAction: (action, payload) => {
      if (action === 'move') {
        platformSx = payload.stickX ?? 0
        platformSy = payload.stickY ?? 0
      }
      if (action === 'button_down') {
        if (payload.id === 'jump') jumpHeld = true
        if (payload.id === 'break') breakHeld = true
        if (payload.id === 'place') placeHeld = true
      }
      if (action === 'button_up') {
        if (payload.id === 'jump') jumpHeld = false
        if (payload.id === 'break') breakHeld = false
        if (payload.id === 'place') placeHeld = false
      }
    },
  })

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
    if (mobile) return
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.()
    }
  }

  const inStickZone = (lx: number, ly: number) => lx < 0.42 && ly > 0.42
  const inLookZone = (lx: number, ly: number) =>
    lx > 0.44 && ly < 0.42 && !inStickZone(lx, ly)

  let lookPointerId: number | null = null
  let lastLookClientX = 0
  let lastLookClientY = 0
  let lookAccX = 0
  let lookAccY = 0
  const LOOK_SENS = 0.0045

  const onLookPointerDown = (e: PointerEvent) => {
    if (!mobile || e.button !== 0) return
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) / rect.width
    const ly = (e.clientY - rect.top) / rect.height
    if (!inLookZone(lx, ly)) return
    e.preventDefault()
    lookPointerId = e.pointerId
    lastLookClientX = e.clientX
    lastLookClientY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }

  const onLookPointerMove = (e: PointerEvent) => {
    if (lookPointerId !== e.pointerId) return
    e.preventDefault()
    const dx = e.clientX - lastLookClientX
    const dy = e.clientY - lastLookClientY
    lastLookClientX = e.clientX
    lastLookClientY = e.clientY
    lookAccX += dx * LOOK_SENS
    lookAccY += dy * LOOK_SENS
  }

  const endLookPointer = (e: PointerEvent) => {
    if (lookPointerId !== e.pointerId) return
    lookPointerId = null
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('contextmenu', onContext)
  document.addEventListener('pointerlockchange', onLockChange)
  canvas.addEventListener('click', onClick)
  if (mobile) {
    canvas.addEventListener('pointerdown', onLookPointerDown, { passive: false })
    canvas.addEventListener('pointermove', onLookPointerMove, { passive: false })
    canvas.addEventListener('pointerup', endLookPointer)
    canvas.addEventListener('pointercancel', endLookPointer)
  }

  const tick = () => {
    const kbFwd = keys.has('KeyW') || keys.has('ArrowUp')
    const kbBack = keys.has('KeyS') || keys.has('ArrowDown')
    const kbLeft = keys.has('KeyA') || keys.has('ArrowLeft')
    const kbRight = keys.has('KeyD') || keys.has('ArrowRight')

    const plat = stickToBools(platformSx, platformSy)
    snapshot.forward = plat.forward || kbFwd
    snapshot.back = plat.back || kbBack
    snapshot.left = plat.left || kbLeft
    snapshot.right = plat.right || kbRight

    snapshot.jump = keys.has('Space') || jumpHeld
    snapshot.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight')
    snapshot.breakBlock = breakHeld
    snapshot.placeBlock = placeHeld
    snapshot.hotbarNext = keys.has('KeyE')
    snapshot.hotbarPrev = keys.has('KeyQ')
    snapshot.lookYawDelta = lookAccX
    snapshot.lookPitchDelta = lookAccY
    lookAccX = 0
    lookAccY = 0
  }

  const dispose = () => {
    controls?.dispose()
    controls = null
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('contextmenu', onContext)
    document.removeEventListener('pointerlockchange', onLockChange)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('pointerdown', onLookPointerDown)
    canvas.removeEventListener('pointermove', onLookPointerMove)
    canvas.removeEventListener('pointerup', endLookPointer)
    canvas.removeEventListener('pointercancel', endLookPointer)
    if (document.pointerLockElement === canvas) document.exitPointerLock()
  }

  return { snapshot, tick, dispose }
}