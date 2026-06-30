/**
 * 框架对局会话：生命周期上下文 + 与 gameSession 一致的桥接约定
 */
import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycleContext } from './GameLifecycle'
import { getMainGameCanvas } from './canvasHost'
import { isExternalCanvas3dGame } from './game3dHost'

export function createLifecycleContext(
  gameId: string,
  engine: GameEngine,
  onEnd: () => void,
): GameLifecycleContext | null {
  if (isExternalCanvas3dGame(gameId)) {
    const host =
      document.getElementById('gameCanvas') ??
      document.querySelector<HTMLElement>('.game-play-shell__canvas')
    if (!host) return null
    return { gameId, engine, onEnd, canvas: host }
  }
  const canvas = getMainGameCanvas()
  if (!canvas) return null
  return { gameId, engine, onEnd, canvas }
}

export function requireLifecycleContext(
  gameId: string,
  engine: GameEngine,
  onEnd: () => void,
): GameLifecycleContext {
  const ctx = createLifecycleContext(gameId, engine, onEnd)
  if (!ctx) throw new Error(`[frameworkSession] no canvas for ${gameId}`)
  return ctx
}