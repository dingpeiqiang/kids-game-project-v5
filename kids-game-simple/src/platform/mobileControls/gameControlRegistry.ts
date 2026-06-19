import { getDesktopGuideHint } from './keyboardMapping'
import type { MobileControlPresetId } from './types'

/**
 * 各 gameId 默认操作预设（可被游戏内显式 override）
 * 新增游戏请在此登记，并与 guide.ops 一致
 */
const GAME_CONTROL_PRESETS: Record<string, MobileControlPresetId> = {
  // 消除 / 点击
  eliminate: 'tap',
  match3: 'tap',
  jewelMatch: 'tap',
  bubbleShooter: 'aim_drag_release',
  pop: 'tap',
  whackMole: 'tap',
  colorTap: 'tap',
  memoryMatch: 'tap',
  animalMatch: 'tap',

  // 休闲切割 / 蓄力
  fruitSlice: 'swipe_pan',
  cookieCut: 'tap_hold',

  // 跑酷 / 分屏
  /** 横向跟手拖拽 + 方向键（见 dodge/game.ts） */
  dodge: 'swipe_pan',
  racingRun: 'tap',
  neonRun: 'portrait_swipe_lane',
  slimeJump: 'tap',
  bouncePath: 'tap',
  starCatcher: 'tap',

  // 方向 / 堆叠
  snake: 'swipe_pan',
  tetris: 'swipe_pan',
  stack: 'tap',
  sort: 'tap',
  colorSort: 'tap',

  // 平台 / 动作 RPG
  superMario: 'joystick_dynamic',
  contraRpg: 'joystick_action',
  dnfRpg: 'joystick_action',
  wangzheRpg: 'joystick_action',
  kingBaby: 'joystick_action',
  beatDragon: 'joystick_action',
  voxelRealm: 'joystick_dynamic',

  // 射击
  spaceShooter: 'joystick_dynamic',
  dragonShooter: 'joystick_dynamic',
  rpgShooter: 'joystick_dynamic',
  skyRush3d: 'joystick_dynamic',
  skyFrenzy: 'tap',
  skyTideClash: 'joystick_dynamic',
  cloudBallRush3d: 'tilt',

  // 塔防 / 策略点选
  towerDefense: 'tap',
  happyDefense: 'tap',
  plantZombieDefense: 'tap',
  plantZombieDefense2d: 'tap',
  plantsVsZombies: 'tap',
  rpgShooterTD: 'tap',

  // 坦克 / 格斗向
  cuteTankBattle: 'joystick_4way',
}

const DEFAULT_PRESET: MobileControlPresetId = 'tap'

/**
 * 统一操作框架试点（见 docs/CONTROL_PILOT_GAMES.md）
 * P0 先迁：whackMole → dodge → superMario
 */
export const CONTROL_PILOT_GAME_IDS = [
  'superMario',
  'whackMole',
  'dodge',
  'bubbleShooter',
  'tetris',
  'cuteTankBattle',
  'towerDefense',
  'cookieCut',
] as const

export type ControlPilotGameId = (typeof CONTROL_PILOT_GAME_IDS)[number]

export function isControlPilotGame(gameId: string): gameId is ControlPilotGameId {
  return (CONTROL_PILOT_GAME_IDS as readonly string[]).includes(gameId)
}

export function getControlPilotPreset(gameId: ControlPilotGameId): MobileControlPresetId {
  return getGameControlPreset(gameId)
}

export function getGameControlPreset(gameId: string): MobileControlPresetId {
  return GAME_CONTROL_PRESETS[gameId] ?? DEFAULT_PRESET
}

export function listGameControlPresets(): Record<string, MobileControlPresetId> {
  return { ...GAME_CONTROL_PRESETS }
}

export function getPresetGuideHint(preset: MobileControlPresetId): string {
  const hints: Record<MobileControlPresetId, string> = {
    tap: '👆 点击屏幕进行游戏',
    tap_hold: '👆 点击 / 长按蓄力',
    joystick_action: '🕹️ 左下摇杆移动 · 右侧按键攻击/跳跃',
    joystick_dynamic: '🕹️ 左侧滑动移动 · 右侧按键',
    joystick_4way: '🕹️ 四方向摇杆',
    joystick_8way: '🕹️ 八方向走位',
    swipe_pan: '👆 滑动控制方向',
    swipe_flick: '💨 快速划动释放',
    aim_drag_release: '🎯 按住拖动瞄准 · 松手发射',
    drag_select_rect: '📦 拖拽框选单位',
    portrait_swipe_lane: '⬅️➡️ 点击左/右半屏切换赛道',
    portrait_dpad: '⬆️⬇️⬅️➡️ 四边方向键',
    fighting_stick_buttons: '🥊 摇杆 + 拳脚技能键',
    tilt: '📱 倾斜手机控制方向',
    gesture_combo: '✌️ 双击 / 组合手势',
    tap_move_marker: '🗺️ 点击地图自动移动',
  }
  return hints[preset] ?? hints.tap
}

/** 引导页可同时展示触屏 + PC 文案 */
export function getCombinedControlGuideHint(preset: MobileControlPresetId): string {
  return `${getPresetGuideHint(preset)}\n${getDesktopGuideHint(preset)}`
}