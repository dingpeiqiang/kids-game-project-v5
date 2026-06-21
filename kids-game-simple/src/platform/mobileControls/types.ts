/**
 * 移动终端操作预设与运行时类型（见 docs/MOBILE_CONTROL_DESIGN.md）
 */

/** 与策划分类、文档 §1 对齐 */
export type MobileControlPresetId =
  | 'tap'
  | 'tap_hold'
  | 'joystick_action'
  | 'joystick_dynamic'
  | 'joystick_4way'
  | 'joystick_8way'
  | 'swipe_pan'
  | 'swipe_flick'
  | 'aim_drag_release'
  | 'drag_select_rect'
  | 'portrait_swipe_lane'
  | 'portrait_dpad'
  | 'fighting_stick_buttons'
  | 'tilt'
  | 'gesture_combo'
  | 'tap_move_marker'

export type StickQuantize = 'analog' | '4way' | '8way'

export interface JoystickLayout {
  /** 固定摇杆锚点（逻辑坐标），未设则用默认左下 */
  x?: number
  y?: number
  radius?: number
  knobRadius?: number
  deadZone?: number
  /** 随点摇杆：按下点落在画布左宽比例内则激活 */
  dynamicZoneWidthRatio?: number
  quantize?: StickQuantize
}

export interface TouchButtonLayout {
  id: string
  label?: string
  /** 圆心 + 半径（与 superMario / dnf 一致） */
  cx: number
  cy: number
  r: number
}

export interface MobileControlLayout {
  viewWidth: number
  viewHeight: number
  joystick?: JoystickLayout
  buttons?: TouchButtonLayout[]
}

export type MobileControlAction =
  | 'tap'
  | 'hold'
  | 'move'
  | 'button_down'
  | 'button_up'
  | 'aim'
  | 'shoot'
  | 'lane_left'
  | 'lane_right'
  | 'swipe'
  | 'flick'
  | 'double_tap'
  | 'select_rect'

export type ControlInputSource = 'touch' | 'pointer' | 'keyboard' | 'sensor'

export interface MobileControlActionPayload {
  x?: number
  y?: number
  stickX?: number
  stickY?: number
  stickAngle?: number
  stickMagnitude?: number
  id?: string
  holdMs?: number
  chargeTime?: number
  dx?: number
  dy?: number
  vx?: number
  vy?: number
  rect?: { x1: number; y1: number; x2: number; y2: number }
  /** PC / 触屏来源，便于游戏区分连击与 UI 反馈 */
  source?: ControlInputSource
}

export type MobileControlHandler = (
  action: MobileControlAction,
  payload: MobileControlActionPayload,
) => void

export interface BindMobileControlOptions {
  preset: MobileControlPresetId
  viewWidth: number
  viewHeight: number
  layout?: Partial<MobileControlLayout>
  /** 长按阈值 ms */
  holdThresholdMs?: number
  onAction: MobileControlHandler
  /** 绑定触屏（默认 true） */
  enableTouch?: boolean
  /** 绑定 PC 键鼠（默认 true，与触屏可同时存在） */
  enableDesktop?: boolean
  /** PC 键位覆盖（见 keyboardMapping.ts） */
  keyboardProfile?: Partial<import('./keyboardMapping').KeyboardPresetProfile>
  /** 屏上摇杆/按钮：auto=仅触屏主设备显示 */
  onScreenControls?: 'auto' | 'always' | 'never'
  /** swipe_pan：滑出画布仍跟手（切水果） */
  trackOutsideCanvas?: boolean
  /** swipe_pan / swipe_flick：仅水平或仅垂直 delta */
  swipePanAxis?: 'both' | 'horizontal' | 'vertical'
  /** gesture_combo：两次 tap 间隔上限 ms */
  doubleTapMs?: number
  /** 从 localStorage 读取 `mobileControlLayout:v1` 并按视口缩放（`bindGameCanvasControls` 默认带 gameId） */
  layoutPersistenceGameId?: string
  /** 开发/调试：拖拽屏上按钮后松手写入持久化（需同时设 layoutPersistenceGameId） */
  layoutEditEnabled?: boolean
}

export interface TouchButtonSnapshot {
  id: string
  label?: string
  cx: number
  cy: number
  r: number
  pressed: boolean
}

export interface MobileControlSnapshot {
  preset: MobileControlPresetId
  joystickActive: boolean
  stickX: number
  stickY: number
  buttons: TouchButtonSnapshot[]
}