import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startContraRpgLifecycle } from './contraRpg/game'

let activeHost: GameLifecycle | null = null

export function destroyContraRpg(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initContraRpg(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyContraRpg()
  const ctx = createLifecycleContext('contraRpg', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startContraRpgLifecycle(ctx)
}
