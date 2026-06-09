import * as THREE from 'three';
import { GAME_CONFIG, DIFFICULTY_LEVELS, COLLECTIBLE_SCORES, SPEED_INCREMENT_DISTANCE, POWERUP_DURATIONS, COLORS } from './config';
import { TrackManager } from './track';
import { Player } from './player';
import { ObstacleManager } from './obstacles';
import { CollectibleManager } from './collectibles';
import { CameraManager } from './camera';
import { InputHandler } from './input';
import { UI } from './ui';
import { checkCollision, checkCollectibleCollision, checkFall } from './collision';

export class CloudRunnerGame {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private trackManager!: TrackManager;
  private player!: Player;
  private obstacleManager!: ObstacleManager;
  private collectibleManager!: CollectibleManager;
  private cameraManager!: CameraManager;
  private inputHandler!: InputHandler;
  private ui!: UI;
  
  private score: number = 0;
  private distance: number = 0;
  private speed: number = 0.5;
  private baseSpeed: number = 0.5;
  private gameOver: boolean = false;
  private isStarted: boolean = false;
  private highScore: number = 0;
  private lastObstacleZ: number = 0;
  private lastCollectibleZ: number = 0;
  
  private animationId: number = 0;
  private lastTime: number = 0;

  constructor(container: HTMLElement) {
    this.initThreeJS(container);
    this.initManagers();
    this.initUI(container);
    this.loadHighScore();
    this.ui.showStartScreen();
  }

