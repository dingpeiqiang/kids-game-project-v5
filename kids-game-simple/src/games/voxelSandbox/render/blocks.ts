import * as THREE from 'three';
import { Block, BlockType } from '../types';
import { BLOCK_SIZE, BLOCK_COLORS } from '../config';

const blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

export function createBlockMesh(block: Block): THREE.Mesh {
  const colors = BLOCK_COLORS[block.type];
  
  const materials = [
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.top }),
    new THREE.MeshLambertMaterial({ color: colors.bottom }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
  ];

  const mesh = new THREE.Mesh(blockGeometry, materials);
  mesh.position.set(
    block.x * BLOCK_SIZE + BLOCK_SIZE / 2,
    block.y * BLOCK_SIZE + BLOCK_SIZE / 2,
    block.z * BLOCK_SIZE + BLOCK_SIZE / 2
  );
  
  mesh.userData = { block };
  
  return mesh;
}

export function createChunkMesh(blocks: Map<string, Block>): THREE.Group {
  const group = new THREE.Group();
  
  blocks.forEach((block) => {
    const mesh = createBlockMesh(block);
    group.add(mesh);
  });
  
  return group;
}

export function createBlockPreview(blockType: BlockType): THREE.Mesh {
  const colors = BLOCK_COLORS[blockType];
  
  const materials = [
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.top }),
    new THREE.MeshLambertMaterial({ color: colors.bottom }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
    new THREE.MeshLambertMaterial({ color: colors.side }),
  ];

  const mesh = new THREE.Mesh(blockGeometry, materials);
  mesh.scale.set(0.3, 0.3, 0.3);
  
  return mesh;
}

export function getBlockFaceNormal(face: string): THREE.Vector3 {
  switch (face) {
    case 'right': return new THREE.Vector3(1, 0, 0);
    case 'left': return new THREE.Vector3(-1, 0, 0);
    case 'top': return new THREE.Vector3(0, 1, 0);
    case 'bottom': return new THREE.Vector3(0, -1, 0);
    case 'front': return new THREE.Vector3(0, 0, 1);
    case 'back': return new THREE.Vector3(0, 0, -1);
    default: return new THREE.Vector3(0, 1, 0);
  }
}