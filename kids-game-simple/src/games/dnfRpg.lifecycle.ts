import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startDnfRpgLifecycle } from './dnfRpg/game'

let activeHost: GameLifecycle | null = null

export function destroyDnfRpgLifecycle(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initDnfRpgLifecycle(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyDnfRpgLifecycle()
  const ctx = createLifecycleContext('dnfRpg', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startDnfRpgLifecycle(ctx)
}
