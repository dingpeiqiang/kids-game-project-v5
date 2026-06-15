import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startWhackMoleLifecycle } from './whackMole.lifecycle'

let activeHost: GameLifecycle | null = null

export function destroyWhackMole(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initWhackMole(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyWhackMole()
  const ctx = createLifecycleContext('whackMole', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startWhackMoleLifecycle(ctx)
}