import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startStarCatcherLifecycle } from './starCatcher.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyStarCatcher(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initStarCatcher(engine: GameEngine, onEnd: () => void) {
  destroyStarCatcher()
  const ctx = createLifecycleContext('starCatcher', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startStarCatcherLifecycle(ctx)
}