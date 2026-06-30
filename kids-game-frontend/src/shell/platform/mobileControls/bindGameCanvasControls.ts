import { bindMobileControlPreset, type MobileControlRuntime } from './bindPreset'
import { getGameControlPreset } from './gameControlRegistry'
import type { BindMobileControlOptions, MobileControlPresetId } from './types'

export interface BindGameCanvasControlsOptions
  extends Omit<BindMobileControlOptions, 'preset'> {
  gameId: string
  /** 覆盖 registry 中的 preset */
  preset?: MobileControlPresetId
  /** 透传 swipe_pan 跟刀 */
  trackOutsideCanvas?: boolean
}

/**
 * 按 gameId 从 registry 取 preset 并绑定统一操作（触屏 + PC）。
 * 退出对局时调用返回值的 dispose()。
 */
export function bindGameCanvasControls(
  canvas: HTMLCanvasElement,
  options: BindGameCanvasControlsOptions,
): MobileControlRuntime {
  const { gameId, preset: presetOverride, layoutPersistenceGameId, ...rest } = options
  const preset = presetOverride ?? getGameControlPreset(gameId)
  return bindMobileControlPreset(canvas, {
    ...rest,
    preset,
    layoutPersistenceGameId: layoutPersistenceGameId ?? gameId,
  })
}