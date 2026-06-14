import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startBouncePathLifecycle } from './bouncePath.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyBouncePath(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initBouncePath(engine: GameEngine, onEnd: () => void) {
  destroyBouncePath()
  const ctx = createLifecycleContext('bouncePath', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startBouncePathLifecycle(ctx)
}