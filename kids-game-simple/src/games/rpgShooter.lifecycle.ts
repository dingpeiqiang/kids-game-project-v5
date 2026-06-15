import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startRpgShooterLifecycle } from './rpgShooter'

let activeHost: GameLifecycle | null = null

export function destroyRpgShooter(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initRpgShooter(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyRpgShooter()
  const ctx = createLifecycleContext('rpgShooter', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startRpgShooterLifecycle(ctx)
}
