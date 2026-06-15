import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycle } from '../platform/GameLifecycle'
import { createLifecycleContext } from '../platform/frameworkSession'
import { startSortLifecycle } from './sort'

let activeHost: GameLifecycle | null = null

export function destroySort(): void {
  activeHost?.destroy()
  activeHost = null
}

export async function initSort(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySort()
  const ctx = createLifecycleContext('sort', engine, onEnd)
  if (!ctx) {
    onEnd()
    return
  }
  activeHost = startSortLifecycle(ctx)
}
