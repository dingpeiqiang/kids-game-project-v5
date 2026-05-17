import type { GameEngine } from '../services/gameEngine'
import { StackGame } from './stack-game'

export function initStack(engine: GameEngine, onEnd: () => void) {
  try {
    const game = new StackGame(engine, onEnd)
    game.start()
  } catch (error) {
    console.error('Failed to initialize StackGame:', error)
    onEnd()
  }
}