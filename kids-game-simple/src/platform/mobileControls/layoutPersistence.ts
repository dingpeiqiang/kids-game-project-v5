/**
 * 按键/摇杆布局持久化（localStorage `mobileControlLayout:v1`）
 * 见 docs/MOBILE_CONTROL_DESIGN.md §9
 */
import type { JoystickLayout, MobileControlLayout, TouchButtonLayout } from './types'

export const MOBILE_CONTROL_LAYOUT_STORAGE_KEY = 'mobileControlLayout:v1'

export interface StoredLayoutEntryV1 {
  /** 保存时的参考视口（逻辑坐标系） */
  refWidth: number
  refHeight: number
  joystick?: JoystickLayout
  /** 仅持久化位置与半径，id 与游戏 layout 对齐 */
  buttons?: Array<Pick<TouchButtonLayout, 'id' | 'cx' | 'cy' | 'r' | 'label'>>
  updatedAt?: number
}

export type StoredLayoutStoreV1 = Record<string, StoredLayoutEntryV1>

function readStore(): StoredLayoutStoreV1 {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(MOBILE_CONTROL_LAYOUT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredLayoutStoreV1
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: StoredLayoutStoreV1): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(MOBILE_CONTROL_LAYOUT_STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode */
  }
}

function scaleNum(v: number, from: number, to: number): number {
  if (from <= 0) return v
  return (v / from) * to
}

function scaleJoystick(
  joy: JoystickLayout | undefined,
  refW: number,
  refH: number,
  viewW: number,
  viewH: number,
): JoystickLayout | undefined {
  if (!joy) return undefined
  const minFrom = Math.min(refW, refH)
  const minTo = Math.min(viewW, viewH)
  const out: JoystickLayout = { ...joy }
  if (joy.x != null) out.x = scaleNum(joy.x, refW, viewW)
  if (joy.y != null) out.y = scaleNum(joy.y, refH, viewH)
  if (joy.radius != null) out.radius = scaleNum(joy.radius, minFrom, minTo)
  if (joy.knobRadius != null) out.knobRadius = scaleNum(joy.knobRadius, minFrom, minTo)
  return out
}

function scaleButtons(
  buttons: StoredLayoutEntryV1['buttons'],
  refW: number,
  refH: number,
  viewW: number,
  viewH: number,
): TouchButtonLayout[] | undefined {
  if (!buttons?.length) return undefined
  const minFrom = Math.min(refW, refH)
  const minTo = Math.min(viewW, viewH)
  return buttons.map((b) => ({
    id: b.id,
    label: b.label,
    cx: scaleNum(b.cx, refW, viewW),
    cy: scaleNum(b.cy, refH, viewH),
    r: scaleNum(b.r, minFrom, minTo),
  }))
}

/** 读取某游戏的已保存布局，并按当前 view 等比缩放 */
export function loadSavedLayoutOverrides(
  gameId: string,
  viewWidth: number,
  viewHeight: number,
): Partial<MobileControlLayout> | null {
  const entry = readStore()[gameId]
  if (!entry || entry.refWidth <= 0 || entry.refHeight <= 0) return null
  const joystick = scaleJoystick(entry.joystick, entry.refWidth, entry.refHeight, viewWidth, viewHeight)
  const buttons = scaleButtons(entry.buttons, entry.refWidth, entry.refHeight, viewWidth, viewHeight)
  if (!joystick && !buttons?.length) return null
  return {
    viewWidth,
    viewHeight,
    ...(joystick ? { joystick } : {}),
    ...(buttons?.length ? { buttons } : {}),
  }
}

/** 保存当前逻辑布局（通常来自 merge 后的 layout + 用户拖拽结果） */
export function saveLayoutOverrides(
  gameId: string,
  layout: MobileControlLayout,
): void {
  const store = readStore()
  store[gameId] = {
    refWidth: layout.viewWidth,
    refHeight: layout.viewHeight,
    joystick: layout.joystick ? { ...layout.joystick } : undefined,
    buttons: layout.buttons?.map((b) => ({
      id: b.id,
      label: b.label,
      cx: b.cx,
      cy: b.cy,
      r: b.r,
    })),
    updatedAt: Date.now(),
  }
  writeStore(store)
}

export function clearSavedLayoutOverrides(gameId: string): void {
  const store = readStore()
  if (!(gameId in store)) return
  delete store[gameId]
  writeStore(store)
}

export function listSavedLayoutGameIds(): string[] {
  return Object.keys(readStore())
}