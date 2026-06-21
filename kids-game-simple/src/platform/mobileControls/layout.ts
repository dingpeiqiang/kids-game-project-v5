import type { JoystickLayout, MobileControlLayout, TouchButtonLayout } from './types'

/** 横屏动作类默认布局（文档 §2） */
export function defaultActionLayout(viewWidth: number, viewHeight: number): MobileControlLayout {
  const min = Math.min(viewWidth, viewHeight)
  const r = min * 0.11
  return {
    viewWidth,
    viewHeight,
    joystick: {
      x: viewWidth * 0.14,
      y: viewHeight * 0.82,
      radius: r,
      knobRadius: r * 0.42,
      deadZone: 0.12,
      dynamicZoneWidthRatio: 0.42,
      quantize: 'analog',
    },
    buttons: [
      {
        id: 'jump',
        label: '跳',
        cx: viewWidth - min * 0.12,
        cy: viewHeight * 0.78,
        r: min * 0.07,
      },
      {
        id: 'attack',
        label: 'A',
        cx: viewWidth - min * 0.22,
        cy: viewHeight * 0.72,
        r: min * 0.065,
      },
    ],
  }
}

/**
 * 竖屏长屏动作类（俯视角坦克等）：摇杆/主键贴近底部拇指区，避免横屏 defaultActionLayout 在 H>>W 时控件过小。
 */
export function portraitActionLayout(viewWidth: number, viewHeight: number): MobileControlLayout {
  const min = Math.min(viewWidth, viewHeight)
  const r = min * 0.13
  const btnR = min * 0.1
  return {
    viewWidth,
    viewHeight,
    joystick: {
      x: viewWidth * 0.16,
      y: viewHeight * 0.9,
      radius: r,
      knobRadius: r * 0.42,
      deadZone: 0.12,
      dynamicZoneWidthRatio: 0.48,
      quantize: '4way',
    },
    buttons: [
      {
        id: 'attack',
        label: '射',
        cx: viewWidth * 0.84,
        cy: viewHeight * 0.9,
        r: btnR,
      },
    ],
  }
}

/** 竖屏四向键（文档 §1 portrait_dpad） */
export function portraitDpadButtons(viewWidth: number, viewHeight: number): TouchButtonLayout[] {
  const min = Math.min(viewWidth, viewHeight)
  const r = min * 0.08
  const cx = viewWidth * 0.5
  const cy = viewHeight * 0.88
  const gap = r * 1.35
  return [
    { id: 'dpad_up', label: '↑', cx, cy: cy - gap, r },
    { id: 'dpad_down', label: '↓', cx, cy: cy + gap, r },
    { id: 'dpad_left', label: '←', cx: cx - gap, cy, r },
    { id: 'dpad_right', label: '→', cx: cx + gap, cy, r },
  ]
}

export function mergeLayout(
  viewWidth: number,
  viewHeight: number,
  partial?: Partial<MobileControlLayout>,
): MobileControlLayout {
  const base = defaultActionLayout(viewWidth, viewHeight)
  if (!partial) return base
  return {
    viewWidth,
    viewHeight,
    joystick: { ...base.joystick, ...partial.joystick },
    buttons: partial.buttons ?? base.buttons,
  }
}

/** dpad 按钮 id → 方向向量（用于 move 合成） */
export function dpadButtonToStick(id: string): { x: number; y: number } {
  switch (id) {
    case 'dpad_up':
      return { x: 0, y: -1 }
    case 'dpad_down':
      return { x: 0, y: 1 }
    case 'dpad_left':
      return { x: -1, y: 0 }
    case 'dpad_right':
      return { x: 1, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

export function stickFromDpadPressed(pressed: Set<string>): { x: number; y: number } {
  let x = 0
  let y = 0
  for (const id of pressed) {
    const v = dpadButtonToStick(id)
    x += v.x
    y += v.y
  }
  const len = Math.hypot(x, y)
  if (len > 1) {
    x /= len
    y /= len
  }
  return { x, y }
}

export function quantizeStick(
  x: number,
  y: number,
  mode: JoystickLayout['quantize'],
): { x: number; y: number } {
  if (!mode || mode === 'analog') return { x, y }
  const angle = Math.atan2(y, x)
  if (mode === '4way') {
    const a = angle * (180 / Math.PI)
    if (a >= -45 && a < 45) return { x: 1, y: 0 }
    if (a >= 45 && a < 135) return { x: 0, y: 1 }
    if (a >= -135 && a < -45) return { x: 0, y: -1 }
    return { x: -1, y: 0 }
  }
  // 8way
  const step = Math.PI / 4
  const snapped = Math.round(angle / step) * step
  return { x: Math.cos(snapped), y: Math.sin(snapped) }
}

export function hitCircle(x: number, y: number, btn: TouchButtonLayout): boolean {
  const dx = x - btn.cx
  const dy = y - btn.cy
  return dx * dx + dy * dy <= btn.r * btn.r
}