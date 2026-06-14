import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startColorTapLifecycle } from './colorTap.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyColorTap(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initColorTap(engine: GameEngine, onEnd: () => void) {
  destroyColorTap()
  const ctx = createLifecycleContext('colorTap', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startColorTapLifecycle(ctx)
}