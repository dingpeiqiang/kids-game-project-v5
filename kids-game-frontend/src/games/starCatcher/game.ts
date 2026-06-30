import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startStarCatcherLifecycle } from './starCatcher.lifecycle'

const lifecycle = createCanvasGameLifecycle('starCatcher', startStarCatcherLifecycle)

export const initStarCatcher = lifecycle.init
export const destroyStarCatcher = lifecycle.destroy