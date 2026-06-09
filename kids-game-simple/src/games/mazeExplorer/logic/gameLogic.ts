import { GameState, Position, Key, Trap, LevelConfig, PlayerStats } from '../types';
import { LEVEL_CONFIGS, STORAGE_KEYS } from '../config';
import { MazeGenerator } from './mazeGenerator';
import { CollisionDetector } from './collision';

export class GameLogic {
  private currentLevel: number;
  private levelConfig: LevelConfig;
  private mazeGenerator: MazeGenerator;
  private collisionDetector: CollisionDetector;
  private keys: Key[];
  private traps: Trap[];
  private exitPosition: Position;
  private playerPosition: Position;
  private playerRotation: number;
  private playerStats: PlayerStats;
  private gameState: GameState;
  private startTime: number = 0;
  private timeRemaining: number;
  private score: number;
  private trapHitCount: number;
  private maxTrapHits: number;

  constructor() {
    this.currentLevel = 1;
    this.levelConfig = LEVEL_CONFIGS[0];
    this.playerStats = {
      speed: 5,
      speedMultiplier: 1,
      visionRadius: 20,
    };
    this.maxTrapHits = 3;
    this.trapHitCount = 0;
    this.score = 0;
    this.timeRemaining = this.levelConfig.timeLimit;
    this.playerPosition = { x: 0, y: 0, z: 0 };
    this.playerRotation = 0;

    this.mazeGenerator = this.createMazeGenerator();
    this.collisionDetector = new CollisionDetector([[]], 1);
    this.keys = [];
    this.traps = [];
    this.exitPosition = { x: 0, y: 0, z: 0 };

    this.gameState = this.createInitialGameState();
  }

  private createMazeGenerator(): MazeGenerator {
    return new MazeGenerator({
      size: this.levelConfig.mazeSize,
      cellSize: this.levelConfig.cellSize,
      wallHeight: 3,
      keyCount: this.levelConfig.keyCount,
      trapCount: this.levelConfig.trapCount,
      timeLimit: this.levelConfig.timeLimit,
      fogRadius: this.levelConfig.fogRadius,
    });
  }

  private createInitialGameState(): GameState {
    return {
      currentLevel: this.currentLevel,
      keysCollected: 0,
      totalKeys: this.levelConfig.keyCount,
      timeRemaining: this.levelConfig.timeLimit,
      score: this.score,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      playerPosition: this.playerPosition,
      playerRotation: this.playerRotation,
    };
  }

  initLevel(level?: number): void {
    this.currentLevel = level || this.currentLevel;
    this.levelConfig = LEVEL_CONFIGS[Math.min(this.currentLevel - 1, LEVEL_CONFIGS.length - 1)];

    this.mazeGenerator = this.createMazeGenerator();
    this.mazeGenerator.generate();

    this.collisionDetector = new CollisionDetector(
      this.mazeGenerator.getMaze(),
      this.levelConfig.cellSize
    );

    this.exitPosition = this.mazeGenerator.getExitPosition();
    this.keys = this.mazeGenerator.generateKeys(this.levelConfig.keyCount, this.exitPosition);

    const keyPositions = this.keys.map(k => k.position);
    this.traps = this.mazeGenerator.generateTraps(
      this.levelConfig.trapCount,
      this.exitPosition,
      keyPositions
    );

    this.playerPosition = this.mazeGenerator.getStartPosition();
    this.playerRotation = 0;
    this.playerStats = {
      speed: 5,
      speedMultiplier: 1,
      visionRadius: this.levelConfig.hasFog ? this.levelConfig.fogRadius : 20,
    };

    this.timeRemaining = this.levelConfig.timeLimit;
    this.startTime = Date.now();
    this.trapHitCount = 0;

    this.gameState = this.createInitialGameState();
  }

  getGameState(): GameState {
    return {
      ...this.gameState,
      playerPosition: { ...this.playerPosition },
      timeRemaining: this.timeRemaining,
      keysCollected: this.keys.filter(k => k.collected).length,
      totalKeys: this.keys.length,
      score: this.score,
    };
  }

  getMaze() {
    return this.mazeGenerator.getMaze();
  }

  getKeys(): Key[] {
    return this.keys;
  }

  getTraps(): Trap[] {
    return this.traps;
  }

  getExitPosition(): Position {
    return this.exitPosition;
  }

  getPlayerPosition(): Position {
    return { ...this.playerPosition };
  }

  getPlayerRotation(): number {
    return this.playerRotation;
  }

  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  getLevelConfig(): LevelConfig {
    return { ...this.levelConfig };
  }

  movePlayer(direction: 'forward' | 'backward' | 'left' | 'right', deltaTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.isGameOver) {
      return;
    }

