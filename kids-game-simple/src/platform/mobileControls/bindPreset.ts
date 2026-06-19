import {
  applyCanvasMobileStyles,
  bindCanvasAimAndShoot,
  bindCanvasLaneTap,
  bindCanvasPointerInput,
  bindCanvasPointerTapAndMove,
  clientToCanvas,
} from '../../utils/canvasMobileUtils'
import { bindDesktopControls } from './bindDesktop'
import { shouldDrawOnScreenControls } from './controlSurface'
import { hitCircle, mergeLayout, quantizeStick } from './layout'
import { VirtualJoystick } from './VirtualJoystick'
import type {
  BindMobileControlOptions,
  MobileControlSnapshot,
  TouchButtonLayout,
} from './types'

export interface MobileControlRuntime {
  getSnapshot: () => MobileControlSnapshot
  /** 是否绘制屏上摇杆/按钮（PC 默认 false） */
  shouldDrawOverlay: () => boolean
  /** 摇杆类预设：每帧同步到游戏 input 前可读 */
  getJoystick: () => VirtualJoystick | null
  dispose: () => void
}

export function bindMobileControlPreset(
  canvas: HTMLCanvasElement,
  options: BindMobileControlOptions,
): MobileControlRuntime {
  const layout = mergeLayout(options.viewWidth, options.viewHeight, options.layout)
  const onAction = options.onAction
  const preset = options.preset
  const enableTouch = options.enableTouch !== false
  const enableDesktop = options.enableDesktop !== false
  const onScreenMode = options.onScreenControls ?? 'auto'
  const disposers: Array<() => void> = []

  const shouldDrawOverlay = (): boolean => {
    if (onScreenMode === 'never') return false
    if (onScreenMode === 'always') return true
    return shouldDrawOnScreenControls()
  }

  const buttonPressed = new Map<string, boolean>()
  for (const b of layout.buttons ?? []) {
    buttonPressed.set(b.id, false)
  }

  let joystick: VirtualJoystick | null = null
  const joyCfg = layout.joystick
  if (
    preset === 'joystick_action' ||
    preset === 'joystick_dynamic' ||
    preset === 'joystick_4way' ||
    preset === 'joystick_8way' ||
    preset === 'fighting_stick_buttons'
  ) {
    const quantize =
      preset === 'joystick_4way' ? '4way' : preset === 'joystick_8way' ? '8way' : joyCfg?.quantize
    joystick = new VirtualJoystick({
      x: joyCfg?.x ?? layout.viewWidth * 0.14,
      y: joyCfg?.y ?? layout.viewHeight * 0.82,
      radius: joyCfg?.radius ?? Math.min(layout.viewWidth, layout.viewHeight) * 0.11,
      knobRadius: joyCfg?.knobRadius ?? Math.min(layout.viewWidth, layout.viewHeight) * 0.046,
      deadZone: joyCfg?.deadZone ?? 0.12,
      dynamic: preset === 'joystick_dynamic',
    })
    if (quantize) layout.joystick = { ...joyCfg, quantize }

    const zoneRatio = joyCfg?.dynamicZoneWidthRatio ?? 0.42
    const buttons = layout.buttons ?? []
    const touchToButton = new Map<number, string>()

    const emitMove = () => {
      if (!joystick) return
      const out = joystick.getState().output
      let sx = out.x
      let sy = out.y
      const q = layout.joystick?.quantize ?? 'analog'
      if (q !== 'analog') {
        const qv = quantizeStick(sx, sy, q)
        sx = qv.x * out.magnitude
        sy = qv.y * out.magnitude
      }
      onAction('move', {
        stickX: sx,
        stickY: sy,
        stickAngle: out.angle,
        stickMagnitude: out.magnitude,
        source: 'touch',
      })
    }

    if (enableTouch) {
    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        const p = clientToCanvas(canvas, t.clientX, t.clientY)
        const inJoyZone =
          preset === 'joystick_dynamic'
            ? p.x < layout.viewWidth * zoneRatio
            : joystick!.containsPoint(p.x, p.y) || p.x < layout.viewWidth * zoneRatio

        if (inJoyZone && !joystick!.getState().active) {
          joystick!.activate(p.x, p.y, t.identifier)
          e.preventDefault()
          emitMove()
          continue
        }

        for (const btn of buttons) {
          if (hitCircle(p.x, p.y, btn)) {
            touchToButton.set(t.identifier, btn.id)
            buttonPressed.set(btn.id, true)
            onAction('button_down', { id: btn.id, x: p.x, y: p.y, source: 'touch' })
            e.preventDefault()
            break
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const joyId = joystick!.getActiveTouchId()
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i]
        if (t.identifier !== joyId) continue
        const p = clientToCanvas(canvas, t.clientX, t.clientY)
        joystick!.update(p.x, p.y)
        e.preventDefault()
        emitMove()
        break
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        joystick!.deactivate(t.identifier)
        const bid = touchToButton.get(t.identifier)
        if (bid) {
          buttonPressed.set(bid, false)
          onAction('button_up', { id: bid, source: 'touch' })
          touchToButton.delete(t.identifier)
        }
      }
      emitMove()
    }

    applyCanvasMobileStyles(canvas)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)
    disposers.push(() => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    })
    }
  }

  if (
    (enableTouch || enableDesktop) &&
    (preset === 'tap' || preset === 'tap_hold' || preset === 'tap_move_marker')
  ) {
    const holdMs = options.holdThresholdMs ?? 400
    let holdTimer: ReturnType<typeof setTimeout> | null = null
    let downX = 0
    let downY = 0

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer)
        holdTimer = null
      }
    }

    const fireTap = (x: number, y: number, source: 'touch' | 'pointer') => {
      downX = x
      downY = y
      onAction('tap', { x, y, source })
      if (preset === 'tap_hold') {
        clearHold()
        holdTimer = setTimeout(() => {
          onAction('hold', { x: downX, y: downY, holdMs, source })
        }, holdMs)
      }
    }

    const onUp = () => clearHold()

    if (enableTouch) {
      if (enableDesktop) {
        const onTouchTap = (e: TouchEvent) => {
          const t = e.changedTouches[0]
          if (!t) return
          e.preventDefault()
          const p = clientToCanvas(canvas, t.clientX, t.clientY)
          fireTap(p.x, p.y, 'touch')
        }
        canvas.addEventListener('touchstart', onTouchTap, { passive: false })
        canvas.addEventListener('touchend', onUp)
        disposers.push(() => {
          canvas.removeEventListener('touchstart', onTouchTap)
          canvas.removeEventListener('touchend', onUp)
          clearHold()
        })
      } else {
        disposers.push(
          bindCanvasPointerInput(canvas, (x, y) => {
            fireTap(x, y, 'pointer')
          }),
        )
        canvas.addEventListener('touchend', onUp)
        canvas.addEventListener('mouseup', onUp)
        disposers.push(() => {
          canvas.removeEventListener('touchend', onUp)
          canvas.removeEventListener('mouseup', onUp)
          clearHold()
        })
      }
    }
    // PC 点击由 bindDesktopControls 的 bindCanvasPointerInput 处理（enableDesktop）
  }

  if (enableTouch && preset === 'portrait_swipe_lane') {
    disposers.push(
      bindCanvasLaneTap(
        canvas,
        layout.viewWidth,
        () => onAction('lane_left', { source: 'touch' }),
        () => onAction('lane_right', { source: 'touch' }),
      ),
    )
  }

  if ((enableTouch || enableDesktop) && preset === 'aim_drag_release') {
    disposers.push(
      bindCanvasAimAndShoot(
        canvas,
        (x, y, chargeTime) => onAction('aim', { x, y, chargeTime, source: 'pointer' }),
        (x, y, chargeTime) => onAction('shoot', { x, y, chargeTime, source: 'pointer' }),
        () => onAction('button_up', { id: 'aim_cancel', source: 'pointer' }),
      ),
    )
  }

  if ((enableTouch || enableDesktop) && preset === 'swipe_pan') {
    let lastX = 0
    let lastY = 0
    let tracking = false
    disposers.push(
      bindCanvasPointerTapAndMove(
        canvas,
        (x, y) => {
          if (!tracking) {
            tracking = true
            lastX = x
            lastY = y
            return
          }
          onAction('swipe', { dx: x - lastX, dy: y - lastY, x, y })
          lastX = x
          lastY = y
        },
        (x, y) => {
          tracking = true
          lastX = x
          lastY = y
          onAction('tap', { x, y })
        },
      ),
    )
  }

  if ((enableTouch || enableDesktop) && preset === 'drag_select_rect') {
    let x1 = 0
    let y1 = 0
    let dragging = false
    applyCanvasMobileStyles(canvas)

    const onDown = (e: TouchEvent | MouseEvent) => {
      const pt =
        'touches' in e
          ? clientToCanvas(canvas, e.touches[0].clientX, e.touches[0].clientY)
          : clientToCanvas(canvas, (e as MouseEvent).clientX, (e as MouseEvent).clientY)
      x1 = pt.x
      y1 = pt.y
      dragging = true
      e.preventDefault()
    }

    const onUp = (e: TouchEvent | MouseEvent) => {
      if (!dragging) return
      dragging = false
      const pt =
        'changedTouches' in e && e.changedTouches.length
          ? clientToCanvas(canvas, e.changedTouches[0].clientX, e.changedTouches[0].clientY)
          : 'clientX' in e
            ? clientToCanvas(canvas, (e as MouseEvent).clientX, (e as MouseEvent).clientY)
            : { x: x1, y: y1 }
      onAction('select_rect', { rect: { x1, y1, x2: pt.x, y2: pt.y } })
    }

    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchend', onUp)
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mouseup', onUp)
    disposers.push(() => {
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchend', onUp)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mouseup', onUp)
    })
  }

  if (enableDesktop) {
    disposers.push(
      bindDesktopControls({
        canvas,
        preset,
        layout,
        onAction,
        keyboardProfile: options.keyboardProfile,
        buttonPressed,
      }),
    )
  }

  const getSnapshot = (): MobileControlSnapshot => {
    const out = joystick?.getState().output
    const buttons: MobileControlSnapshot['buttons'] = (layout.buttons ?? []).map(
      (b: TouchButtonLayout) => ({
        id: b.id,
        label: b.label,
        cx: b.cx,
        cy: b.cy,
        r: b.r,
        pressed: buttonPressed.get(b.id) ?? false,
      }),
    )
    return {
      preset,
      joystickActive: joystick?.getState().active ?? false,
      stickX: out?.x ?? 0,
      stickY: out?.y ?? 0,
      buttons,
    }
  }

  return {
    getSnapshot,
    shouldDrawOverlay,
    getJoystick: () => joystick,
    dispose: () => {
      for (const d of disposers) d()
      disposers.length = 0
      joystick = null
    },
  }
}