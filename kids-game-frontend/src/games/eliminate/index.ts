import type { GameEngine } from '@shell/services/gameEngine'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { createLifecycleContext } from '@shell/platform/frameworkSession'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { EliminateGame } from './EliminateGame'

let activeHost: GameLifecycle | null = null
let activeGame: EliminateGame | null = null

export function destroyEliminate(): void {
  activeGame?.destroy()
  activeGame = null
  activeHost?.destroy()
  activeHost = null
}

export function initEliminate(engine: GameEngine, onEnd: () => void) {
  destroyEliminate()
  const lifecycleCtx = createLifecycleContext('eliminate', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const canvas = lifecycleCtx.canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onEnd()
    return
  }
  ctx.imageSmoothingEnabled = false

  const game = new EliminateGame(canvas, ctx, engine, onEnd)
  activeGame = game

  let lastMs = 0
  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      game.init()
      lastMs = performance.now()
    },
    onUpdate(_dtSec) {
      const now = performance.now()
      const deltaMs = lastMs > 0 ? now - lastMs : 16
      lastMs = now
      game.update(Math.min(50, Math.max(1, deltaMs)))
    },
    onRender() {
      game.render()
    },
    onDestroy() {
      game.destroy()
      activeGame = null
    },
  })
}