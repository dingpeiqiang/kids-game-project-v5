/**
 * 玩法层只 emit 事件；由本模块桥接到 gameEngine / gameSession
 */
import { gameEngine } from '../services/gameEngine'
import { eventBus } from './eventBus'
import { GameEvents, type GameOverPayload, type ScoreAddPayload, type ScoreSetPayload } from './gameEvents'

let endGameHandler: ((payload: GameOverPayload) => void) | null = null
let bridgeInstalled = false
let bridgeUnsubs: Array<() => void> = []

export function setGameEndHandler(handler: ((payload: GameOverPayload) => void) | null): void {
  endGameHandler = handler
}

function handleGameOver(p: GameOverPayload) {
  if (p.score != null) gameEngine.setScore(p.score)
  gameEngine.setVictory(!!p.victory)
  if (p.stats) gameEngine.setGameStats(p.stats)
  gameEngine.endGame()
  endGameHandler?.(p)
}

export function installGameEventBridge(): void {
  if (bridgeInstalled) return
  bridgeInstalled = true

  bridgeUnsubs = [
    eventBus.on(GameEvents.SCORE_ADD, (p: ScoreAddPayload) => {
      gameEngine.addScore(p.amount, p.x, p.y)
    }),
    eventBus.on(GameEvents.SCORE_SET, (p: ScoreSetPayload) => {
      gameEngine.setScore(p.score)
    }),
    eventBus.on(GameEvents.COMBO_BREAK, () => {
      gameEngine.breakCombo()
    }),
    eventBus.on(GameEvents.PAUSE_REQUEST, () => {
      eventBus.emit(GameEvents.PAUSE, { source: 'request' })
      gameEngine.pause()
    }),
    eventBus.on(GameEvents.RESUME, () => {
      gameEngine.resume()
    }),
    eventBus.on(GameEvents.GAME_OVER, (p: GameOverPayload) => {
      handleGameOver(p)
    }),
    eventBus.on(GameEvents.GAME_VICTORY, (p: GameOverPayload) => {
      handleGameOver({ ...p, victory: true })
    }),
  ]
}

export function uninstallGameEventBridge(): void {
  bridgeUnsubs.forEach(u => u())
  bridgeUnsubs = []
  bridgeInstalled = false
  endGameHandler = null
}

/** 玩法层 API：不直接调 gameEngine */
export const gameActions = {
  addScore(amount: number, x: number, y: number, source?: string) {
    eventBus.emit(GameEvents.SCORE_ADD, { amount, x, y, source })
  },
  setScore(score: number, source?: string) {
    eventBus.emit(GameEvents.SCORE_SET, { score, source })
  },
  damageHp(amount: number, reason?: string) {
    eventBus.emit(GameEvents.HP_DAMAGE, { amount, reason })
  },
  requestPause(source?: string) {
    eventBus.emit(GameEvents.PAUSE_REQUEST, { source })
  },
  requestResume(source?: string) {
    eventBus.emit(GameEvents.RESUME, { source })
  },
  gameOver(payload: GameOverPayload) {
    eventBus.emit(GameEvents.GAME_OVER, payload)
  },
  breakCombo() {
    eventBus.emit(GameEvents.COMBO_BREAK, {})
  },
}