  private initThreeJS(container: HTMLElement): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.sky);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(-8, 8, -12);
    this.camera.rotation.set(-0.4, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    this.createClouds();

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private createClouds(): void {
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: COLORS.cloud });
    
    for (let i = 0; i < 15; i++) {
      const cloud = new THREE.Group();
      const baseX = (Math.random() - 0.5) * 50;
      const baseY = 5 + Math.random() * 10;
      const baseZ = Math.random() * 200 - 100;
      
      for (let j = 0; j < 5; j++) {
        const geometry = new THREE.SphereGeometry(1 + Math.random() * 2, 16, 16);
        const part = new THREE.Mesh(geometry, cloudMaterial);
        part.position.set(
          baseX + (Math.random() - 0.5) * 8,
          baseY + (Math.random() - 0.5) * 3,
          baseZ + (Math.random() - 0.5) * 5
        );
        cloud.add(part);
      }
      
      this.scene.add(cloud);
    }
  }

  private initManagers(): void {
    this.trackManager = new TrackManager(this.scene);
    this.player = new Player(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.collectibleManager = new CollectibleManager(this.scene);
    this.cameraManager = new CameraManager(this.camera);
    this.inputHandler = new InputHandler(this.renderer.domElement);
    
    this.inputHandler.setCallback('reset', () => {
      if (this.isStarted && !this.gameOver) {
        this.reset();
      }
    });
  }

  private initUI(container: HTMLElement): void {
    this.ui = new UI(container);
    this.ui.setStartCallback(() => this.start());
    this.ui.setRestartCallback(() => this.reset());
    this.ui.updateHighScore(this.highScore);
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem('cloudRunner_highScore');
    this.highScore = saved ? parseInt(saved) : 0;
  }

  private saveHighScore(): void {
    localStorage.setItem('cloudRunner_highScore', this.highScore.toString());
  }

  private start(): void {
    this.isStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.distance = 0;
    this.baseSpeed = 0.5;
    this.speed = 0.5;
    this.lastObstacleZ = 50;
    this.lastCollectibleZ = 30;
    
    this.ui.hideStartScreen();
    this.player.reset();
    this.obstacleManager.cleanup();
    this.collectibleManager.cleanup();
    this.cameraManager.reset();
    
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private reset(): void {
    this.start();
  }

  private gameLoop(): void {
    if (this.gameOver) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    const input = this.inputHandler.getInput();
    this.player.handleInput(input);

    const playerState = this.player.getState();
    const speedMultiplier = playerState.slowModeActive ? 0.6 : 1;
    const actualSpeed = this.speed * speedMultiplier;

    this.player.update(deltaTime, actualSpeed);

    this.cameraManager.setTarget(new THREE.Vector3(
      this.player.getBounds().position.x,
      this.player.getBounds().position.y,
      0
    ));
    this.cameraManager.update(deltaTime);

    this.trackManager.update(this.cameraManager.getZ());

    this.obstacleManager.update(this.cameraManager.getZ(), actualSpeed);
    this.collectibleManager.update(this.cameraManager.getZ(), actualSpeed);

    this.distance += actualSpeed * 0.1;
    this.updateSpeed();
    this.spawnObjects();
    this.checkCollisions();

    this.ui.updateScore(this.score);
    this.ui.updateDistance(this.distance);
    this.ui.updateSpeed(this.speed / 0.5);
  }

  private updateSpeed(): void {
    const distanceLevel = Math.floor(this.distance / SPEED_INCREMENT_DISTANCE);
    const level = Math.min(distanceLevel + 1, Object.keys(DIFFICULTY_LEVELS).length);
    const config = DIFFICULTY_LEVELS[level];
    
    if (config) {
      this.baseSpeed = 0.5 * config.speedMultiplier;
      this.speed = this.baseSpeed;
    }
  }

  private spawnObjects(): void {
    const cameraZ = this.cameraManager.getZ();
    const level = Math.min(Math.floor(this.distance / SPEED_INCREMENT_DISTANCE) + 1, 5);
    const config = DIFFICULTY_LEVELS[level];

    if (this.lastObstacleZ < cameraZ + 100) {
      if (Math.random() < config.obstacleSpawnRate) {
        const lane = Math.floor(Math.random() * 3) - 1;
        this.obstacleManager.spawnObstacle(this.lastObstacleZ + 50 + Math.random() * 30, lane, level);
      }
      this.lastObstacleZ += 10;
    }

    if (this.lastCollectibleZ < cameraZ + 80) {
      if (Math.random() < config.collectibleSpawnRate) {
        const lane = Math.floor(Math.random() * 3) - 1;
        this.collectibleManager.spawnCollectible(this.lastCollectibleZ + 30 + Math.random() * 20, lane);
      }
      this.lastCollectibleZ += 5;
    }
  }

  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();
    const playerState = this.player.getState();

    for (const obstacle of this.obstacleManager.getObstacles()) {
      if (checkCollision(playerBounds, obstacle)) {
        if (playerState.shieldActive) {
          this.player.activateShield(0);
          this.obstacleManager.removeObstacleById(obstacle.id);
        } else {
          this.endGame();
          return;
        }
      }
    }

    for (const collectible of this.collectibleManager.getCollectibles()) {
      if (checkCollectibleCollision(playerBounds, collectible)) {
        const collected = this.collectibleManager.collect(collectible.id);
        if (collected) {
          const multiplier = playerState.doubleScoreActive ? 2 : 1;
          this.score += COLLECTIBLE_SCORES[collected.type] * multiplier;

          switch (collected.type) {
            case 'shield':
              this.player.activateShield(POWERUP_DURATIONS.shield);
              break;
            case 'double':
              this.player.activateDoubleScore(POWERUP_DURATIONS.double);
              break;
            case 'slow':
              this.player.activateSlowMode(POWERUP_DURATIONS.slow);
              break;
          }
        }
      }
    }

    if (checkFall(playerBounds, GAME_CONFIG.GROUND_Y)) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.gameOver = true;
    cancelAnimationFrame(this.animationId);

    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.highScore = this.score;
      this.saveHighScore();
      this.ui.showNewRecord();
    }

    this.ui.showGameOver(this.score, this.distance, isNewRecord);
    this.ui.updateHighScore(this.highScore);
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize(): void {
    const container = this.renderer.domElement.parentElement!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    this.inputHandler.cleanup();
    this.player.cleanup();
    this.obstacleManager.cleanup();
    this.collectibleManager.cleanup();
    this.trackManager.cleanup();
    this.ui.cleanup();
    
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}