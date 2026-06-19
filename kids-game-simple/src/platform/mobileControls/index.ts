export {
  bindMobileControlPreset,
  type MobileControlRuntime,
} from './bindPreset'
export { drawMobileControlOverlay } from './drawOverlay'
export {
  defaultActionLayout,
  mergeLayout,
  quantizeStick,
  hitCircle,
} from './layout'
export {
  getGameControlPreset,
  listGameControlPresets,
  getPresetGuideHint,
  getCombinedControlGuideHint,
  CONTROL_PILOT_GAME_IDS,
  isControlPilotGame,
  getControlPilotPreset,
  type ControlPilotGameId,
} from './gameControlRegistry'
export { bindDesktopControls, type BindDesktopOptions } from './bindDesktop'
export {
  DEFAULT_KEYBOARD_BY_PRESET,
  mergeKeyboardProfile,
  getDesktopGuideHint,
  type KeyboardPresetProfile,
  type KeyboardButtonMap,
} from './keyboardMapping'
export {
  isTouchPrimaryDevice,
  shouldDrawOnScreenControls,
  getPrimaryControlSurface,
  type ControlSurface,
} from './controlSurface'
export {
  VirtualJoystick,
  type JoystickConfig,
  type JoystickOutput,
  type JoystickState,
} from './VirtualJoystick'
export type {
  ControlInputSource,
  MobileControlPresetId,
  StickQuantize,
  JoystickLayout,
  TouchButtonLayout,
  MobileControlLayout,
  MobileControlAction,
  MobileControlActionPayload,
  MobileControlHandler,
  BindMobileControlOptions,
  TouchButtonSnapshot,
  MobileControlSnapshot,
} from './types'