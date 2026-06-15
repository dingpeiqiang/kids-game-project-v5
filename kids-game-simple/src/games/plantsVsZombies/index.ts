export { PlantsVsZombiesGame } from './game'
export * from './types'
export * from './config'

import type { GameEngine } from '../../services/gameEngine'
import type { GameLifecycle } from '../../platform/GameLifecycle'
import { createLifecycleContext } from '../../platform/frameworkSession'
import { hostCanvas2D } from '../../platform/hostCanvas2D'
import { PlantsVsZombiesGame } from './game'

let activeHost: GameLifecycle | null = null
let gameInstance: PlantsVsZombiesGame | null = null

export function destroyPlantsVsZombies(): void {
  gameInstance?.destroy()
  gameInstance = null
  activeHost?.destroy()
  activeHost = null
}

export function initPlantsVsZombies(engine: GameEngine, onEnd: () => void) {
  destroyPlantsVsZombies()
  const lifecycleCtx = createLifecycleContext('plantsVsZombies', engine, onEnd)
  if (!lifecycleCtx?.canvas) {
    onEnd()
    return
  }

  const game = new PlantsVsZombiesGame(lifecycleCtx.canvas, engine, true)
  gameInstance = game

  activeHost = hostCanvas2D(lifecycleCtx, {
    onInit() {
      game.beginHostedLoop()
    },
    onUpdate(_dt) {
      if (!engine.canTick()) return
      game.runHostUpdate()
    },
    onRender() {
      game.runHostRender()
    },
    onDestroy() {
      game.destroy()
      gameInstance = null
    },
  })
}