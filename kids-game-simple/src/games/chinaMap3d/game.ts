import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from './config';
import { GameState, GeoPoint, QuizResult } from './types';
import { calculateScore, calculateTimeBonus, isPassingScore } from './logic/scoring';
import { getRandomQuestion } from './logic/questionBank';
import { loadRecords, updateHighScore, updateMaxLevel, incrementPerfectCount, incrementTotalAnswers, unlockKnowledge } from './logic/storage';
import { createScene, createRenderer, createCamera, createLighting, handleResize } from './render/scene';
import { createChinaMap, createMarker, removeMarker, geoPointToWorld, screenToGeoPoint } from './render/map';
import { createUI, updateUI, showFeedback, showResult } from './render/ui';

export class ChinaMap3DGame {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mapGroup: THREE.Group;
  
  private gameState: GameState = {
    currentLevel: 1,
    score: 0,
    timeRemaining: GAME_CONFIG.TIME_LIMITS[1],
    isPlaying: false,
    isGameOver: false,
    isSuccess: false,
    showResult: false,
    playerPoint: null,
    currentQuestion: null,
  };
  
  private playerMarker: THREE.Mesh | null = null;
  private targetMarker: THREE.Mesh | null = null;
  
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private rotationX = 0;
  private rotationY = 0;
  private zoom = GAME_CONFIG.CAMERA.INITIAL_ZOOM;
  
  private animationId: number = 0;
  private startTime: number = 0;
  
  private ui: ReturnType<typeof createUI>;
  
  private onScoreUpdate?: (score: number, level: number, highScore: number) => void;
  private onGameOver?: (score: number, level: number, isSuccess: boolean, isNewRecord: boolean) => void;
  private onPerfectLanding?: () => void;
  
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.scene = createScene();
    this.camera = createCamera(container, this.zoom);
    this.renderer = createRenderer(container);
    
    createLighting(this.scene);
    this.mapGroup = createChinaMap(this.scene);
    
    handleResize(this.renderer, this.camera, container);
    
    this.ui = createUI(container);
    this.initEventListeners();
    
