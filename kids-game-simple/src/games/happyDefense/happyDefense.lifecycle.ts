import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { startHappyDefenseLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('happyDefense', startHappyDefenseLifecycle)

export const initHappyDefense = lifecycle.init
export const destroyHappyDefense = lifecycle.destroy