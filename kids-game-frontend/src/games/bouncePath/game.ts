import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startBouncePathLifecycle } from './bouncePath.lifecycle'

const lifecycle = createCanvasGameLifecycle('bouncePath', startBouncePathLifecycle)

export const initBouncePath = lifecycle.init
export const destroyBouncePath = lifecycle.destroy