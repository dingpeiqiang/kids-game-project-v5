export { PlantsVsZombiesGame } from './game'
export * from './types'
export * from './config'

import { GameEngine } from '../../services/gameEngine'
import { PlantsVsZombiesGame } from './game'

let gameInstance: PlantsVsZombiesGame | null = null

export function initPlantsVsZombies(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) return

  gameInstance = new PlantsVsZombiesGame(canvas)
}
