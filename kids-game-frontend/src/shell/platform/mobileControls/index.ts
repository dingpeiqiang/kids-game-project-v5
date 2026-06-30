export {
  bindMobileControlPreset,
  type MobileControlRuntime,
} from './bindPreset'
export {
  bindGameCanvasControls,
  type BindGameCanvasControlsOptions,
} from './bindGameCanvasControls'
export {
  bindGame3dCanvasControls,
  type BindGame3dCanvasControlsOptions,
} from './bindGame3dCanvasControls'
export {
  bindHorizontalSwipePan,
  type BindHorizontalSwipePanOptions,
} from './bindHorizontalSwipePan'
export { mergeGuideWithControlHint } from './mergeGuideWithControlHint'
export { drawMobileControlOverlay } from './drawOverlay'
export {
  defaultActionLayout,
  portraitActionLayout,
  mergeLayout,
  quantizeStick,
  hitCircle,
  portraitDpadButtons,
  stickFromDpadPressed,
  dpadButtonToStick,
} from './layout'
export {
  MOBILE_CONTROL_LAYOUT_STORAGE_KEY,
  loadSavedLayoutOverrides,
  saveLayoutOverrides,
  clearSavedLayoutOverrides,
  listSavedLayoutGameIds,
  type StoredLayoutEntryV1,
  type StoredLayoutStoreV1,
} from './layoutPersistence'
export { bindTiltControl, type BindTiltOptions } from './bindTilt'
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