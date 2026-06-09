import * as THREE from 'three';
import { GAME_CONFIG, COLORS, OBSTACLE_TYPES } from './config';
import { generateId, randomRange } from './utils';
import type { Obstacle } from './types';

export class ObstacleManager {
  private scene: THREE.Scene;
  private obstacles: Obstacle[] = [];
  private meshes: Map<string, THREE.Mesh> = new Map();
  private materials: Record<string, THREE.MeshStandardMaterial> = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.materials = {
      static: new THREE.MeshStandardMaterial({ color: COLORS.obstacle }),
      moving: new THREE.MeshStandardMaterial({ color: COLORS.obstacleMoving }),
      pendulum: new THREE.MeshStandardMaterial({ color: COLORS.obstaclePendulum }),
      spike: new THREE.MeshStandardMaterial({ color: COLORS.obstacle }),
    };
  }

  spawnObstacle(z: number, lane: number, difficultyLevel: number): void {
    const typeIndex = Math.min(Math.floor(Math.random() * (difficultyLevel + 1)), OBSTACLE_TYPES.length - 1);
    const type = OBSTACLE_TYPES[typeIndex];

    const obstacle: Obstacle = {
      id: generateId(),
      type,
      position: {
        x: lane * GAME_CONFIG.LANE_WIDTH,
        y: GAME_CONFIG.GROUND_Y + GAME_CONFIG.TRACK_HEIGHT + 1,
        z,
      },
      size: this.getObstacleSize(type),
      rotation: 0,
    };

    if (type === 'moving') {
      obstacle.movingDirection = Math.random() > 0.5 ? 1 : -1;
      obstacle.movingRange = GAME_CONFIG.LANE_WIDTH * 2;
      obstacle.initialX = obstacle.position.x;
    } else if (type === 'pendulum') {
      obstacle.rotationSpeed = 0.03 + Math.random() * 0.02;
      obstacle.initialX = obstacle.position.x;
    }

    this.obstacles.push(obstacle);
    this.createMesh(obstacle);
  }

  private getObstacleSize(type: Obstacle['type']): { width: number; height: number; depth: number } {
    switch (type) {
      case 'static':
        return { width: 2, height: 2, depth: 2 };
      case 'moving':
        return { width: 1.5, height: 2.5, depth: 1.5 };
      case 'pendulum':
        return { width: 1, height: 3, depth: 1 };
      case 'spike':
        return { width: 1.5, height: 0.8, depth: 1.5 };
      default:
        return { width: 2, height: 2, depth: 2 };
    }
  }

  private createMesh(obstacle: Obstacle): void {
    let geometry: THREE.BufferGeometry;
    
    if (obstacle.type === 'spike') {
      geometry = new THREE.ConeGeometry(obstacle.size.width / 2, obstacle.size.height, 4);
    } else {
      geometry = new THREE.BoxGeometry(obstacle.size.width, obstacle.size.height, obstacle.size.depth);
    }

    const material = this.materials[obstacle.type];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      obstacle.position.x,
      obstacle.position.y,
      obstacle.position.z
    );

    if (obstacle.type === 'spike') {
      mesh.rotation.x = Math.PI / 2;
    }

    this.scene.add(mesh);
    this.meshes.set(obstacle.id, mesh);
  }

  update(cameraZ: number, speed: number): void {
    const nearZ = cameraZ - 50;

    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.position.z -= speed;

      if (obstacle.type === 'moving' && obstacle.movingDirection && obstacle.movingRange && obstacle.initialX) {
        obstacle.position.x += obstacle.movingDirection * 0.08;
        if (Math.abs(obstacle.position.x - obstacle.initialX) > obstacle.movingRange / 2) {
          obstacle.movingDirection *= -1;
        }
      }

      if (obstacle.type === 'pendulum' && obstacle.rotationSpeed && obstacle.initialX !== undefined) {
        obstacle.rotation = (obstacle.rotation || 0) + obstacle.rotationSpeed;
        obstacle.position.x = obstacle.initialX + Math.sin(obstacle.rotation) * GAME_CONFIG.LANE_WIDTH;
      }

      const mesh = this.meshes.get(obstacle.id);
      if (mesh) {
        mesh.position.set(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.z
        );
        if (obstacle.type === 'pendulum') {
          mesh.rotation.z = Math.sin(obstacle.rotation || 0) * 0.5;
        }
      }

      if (obstacle.position.z < nearZ) {
        this.removeObstacle(obstacle.id);
        return false;
      }
      return true;
    });
  }

  private removeObstacle(id: string): void {
    const mesh = this.meshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.meshes.delete(id);
    }
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  removeObstacleById(id: string): void {
    this.obstacles = this.obstacles.filter(o => o.id !== id);
    this.removeObstacle(id);
  }

  cleanup(): void {
    this.meshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.meshes.clear();
    this.obstacles = [];
  }
}