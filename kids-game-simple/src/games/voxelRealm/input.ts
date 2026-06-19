import type { InputSnapshot } from './types'
import { applyCanvasMobileStyles } from '../../utils/canvasMobileUtils'
import { isMobileDevice } from '../../utils/mobileEnv'

export interface InputController {
  snapshot: InputSnapshot
  tick: () => void
  dispose: () => void
}

export function createInputController(canvas: HTMLCanvasElement): InputController {
  applyCanvasMobileStyles(canvas)
  const mobile = isMobileDevice()

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

  // --- 移动端：左下摇杆 + 右下跳跃 / 破坏 / 放置 ---
  let stickTouchId: number | null = null
  let stickOx = 0
  let stickOy = 0
  const STICK_R = 52
  let mobileFwd = false
  let mobileBack = false
  let mobileLeft = false
  let mobileRight = false
  const touchRoles = new Map<number, 'jump' | 'break' | 'place' | 'stick'>()

  const localFromTouch = (t: Touch) => {
    const rect = canvas.getBoundingClientRect()
    return {
      lx: (t.clientX - rect.left) / rect.width,
      ly: (t.clientY - rect.top) / rect.height,
      px: t.clientX - rect.left,
      py: t.clientY - rect.top,
    }
  }

  const inJumpZone = (lx: number, ly: number) => lx > 0.78 && ly > 0.68
  const inBreakZone = (lx: number, ly: number) => lx > 0.58 && lx < 0.76 && ly > 0.68
  const inPlaceZone = (lx: number, ly: number) => lx > 0.78 && ly > 0.48 && ly < 0.66
  const inStickZone = (lx: number, ly: number) => lx < 0.42 && ly > 0.42
  const inLookZone = (lx: number, ly: number) =>
    lx > 0.44 &&
    ly < 0.42 &&
    !inStickZone(lx, ly)

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

  const updateStickFromPos = (px: number, py: number) => {
    let dx = px - stickOx
    let dy = py - stickOy
    const d = Math.hypot(dx, dy)
    if (d > STICK_R) {
      dx = (dx / d) * STICK_R
      dy = (dy / d) * STICK_R
    }
    const ndx = dx / STICK_R
    const ndy = dy / STICK_R
    const dead = 0.2
    mobileFwd = ndy < -dead
    mobileBack = ndy > dead
    mobileLeft = ndx < -dead
    mobileRight = ndx > dead
  }

  const clearMobileMove = () => {
    mobileFwd = mobileBack = mobileLeft = mobileRight = false
  }

  const onTouchStart = (e: TouchEvent) => {
    if (!mobile) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const { lx, ly, px, py } = localFromTouch(t)
      if (inJumpZone(lx, ly)) {
        touchRoles.set(t.identifier, 'jump')
        jumpHeld = true
        e.preventDefault()
        continue
      }
      if (inBreakZone(lx, ly)) {
        touchRoles.set(t.identifier, 'break')
        breakHeld = true
        e.preventDefault()
        continue
      }
      if (inPlaceZone(lx, ly)) {
        touchRoles.set(t.identifier, 'place')
        placeHeld = true
        e.preventDefault()
        continue
      }
      if (inStickZone(lx, ly) && stickTouchId === null) {
        stickTouchId = t.identifier
        touchRoles.set(t.identifier, 'stick')
        stickOx = px
        stickOy = py
        e.preventDefault()
      }
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!mobile || stickTouchId === null) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      if (t.identifier !== stickTouchId) continue
      const { px, py } = localFromTouch(t)
      updateStickFromPos(px, py)
      e.preventDefault()
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!mobile) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const role = touchRoles.get(t.identifier)
      touchRoles.delete(t.identifier)
      if (role === 'jump') jumpHeld = false
      if (role === 'break') breakHeld = false
      if (role === 'place') placeHeld = false
      if (role === 'stick' && t.identifier === stickTouchId) {
        stickTouchId = null
        clearMobileMove()
      }
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
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })
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
    if (mobile) {
      snapshot.forward = mobileFwd || kbFwd
      snapshot.back = mobileBack || kbBack
      snapshot.left = mobileLeft || kbLeft
      snapshot.right = mobileRight || kbRight
    } else {
      snapshot.forward = kbFwd
      snapshot.back = kbBack
      snapshot.left = kbLeft
      snapshot.right = kbRight
    }
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
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('contextmenu', onContext)
    document.removeEventListener('pointerlockchange', onLockChange)
    canvas.removeEventListener('click', onClick)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
    canvas.removeEventListener('pointerdown', onLookPointerDown)
    canvas.removeEventListener('pointermove', onLookPointerMove)
    canvas.removeEventListener('pointerup', endLookPointer)
    canvas.removeEventListener('pointercancel', endLookPointer)
    if (document.pointerLockElement === canvas) document.exitPointerLock()
  }

  return { snapshot, tick, dispose }
}