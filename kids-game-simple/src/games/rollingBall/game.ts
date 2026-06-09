import * as THREE from 'three';
import { LEVELS, CAMERA_CONFIG, GAME_CONFIG } from './config';
import type { Ball, GameState, InputState } from './types';
import {
  updateBall,
  checkTerrainCollision,
  checkCrystalCollision,
  checkObstacleCollision,
  checkEndZone,
  updateObstacles,
} from './logic/physics';
import {
  createScene,
  createCamera,
  createRenderer,
  createLights,
  createBall,
  createTrack,
  createCrystals,
  createObstacles,
  createEndZone,
  createSkybox,
  createParticles,
} from './render/scene';
import { createUI, updateUI, showVictory, showGameOver, type ModalElement } from './render/ui';

export class RollingBallGame {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private ballMesh!: THREE.Mesh;
  private trackGroup!: THREE.Group;
  private crystalsGroup!: THREE.Group;
  private obstaclesGroup!: THREE.Group;
  private endZoneGroup!: THREE.Group;
  private particles!: THREE.Points;

  private ball: Ball = {
    position: { x: 0, y: 2, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    radius: 1,
    hasShield: false,
    isSpeedBoost: false,
    speedBoostTimer: 0,
  };

  private gameState: GameState = {
    level: 0,
    score: 0,
    time: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isVictory: false,
    perfectCompletion: false,
    collectedCrystals: 0,
  };

  private inputState: InputState = {
    left: false,
    right: false,
    forward: false,
    backward: false,
    reset: false,
  };

  private ui: ReturnType<typeof createUI> | null = null;
  private animationId: number = 0;
  private lastTime: number = 0;
  private startTime: number = 0;

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartDistance: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init(): void {
    this.scene = createScene();
    this.camera = createCamera(this.container.clientWidth, this.container.clientHeight);
    this.renderer = createRenderer(this.container);
    createLights(this.scene);
    createSkybox(this.scene);
    this.particles = createParticles(this.scene);

    this.ui = createUI(this.container);
    this.setupEventListeners();
    this.loadLevel(0);

    window.addEventListener('resize', () => this.onResize());
  }

  private setupEventListeners(): void {
    if (!this.ui) return;

    this.ui.startButton.addEventListener('click', () => this.startGame());
    this.ui.resetButton.addEventListener('click', () => this.resetLevel());
    this.ui.nextLevelButton.addEventListener('click', () => this.nextLevel());
    this.ui.restartButton.addEventListener('click', () => this.resetLevel());

    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputState.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputState.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputState.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputState.right = true;
          break;
        case 'Space':
          e.preventDefault();
          if (this.gameState.isPlaying) {
            this.resetLevel();
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputState.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputState.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputState.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputState.right = false;
          break;
      }
    });

    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        this.touchStartDistance = this.getTouchDistance(e.touches);
      }
    });

    this.container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.gameState.isPlaying || this.gameState.isPaused) return;

      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;

        const sensitivity = 0.03;
        this.inputState.left = deltaX < -10;
        this.inputState.right = deltaX > 10;
        this.inputState.backward = deltaY > 10;
        this.inputState.forward = deltaY < -10;

        if (deltaY > 100) {
          this.resetLevel();
        }
      }
    });

    this.container.addEventListener('touchend', () => {
      this.inputState.left = false;
      this.inputState.right = false;
      this.inputState.forward = false;
      this.inputState.backward = false;
    });
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private loadLevel(levelIndex: number): void {
    this.gameState.level = levelIndex;
    this.gameState.score = 0;
    this.gameState.time = 0;
    this.gameState.isPlaying = false;
    this.gameState.isGameOver = false;
    this.gameState.isVictory = false;
    this.gameState.perfectCompletion = false;
    this.gameState.collectedCrystals = 0;

    const level = LEVELS[levelIndex];

    if (this.trackGroup) this.scene.remove(this.trackGroup);
    if (this.crystalsGroup) this.scene.remove(this.crystalsGroup);
    if (this.obstaclesGroup) this.scene.remove(this.obstaclesGroup);
    if (this.endZoneGroup) this.scene.remove(this.endZoneGroup);
    if (this.ballMesh) this.scene.remove(this.ballMesh);

    this.trackGroup = createTrack(level.track);
    this.crystalsGroup = createCrystals(level.crystals.map(c => ({ position: c.position, size: c.size })));
    this.obstaclesGroup = createObstacles(level.obstacles);
    this.endZoneGroup = createEndZone(level.endPosition);
    this.ballMesh = createBall(this.ball.radius);

    this.scene.add(this.trackGroup);
    this.scene.add(this.crystalsGroup);
    this.scene.add(this.obstaclesGroup);
    this.scene.add(this.endZoneGroup);
    this.scene.add(this.ballMesh);

    this.resetBall();

    if (this.ui) {
      updateUI(
        this.ui.scoreElement,
        this.ui.levelElement,
        this.ui.timeElement,
        this.gameState.score,
        this.gameState.level + 1,
        this.gameState.time,
        level.timeLimit
      );
    }
  }

  private resetBall(): void {
    const level = LEVELS[this.gameState.level];
    this.ball.position = { ...level.startPosition };
    this.ball.velocity = { x: 0, y: 0, z: 0 };
    this.ball.rotation = { x: 0, y: 0, z: 0 };
    this.ball.hasShield = false;
    this.ball.isSpeedBoost = false;
    this.ball.speedBoostTimer = 0;

    this.updateBallMesh();
  }

  private startGame(): void {
    if (!this.ui) return;
    this.ui.startModal.hide();
    this.gameState.isPlaying = true;
    this.startTime = Date.now();
    this.lastTime = Date.now();
    this.gameLoop();
  }

  private resetLevel(): void {
    if (!this.ui) return;
    this.ui.victoryModal.hide();
    this.ui.gameOverModal.hide();
    this.loadLevel(this.gameState.level);
    this.startGame();
  }

  private nextLevel(): void {
    if (!this.ui) return;
    this.ui.victoryModal.hide();
    const nextIndex = this.gameState.level + 1;
    if (nextIndex < LEVELS.length) {
      this.loadLevel(nextIndex);
      this.startGame();
    }
  }

  private gameLoop(): void {
    if (!this.gameState.isPlaying) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameState.isPaused) {
      this.gameState.time = (currentTime - this.startTime) / 1000;
      this.update(deltaTime);
    }

    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    const level = LEVELS[this.gameState.level];

    if (level.timeLimit && this.gameState.time >= level.timeLimit) {
      this.gameOver();
      return;
    }

    const terrainType = checkTerrainCollision(this.ball, level.track);
    updateBall(this.ball, this.inputState, terrainType);

    if (this.ball.isSpeedBoost) {
      this.ball.speedBoostTimer -= deltaTime;
      if (this.ball.speedBoostTimer <= 0) {
        this.ball.isSpeedBoost = false;
      }
    }

    const collected = checkCrystalCollision(this.ball, level.crystals);
    if (collected > 0) {
      this.gameState.score += collected * GAME_CONFIG.CRYSTAL_SCORE;
      this.gameState.collectedCrystals += collected;
      this.updateCrystalsVisibility();
    }

    checkObstacleCollision(this.ball, level.obstacles);
    updateObstacles(level.obstacles);
    this.updateObstaclesMesh();

    if (this.ball.position.y < GAME_CONFIG.FALL_THRESHOLD) {
      if (this.ball.hasShield) {
        this.ball.hasShield = false;
        this.resetBall();
      } else {
        this.gameOver();
        return;
      }
    }

    if (checkEndZone(this.ball, level.endPosition)) {
      this.gameState.perfectCompletion = this.gameState.score >= level.perfectScore;
      this.victory();
      return;
    }

    this.updateBallMesh();
    this.updateCamera();

    if (this.ui) {
      updateUI(
        this.ui.scoreElement,
        this.ui.levelElement,
        this.ui.timeElement,
        this.gameState.score,
        this.gameState.level + 1,
        this.gameState.time,
        level.timeLimit
      );
    }
  }

  private updateBallMesh(): void {
    this.ballMesh.position.set(this.ball.position.x, this.ball.position.y, this.ball.position.z);
    this.ballMesh.rotation.set(this.ball.rotation.x, this.ball.rotation.y, this.ball.rotation.z);
  }

  private updateCrystalsVisibility(): void {
    const level = LEVELS[this.gameState.level];
    this.crystalsGroup.children.forEach((child, index) => {
      if (level.crystals[index]?.collected) {
        child.visible = false;
      }
    });
  }

  private updateObstaclesMesh(): void {
    const level = LEVELS[this.gameState.level];
    this.obstaclesGroup.children.forEach((child, index) => {
      const obstacle = level.obstacles[index];
      if (obstacle) {
        child.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
        if (obstacle.type === 'pendulum' && obstacle.angle !== undefined) {
          child.rotation.z = obstacle.angle;
        }
      }
    });
  }

  private updateCamera(): void {
    const targetX = this.ball.position.x - CAMERA_CONFIG.distance * Math.cos(CAMERA_CONFIG.angle);
    const targetZ = this.ball.position.z - CAMERA_CONFIG.distance * Math.sin(CAMERA_CONFIG.angle);
    const targetY = this.ball.position.y + CAMERA_CONFIG.height;

    this.camera.position.x += (targetX - this.camera.position.x) * CAMERA_CONFIG.followSpeed;
    this.camera.position.y += (targetY - this.camera.position.y) * CAMERA_CONFIG.followSpeed;
    this.camera.position.z += (targetZ - this.camera.position.z) * CAMERA_CONFIG.followSpeed;

    this.camera.lookAt(this.ball.position.x, this.ball.position.y, this.ball.position.z);
  }

  private render(): void {
    this.particles.rotation.y += 0.001;
    this.renderer.render(this.scene, this.camera);
  }

  private victory(): void {
    this.gameState.isPlaying = false;
    this.gameState.isVictory = true;

    if (this.ui) {
      showVictory(this.ui.victoryModal, this.gameState.score, this.gameState.perfectCompletion);
    }
  }

  private gameOver(): void {
    this.gameState.isPlaying = false;
    this.gameState.isGameOver = true;

    if (this.ui) {
      showGameOver(this.ui.gameOverModal);
    }
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', () => this.onResize());
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
