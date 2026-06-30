import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startNeonRunLifecycle } from './neonRun.lifecycle'

const lifecycle = createCanvasGameLifecycle('neonRun', startNeonRunLifecycle)

export const initNeonRun = lifecycle.init
export const destroyNeonRun = lifecycle.destroy