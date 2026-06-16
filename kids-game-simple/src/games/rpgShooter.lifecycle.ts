import type { GameLifecycleContext } from '../platform/GameLifecycle'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { hostCanvas2D } from '../platform/hostCanvas2D'
import { createInitialState } from './rpgShooter/index'

/** Stub: rpgShooter game lifecycle (not yet implemented) */
function startRpgShooterLifecycle(ctx: GameLifecycleContext): GameLifecycle {
  const state = createInitialState()
  return hostCanvas2D(ctx, {
    onInit() {},
    onUpdate(_dtSec) {},
    onRender() {},
    onDestroy() {},
  })
}

let activeHost: GameLifecycle | null = null

export function destroyRpgShooter(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initRpgShooter(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroyRpgShooter()
  const ctx = createLifecycleContext('rpgShooter', engine, onEnd)
  if (!ctx) { onEnd(); return }
  activeHost = startRpgShooterLifecycle(ctx)
}

type GameEngine = import('../services/gameEngine').GameEngine