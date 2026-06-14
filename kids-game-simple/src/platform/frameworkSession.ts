/**
 * 框架对局会话：生命周期上下文 + 与 gameSession 一致的桥接约定
 */
import type { GameEngine } from '../services/gameEngine'
import type { GameLifecycleContext } from './GameLifecycle'
import { getMainGameCanvas } from './canvasHost'

export function createLifecycleContext(
  gameId: string,
  engine: GameEngine,
  onEnd: () => void,
): GameLifecycleContext | null {
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