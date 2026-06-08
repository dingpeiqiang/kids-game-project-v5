import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from './config';
import { clamp, lerp } from './utils';
import type { PlayerState, InputState } from './types';

export class Player {
  private scene: THREE.Scene;
  private mesh!: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private shieldMesh: THREE.Mesh | null = null;
  private state!: PlayerState;
  private targetLane!: number;
  private moveProgress: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.state = this.createInitialState();
    this.targetLane = this.state.lane;
    this.mesh = this.createPlayerMesh();
    scene.add(this.mesh);
  }

  private createInitialState(): PlayerState {
    return {
      position: { x: 0, y: GAME_CONFIG.GROUND_Y + GAME_CONFIG.PLAYER_HEIGHT / 2, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isJumping: false,
      isCrouching: false,
      lane: 0,
      shieldActive: false,
      shieldTimer: 0,
      doubleScoreActive: false,
      doubleScoreTimer: 0,
      slowModeActive: false,
      slowModeTimer: 0,
    };
  }

  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT, GAME_CONFIG.PLAYER_DEPTH);
    this.bodyMesh = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: COLORS.player }));
    this.bodyMesh.position.y = GAME_CONFIG.PLAYER_HEIGHT / 2;
    group.add(this.bodyMesh);

    const headGeometry = new THREE.SphereGeometry(GAME_CONFIG.PLAYER_WIDTH * 0.35, 16, 16);
    this.headMesh = new THREE.Mesh(headGeometry, new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
    this.headMesh.position.y = GAME_CONFIG.PLAYER_HEIGHT + GAME_CONFIG.PLAYER_WIDTH * 0.2;
    group.add(this.headMesh);

    return group;
  }

  private updateMesh(): void {
    const targetHeight = this.state.isCrouching ? GAME_CONFIG.PLAYER_CROUCH_HEIGHT : GAME_CONFIG.PLAYER_HEIGHT;
    
    this.bodyMesh.scale.y = targetHeight / GAME_CONFIG.PLAYER_HEIGHT;
    this.bodyMesh.position.y = targetHeight / 2;
    
    const headY = targetHeight + GAME_CONFIG.PLAYER_WIDTH * 0.2;
    this.headMesh.position.y = lerp(this.headMesh.position.y, headY, 0.3);

    const material = this.state.isCrouching ? 
      new THREE.MeshStandardMaterial({ color: COLORS.playerCrouching }) :
      new THREE.MeshStandardMaterial({ color: COLORS.player });
    this.bodyMesh.material = material;

    this.updateShield();
  }

  private updateShield(): void {
    if (this.state.shieldActive && !this.shieldMesh) {
      const geometry = new THREE.SphereGeometry(GAME_CONFIG.PLAYER_WIDTH * 0.8, 16, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: COLORS.shield, 
        transparent: true, 
        opacity: 0.4,
        wireframe: true
      });
      this.shieldMesh = new THREE.Mesh(geometry, material);
      this.mesh.add(this.shieldMesh);
    } else if (!this.state.shieldActive && this.shieldMesh) {
      this.mesh.remove(this.shieldMesh);
      this.shieldMesh.geometry.dispose();
      this.shieldMesh = null;
    }

    if (this.shieldMesh) {
      this.shieldMesh.rotation.y += 0.05;
    }
  }

  handleInput(input: InputState): void {
    if (input.left) {
      this.targetLane = clamp(this.targetLane - 1, -1, 1);
    } else if (input.right) {
      this.targetLane = clamp(this.targetLane + 1, -1, 1);
    }

    if (input.jump && !this.state.isJumping) {
      this.jump();
    }

    if (input.crouch) {
      this.crouch();
    } else {
      this.standUp();
    }
  }

  private jump(): void {
    this.state.velocity.y = GAME_CONFIG.JUMP_FORCE;
    this.state.isJumping = true;
    this.state.isCrouching = false;
  }

  private crouch(): void {
    this.state.isCrouching = true;
  }

  private standUp(): void {
    this.state.isCrouching = false;
  }

  update(deltaTime: number, speed: number): void {

    const moveSpeed = GAME_CONFIG.MOVE_SPEED * (1 + deltaTime / 16);
    
    if (this.targetLane !== this.state.lane) {
      this.moveProgress += moveSpeed * 2;
      if (this.moveProgress >= 1) {
        this.state.lane = this.targetLane;
        this.moveProgress = 0;
      }
    }

    const targetX = this.state.lane * GAME_CONFIG.LANE_WIDTH;
    this.state.position.x = lerp(this.state.position.x, targetX, this.moveProgress * 2);

    this.state.velocity.y += GAME_CONFIG.GRAVITY;

    if (this.state.isCrouching && !this.state.isJumping) {
      this.state.velocity.y = Math.max(this.state.velocity.y, -0.5);
    }

    this.state.position.y += this.state.velocity.y;

    const groundLevel = GAME_CONFIG.GROUND_Y + GAME_CONFIG.PLAYER_HEIGHT / 2;
    if (this.state.position.y <= groundLevel) {
      this.state.position.y = groundLevel;
      this.state.velocity.y = 0;
      this.state.isJumping = false;
    }

    this.updatePowerups();
    this.updateMesh();

    this.mesh.position.set(
      this.state.position.x,
      this.state.position.y,
      this.state.position.z
    );

    const bounce = this.state.isJumping ? Math.sin(Date.now() * 0.01) * 0.1 : 0;
    this.mesh.rotation.x = -this.state.velocity.y * 0.1 + bounce * 0.2;
    this.mesh.rotation.z = (this.targetLane - this.state.lane) * 0.3;
  }

  private updatePowerups(): void {
    if (this.state.shieldActive) {
      this.state.shieldTimer -= 16;
      if (this.state.shieldTimer <= 0) {
        this.state.shieldActive = false;
      }
    }

    if (this.state.doubleScoreActive) {
      this.state.doubleScoreTimer -= 16;
      if (this.state.doubleScoreTimer <= 0) {
        this.state.doubleScoreActive = false;
      }
    }

    if (this.state.slowModeActive) {
      this.state.slowModeTimer -= 16;
      if (this.state.slowModeTimer <= 0) {
        this.state.slowModeActive = false;
      }
    }
  }

  activateShield(duration: number): void {
    this.state.shieldActive = true;
    this.state.shieldTimer = duration;
  }

  activateDoubleScore(duration: number): void {
    this.state.doubleScoreActive = true;
    this.state.doubleScoreTimer = duration;
  }

  activateSlowMode(duration: number): void {
    this.state.slowModeActive = true;
    this.state.slowModeTimer = duration;
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  getBounds(): {
    position: { x: number; y: number; z: number };
    size: { width: number; height: number; depth: number };
  } {
    const height = this.state.isCrouching ? GAME_CONFIG.PLAYER_CROUCH_HEIGHT : GAME_CONFIG.PLAYER_HEIGHT;
    return {
      position: { ...this.state.position },
      size: {
        width: GAME_CONFIG.PLAYER_WIDTH,
        height,
        depth: GAME_CONFIG.PLAYER_DEPTH,
      },
    };
  }

  reset(): void {
    this.state = this.createInitialState();
    this.targetLane = 0;
    this.moveProgress = 0;
    this.mesh.position.set(0, GAME_CONFIG.GROUND_Y + GAME_CONFIG.PLAYER_HEIGHT / 2, 0);
    this.mesh.rotation.set(0, 0, 0);
  }

  cleanup(): void {
    this.scene.remove(this.mesh);
    this.bodyMesh.geometry.dispose();
    this.headMesh.geometry.dispose();
    if (this.shieldMesh) {
      this.shieldMesh.geometry.dispose();
    }
  }
}