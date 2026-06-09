import * as THREE from 'three';
import { VehicleState, GameState, CameraMode, Level } from './types';
import { LEVELS, GAME_CONFIG } from './config';
import { updateVehicle } from './logic/vehiclePhysics';
import { checkCollision, checkParking } from './logic/collision';
import { calculateFinalScore, isPerfectScore, updatePlayerData, resetGameState } from './logic/scoreSystem';
import { createScene, createRenderer, createLighting, createGround, createParkingSpot, createObstacles, handleResize } from './render/scene';
import { createCamera, updateCameraPosition, cycleCameraMode } from './render/camera';
import { createVehicle, updateVehicleMesh } from './render/vehicle';

export class CarParkingGame {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private vehicle: THREE.Group;
  private parkingSpotGroup: THREE.Group | null = null;
  private obstacleGroups: THREE.Group[] = [];
  
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
  private inputState = {
    throttle: 0,
    steering: 0,
    brake: false,
  };
  
  private animationId: number = 0;
  private lastTime: number = 0;
  private lastParkingCheck: number = 0;
  private lastCollisionTime: number = 0;
  
  private onStateChange?: (state: GameState) => void;
  private onLevelComplete?: (score: number, isPerfect: boolean, levelId: number) => void;
  private onGameOver?: (score: number, levelId: number) => void;
  private onCollision?: () => void;
  
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.scene = createScene();
    this.camera = createCamera(container);
    this.renderer = createRenderer(container);
    
    createLighting(this.scene);
    createGround(this.scene);
    handleResize(this.renderer, this.camera);
    
    this.vehicle = createVehicle();
    this.scene.add(this.vehicle);
    
    this.initEventListeners();
    this.loadLevel(1);
    this.render();
  }
  
  private initEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
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
  
  private touchStartPos = { x: 0, y: 0 };
  private touchStartTime = 0;
  
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    this.touchStartTime = Date.now();
  }
  
  private handleTouchMove(e: TouchEvent): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStartPos.x;
    const dy = touch.clientY - this.touchStartPos.y;
    
    this.inputState.steering = Math.max(-1, Math.min(1, dx * 0.01));
    this.inputState.throttle = Math.max(-1, Math.min(1, -dy * 0.01));
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.inputState.steering = 0;
    this.inputState.throttle = 0;
    
    const touchDuration = Date.now() - this.touchStartTime;
    if (touchDuration < 200) {
      const touch = e.changedTouches[0];
      const rect = this.container.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;
      
      if (x > 0.85 && y < 0.15) {
        this.cameraMode = cycleCameraMode(this.cameraMode);
      } else if (x < 0.15 && y < 0.15) {
        this.resetLevel();
      }
    }
  }
  
  private loadLevel(levelId: number): void {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return;
    
    this.clearLevelObjects();
    
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
    
    updateVehicleMesh(this.vehicle, this.vehicleState);
    this.render();
    
    this.notifyStateChange();
  }
  
  private clearLevelObjects(): void {
    if (this.parkingSpotGroup) {
      this.scene.remove(this.parkingSpotGroup);
      this.parkingSpotGroup = null;
    }
    
    for (const group of this.obstacleGroups) {
      this.scene.remove(group);
    }
    this.obstacleGroups = [];
  }
  
  public startGame(): void {
    if (this.gameState.isPlaying) return;
    
    this.gameState.isPlaying = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  public pauseGame(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
    this.notifyStateChange();
  }
  
  public resetLevel(): void {
    cancelAnimationFrame(this.animationId);
    this.loadLevel(this.gameState.currentLevel);
  }
  
  public nextLevel(): void {
    const nextLevelId = this.gameState.currentLevel + 1;
    if (nextLevelId <= LEVELS.length) {
      this.loadLevel(nextLevelId);
    }
  }
  
  public selectLevel(levelId: number): void {
    if (levelId >= 1 && levelId <= LEVELS.length) {
      this.loadLevel(levelId);
    }
  }
  
  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.gameState.isPaused && !this.gameState.isGameOver && !this.gameState.isCompleted) {
      this.update(deltaTime, currentTime);
    }
    
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
  
  private update(deltaTime: number, currentTime: number): void {
    const level = LEVELS.find(l => l.id === this.gameState.currentLevel);
    if (!level) return;
    
    this.gameState.timeRemaining -= deltaTime / 1000;
    if (this.gameState.timeRemaining <= 0) {
      this.gameOver();
      return;
    }
    
    this.vehicleState = updateVehicle(this.vehicleState, this.inputState, deltaTime);
    
    if (checkCollision(this.vehicleState, level.obstacles)) {
      if (currentTime - this.lastCollisionTime > 500) {
        this.gameState.collisions++;
        this.gameState.score = Math.max(0, this.gameState.score - GAME_CONFIG.COLLISION_PENALTY);
        this.lastCollisionTime = currentTime;
        this.onCollision?.();
        
        if (this.gameState.collisions >= this.gameState.maxCollisions) {
          this.gameOver();
          return;
        }
        
        this.vehicleState.velocity *= -0.3;
      }
    }
    
    if (currentTime - this.lastParkingCheck > GAME_CONFIG.PARKING_CHECK_INTERVAL) {
      if (Math.abs(this.vehicleState.velocity) < 0.1) {
        const parkingResult = checkParking(this.vehicleState, level.parkingSpot);
        if (parkingResult.success) {
          const finalScore = calculateFinalScore(parkingResult.score, this.gameState.timeRemaining, level.timeLimit);
          this.gameState.score = finalScore;
          this.gameState.isPerfect = isPerfectScore(finalScore);
          this.gameState.isCompleted = true;
          
          updatePlayerData(this.gameState.currentLevel, finalScore, this.gameState.isPerfect);
          this.onLevelComplete?.(finalScore, this.gameState.isPerfect, this.gameState.currentLevel);
        }
      }
      this.lastParkingCheck = currentTime;
    }
    
    updateVehicleMesh(this.vehicle, this.vehicleState);
    updateCameraPosition(this.camera, this.vehicleState.position, this.vehicleState.rotation, this.cameraMode, deltaTime);
    
    this.notifyStateChange();
  }
  
  private gameOver(): void {
    cancelAnimationFrame(this.animationId);
    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
    this.onGameOver?.(this.gameState.score, this.gameState.currentLevel);
    this.notifyStateChange();
  }
  
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  private notifyStateChange(): void {
    this.onStateChange?.({ ...this.gameState });
  }
  
  public on(event: string, callback: (...args: unknown[]) => void): void {
    switch (event) {
      case 'stateChange':
        this.onStateChange = callback as (state: GameState) => void;
        break;
      case 'levelComplete':
        this.onLevelComplete = callback as (score: number, isPerfect: boolean, levelId: number) => void;
        break;
      case 'gameOver':
        this.onGameOver = callback as (score: number, levelId: number) => void;
        break;
      case 'collision':
        this.onCollision = callback as () => void;
        break;
    }
  }
  
  public getState(): GameState {
    return { ...this.gameState };
  }
  
  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }
  
  public getLevels(): Level[] {
    return [...LEVELS];
  }
  
  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    
    this.clearLevelObjects();
    
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
    this.container.removeChild(this.renderer.domElement);
    
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
