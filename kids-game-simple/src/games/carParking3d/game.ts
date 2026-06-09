import * as THREE from 'three';
import { VehicleState, GameState, CameraMode, Level } from './types';
import { LEVELS, GAME_CONFIG } from './config';
import { updateVehicle, applyCollisionResponse } from './logic/vehiclePhysics';
import { checkCollision, checkParking, isOutOfBounds } from './logic/collision';
import {
  calculateFinalScore,
  isPerfectScore,
  updatePlayerData,
  resetGameState,
  loadPlayerData,
  markGuideSeen,
  getLevelBest,
} from './logic/scoreSystem';
import {
  createScene,
  createRenderer,
  createLighting,
  createGround,
  createParkingSpot,
  createObstacles,
  createLevelBounds,
  handleResize,
} from './render/scene';
import { createCamera, updateCameraPosition, cycleCameraMode } from './render/camera';
import { createVehicle, updateVehicleMesh } from './render/vehicle';
import { createParkingUI, type ParkingUI } from './render/ui';
import { flashCollision, pulseParkingSpot } from './render/effects';
import { audioService } from '../../services/audio';

/** 返回大厅时由 index 统一写入 gameEngine 分数 */
export interface CarParkingPlatformBridge {
  onExit: () => void;
}

export class CarParkingGame {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private vehicle: THREE.Group;
  private parkingSpotGroup: THREE.Group | null = null;
  private obstacleGroups: THREE.Group[] = [];
  private boundsGroup: THREE.Group | null = null;
  private ui: ParkingUI;
  private platform: CarParkingPlatformBridge | null = null;

  private currentLevelConfig: Level | null = null;
  private liveParkingScore = 0;
  private parkingHint = { center: 1, angle: 1, inside: false };
  private outOfBoundsTimer = 0;

  private vehicleState: VehicleState = {
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    velocity: 0,
    angularVelocity: 0,
    steeringAngle: 0,
    isBraking: false,
  };

  private gameState: GameState = {
    currentLevel: 1,
    score: 0,
    maxScore: 100,
    timeRemaining: 120,
    collisions: 0,
    maxCollisions: GAME_CONFIG.MAX_COLLISIONS,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isCompleted: false,
    isPerfect: false,
  };

  private cameraMode: CameraMode = 'follow';
  private inputState = { throttle: 0, steering: 0, brake: false };

  private animationId = 0;
  private lastTime = 0;
  private lastParkingCheck = 0;
  private lastCollisionTime = 0;
  private endedForPlatform = false;

