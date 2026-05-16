import type { GameEngine as ExternalEngine } from '../../services/gameEngine'
import { GameEngine } from './GameEngine'

let gameInstance: GameEngine | null = null

export function initStack3D(engine: ExternalEngine, onEnd: () => void) {
  const container = document.getElementById('gameCanvas')!
  container.innerHTML = '<div id="threeContainer" style="width:100%;height:100%"></div>'
  
  gameInstance = new GameEngine({
    containerId: 'threeContainer',
    externalEngine: engine,
    onEnd
  })
}

export function destroyStack3D() {
  if (gameInstance) {
    gameInstance.destroy()
    gameInstance = null
  }
}

export { GameEngine } from './GameEngine'