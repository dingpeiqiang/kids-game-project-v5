import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { startPlantZombieDefense2dLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('plantZombieDefense2d', startPlantZombieDefense2dLifecycle)

export const initPlantZombieDefense2d = lifecycle.init
export const destroyPlantZombieDefense2d = lifecycle.destroy