import * as THREE from 'three';
import { GAME_CONFIG } from './config';
import { PlayerState, Platform, GameState, LandingResult } from './types';
import { calculateJumpVelocity, updatePlayerPhysics, checkLanding, applyLandingBounce, isPlayerFalling } from './logic/jumpPhysics';
import { generatePlatform, generateInitialPlatforms, cleanupOldPlatforms, updateMovingPlatforms } from './logic/platformGenerator';
import { updateGameState, resetGameState, loadRecords } from './logic/scoreSystem';
import { createScene, createLighting, createClouds, createRenderer, handleResize } from './render/scene';
import { createCamera, updateCameraPosition, setInitialCameraPosition } from './render/camera';
import { createPlayerMesh, updatePlayerMesh, createChargeEffect, updateChargeEffect, createTrailEffect } from './render/player';
import { syncPlatforms, cleanupAllPlatforms } from './render/platforms';

export class Jump3DGame {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private playerMesh: THREE.Mesh;
  private chargeRing: THREE.Mesh;
  private trailEffect: ReturnType<typeof createTrailEffect>;
  private clouds: THREE.Group;
  
  private player: PlayerState = {
    position: { x: 0, y: GAME_CONFIG.PLAYER.SIZE / 2, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    isJumping: false,
    isGrounded: true,
    scale: GAME_CONFIG.PLAYER.IDLE_SCALE,
    currentPlatformIndex: 0,
  };
  
  private platforms: Platform[] = [];
  private gameState: GameState = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    isPlaying: false,
    isGameOver: false,
    isCharging: false,
    chargeTime: 0,
    currentLevel: 1,
  };
  
  private chargeStartTime: number = 0;
  private animationId: number = 0;
  private lastTime: number = 0;
  private showNewRecord: boolean = false;
  
  private onScoreUpdate?: (score: number, combo: number, highScore: number) => void;
  private onGameOver?: (score: number, maxCombo: number, highScore: number, isNewRecord: boolean) => void;
  private onPerfectLanding?: () => void;
  
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.scene = createScene();
    this.camera = createCamera(container);
    this.renderer = createRenderer(container);
    
    createLighting(this.scene);
    this.clouds = createClouds(this.scene);
    handleResize(this.renderer, this.camera);
    
    this.playerMesh = createPlayerMesh();
    this.scene.add(this.playerMesh);
    
    this.chargeRing = createChargeEffect(this.playerMesh);
    this.trailEffect = createTrailEffect(this.scene);
    
