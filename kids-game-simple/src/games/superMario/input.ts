import { VirtualJoystick } from '../contraRpg/joystick'
import { MARIO_CONFIG } from './config'
import { applyCanvasMobileStyles, clientToCanvas } from '../../utils/canvasMobileUtils'

export interface MarioInput {
  left: boolean
  right: boolean
  jump: boolean
  jumpPressed: boolean
  run: boolean
}

export function createInputState(): MarioInput {
  return {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    run: false,
  }
}

export function bindMarioInput(
  canvas: HTMLCanvasElement,
  input: MarioInput,
  joystick: VirtualJoystick,
  onJumpTap: () => void,
): () => void {
  applyCanvasMobileStyles(canvas)

  const key = (e: KeyboardEvent, down: boolean) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        input.left = down
        break
      case 'ArrowRight':
      case 'KeyD':
        input.right = down
        break
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        if (down && !e.repeat) {
          input.jump = true
          input.jumpPressed = true
          onJumpTap()
        }
        if (!down) input.jump = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        input.run = down
        break
    }
  }

  const onKeyDown = (e: KeyboardEvent) => key(e, true)
  const onKeyUp = (e: KeyboardEvent) => key(e, false)

  let jumpTouchId = -1

  const jumpBtn = {
    cx: MARIO_CONFIG.VIEW_W - 58,
    cy: MARIO_CONFIG.VIEW_H - 72,
    r: 44,
  }

  const hitJump = (x: number, y: number) => {
    const dx = x - jumpBtn.cx
    const dy = y - jumpBtn.cy
    return dx * dx + dy * dy <= jumpBtn.r * jumpBtn.r
  }

  const onTouchStart = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const p = clientToCanvas(canvas, t.clientX, t.clientY)
      if (p.x < MARIO_CONFIG.VIEW_W * 0.45) {
        joystick.activate(p.x, p.y, t.identifier)
        e.preventDefault()
        continue
      }
      if (hitJump(p.x, p.y)) {
        jumpTouchId = t.identifier
        input.jump = true
        input.jumpPressed = true
        onJumpTap()
        e.preventDefault()
      }
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      const p = clientToCanvas(canvas, t.clientX, t.clientY)
      if (p.x < MARIO_CONFIG.VIEW_W * 0.5) {
        joystick.update(p.x, p.y)
        e.preventDefault()
      }
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      if (t.identifier === jumpTouchId) {
        jumpTouchId = -1
        input.jump = false
      }
      joystick.deactivate(t.identifier)
    }
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)
  canvas.addEventListener('touchcancel', onTouchEnd)

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
  }
}

export function applyJoystickToInput(
  joystick: VirtualJoystick,
  input: MarioInput,
  keyboardActive: { left: boolean; right: boolean },
): void {
  const out = joystick.getState().output
  const dead = 0.2
  if (joystick.getState().active) {
    input.left = out.x < -dead
    input.right = out.x > dead
    if (out.magnitude > 0.75) input.run = true
  } else {
    input.left = keyboardActive.left
    input.right = keyboardActive.right
  }
}

export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  joystick: VirtualJoystick,
): void {
  const jumpBtn = { cx: MARIO_CONFIG.VIEW_W - 58, cy: MARIO_CONFIG.VIEW_H - 72, r: 44 }
  ctx.save()
  ctx.globalAlpha = 0.85
  joystick.draw(ctx)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(jumpBtn.cx, jumpBtn.cy, jumpBtn.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('跳', jumpBtn.cx, jumpBtn.cy)
  ctx.restore()
}