    this.render();
  }
  
  private initEventListeners(): void {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.container.addEventListener('wheel', this.onWheel.bind(this));
    
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    
    this.ui.restartBtn.addEventListener('click', () => this.reset());
    
    const nextBtn = this.ui.resultModal.querySelector('button:last-child') as HTMLButtonElement;
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextLevel());
    }
  }
  
  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    
    if (!this.gameState.isPlaying) {
      this.startGame();
    }
  }
  
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    
    this.rotationY += deltaX * GAME_CONFIG.CAMERA.ROTATION_SENSITIVITY;
    this.rotationX += deltaY * GAME_CONFIG.CAMERA.ROTATION_SENSITIVITY;
    
    this.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotationX));
    
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  private onMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    
    if (this.gameState.isPlaying && !this.gameState.isGameOver) {
      const geoPoint = screenToGeoPoint(e, this.container, this.camera, this.mapGroup);
      if (geoPoint) {
        this.handleMapClick(geoPoint);
      }
    }
  }
  
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoom += e.deltaY * GAME_CONFIG.CAMERA.ZOOM_SENSITIVITY;
    this.zoom = Math.max(GAME_CONFIG.CAMERA.MIN_ZOOM, Math.min(GAME_CONFIG.CAMERA.MAX_ZOOM, this.zoom));
  }
  
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      if (!this.gameState.isPlaying) {
        this.startGame();
      }
    }
  }
  
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
      
      this.rotationY += deltaX * GAME_CONFIG.CAMERA.ROTATION_SENSITIVITY;
      this.rotationX += deltaY * GAME_CONFIG.CAMERA.ROTATION_SENSITIVITY;
      
      this.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotationX));
      
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const initialDistance = this.initialPinchDistance || distance;
      this.zoom *= distance / initialDistance;
      this.zoom = Math.max(GAME_CONFIG.CAMERA.MIN_ZOOM, Math.min(GAME_CONFIG.CAMERA.MAX_ZOOM, this.zoom));
      this.initialPinchDistance = distance;
    }
  }
  
  private initialPinchDistance: number | null = null;
  
  private onTouchEnd(e: TouchEvent): void {
    this.isDragging = false;
    this.initialPinchDistance = null;
    
    if (e.changedTouches.length === 1 && this.gameState.isPlaying && !this.gameState.isGameOver) {
      const geoPoint = screenToGeoPoint(e.changedTouches[0], this.container, this.camera, this.mapGroup);
      if (geoPoint) {
        this.handleMapClick(geoPoint);
      }
    }
  }
  
  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'r' || e.key === 'R') {
      this.reset();
    }
  }
  
  private startGame(): void {
    this.gameState.isPlaying = true;
    this.gameState.isGameOver = false;
    this.gameState.isSuccess = false;
    this.gameState.showResult = false;
    this.gameState.score = 0;
    this.gameState.timeRemaining = GAME_CONFIG.TIME_LIMITS[this.gameState.currentLevel as keyof typeof GAME_CONFIG.TIME_LIMITS] || 60;
    
    this.loadNewQuestion();
    
    this.startTime = performance.now();
    this.gameLoop();
  }
  
  private loadNewQuestion(): void {
    const difficulty = Math.min(this.gameState.currentLevel, 5);
    const question = getRandomQuestion(difficulty);
    
    if (question) {
      this.gameState.currentQuestion = question;
      this.showTargetMarker(question.target);
    }
  }
  
  private showTargetMarker(target: GeoPoint): void {
    if (this.targetMarker) {
      removeMarker(this.scene, this.targetMarker);
    }
    
    const worldPos = geoPointToWorld(target);
    this.targetMarker = createMarker(this.scene, worldPos, COLORS.TARGET_MARKER);
    this.targetMarker.visible = false;
  }
  
  private handleMapClick(point: GeoPoint): void {
    if (!this.gameState.currentQuestion || this.gameState.isGameOver) return;
    
    this.gameState.playerPoint = point;
    
    if (this.playerMarker) {
      removeMarker(this.scene, this.playerMarker);
    }
    
    const worldPos = geoPointToWorld(point);
    this.playerMarker = createMarker(this.scene, worldPos, COLORS.PLAYER_MARKER);
    
    this.evaluateAnswer();
  }
  
  private evaluateAnswer(): void {
    if (!this.gameState.playerPoint || !this.gameState.currentQuestion) return;
    
    const scoreResult = calculateScore(this.gameState.playerPoint, this.gameState.currentQuestion.target);
    const timeBonus = calculateTimeBonus(this.gameState.timeRemaining);
    const finalScore = scoreResult.score + timeBonus;
    
    this.gameState.score = finalScore;
    
    if (this.targetMarker) {
      this.targetMarker.visible = true;
    }
    
    const success = isPassingScore(finalScore);
    this.gameState.isSuccess = success;
    this.gameState.isGameOver = true;
    
    incrementTotalAnswers();
    
    if (scoreResult.rating === 'perfect') {
      incrementPerfectCount();
      this.onPerfectLanding?.();
    }
    
    unlockKnowledge(this.gameState.currentQuestion.id);
    
    const { newRecord } = updateHighScore(finalScore);
    updateMaxLevel(this.gameState.currentLevel);
    
    const ratingText = this.getRatingText(scoreResult.rating);
    
    showResult(
      this.ui,
      success,
      finalScore,
      ratingText,
      this.gameState.currentQuestion.knowledge,
      this.gameState.currentLevel < 5
    );
    
    this.onGameOver?.(finalScore, this.gameState.currentLevel, success, newRecord);
  }
  
  private getRatingText(rating: string): string {
    switch (rating) {
      case 'perfect': return '完美！';
      case 'excellent': return '优秀！';
      case 'good': return '良好';
      default: return '继续加油';
    }
  }
  
  private gameLoop(): void {
    if (!this.gameState.isPlaying || this.gameState.isGameOver) return;
    
    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000;
    this.gameState.timeRemaining = Math.max(0, GAME_CONFIG.TIME_LIMITS[this.gameState.currentLevel as keyof typeof GAME_CONFIG.TIME_LIMITS] || 60 - elapsed);
    
    if (this.gameState.timeRemaining <= 0) {
      this.gameState.timeRemaining = 0;
      this.handleTimeout();
      return;
    }
    
    updateUI(this.ui, this.gameState);
    
    this.updateCamera();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
  
  private handleTimeout(): void {
    this.gameState.isGameOver = true;
    this.gameState.isSuccess = false;
    
    if (this.targetMarker) {
      this.targetMarker.visible = true;
    }
    
    showResult(
      this.ui,
      false,
      0,
      '时间耗尽',
      this.gameState.currentQuestion?.knowledge || '',
      false
    );
    
    this.onGameOver?.(0, this.gameState.currentLevel, false, false);
  }
  
  private updateCamera(): void {
    const targetX = Math.sin(this.rotationY) * this.zoom;
    const targetZ = Math.cos(this.rotationY) * this.zoom;
    const targetY = this.zoom * Math.cos(this.rotationX) + 2;
    
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
    
    this.camera.lookAt(0, 0, 0);
  }
  
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  private nextLevel(): void {
    this.gameState.currentLevel++;
    this.reset();
    this.startGame();
  }
  
  public reset(): void {
    cancelAnimationFrame(this.animationId);
    
    if (this.playerMarker) {
      removeMarker(this.scene, this.playerMarker);
      this.playerMarker = null;
    }
    
    if (this.targetMarker) {
      removeMarker(this.scene, this.targetMarker);
      this.targetMarker = null;
    }
    
    this.gameState = {
      currentLevel: 1,
      score: 0,
      timeRemaining: GAME_CONFIG.TIME_LIMITS[1],
      isPlaying: false,
      isGameOver: false,
      isSuccess: false,
      showResult: false,
      playerPoint: null,
      currentQuestion: null,
    };
    
    this.rotationX = 0;
    this.rotationY = 0;
    this.zoom = GAME_CONFIG.CAMERA.INITIAL_ZOOM;
    
    updateUI(this.ui, this.gameState);
    this.render();
    
    this.onScoreUpdate?.(0, 1, loadRecords().highScore);
  }
  
  public on(event: string, callback: (...args: unknown[]) => void): void {
    switch (event) {
      case 'scoreUpdate':
        this.onScoreUpdate = callback as (score: number, level: number, highScore: number) => void;
        break;
      case 'gameOver':
        this.onGameOver = callback as (score: number, level: number, isSuccess: boolean, isNewRecord: boolean) => void;
        break;
      case 'perfectLanding':
        this.onPerfectLanding = callback as () => void;
        break;
    }
  }
  
  public getState(): GameState {
    return { ...this.gameState };
  }
  
  public getRecords() {
    return loadRecords();
  }
  
  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    
    if (this.playerMarker) {
      removeMarker(this.scene, this.playerMarker);
    }
    if (this.targetMarker) {
      removeMarker(this.scene, this.targetMarker);
    }
    
    this.mapGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    this.container.removeEventListener('wheel', this.onWheel.bind(this));
    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
  }
}