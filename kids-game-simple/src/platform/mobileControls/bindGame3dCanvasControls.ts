import { bindMobileControlPreset, type MobileControlRuntime } from './bindPreset'
import { getGameControlPreset } from './gameControlRegistry'
import type { BindMobileControlOptions, MobileControlPresetId } from './types'

export interface BindGame3dCanvasControlsOptions
  extends Omit<BindMobileControlOptions, 'preset'> {
  gameId: string
  preset?: MobileControlPresetId
  /** 3D 画布逻辑宽高（通常 canvas.width / height） */
  viewWidth: number
  viewHeight: number
}

/**
 * 3D 游戏 canvas 统一操作（与 2D bindGameCanvasControls 同 registry）。
 * 不绘制 overlay 时仍须 bind，以接收陀螺仪 / 键鼠。
 */
export function bindGame3dCanvasControls(
  canvas: HTMLCanvasElement,
  options: BindGame3dCanvasControlsOptions,
): MobileControlRuntime {
  const { gameId, preset: presetOverride, viewWidth, viewHeight, layoutPersistenceGameId, ...rest } =
    options
  const preset = presetOverride ?? getGameControlPreset(gameId)
  return bindMobileControlPreset(canvas, {
    ...rest,
    preset,
    viewWidth,
    viewHeight,
    layoutPersistenceGameId: layoutPersistenceGameId ?? gameId,
    onScreenControls: rest.onScreenControls ?? 'never',
  })
}