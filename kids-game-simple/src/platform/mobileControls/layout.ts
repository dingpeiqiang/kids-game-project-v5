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