import { Block, SavedWorld, BlockType } from '../types';
import { STORAGE_KEY } from '../config';

export function saveWorld(
  seed: number,
  blocks: Map<string, Block>,
  playerX: number,
  playerY: number,
  playerZ: number,
  gameTime: number
): void {
  const blockArray = Array.from(blocks.values()).map(block => ({
    x: block.x,
    y: block.y,
    z: block.z,
    type: block.type,
  }));

  const savedWorld: SavedWorld = {
    seed,
    blocks: blockArray,
    playerPosition: { x: playerX, y: playerY, z: playerZ },
    gameTime,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWorld));
}

export function loadWorld(): SavedWorld | null {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return null;

  try {
    return JSON.parse(savedData) as SavedWorld;
  } catch {
    return null;
  }
}

export function clearWorld(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedWorld(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function blocksFromSaved(savedBlocks: Array<{ x: number; y: number; z: number; type: BlockType }>): Map<string, Block> {
  const blocks = new Map<string, Block>();
  
  for (const savedBlock of savedBlocks) {
    const block: Block = {
      type: savedBlock.type,
      x: savedBlock.x,
      y: savedBlock.y,
      z: savedBlock.z,
    };
    blocks.set(`${savedBlock.x},${savedBlock.y},${savedBlock.z}`, block);
  }
  
  return blocks;
}