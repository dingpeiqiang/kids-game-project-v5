import type { GameEngine } from '../../services/gameEngine'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { startHappyDefenseLifecycle } from './happyDefense/game'

let activeHost: GameLifecycle | null = null

export function destroyHappyDefense(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initHappyDefense(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyHappyDefense()
  const ctx = createLifecycleContext('happyDefense', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startHappyDefenseLifecycle(ctx)
}
