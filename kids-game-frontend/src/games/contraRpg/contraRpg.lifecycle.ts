import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startContraRpgLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('contraRpg', startContraRpgLifecycle)

export const initContraRpg = lifecycle.init
export const destroyContraRpg = lifecycle.destroy