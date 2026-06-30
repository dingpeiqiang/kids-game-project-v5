import type { GameEngine } from '@shell/services/gameEngine'
import type { GameLifecycle } from '@shell/platform/GameLifecycle'
import { createLifecycleContext } from '@shell/platform/frameworkSession'
import { hostCanvas2D } from '@shell/platform/hostCanvas2D'
import { applyCanvasMobileStyles } from '@shell/utils/canvasMobileUtils'
import { StackGame } from '../stack-game'

let activeHost: GameLifecycle | null = null
let activeGame: StackGame | null = null

export function destroyStack(): void {
  activeGame?.destroy()
  activeGame = null
  activeHost?.destroy()
  activeHost = null
}

export function initStack(engine: GameEngine, onEnd: () => void) {
  destroyStack()
  const lifecycleCtx = createLifecycleContext('stack', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  try {
    const game = new StackGame(engine, onEnd)
    activeGame = game

    activeHost = hostCanvas2D(lifecycleCtx, {
      onInit() {
        applyCanvasMobileStyles(lifecycleCtx.canvas!)
        game.bindInput()
        game.renderFrame()
      },
      onUpdate(_dt) {
        game.runHostFrame(engine.canTick())
      },
      onRender() {
        if (!engine.canTick()) {
          game.renderFrame()
        }
      },
      onDestroy() {
        game.destroy()
        activeGame = null
      },
    })
  } catch (error) {
    console.error('Failed to initialize StackGame:', error)
    onEnd()
  }
}