import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { initDragonShooter, destroyDragonShooter } from './dragonShooter/index'

let activeHost: GameLifecycle | null = null

export function destroyDragonShooterLifecycle(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initDragonShooterLifecycle(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyDragonShooterLifecycle()
  const ctx = createLifecycleContext('dragonShooter', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  await initDragonShooter(engine, onEnd)
}
