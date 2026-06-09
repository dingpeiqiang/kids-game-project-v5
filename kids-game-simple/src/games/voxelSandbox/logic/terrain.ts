import { Block, BlockType } from '../types';
import { CHUNK_SIZE, TERRAIN_CONFIG } from '../config';
import { getTerrainHeight, getBiomeType } from './noise';

export function generateChunk(chunkX: number, chunkZ: number, seed: number): Map<string, Block> {
  const blocks = new Map<string, Block>();
  const startX = chunkX * CHUNK_SIZE;
  const startZ = chunkZ * CHUNK_SIZE;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = startX + x;
      const worldZ = startZ + z;
      const height = Math.floor(getTerrainHeight(worldX, worldZ, seed, TERRAIN_CONFIG.scale, TERRAIN_CONFIG.height));
      const biome = getBiomeType(worldX, worldZ, seed, height);

      for (let y = 0; y <= height; y++) {
        let blockType: BlockType = 'stone';
        
        if (y === height) {
          blockType = biome;
        } else if (y > height - 3) {
          blockType = biome === 'snow' ? 'snow' : 'dirt';
        } else if (y > height - TERRAIN_CONFIG.groundDepth) {
          blockType = 'dirt';
        }

        const block: Block = {
          type: blockType,
          x: worldX,
          y: y,
          z: worldZ,
        };
        
        blocks.set(getBlockKey(worldX, y, worldZ), block);
      }
    }
  }

  return blocks;
}

export function getBlockKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export function parseBlockKey(key: string): { x: number; y: number; z: number } {
  const parts = key.split(',').map(Number);
  return { x: parts[0], y: parts[1], z: parts[2] };
}

export function isBlockSolid(blocks: Map<string, Block>, x: number, y: number, z: number): boolean {
  return blocks.has(getBlockKey(x, y, z));
}

export function getNeighborBlocks(x: number, y: number, z: number): Array<{ x: number; y: number; z: number; face: string }> {
  return [
    { x: x + 1, y: y, z: z, face: 'right' },
    { x: x - 1, y: y, z: z, face: 'left' },
    { x: x, y: y + 1, z: z, face: 'top' },
    { x: x, y: y - 1, z: z, face: 'bottom' },
    { x: x, y: y, z: z + 1, face: 'front' },
    { x: x, y: y, z: z - 1, face: 'back' },
  ];
}

export function countVisibleFaces(block: Block, allBlocks: Map<string, Block>): number {
  let visibleFaces = 0;
  const neighbors = getNeighborBlocks(block.x, block.y, block.z);
  
  for (const neighbor of neighbors) {
    if (!allBlocks.has(getBlockKey(neighbor.x, neighbor.y, neighbor.z))) {
      visibleFaces++;
    }
  }
  
  return visibleFaces;
}