    this.initEventListeners();
  }
  
  private initEventListeners(): void {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseUp.bind(this));
    
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }
  
  private onMouseDown(): void {
    this.startCharging();
  }
  
  private onMouseUp(): void {
    this.releaseJump();
  }
  
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.startCharging();
  }
  
  private onTouchEnd(): void {
    this.releaseJump();
  }
  
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (e.repeat) return;
      this.startCharging();
    }
    if (e.key === 'r' || e.key === 'R') {
      this.reset();
    }
  }
  
  private startCharging(): void {
    if (!this.gameState.isPlaying || this.gameState.isGameOver) {
      if (!this.gameState.isPlaying && !this.gameState.isGameOver) {
        this.startGame();
      }
      return;
    }
    
    if (!this.player.isGrounded || this.player.isJumping) return;
    
    this.gameState.isCharging = true;
    this.chargeStartTime = performance.now();
  }
  
  private releaseJump(): void {
    if (!this.gameState.isCharging) return;
    
    const chargeTime = performance.now() - this.chargeStartTime;
    this.gameState.isCharging = false;
    
    if (!this.gameState.isPlaying) {
      this.startGame();
      return;
    }
    
    const velocity = calculateJumpVelocity(chargeTime);
    this.player.velocity = velocity;
    this.player.isJumping = true;
    this.player.isGrounded = false;
  }
  
  private startGame(): void {
    this.gameState.isPlaying = true;
    this.gameState.isGameOver = false;
    this.platforms = generateInitialPlatforms(GAME_CONFIG.WORLD.INITIAL_PLATFORMS);
    
    this.player.position = { 
      x: this.platforms[0].position.x, 
      y: this.platforms[0].position.y + this.platforms[0].height + GAME_CONFIG.PLAYER.SIZE / 2,
      z: this.platforms[0].position.z 
    };
    this.player.velocity = { x: 0, y: 0, z: 0 };
    this.player.isJumping = false;
    this.player.isGrounded = true;
    this.player.currentPlatformIndex = 0;
    
    setInitialCameraPosition(this.camera, this.player.position.z);
    
    syncPlatforms(this.scene, this.platforms);
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime, currentTime);
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
  
  private update(deltaTime: number, currentTime: number): void {
    if (this.gameState.isGameOver) return;
    
    this.clouds.rotation.y += 0.0005;
    
    if (this.gameState.isCharging && this.player.isGrounded) {
      this.gameState.chargeTime = performance.now() - this.chargeStartTime;
      const chargeRatio = Math.min(this.gameState.chargeTime / GAME_CONFIG.PLAYER.CHARGE_DURATION, 1);
      updateChargeEffect(this.chargeRing, chargeRatio);
    } else {
      updateChargeEffect(this.chargeRing, 0);
    }
    
    updateMovingPlatforms(this.platforms, currentTime);
    syncPlatforms(this.scene, this.platforms);
    
    if (this.player.isJumping) {
      this.trailEffect.addTrail(new THREE.Vector3(this.player.position.x, this.player.position.y, this.player.position.z));
      this.trailEffect.update();
    }
    
    updatePlayerPhysics(this.player, deltaTime);
    
    if (this.player.isJumping) {
      const landing = this.checkLanding();
      if (landing.success) {
        this.handleLanding(landing);
      } else if (isPlayerFalling(this.player)) {
        this.gameOver();
      }
    }
    
    updateCameraPosition(this.camera, this.player, this.gameState.isPlaying && !this.player.isJumping);
  }
  
  private checkLanding(): LandingResult {
    return checkLanding(this.player, this.platforms);
  }
  
  private handleLanding(landing: LandingResult): void {
    applyLandingBounce(this.player);
    
    const { newRecord } = updateGameState(this.gameState, landing);
    if (newRecord) {
      this.showNewRecord = true;
    }
    
    if (landing.isPerfect) {
      this.onPerfectLanding?.();
    }
    
    this.onScoreUpdate?.(this.gameState.score, this.gameState.combo, loadRecords().highScore);
    
    const lastPlatform = this.platforms[this.platforms.length - 1];
    const newPlatform = generatePlatform(lastPlatform, this.gameState.score);
    this.platforms.push(newPlatform);
    
    this.platforms = cleanupOldPlatforms(this.platforms, this.player.currentPlatformIndex);
    
    syncPlatforms(this.scene, this.platforms);
  }
  
  private gameOver(): void {
    cancelAnimationFrame(this.animationId);
    this.gameState.isGameOver = true;
    
    const records = loadRecords();
    const isNewRecord = this.gameState.score >= records.highScore;
    
    this.onGameOver?.(this.gameState.score, this.gameState.maxCombo, records.highScore, isNewRecord);
  }
  
  private render(): void {
    updatePlayerMesh(this.playerMesh, this.player);
    this.renderer.render(this.scene, this.camera);
  }
  
  public reset(): void {
    cancelAnimationFrame(this.animationId);
    
    cleanupAllPlatforms(this.scene);
    
    resetGameState(this.gameState);
    
    this.player = {
      position: { x: 0, y: GAME_CONFIG.PLAYER.SIZE / 2, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isJumping: false,
      isGrounded: true,
      scale: GAME_CONFIG.PLAYER.IDLE_SCALE,
      currentPlatformIndex: 0,
    };
    
    this.showNewRecord = false;
    
    updatePlayerMesh(this.playerMesh, this.player);
    updateChargeEffect(this.chargeRing, 0);
    
    setInitialCameraPosition(this.camera, 0);
    this.render();
    
    this.onScoreUpdate?.(0, 0, loadRecords().highScore);
  }
  
  public on(event: string, callback: (...args: unknown[]) => void): void {
    switch (event) {
      case 'scoreUpdate':
        this.onScoreUpdate = callback as (score: number, combo: number, highScore: number) => void;
        break;
      case 'gameOver':
        this.onGameOver = callback as (score: number, maxCombo: number, highScore: number, isNewRecord: boolean) => void;
        break;
      case 'perfectLanding':
        this.onPerfectLanding = callback as () => void;
        break;
    }
  }
  
  public getState(): GameState {
    return { ...this.gameState };
  }
  
  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    
    cleanupAllPlatforms(this.scene);
    
    this.playerMesh.geometry.dispose();
    (this.playerMesh.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
  }
}
