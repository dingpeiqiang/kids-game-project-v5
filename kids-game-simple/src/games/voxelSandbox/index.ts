import { VoxelSandboxGame } from './game';

export function initVoxelSandbox(container: HTMLDivElement): VoxelSandboxGame {
  return new VoxelSandboxGame(container);
}

export { VoxelSandboxGame } from './game';
export type { BlockType, GameState } from './types';