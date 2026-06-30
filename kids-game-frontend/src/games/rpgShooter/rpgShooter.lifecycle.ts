import { createCanvasGameLifecycle } from '@shell/platform/createCanvasGameLifecycle'
import { startRpgShooterLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('rpgShooter', startRpgShooterLifecycle)

export const initRpgShooter = lifecycle.init
export const destroyRpgShooter = lifecycle.destroy