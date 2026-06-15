import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startPlantZombieDefense2dLifecycle } from './plantZombieDefense2d/game'

let activeHost: GameLifecycle | null = null

export function destroyPlantZombieDefense2d(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initPlantZombieDefense2d(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyPlantZombieDefense2d()
  const ctx = createLifecycleContext('plantZombieDefense2d', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startPlantZombieDefense2dLifecycle(ctx)
}
