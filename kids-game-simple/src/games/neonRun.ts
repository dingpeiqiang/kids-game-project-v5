import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startNeonRunLifecycle } from './neonRun.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyNeonRun(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initNeonRun(engine: GameEngine, onEnd: () => void) {
  destroyNeonRun()
  const ctx = createLifecycleContext('neonRun', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startNeonRunLifecycle(ctx)
}