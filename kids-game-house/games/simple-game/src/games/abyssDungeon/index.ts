import type { GameEngine } from '../../services/gameEngine'
import { AbyssDungeonGame } from './game'

export function initAbyssDungeon(engine: GameEngine, onEnd: () => void) {
  try {
    new AbyssDungeonGame(engine, onEnd)
  } catch (error) {
    console.error('Failed to initialize AbyssDungeonGame:', error)
    onEnd()
  }
}