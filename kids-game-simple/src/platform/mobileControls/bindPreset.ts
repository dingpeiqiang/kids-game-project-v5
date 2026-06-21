import {
  applyCanvasMobileStyles,
  bindCanvasAimAndShoot,
  bindCanvasLaneTap,
  bindCanvasPointerInput,
  bindCanvasPointerTapAndMove,
  clientToCanvas,
} from '../../utils/canvasMobileUtils'
import { bindTiltControl } from './bindTilt'
import { bindDesktopControls } from './bindDesktop'
import { shouldDrawOnScreenControls } from './controlSurface'
import {
  hitCircle,
  mergeLayout,
  portraitDpadButtons,
  quantizeStick,
  stickFromDpadPressed,
} from './layout'
import { loadSavedLayoutOverrides, saveLayoutOverrides } from './layoutPersistence'
import { VirtualJoystick } from './VirtualJoystick'
import type {
  BindMobileControlOptions,
  MobileControlLayout,
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

function mergeSavedLayout(
  gameId: string | undefined,
  viewWidth: number,
  viewHeight: number,
  base: Partial<MobileControlLayout> | undefined,
): Partial<MobileControlLayout> | undefined {
  if (!gameId) return base
  const saved = loadSavedLayoutOverrides(gameId, viewWidth, viewHeight)
  if (!saved) return base
  let buttons = base?.buttons
  if (saved.buttons?.length) {
    if (base?.buttons?.length) {
      buttons = base.buttons.map((b) => {
        const s = saved.buttons!.find((x) => x.id === b.id)
        return s ? { ...b, cx: s.cx, cy: s.cy, r: s.r, label: s.label ?? b.label } : b
      })
    } else {
      buttons = saved.buttons
    }
  }
  return {
    ...base,
    joystick: { ...base?.joystick, ...saved.joystick },
    buttons,
  }
}

function applyJoystickAnchorFromLayout(
  joystick: VirtualJoystick,
  joyCfg: MobileControlLayout['joystick'] | undefined,
): void {
  if (joyCfg?.x == null || joyCfg?.y == null) return
  const j = joystick as VirtualJoystick & {
    config: { x: number; y: number; radius: number; knobRadius: number }
  }
  j.config.x = joyCfg.x
  j.config.y = joyCfg.y
  if (joyCfg.radius != null) j.config.radius = joyCfg.radius
  if (joyCfg.knobRadius != null) j.config.knobRadius = joyCfg.knobRadius
}

export function bindMobileControlPreset(
  canvas: HTMLCanvasElement,
  options: BindMobileControlOptions,
): MobileControlRuntime {
  const persistId = options.layoutPersistenceGameId
  const layoutPartial = mergeSavedLayout(
    persistId,
    options.viewWidth,
    options.viewHeight,
    options.layout,
  )
  let layout = mergeLayout(options.viewWidth, options.viewHeight, layoutPartial)
  const onAction = options.onAction
  const preset = options.preset
  if (preset === 'portrait_dpad') {
    layout = {
      ...layout,
      buttons: layoutPartial?.buttons ?? options.layout?.buttons ?? portraitDpadButtons(layout.viewWidth, layout.viewHeight),
    }
  }
  const persistLayout = () => {
    if (persistId) saveLayoutOverrides(persistId, layout)
  }
  const enableTouch = options.enableTouch !== false
  const enableDesktop = options.enableDesktop !== false
  const onScreenMode = options.onScreenControls ?? 'auto'
  const disposers: Array<() => void> = []

  /** tilt：陀螺仪有输入时优先于左区动态摇杆 */
  let tiltSensorActive = false
  let tiltIdleTimer: ReturnType<typeof setTimeout> | null = null
  const TILT_IDLE_MS = 280
  const markTiltSensor = (mag: number) => {
    if (preset !== 'tilt') return
    if (mag > 0.08) {
      tiltSensorActive = true
      if (tiltIdleTimer) clearTimeout(tiltIdleTimer)
      tiltIdleTimer = setTimeout(() => {
        tiltSensorActive = false
        tiltIdleTimer = null
      }, TILT_IDLE_MS)
    }
  }

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
    preset === 'fighting_stick_buttons' ||
    preset === 'tilt'
  ) {
    const quantize =
      preset === 'joystick_4way' ? '4way' : preset === 'joystick_8way' ? '8way' : joyCfg?.quantize
    joystick = new VirtualJoystick({
      x: joyCfg?.x ?? layout.viewWidth * 0.14,
      y: joyCfg?.y ?? layout.viewHeight * 0.82,
      radius: joyCfg?.radius ?? Math.min(layout.viewWidth, layout.viewHeight) * 0.11,
      knobRadius: joyCfg?.knobRadius ?? Math.min(layout.viewWidth, layout.viewHeight) * 0.046,
      deadZone: joyCfg?.deadZone ?? 0.12,
      dynamic: preset === 'joystick_dynamic' || preset === 'tilt',
    })
    applyJoystickAnchorFromLayout(joystick, layout.joystick)
    if (quantize) layout.joystick = { ...joyCfg, quantize }

    const zoneRatio = joyCfg?.dynamicZoneWidthRatio ?? 0.42
    const buttons = layout.buttons ?? []
    const touchToButton = new Map<number, string>()
    const layoutEdit = options.layoutEditEnabled === true && !!persistId
    let layoutDrag: { touchId: number; target: 'button'; id: string } | {
      touchId: number
      target: 'joystick'
    } | null = null

    const emitMove = () => {
      if (!joystick) return
      if (preset === 'tilt' && tiltSensorActive) return
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

        if (layoutEdit) {
          for (const btn of buttons) {
            if (hitCircle(p.x, p.y, btn)) {
              layoutDrag = { touchId: t.identifier, target: 'button', id: btn.id }
              e.preventDefault()
              return
            }
          }
          const isFixedJoy =
            preset !== 'joystick_dynamic' && preset !== 'tilt' && joystick!.containsPoint(p.x, p.y)
          if (isFixedJoy) {
            layoutDrag = { touchId: t.identifier, target: 'joystick' }
            e.preventDefault()
            return
          }
        }

        const inJoyZone =
          preset === 'joystick_dynamic' || preset === 'tilt'
            ? p.x < layout.viewWidth * zoneRatio
            : joystick!.containsPoint(p.x, p.y) || p.x < layout.viewWidth * zoneRatio

        if (inJoyZone && !joystick!.getState().active && !layoutDrag) {
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
      if (layoutDrag) {
        for (let i = 0; i < e.touches.length; i++) {
          const t = e.touches[i]
          if (t.identifier !== layoutDrag.touchId) continue
          const p = clientToCanvas(canvas, t.clientX, t.clientY)
          if (layoutDrag.target === 'button') {
            const btn = buttons.find((b) => b.id === layoutDrag!.id)
            if (btn) {
              btn.cx = p.x
              btn.cy = p.y
            }
          } else {
            layout.joystick = { ...layout.joystick, x: p.x, y: p.y }
            applyJoystickAnchorFromLayout(joystick!, layout.joystick)
          }
          e.preventDefault()
          break
        }
        return
      }
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
        if (layoutDrag?.touchId === t.identifier) {
          persistLayout()
          layoutDrag = null
          e.preventDefault()
          continue
        }
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

  const swipeAxis = options.swipePanAxis ?? 'both'
  const filterSwipeDelta = (dx: number, dy: number) => {
    if (swipeAxis === 'horizontal') return { dx, dy: 0 }
    if (swipeAxis === 'vertical') return { dx: 0, dy }
    return { dx, dy }
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
          const raw = filterSwipeDelta(x - lastX, y - lastY)
          onAction('swipe', {
            dx: raw.dx,
            dy: raw.dy,
            x,
            y,
            source: 'pointer',
          })
          lastX = x
          lastY = y
        },
        (x, y) => {
          tracking = true
          lastX = x
          lastY = y
          onAction('tap', { x, y, source: 'pointer' })
        },
        { trackOutsideCanvas: options.trackOutsideCanvas },
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

  if (preset === 'portrait_dpad') {
    const dpadButtons = layout.buttons ?? []
    const dpadPressed = new Set<string>()
    const touchToDpad = new Map<number, string>()

    const emitDpadMove = (source: 'touch' | 'pointer' | 'keyboard') => {
      const { x, y } = stickFromDpadPressed(dpadPressed)
      const mag = x === 0 && y === 0 ? 0 : 1
      onAction('move', {
        stickX: x * mag,
        stickY: y * mag,
        stickMagnitude: mag,
        stickAngle: Math.atan2(y, x) * (180 / Math.PI),
        source,
      })
    }

    if (enableTouch) {
      const onTouchStart = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i]
          const p = clientToCanvas(canvas, t.clientX, t.clientY)
          for (const btn of dpadButtons) {
            if (hitCircle(p.x, p.y, btn)) {
              touchToDpad.set(t.identifier, btn.id)
              dpadPressed.add(btn.id)
              buttonPressed.set(btn.id, true)
              onAction('button_down', { id: btn.id, x: p.x, y: p.y, source: 'touch' })
              emitDpadMove('touch')
              e.preventDefault()
              break
            }
          }
        }
      }
      const onTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i]
          const bid = touchToDpad.get(t.identifier)
          if (bid) {
            dpadPressed.delete(bid)
            buttonPressed.set(bid, false)
            onAction('button_up', { id: bid, source: 'touch' })
            touchToDpad.delete(t.identifier)
          }
        }
        emitDpadMove('touch')
      }
      applyCanvasMobileStyles(canvas)
      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd)
      canvas.addEventListener('touchcancel', onTouchEnd)
      disposers.push(() => {
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchend', onTouchEnd)
        canvas.removeEventListener('touchcancel', onTouchEnd)
        dpadPressed.clear()
      })
    }
  }

  if (enableTouch && preset === 'tilt') {
    disposers.push(
      bindTiltControl({
        onAction: (action, payload) => {
          if (action === 'move') markTiltSensor(payload.stickMagnitude ?? 0)
          onAction(action, payload)
        },
      }),
    )
  }

  if ((enableTouch || enableDesktop) && preset === 'swipe_flick') {
    let lastX = 0
    let lastY = 0
    let prevX = 0
    let prevY = 0
    let prevT = 0
    let flickVx = 0
    let flickVy = 0
    let tracking = false

    disposers.push(
      bindCanvasPointerTapAndMove(
        canvas,
        (x, y) => {
          const now = performance.now()
          if (!tracking) {
            tracking = true
            lastX = x
            lastY = y
            prevX = x
            prevY = y
            prevT = now
            return
          }
          const dt = Math.max(8, now - prevT)
          flickVx = (x - prevX) / dt
          flickVy = (y - prevY) / dt
          prevX = x
          prevY = y
          prevT = now
          const raw = filterSwipeDelta(x - lastX, y - lastY)
          onAction('swipe', { dx: raw.dx, dy: raw.dy, x, y, source: 'pointer' })
          lastX = x
          lastY = y
        },
        (x, y) => {
          tracking = true
          lastX = x
          lastY = y
          prevX = x
          prevY = y
          prevT = performance.now()
          flickVx = 0
          flickVy = 0
          onAction('tap', { x, y, source: 'pointer' })
        },
        { trackOutsideCanvas: options.trackOutsideCanvas },
      ),
    )

    const onFlickUp = () => {
      if (!tracking) return
      tracking = false
      const filtered = filterSwipeDelta(flickVx * 1000, flickVy * 1000)
      const vx = filtered.dx / 1000
      const vy = filtered.dy / 1000
      if (Math.hypot(vx, vy) > 0.12) {
        onAction('flick', {
          vx,
          vy,
          x: prevX,
          y: prevY,
          source: 'pointer',
        })
      }
    }
    window.addEventListener('mouseup', onFlickUp)
    window.addEventListener('touchend', onFlickUp)
    disposers.push(() => {
      window.removeEventListener('mouseup', onFlickUp)
      window.removeEventListener('touchend', onFlickUp)
    })
  }

  if ((enableTouch || enableDesktop) && preset === 'gesture_combo') {
    const doubleMs = options.doubleTapMs ?? 320
    let lastTapT = 0
    let lastTapX = 0
    let lastTapY = 0

    const onComboTap = (x: number, y: number, source: 'touch' | 'pointer') => {
      const now = performance.now()
      if (now - lastTapT <= doubleMs && Math.hypot(x - lastTapX, y - lastTapY) < 48) {
        onAction('double_tap', { x, y, source })
        lastTapT = 0
        return
      }
      lastTapT = now
      lastTapX = x
      lastTapY = y
      onAction('tap', { x, y, source })
    }

    if (enableTouch) {
      const onTouchTap = (e: TouchEvent) => {
        const t = e.changedTouches[0]
        if (!t) return
        e.preventDefault()
        const p = clientToCanvas(canvas, t.clientX, t.clientY)
        onComboTap(p.x, p.y, 'touch')
      }
      applyCanvasMobileStyles(canvas)
      canvas.addEventListener('touchstart', onTouchTap, { passive: false })
      disposers.push(() => canvas.removeEventListener('touchstart', onTouchTap))
    }
    if (enableDesktop) {
      disposers.push(
        bindCanvasPointerInput(canvas, (x, y) => {
          onComboTap(x, y, 'pointer')
        }),
      )
    }
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
      if (tiltIdleTimer) {
        clearTimeout(tiltIdleTimer)
        tiltIdleTimer = null
      }
      tiltSensorActive = false
      for (const d of disposers) d()
      disposers.length = 0
      joystick = null
    },
  }
}