export { eventBus } from './eventBus'
export { GameEvents, type GameOverPayload, type ScoreAddPayload } from './gameEvents'
export {
  gameActions,
  installGameEventBridge,
  uninstallGameEventBridge,
  setGameEndHandler,
} from './gameBridge'
export { inputManager, type ShellInputMode } from './inputManager'
export { ObjectPool, getPool, clearAllPools } from './objectPool'
export { GameLifecycle, runCanvasLifecycle, type GameLifecycleContext } from './GameLifecycle'
export { createLifecycleContext, requireLifecycleContext } from './frameworkSession'
export { getMainGameCanvas, requireMainGameCanvas } from './canvasHost'