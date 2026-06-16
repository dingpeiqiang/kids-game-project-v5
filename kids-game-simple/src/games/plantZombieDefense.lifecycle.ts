import type { GameEngine } from '../../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startPlantZombieDefenseLifecycle } from './plantZombieDefense/game'

let activeHost: GameLifecycle | null = null

export function destroyPlantZombieDefense(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initPlantZombieDefense(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyPlantZombieDefense()
  const ctx = createLifecycleContext('plantZombieDefense', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startPlantZombieDefenseLifecycle(ctx)
}
