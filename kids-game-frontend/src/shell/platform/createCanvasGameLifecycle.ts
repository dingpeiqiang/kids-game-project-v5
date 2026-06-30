/**
 * 标准 Canvas 游戏入口：init / destroy + createLifecycleContext
 * 见 docs/FRAMEWORK_MIGRATE_TEMPLATE.md
 */
import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle, GameLifecycleContext } from './GameLifecycle'
import { createLifecycleContext } from './frameworkSession'

export type StartLifecycleFn = (ctx: GameLifecycleContext) => GameLifecycle

export function createCanvasGameLifecycle(
  gameId: string,
  startLifecycle: StartLifecycleFn,
): {
  init: (engine: GameEngine, onEnd: () => void) => Promise<void>
  destroy: () => void
} {
  let activeHost: GameLifecycle | null = null

  function destroy(): void {
    activeHost?.destroy()
    activeHost = null
  }

  async function init(engine: GameEngine, onEnd: () => void): Promise<void> {
    destroy()
    const ctx = createLifecycleContext(gameId, engine, onEnd)
    if (!ctx) {
      onEnd()
      return
    }
    activeHost = startLifecycle(ctx)
  }

  return { init, destroy }
}