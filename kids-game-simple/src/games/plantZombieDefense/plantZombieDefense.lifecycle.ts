import { createCanvasGameLifecycle } from '../../platform/createCanvasGameLifecycle'
import { startPlantZombieDefenseLifecycle } from './game'

const lifecycle = createCanvasGameLifecycle('plantZombieDefense', startPlantZombieDefenseLifecycle)

export const initPlantZombieDefense = lifecycle.init
export const destroyPlantZombieDefense = lifecycle.destroy