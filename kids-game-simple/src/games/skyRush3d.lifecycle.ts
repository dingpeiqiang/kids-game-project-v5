import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startSkyRush3dLifecycle } from './skyRush3d/game'

let activeHost: GameLifecycle | null = null

export function destroySkyRush3d(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initSkyRush3d(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySkyRush3d()
  const ctx = createLifecycleContext('skyRush3d', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startSkyRush3dLifecycle(ctx)
}