  private readonly onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private readonly onKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);

  constructor(container: HTMLDivElement, platform?: CarParkingPlatformBridge) {
    this.container = container;
    this.platform = platform ?? null;

    this.ui = createParkingUI(container);
    this.ui.onViewReset(
      () => this.resetLevel(),
      () => {
        this.cameraMode = cycleCameraMode(this.cameraMode);
        this.ui.showToast(`视角：${this.cameraMode === 'follow' ? '跟随' : this.cameraMode === 'top' ? '俯视' : '后视'}`);
      }
    );
    this.ui.setMobileInput((partial) => {
      if (partial.throttle !== undefined) this.inputState.throttle = partial.throttle;
      if (partial.steering !== undefined) this.inputState.steering = partial.steering;
      if (partial.brake !== undefined) this.inputState.brake = partial.brake;
    });

    this.scene = createScene();
    this.camera = createCamera(container);
    this.renderer = createRenderer(container);
    createLighting(this.scene);
    createGround(this.scene);
    handleResize(this.renderer, this.camera, container);

    this.vehicle = createVehicle();
    this.scene.add(this.vehicle);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.loadLevel(1);
    const data = loadPlayerData();
    const begin = () => {
      markGuideSeen();
      this.startGame();
    };
    if (!data.guideSeen) {
      this.ui.showGuide(begin);
    } else {
      begin();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.gameState.isCompleted || this.gameState.isGameOver) return;
    switch (e.key.toLowerCase()) {
      case 'w':
        this.inputState.throttle = 1;
        break;
      case 's':
        this.inputState.throttle = -1;
        break;
      case 'a':
        this.inputState.steering = -1;
        break;
      case 'd':
        this.inputState.steering = 1;
        break;
      case ' ':
        e.preventDefault();
        this.inputState.brake = true;
        break;
      case 'c':
        this.cameraMode = cycleCameraMode(this.cameraMode);
        break;
      case 'r':
        this.resetLevel();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
        if (this.inputState.throttle > 0) this.inputState.throttle = 0;
        break;
      case 's':
        if (this.inputState.throttle < 0) this.inputState.throttle = 0;
        break;
      case 'a':
        if (this.inputState.steering < 0) this.inputState.steering = 0;
        break;
      case 'd':
        if (this.inputState.steering > 0) this.inputState.steering = 0;
        break;
      case ' ':
        this.inputState.brake = false;
        break;
    }
  }

  private loadLevel(levelId: number): void {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;

    this.ui.hideResult();
    this.clearLevelObjects();
    this.currentLevelConfig = level;
    this.liveParkingScore = 0;
    this.outOfBoundsTimer = 0;
    this.endedForPlatform = false;

    this.gameState.currentLevel = levelId;
    this.gameState = resetGameState(this.gameState, level.timeLimit);

    this.vehicleState = {
      position: { ...level.startPosition, y: 0.5 },
      rotation: level.startRotation,
      velocity: 0,
      angularVelocity: 0,
      steeringAngle: 0,
      isBraking: false,
    };

    this.parkingSpotGroup = createParkingSpot(this.scene, level.parkingSpot);
    this.obstacleGroups = createObstacles(this.scene, level.obstacles);
    this.boundsGroup = createLevelBounds(this.scene, level.boundsHalfSize ?? 24);

    updateVehicleMesh(this.vehicle, this.vehicleState);
    this.syncHud();
  }

  private clearLevelObjects(): void {
    if (this.parkingSpotGroup) {
      this.scene.remove(this.parkingSpotGroup);
      this.parkingSpotGroup = null;
    }
    if (this.boundsGroup) {
      this.scene.remove(this.boundsGroup);
      this.boundsGroup = null;
    }
    for (const group of this.obstacleGroups) {
      this.scene.remove(group);
    }
    this.obstacleGroups = [];
  }

  public startGame(): void {
    if (this.gameState.isPlaying && !this.gameState.isGameOver && !this.gameState.isCompleted) return;
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.isGameOver = false;
    this.gameState.isCompleted = false;
    this.lastTime = performance.now();
    cancelAnimationFrame(this.animationId);
    this.gameLoop();
  }

  public resetLevel(): void {
    cancelAnimationFrame(this.animationId);
    this.loadLevel(this.gameState.currentLevel);
    this.startGame();
  }

  public nextLevel(): void {
    const nextLevelId = this.gameState.currentLevel + 1;
    if (nextLevelId <= LEVELS.length) {
      this.loadLevel(nextLevelId);
      this.startGame();
    } else {
      this.finishForPlatform(this.gameState.score, true);
    }
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.gameState.isPlaying && !this.gameState.isPaused && !this.gameState.isGameOver && !this.gameState.isCompleted) {
      this.update(deltaTime, currentTime);
    }

    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number, currentTime: number): void {
    const level = this.currentLevelConfig;
    if (!level) return;

    this.gameState.timeRemaining -= deltaTime / 1000;
    if (this.gameState.timeRemaining <= 0) {
      this.gameOver('时间到！停车失败');
      return;
    }

    this.vehicleState = updateVehicle(this.vehicleState, this.inputState, deltaTime);

    const half = level.boundsHalfSize ?? 24;
    if (isOutOfBounds(this.vehicleState, half)) {
      this.outOfBoundsTimer += deltaTime;
      if (this.outOfBoundsTimer > 2500) {
        this.gameOver('驶出场地边界');
        return;
      }
    } else {
      this.outOfBoundsTimer = 0;
    }

    if (checkCollision(this.vehicleState, level.obstacles)) {
      if (currentTime - this.lastCollisionTime > 500) {
        this.gameState.collisions++;
        this.gameState.score = Math.max(0, this.gameState.score - GAME_CONFIG.COLLISION_PENALTY);
        this.lastCollisionTime = currentTime;
        this.vehicleState = applyCollisionResponse(this.vehicleState);
        flashCollision(this.container);
        audioService.crash();
        this.ui.showToast(`碰撞！-${GAME_CONFIG.COLLISION_PENALTY}分`);

        if (this.gameState.collisions >= this.gameState.maxCollisions) {
          this.gameOver('碰撞次数过多');
          return;
        }
      }
    }

    const parkingPreview = checkParking(this.vehicleState, level.parkingSpot);
    this.liveParkingScore = parkingPreview.score;
    this.parkingHint = {
      center: parkingPreview.centerDeviation,
      angle: parkingPreview.angleDeviation,
      inside: parkingPreview.isFullyInside,
    };

    if (currentTime - this.lastParkingCheck > GAME_CONFIG.PARKING_CHECK_INTERVAL) {
      if (Math.abs(this.vehicleState.velocity) < 0.12) {
        if (parkingPreview.success) {
          this.levelComplete(parkingPreview.score, level);
          return;
        }
      }
      this.lastParkingCheck = currentTime;
    }

    updateVehicleMesh(this.vehicle, this.vehicleState, deltaTime);
    updateCameraPosition(
      this.camera,
      this.vehicleState.position,
      this.vehicleState.rotation,
      this.cameraMode,
      deltaTime
    );

    this.syncHud();
  }

  private levelComplete(baseParkingScore: number, level: Level): void {
    const finalScore = calculateFinalScore(baseParkingScore, this.gameState.timeRemaining, level.timeLimit);
    this.gameState.score = finalScore;
    this.gameState.isPerfect = isPerfectScore(finalScore);
    this.gameState.isCompleted = true;
    this.gameState.isPlaying = false;

    const prevBest = getLevelBest(this.gameState.currentLevel);
    const isNewBest = finalScore > prevBest;
    updatePlayerData(this.gameState.currentLevel, finalScore, this.gameState.isPerfect);

    if (this.parkingSpotGroup) pulseParkingSpot(this.parkingSpotGroup);
    if (this.gameState.isPerfect) audioService.win();
    else audioService.pop();

    this.ui.showToast(this.gameState.isPerfect ? '完美停车！' : '停车成功！');
    const hasNext = this.gameState.currentLevel < LEVELS.length;

    this.ui.showResult({
      title: this.gameState.isPerfect ? '完美通关' : '停车成功',
      score: finalScore,
      collisions: this.gameState.collisions,
      isPerfect: this.gameState.isPerfect,
      isNewBest,
      hasNext,
      onNext: () => this.nextLevel(),
      onRetry: () => this.resetLevel(),
      onExit: () => this.finishForPlatform(finalScore, true),
    });
  }

  private gameOver(reason: string): void {
    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
    audioService.lose();
    this.ui.showToast(reason);

    this.ui.showResult({
      title: '闯关失败',
      score: this.gameState.score,
      collisions: this.gameState.collisions,
      isPerfect: false,
      isNewBest: false,
      hasNext: false,
      onNext: () => {},
      onRetry: () => this.resetLevel(),
      onExit: () => this.finishForPlatform(this.gameState.score, false),
    });
  }

  private finishForPlatform(_score: number, _victory: boolean): void {
    if (this.endedForPlatform) return;
    this.endedForPlatform = true;
    this.platform?.onExit();
  }

  private syncHud(): void {
    const name = this.currentLevelConfig?.name ?? '';
    this.ui.updateHud(
      this.gameState,
      name,
      this.cameraMode,
      this.liveParkingScore,
      this.parkingHint
    );
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public getState(): GameState {
    return { ...this.gameState };
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.clearLevelObjects();
    this.ui.destroy();
    this.vehicle.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this.vehicle);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}