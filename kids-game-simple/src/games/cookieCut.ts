import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startCookieCutLifecycle } from './cookieCut.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyCookieCut(): void {
  activeHost?.destroy()
  activeHost = null
}

export function initCookieCut(engine: GameEngine, onEnd: () => void) {
  destroyCookieCut()
  const ctx = createLifecycleContext('cookieCut', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startCookieCutLifecycle(ctx)
}