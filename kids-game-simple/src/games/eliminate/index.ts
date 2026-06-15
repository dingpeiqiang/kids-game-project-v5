import type { GameEngine } from '../../services/gameEngine'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
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
      if (deltaMs >= 16) {
        game.update(deltaMs)
      }
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