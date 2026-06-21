import type { MobileControlPresetId } from './types'

/** 逻辑按键 → 触屏按钮 id（与 layout.buttons 对齐） */
export interface KeyboardButtonMap {
  [keyCode: string]: string
}

export interface KeyboardPresetProfile {
  /** 方向：合成 stick，magnitude 默认 1 */
  movementKeys?: {
    up: string[]
    down: string[]
    left: string[]
    right: string[]
  }
  buttons?: KeyboardButtonMap
  /** 分屏 / 赛道 */
  laneLeft?: string[]
  laneRight?: string[]
}

const MOVE_WASD = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
}

const MOVE_ARROWS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
}

/** 各 preset 默认 PC 键位（可被游戏 override） */
export const DEFAULT_KEYBOARD_BY_PRESET: Record<MobileControlPresetId, KeyboardPresetProfile> = {
  tap: {},
  tap_hold: {},
  tap_move_marker: {},
  joystick_action: {
    movementKeys: MOVE_WASD,
    buttons: {
      Space: 'jump',
      KeyJ: 'attack',
      KeyK: 'skill1',
      KeyL: 'skill2',
      Digit1: 'skill1',
      Digit2: 'skill2',
      Digit3: 'skill3',
      Digit4: 'skill4',
      KeyU: 'skill3',
      KeyI: 'skill4',
      ShiftLeft: 'run',
      ShiftRight: 'run',
    },
  },
  joystick_dynamic: {
    movementKeys: MOVE_WASD,
    buttons: {
      Space: 'jump',
      KeyJ: 'attack',
      KeyZ: 'attack',
    },
  },
  joystick_4way: { movementKeys: MOVE_ARROWS },
  joystick_8way: { movementKeys: MOVE_WASD },
  fighting_stick_buttons: {
    movementKeys: MOVE_WASD,
    buttons: {
      KeyJ: 'attack',
      KeyK: 'skill1',
      KeyL: 'skill2',
      KeyU: 'skill3',
      KeyI: 'skill4',
      KeyO: 'skill5',
      KeyP: 'skill6',
    },
  },
  swipe_pan: {
    movementKeys: MOVE_ARROWS,
  },
  swipe_flick: {},
  aim_drag_release: {},
  drag_select_rect: {},
  portrait_swipe_lane: {
    laneLeft: ['ArrowLeft', 'KeyA'],
    laneRight: ['ArrowRight', 'KeyD'],
  },
  portrait_dpad: { movementKeys: MOVE_ARROWS },
  tilt: {
    movementKeys: MOVE_ARROWS,
    buttons: { Space: 'jump' },
  },
  gesture_combo: {},
}

export function mergeKeyboardProfile(
  preset: MobileControlPresetId,
  override?: Partial<KeyboardPresetProfile>,
): KeyboardPresetProfile {
  const base = DEFAULT_KEYBOARD_BY_PRESET[preset] ?? {}
  if (!override) return { ...base }
  return {
    movementKeys: override.movementKeys ?? base.movementKeys,
    buttons: { ...base.buttons, ...override.buttons },
    laneLeft: override.laneLeft ?? base.laneLeft,
    laneRight: override.laneRight ?? base.laneRight,
  }
}

export function computeStickFromKeys(
  profile: KeyboardPresetProfile,
  keysDown: Set<string>,
): { x: number; y: number } {
  const m = profile.movementKeys
  if (!m) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  if (m.left.some((k) => keysDown.has(k))) x -= 1
  if (m.right.some((k) => keysDown.has(k))) x += 1
  if (m.up.some((k) => keysDown.has(k))) y -= 1
  if (m.down.some((k) => keysDown.has(k))) y += 1
  const len = Math.hypot(x, y)
  if (len > 1) {
    x /= len
    y /= len
  }
  return { x, y }
}

export function getDesktopGuideHint(preset: MobileControlPresetId): string {
  const hints: Partial<Record<MobileControlPresetId, string>> = {
    tap: '🖱️ 鼠标左键点击',
    tap_hold: '🖱️ 左键点击 / 长按',
    joystick_action: '⌨️ WASD 或方向键移动 · 空格跳跃 · J 攻击 · 1–4 技能（若已映射）',
    joystick_dynamic: '⌨️ WASD 移动 · 空格跳跃 · J/Z 攻击',
    joystick_4way: '⌨️ 方向键四向移动',
    joystick_8way: '⌨️ WASD 八向移动',
    aim_drag_release: '🖱️ 按住左键拖动瞄准 · 松手发射',
    portrait_swipe_lane: '⌨️ A/D 或 ←/→ 换道',
    swipe_pan: '⌨️ 方向键或 WASD · 鼠标拖拽',
    drag_select_rect: '🖱️ 左键拖拽框选',
    fighting_stick_buttons: '⌨️ WASD + J/K/L/U/I/O/P 技能键',
    portrait_dpad: '⌨️ 方向键 · 或点击屏上四向键',
    tilt: '⌨️ 方向键（无陀螺仪时）· 📱 倾斜设备',
    swipe_flick: '🖱️ 拖拽 · 快速松手甩动',
    gesture_combo: '🖱️ 双击 · 单击',
  }
  return hints[preset] ?? hints.tap ?? '🖱️ 鼠标 / ⌨️ 键盘'
}