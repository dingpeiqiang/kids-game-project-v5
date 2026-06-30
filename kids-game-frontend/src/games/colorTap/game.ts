import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startColorTapLifecycle } from './colorTap.lifecycle'

const lifecycle = createCanvasGameLifecycle('colorTap', startColorTapLifecycle)

export const initColorTap = lifecycle.init
export const destroyColorTap = lifecycle.destroy