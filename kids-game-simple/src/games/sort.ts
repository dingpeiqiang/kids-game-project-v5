import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { GAME_ITEMS, ITEM_UNLOCK_TIMES, ITEM_SPAWN_WEIGHTS } from '../data/items'
import { app } from '../services/appBridge'
import { resolveGtrsCanvasStyle } from '../utils/gtrsCanvasTheme'
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile } from '../utils/mobileHelper'
import type { GameLifecycle, GameLifecycleContext } from '../platform/GameLifecycle'

let activeDispose: (() => void) | null = null

export function destroySort(): void {
  activeDispose?.()
  activeDispose = null
}

export function startSortLifecycle(lifecycleCtx: GameLifecycleContext): GameLifecycle {
  const canvas = lifecycleCtx.canvas ?? document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  const engine = lifecycleCtx.engine
  // ... existing game body would continue here ...
  return {
    destroy() {
      activeDispose?.()
      activeDispose = null
    },
    onInit() {},
    onUpdate() {},
    onRender() {},
    onDestroy() {},
  } as GameLifecycle
}

export async function initSort(engine: GameEngine, onEnd: () => void): Promise<void> {
  destroySort()
  const ctx = lifecycleCtxPlaceholder(engine, onEnd)
  if (!ctx) return
  activeDispose = () => {}
}

function lifecycleCtxPlaceholder(engine: GameEngine, onEnd: () => void): GameLifecycleContext | null {
  void engine
  void onEnd
  return null
}
