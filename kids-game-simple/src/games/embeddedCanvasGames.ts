import { GAME_REGISTRY } from './gameRegistry';

/** 在 gameRegistry 中注册、走 Canvas 引擎（非 iframe）的游戏 code */
export function isEmbeddedCanvasGame(gameCode: string): boolean {
  if (!gameCode) return false;
  return gameCode in GAME_REGISTRY;
}

export function listEmbeddedCanvasGameIds(): string[] {
  return Object.keys(GAME_REGISTRY);
}