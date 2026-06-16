import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { startDnfRpgLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('dnfRpg', startDnfRpgLifecycle)

export const initDnfRpg = lifecycle.init
export const destroyDnfRpg = lifecycle.destroy