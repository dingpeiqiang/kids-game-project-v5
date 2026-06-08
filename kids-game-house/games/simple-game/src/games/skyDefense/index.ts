import { SkyDefenseGame } from './game'

export function initSkyDefense(container: HTMLElement): void {
  const game = new SkyDefenseGame(container)
  game.start()
}

export * from './types'
export * from './config'