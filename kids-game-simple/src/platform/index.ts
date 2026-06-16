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
export { hostCanvas2D } from './hostCanvas2D'
export {
  loadImage,
  loadImages,
  drawSpriteFrame,
  drawSpriteImage,
  UniformSpriteSheet,
  loadUniformSpriteSheet,
  SpriteAtlas,
  loadSpriteAtlas,
  SpriteAnimator,
  type SpriteRect,
  type SpriteAnimationDef,
  type SpriteAtlasJson,
} from './sprite2d'
export {
  loadSpriteSheet,
  loadGridSpriteSheet,
  drawSpriteFrame as drawSpriteFrameFromSheet,
  clearSpriteSheetCache,
  SpriteAnimation,
  type SpriteSheet,
  type SpriteFrame,
  type DrawSpriteOptions,
  type GridSheetConfig,
} from './spriteSheet'