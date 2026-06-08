import * as THREE from 'three';
import { GAME_CONFIG, COLORS, COLLECTIBLE_TYPES } from './config';
import { generateId, randomRange } from './utils';
import type { Collectible } from './types';

export class CollectibleManager {
  private scene: THREE.Scene;
  private collectibles: Collectible[] = [];
  private meshes: Map<string, THREE.Mesh> = new Map();
  private materials: Record<string, THREE.MeshStandardMaterial> = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.materials = {
      coin: new THREE.MeshStandardMaterial({ color: COLORS.coin }),
      crystal: new THREE.MeshStandardMaterial({ color: COLORS.crystal }),
      shield: new THREE.MeshStandardMaterial({ color: COLORS.shield }),
      slow: new THREE.MeshStandardMaterial({ color: COLORS.slow }),
      double: new THREE.MeshStandardMaterial({ color: COLORS.double }),
    };
  }

  spawnCollectible(z: number, lane: number): void {
    const weights = [0.5, 0.2, 0.1, 0.1, 0.1];
    const rand = Math.random();
    let typeIndex = 0;
    let cumWeight = weights[0];
    
    while (rand > cumWeight && typeIndex < weights.length - 1) {
      typeIndex++;
      cumWeight += weights[typeIndex];
    }

    const type = COLLECTIBLE_TYPES[typeIndex];

    const collectible: Collectible = {
      id: generateId(),
      type,
      position: {
        x: lane * GAME_CONFIG.LANE_WIDTH + randomRange(-1, 1),
        y: GAME_CONFIG.GROUND_Y + GAME_CONFIG.TRACK_HEIGHT + 1,
        z,
      },
      collected: false,
      rotation: 0,
    };

    this.collectibles.push(collectible);
    this.createMesh(collectible);
  }

  private createMesh(collectible: Collectible): void {
    let geometry: THREE.BufferGeometry;

    switch (collectible.type) {
      case 'coin':
        geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        break;
      case 'crystal':
        geometry = new THREE.OctahedronGeometry(0.4);
        break;
      case 'shield':
        geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
        break;
      case 'slow':
        geometry = new THREE.ConeGeometry(0.3, 0.5, 8);
        break;
      case 'double':
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.3);
    }

    const material = this.materials[collectible.type];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      collectible.position.x,
      collectible.position.y,
      collectible.position.z
    );

    if (collectible.type === 'coin') {
      mesh.rotation.x = Math.PI / 2;
    }

    this.scene.add(mesh);
    this.meshes.set(collectible.id, mesh);
  }

  update(cameraZ: number, speed: number): void {
    const nearZ = cameraZ - 50;

    this.collectibles = this.collectibles.filter(collectible => {
      collectible.position.z -= speed;
      collectible.rotation += 0.05;

      const mesh = this.meshes.get(collectible.id);
      if (mesh) {
        mesh.position.set(
          collectible.position.x,
          collectible.position.y + Math.sin(Date.now() * 0.005 + parseInt(collectible.id, 36)) * 0.2,
          collectible.position.z
        );
        
        if (collectible.type === 'coin') {
          mesh.rotation.y = collectible.rotation;
        } else {
          mesh.rotation.y = collectible.rotation;
          mesh.rotation.x = collectible.rotation * 0.5;
        }
      }

      if (collectible.position.z < nearZ || collectible.collected) {
        this.removeCollectible(collectible.id);
        return false;
      }
      return true;
    });
  }

  private removeCollectible(id: string): void {
    const mesh = this.meshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.meshes.delete(id);
    }
  }

  getCollectibles(): Collectible[] {
    return this.collectibles;
  }

  collect(id: string): Collectible | null {
    const collectible = this.collectibles.find(c => c.id === id);
    if (collectible) {
      collectible.collected = true;
    }
    return collectible || null;
  }

  cleanup(): void {
    this.meshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.meshes.clear();
    this.collectibles = [];
  }
}