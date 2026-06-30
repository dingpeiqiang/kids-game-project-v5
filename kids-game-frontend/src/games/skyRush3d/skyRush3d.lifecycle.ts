import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startSkyRush3dLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('skyRush3d', startSkyRush3dLifecycle)

export const initSkyRush3d = lifecycle.init
export const destroySkyRush3d = lifecycle.destroy