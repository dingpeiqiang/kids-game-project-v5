import * as THREE from 'three';
import { GAME_CONFIG, TRACK_SEGMENT_LENGTH, MAX_TRACK_SEGMENTS, COLORS } from './config';
import { generateId, randomInt } from './utils';
import type { TrackSegment } from './types';

export class TrackManager {
  private scene: THREE.Scene;
  private segments: TrackSegment[] = [];
  private meshes: THREE.Mesh[] = [];
  private trackMaterial: THREE.MeshStandardMaterial;
  private iceMaterial: THREE.MeshStandardMaterial;
  private lineMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trackMaterial = new THREE.MeshStandardMaterial({ color: COLORS.track });
    this.iceMaterial = new THREE.MeshStandardMaterial({ color: COLORS.iceTrack, roughness: 0.3, metalness: 0.5 });
    this.lineMaterial = new THREE.MeshStandardMaterial({ color: COLORS.trackLine });
    this.initializeTrack();
  }

  private initializeTrack(): void {
    for (let i = 0; i < MAX_TRACK_SEGMENTS; i++) {
      const hasGap = i > 5 && Math.random() < 0.1;
      const type = i > 10 && Math.random() < 0.05 ? 'ice' : 'normal';
      this.createSegment(i * TRACK_SEGMENT_LENGTH, type, hasGap);
    }
  }

  private createSegment(z: number, type: 'normal' | 'ice' | 'broken', hasGap: boolean): void {
    const segment: TrackSegment = {
      id: generateId(),
      position: { x: 0, y: GAME_CONFIG.GROUND_Y, z },
      type,
      hasGap,
    };
    this.segments.push(segment);

    if (!hasGap) {
      const geometry = new THREE.BoxGeometry(GAME_CONFIG.TRACK_WIDTH, GAME_CONFIG.TRACK_HEIGHT, TRACK_SEGMENT_LENGTH);
      const material = type === 'ice' ? this.iceMaterial : this.trackMaterial;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, GAME_CONFIG.GROUND_Y + GAME_CONFIG.TRACK_HEIGHT / 2, z + TRACK_SEGMENT_LENGTH / 2);
      this.scene.add(mesh);
      this.meshes.push(mesh);

      this.createTrackLines(z);
    }
  }

  private createTrackLines(z: number): void {
    const linePositions = [-GAME_CONFIG.LANE_WIDTH, 0, GAME_CONFIG.LANE_WIDTH];
    
    linePositions.forEach(x => {
      const geometry = new THREE.BoxGeometry(0.1, GAME_CONFIG.TRACK_HEIGHT + 0.01, TRACK_SEGMENT_LENGTH);
      const mesh = new THREE.Mesh(geometry, this.lineMaterial);
      mesh.position.set(x, GAME_CONFIG.GROUND_Y + GAME_CONFIG.TRACK_HEIGHT / 2 + 0.005, z + TRACK_SEGMENT_LENGTH / 2);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    });
  }

  update(cameraZ: number): void {
    const farthestZ = cameraZ + 150;
    const nearestZ = cameraZ - 50;

    while (this.segments[this.segments.length - 1].position.z < farthestZ) {
      const lastZ = this.segments[this.segments.length - 1].position.z;
      const hasGap = Math.random() < 0.02;
      const type = Math.random() < 0.08 ? 'ice' : 'normal';
      this.createSegment(lastZ + TRACK_SEGMENT_LENGTH, type, hasGap);
    }

    while (this.segments.length > 0 && this.segments[0].position.z < nearestZ) {
      const segment = this.segments.shift()!;
      if (!segment.hasGap) {
        const meshCount = segment.type === 'ice' ? 4 : 4;
        for (let i = 0; i < meshCount; i++) {
          const mesh = this.meshes.shift();
          if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
          }
        }
      }
    }
  }

  getSegments(): TrackSegment[] {
    return this.segments;
  }

  cleanup(): void {
    this.meshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.segments = [];
    this.meshes = [];
  }
}