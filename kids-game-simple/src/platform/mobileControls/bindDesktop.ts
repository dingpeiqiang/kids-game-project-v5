import {
  applyCanvasMobileStyles,
  bindCanvasLaneTap,
  bindCanvasPointerInput,
  clientToCanvas,
} from '../../utils/canvasMobileUtils'
import { hitCircle, stickFromDpadPressed } from './layout'
import {
  computeStickFromKeys,
  mergeKeyboardProfile,
  type KeyboardPresetProfile,
} from './keyboardMapping'
import type {
  MobileControlActionPayload,
  MobileControlHandler,
  MobileControlLayout,
  MobileControlPresetId,
} from './types'

export interface BindDesktopOptions {
  canvas: HTMLCanvasElement
  preset: MobileControlPresetId
  layout: MobileControlLayout
  onAction: MobileControlHandler
  keyboardProfile?: Partial<KeyboardPresetProfile>
  buttonPressed?: Map<string, boolean>
  enablePointer?: boolean
  enableKeyboard?: boolean
  keyboardMoveMagnitude?: number
}

export function bindDesktopControls(options: BindDesktopOptions): () => void {
  const {
    canvas,
    preset,
    layout,
    onAction,
    enablePointer = true,
    enableKeyboard = true,
    keyboardMoveMagnitude = 1,
    buttonPressed,
  } = options

  const profile = mergeKeyboardProfile(preset, options.keyboardProfile)
  const disposers: Array<() => void> = []
  const keysDown = new Set<string>()

  const emitMoveFromKeys = () => {
    const { x, y } = computeStickFromKeys(profile, keysDown)
    const mag = x === 0 && y === 0 ? 0 : keyboardMoveMagnitude
    onAction('move', {
      stickX: x * mag,
      stickY: y * mag,
      stickAngle: Math.atan2(y, x) * (180 / Math.PI),
      stickMagnitude: mag,
      source: 'keyboard',
    })
  }

  const mapButtonKey = (code: string, down: boolean) => {
    const id = profile.buttons?.[code]
    if (!id) return
    buttonPressed?.set(id, down)
    onAction(down ? 'button_down' : 'button_up', { id, source: 'keyboard' })
  }

  if (enableKeyboard) {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      keysDown.add(e.code)

      if (profile.laneLeft?.includes(e.code)) {
        onAction('lane_left', { source: 'keyboard' })
        e.preventDefault()
      }
      if (profile.laneRight?.includes(e.code)) {
        onAction('lane_right', { source: 'keyboard' })
        e.preventDefault()
      }

      const movementHit =
        profile.movementKeys &&
        (profile.movementKeys.up.includes(e.code) ||
          profile.movementKeys.down.includes(e.code) ||
          profile.movementKeys.left.includes(e.code) ||
          profile.movementKeys.right.includes(e.code))

      if (movementHit) {
        emitMoveFromKeys()
        e.preventDefault()
      }

      if (profile.buttons?.[e.code]) {
        mapButtonKey(e.code, true)
        e.preventDefault()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code)
      const movementHit =
        profile.movementKeys &&
        (profile.movementKeys.up.includes(e.code) ||
          profile.movementKeys.down.includes(e.code) ||
          profile.movementKeys.left.includes(e.code) ||
          profile.movementKeys.right.includes(e.code))
      if (movementHit) emitMoveFromKeys()
      if (profile.buttons?.[e.code]) mapButtonKey(e.code, false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    disposers.push(() => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      keysDown.clear()
    })

    if (profile.movementKeys) {
      let raf = 0
      const poll = () => {
        emitMoveFromKeys()
        raf = requestAnimationFrame(poll)
      }
      raf = requestAnimationFrame(poll)
      disposers.push(() => cancelAnimationFrame(raf))
    }
  }

  const buttons = layout.buttons ?? []
  const isJoystickFamily =
    preset === 'joystick_action' ||
    preset === 'joystick_dynamic' ||
    preset === 'joystick_4way' ||
    preset === 'joystick_8way' ||
    preset === 'fighting_stick_buttons' ||
    preset === 'tilt'

  const dpadPressedKeys = new Set<string>()

  const emitDpadMoveFromKeys = () => {
    const { x, y } = stickFromDpadPressed(dpadPressedKeys)
    const mag = x === 0 && y === 0 ? 0 : 1
    onAction('move', {
      stickX: x * mag,
      stickY: y * mag,
      stickMagnitude: mag,
      stickAngle: Math.atan2(y, x) * (180 / Math.PI),
      source: 'pointer',
    })
  }

  if (enablePointer && preset === 'portrait_dpad' && buttons.length > 0) {
    applyCanvasMobileStyles(canvas)
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const p = clientToCanvas(canvas, e.clientX, e.clientY)
      for (const btn of buttons) {
        if (hitCircle(p.x, p.y, btn)) {
          dpadPressedKeys.add(btn.id)
          buttonPressed?.set(btn.id, true)
          onAction('button_down', { id: btn.id, x: p.x, y: p.y, source: 'pointer' })
          emitDpadMoveFromKeys()
          e.preventDefault()
          break
        }
      }
    }
    const onMouseUp = () => {
      for (const btn of buttons) {
        if (dpadPressedKeys.has(btn.id)) {
          dpadPressedKeys.delete(btn.id)
          buttonPressed?.set(btn.id, false)
          onAction('button_up', { id: btn.id, source: 'pointer' })
        }
      }
      emitDpadMoveFromKeys()
    }
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    disposers.push(() => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      dpadPressedKeys.clear()
    })
  }

  if (enablePointer && isJoystickFamily && buttons.length > 0) {
    applyCanvasMobileStyles(canvas)

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const p = clientToCanvas(canvas, e.clientX, e.clientY)
      for (const btn of buttons) {
        if (hitCircle(p.x, p.y, btn)) {
          buttonPressed?.set(btn.id, true)
          onAction('button_down', { id: btn.id, x: p.x, y: p.y, source: 'pointer' })
          e.preventDefault()
          break
        }
      }
    }

    const onMouseUp = () => {
      for (const btn of buttons) {
        if (buttonPressed?.get(btn.id)) {
          buttonPressed.set(btn.id, false)
          onAction('button_up', { id: btn.id, source: 'pointer' })
        }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    disposers.push(() => {
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    })
  }

  if (enablePointer && preset === 'portrait_swipe_lane') {
    disposers.push(
      bindCanvasLaneTap(
        canvas,
        layout.viewWidth,
        () => onAction('lane_left', { source: 'pointer' }),
        () => onAction('lane_right', { source: 'pointer' }),
      ),
    )
  }

  if (
    enablePointer &&
    (preset === 'tap' || preset === 'tap_hold' || preset === 'tap_move_marker')
  ) {
    if (preset === 'tap_hold') {
      let holdTimer: ReturnType<typeof setTimeout> | null = null
      let hx = 0
      let hy = 0
      const clearHold = () => {
        if (holdTimer) {
          clearTimeout(holdTimer)
          holdTimer = null
        }
      }
      applyCanvasMobileStyles(canvas)
      const onDown = (e: MouseEvent) => {
        if (e.button !== 0) return
        e.preventDefault()
        const p = clientToCanvas(canvas, e.clientX, e.clientY)
        hx = p.x
        hy = p.y
        onAction('tap', { x: hx, y: hy, source: 'pointer' })
        clearHold()
        holdTimer = setTimeout(() => {
          onAction('hold', { x: hx, y: hy, holdMs: 400, source: 'pointer' })
        }, 400)
      }
      const onUp = () => clearHold()
      canvas.addEventListener('mousedown', onDown)
      window.addEventListener('mouseup', onUp)
      disposers.push(() => {
        canvas.removeEventListener('mousedown', onDown)
        window.removeEventListener('mouseup', onUp)
        clearHold()
      })
    } else {
      disposers.push(
        bindCanvasPointerInput(canvas, (x, y) => {
          onAction('tap', { x, y, source: 'pointer' })
        }),
      )
    }
  }

  return () => {
    for (const d of disposers) d()
  }
}