    const speed = this.playerStats.speed * this.playerStats.speedMultiplier * deltaTime;
    let dx = 0;
    let dz = 0;

    switch (direction) {
      case 'forward':
        dx = Math.sin(this.playerRotation) * speed;
        dz = Math.cos(this.playerRotation) * speed;
        break;
      case 'backward':
        dx = -Math.sin(this.playerRotation) * speed;
        dz = -Math.cos(this.playerRotation) * speed;
        break;
      case 'left':
        dx = -Math.cos(this.playerRotation) * speed;
        dz = Math.sin(this.playerRotation) * speed;
        break;
      case 'right':
        dx = Math.cos(this.playerRotation) * speed;
        dz = -Math.sin(this.playerRotation) * speed;
        break;
    }

    if (!this.collisionDetector.checkCollision(this.playerPosition, dx, dz)) {
      this.playerPosition.x += dx;
      this.playerPosition.z += dz;
    }

    this.checkItemCollisions();
    this.checkExitCollision();
  }

  rotatePlayer(angle: number): void {
    this.playerRotation += angle;
  }

  private checkItemCollisions(): void {
    for (const key of this.keys) {
      if (!key.collected && this.collisionDetector.checkItemCollision(this.playerPosition, key.position)) {
        key.collected = true;
        this.updateScore(100);
        
        if (this.keys.every(k => k.collected)) {
          this.onAllKeysCollected();
        }
      }
    }

    for (const trap of this.traps) {
      if (trap.active && this.collisionDetector.checkItemCollision(this.playerPosition, trap.position)) {
        this.onTrapHit(trap);
      }
    }
  }

  private checkExitCollision(): void {
    const allKeysCollected = this.keys.every(k => k.collected);
    if (allKeysCollected && this.collisionDetector.checkItemCollision(this.playerPosition, this.exitPosition, 0.8)) {
      this.onLevelComplete();
    }
  }

  private onAllKeysCollected(): void {
  }

  private onTrapHit(trap: Trap): void {
    trap.active = false;
    this.trapHitCount++;

    switch (trap.type) {
      case 'slow':
        this.playerStats.speedMultiplier = 0.5;
        setTimeout(() => {
          this.playerStats.speedMultiplier = 1;
        }, 3000);
        break;
      case 'fog':
        if (this.levelConfig.hasFog) {
          this.playerStats.visionRadius = Math.max(2, this.playerStats.visionRadius - 2);
          setTimeout(() => {
            this.playerStats.visionRadius = this.levelConfig.fogRadius;
          }, 3000);
        }
        break;
      case 'time':
        this.timeRemaining = Math.max(0, this.timeRemaining - 10);
        break;
    }

    if (this.trapHitCount >= this.maxTrapHits) {
      this.onGameOver('Too many trap hits');
    }
  }

  private onLevelComplete(): void {
    const timeBonus = Math.floor(this.timeRemaining * 10);
    const levelBonus = this.currentLevel * 200;
    this.updateScore(timeBonus + levelBonus);

    this.saveHighLevel(this.currentLevel);
    this.saveBestTime(this.levelConfig.timeLimit - this.timeRemaining);

    this.gameState.isVictory = true;
    this.gameState.isPlaying = false;
  }

  private onGameOver(reason: string): void {
    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
  }

  private updateScore(points: number): void {
    this.score += points;
    this.saveTotalScore(this.score);
  }

  update(deltaTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused) {
      return;
    }

    this.timeRemaining -= deltaTime;

    if (this.timeRemaining <= 0) {
      this.onGameOver('Time ran out');
    }
  }

  nextLevel(): void {
    this.currentLevel++;
    if (this.currentLevel > LEVEL_CONFIGS.length) {
      this.currentLevel = 1;
      this.score = 0;
    }
    this.initLevel();
  }

  resetLevel(): void {
    this.initLevel(this.currentLevel);
  }

  togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
  }

  private saveHighLevel(level: number): void {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_LEVEL) || '1');
    if (level > current) {
      localStorage.setItem(STORAGE_KEYS.HIGH_LEVEL, level.toString());
    }
  }

  private saveBestTime(time: number): void {
    const current = parseFloat(localStorage.getItem(STORAGE_KEYS.BEST_TIME) || 'Infinity');
    if (time < current) {
      localStorage.setItem(STORAGE_KEYS.BEST_TIME, time.toString());
    }
  }

  private saveTotalScore(score: number): void {
    localStorage.setItem(STORAGE_KEYS.TOTAL_SCORE, score.toString());
  }

  getSavedHighLevel(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_LEVEL) || '1');
  }

  getSavedBestTime(): number {
    return parseFloat(localStorage.getItem(STORAGE_KEYS.BEST_TIME) || '0');
  }

  getSavedTotalScore(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SCORE) || '0');
  }
}