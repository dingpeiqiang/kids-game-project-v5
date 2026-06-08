import * as THREE from 'three';
import { GAME_CONFIG } from './config';
import type { GameState, InputState, GameStats } from './types';
import { createInitialGameState, checkGameOver, loadGameStats, saveGameStats, updateGameStats } from './logic/gameState';
import { createAttackData, checkAttackCollision, applyDamage, clampToArena, distanceBetween } from './logic/combat';
import { updateAI } from './logic/ai';
import { createScene, createCamera, createRenderer, createArena, createFighter, createLights } from './render/scene';
import { EffectManager } from './render/effects';
import { HUD } from './ui/hud';
import { GameModal } from './ui/modal';
import { InputManager } from './input';

export class MiniFighterGame {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private arena!: THREE.Group;
  private playerMesh!: THREE.Group;
  private aiMesh!: THREE.Group;
  private effectManager!: EffectManager;
  private hud!: HUD;
  private modal!: GameModal;
  private inputManager!: InputManager;
  private gameState!: GameState;
  private gameStats!: GameStats;
  private animationId!: number;
  private lastTime!: number;
  private comboTimer!: number;
  private comboCount!: number;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.gameStats = loadGameStats();
    this.init();
  }
  
  private init(): void {
    this.scene = createScene();
    this.camera = createCamera(this.container.clientWidth / this.container.clientHeight);
    this.renderer = createRenderer(this.container);
    this.arena = createArena();
    this.scene.add(this.arena);
    
    this.playerMesh = createFighter(true);
    this.scene.add(this.playerMesh);
    
    this.aiMesh = createFighter(false);
    this.scene.add(this.aiMesh);
    
    createLights(this.scene);
    
    this.effectManager = new EffectManager(this.scene);
    this.hud = new HUD(this.container);
    this.modal = new GameModal(this.container);
    this.inputManager = new InputManager();
    
    this.gameState = createInitialGameState(this.gameStats.highestLevel > 1 ? 1 : 1);
    this.hud.update(this.gameState);
    this.hud.updateStats(this.gameStats);
    
    this.lastTime = performance.now();
    this.comboTimer = 0;
    this.comboCount = 0;
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    this.gameLoop();
  }
  
  private gameLoop(): void {
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.gameState.isGameOver) {
      this.update(deltaTime);
      this.checkCombo(deltaTime);
    }
    
    this.render();
  }
  
  private update(deltaTime: number): void {
    const input = this.inputManager.getState();
    
    if (input.reset) {
      this.resetGame();
      return;
    }
    
    this.updatePlayer(input, deltaTime);
    this.updateAIState(deltaTime);
    this.handleCombat();
    
    if (checkGameOver(this.gameState)) {
      this.handleGameOver();
    }
    
    this.hud.update(this.gameState);
  }
  
  private updatePlayer(input: InputState, deltaTime: number): void {
    const player = this.gameState.player;
    const now = Date.now();
    
    if (player.stunUntil > now) {
      player.isStunned = true;
      return;
    }
    player.isStunned = false;
    
    player.isBlocking = input.block && !player.isAttacking && !player.isDodging;
    
    const moveSpeed = GAME_CONFIG.PLAYER_SPEED * (deltaTime / 16.67);
    
    let moveX = 0;
    let moveZ = 0;
    
    if (input.moveForward) moveZ -= moveSpeed;
    if (input.moveBackward) moveZ += moveSpeed;
    if (input.moveLeft) moveX -= moveSpeed;
    if (input.moveRight) moveX += moveSpeed;
    
    if (moveX !== 0 || moveZ !== 0) {
      const angle = Math.atan2(moveX, -moveZ);
      player.rotation = angle;
      
      const magnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const normalizedX = (moveX / magnitude) * moveSpeed;
      const normalizedZ = (moveZ / magnitude) * moveSpeed;
      
      player.position.x += normalizedX;
      player.position.z += normalizedZ;
      player.position = clampToArena(player.position);
    }
    
    if (input.attack && player.attackCooldown <= 0 && !player.isBlocking && !player.isDodging) {
      player.isAttacking = true;
      player.attackCooldown = GAME_CONFIG.ATTACK_COOLDOWN;
      
      setTimeout(() => {
        player.isAttacking = false;
      }, GAME_CONFIG.ATTACK_DURATION);
    }
    
    if (input.dodge && player.dodgeCooldown <= 0 && !player.isAttacking && !player.isBlocking) {
      player.isDodging = true;
      player.dodgeCooldown = GAME_CONFIG.DODGE_COOLDOWN;
      player.invincibleUntil = now + GAME_CONFIG.DODGE_INVINCIBLE_DURATION;
      
      const dodgeX = Math.sin(player.rotation) * GAME_CONFIG.DODGE_DISTANCE;
      const dodgeZ = Math.cos(player.rotation) * GAME_CONFIG.DODGE_DISTANCE;
      
      player.position.x += dodgeX;
      player.position.z += dodgeZ;
      player.position = clampToArena(player.position);
      
      setTimeout(() => {
        player.isDodging = false;
      }, GAME_CONFIG.DODGE_DURATION);
    }
    
    if (input.ultimate && player.energy >= GAME_CONFIG.ULTIMATE_ENERGY_COST && !player.isAttacking && !player.isBlocking && !player.isDodging) {
      player.isAttacking = true;
      player.energy = 0;
      
      setTimeout(() => {
        player.isAttacking = false;
      }, GAME_CONFIG.ULTIMATE_DURATION);
    }
    
    if (player.attackCooldown > 0) {
      player.attackCooldown -= deltaTime;
    }
    if (player.dodgeCooldown > 0) {
      player.dodgeCooldown -= deltaTime;
    }
    
    this.updateFighterMesh(this.playerMesh, player);
  }
  
  private updateAIState(deltaTime: number): void {
    const ai = this.gameState.ai;
    const player = this.gameState.player;
    const now = Date.now();
    
    if (ai.stunUntil > now) {
      ai.isStunned = true;
      return;
    }
    ai.isStunned = false;
    
    const action = updateAI(ai, player, deltaTime);
    
    ai.isBlocking = action.action === 'block';
    
    if (action.action === 'move' && action.direction) {
      const moveSpeed = GAME_CONFIG.PLAYER_SPEED * 0.7 * (deltaTime / 16.67);
      ai.position.x += action.direction.x * moveSpeed;
      ai.position.z += action.direction.z * moveSpeed;
      ai.position = clampToArena(ai.position);
      
      const angle = Math.atan2(action.direction.x, action.direction.z);
      ai.rotation = angle;
    }
    
    if (action.action === 'attack' && ai.attackCooldown <= 0) {
      ai.isAttacking = true;
      ai.attackCooldown = GAME_CONFIG.ATTACK_COOLDOWN;
      
      setTimeout(() => {
        ai.isAttacking = false;
      }, GAME_CONFIG.ATTACK_DURATION);
    }
    
    if (action.action === 'dodge' && ai.dodgeCooldown <= 0 && action.direction) {
      ai.isDodging = true;
      ai.dodgeCooldown = GAME_CONFIG.DODGE_COOLDOWN;
      ai.invincibleUntil = now + GAME_CONFIG.DODGE_INVINCIBLE_DURATION;
      
      ai.position.x += action.direction.x * GAME_CONFIG.DODGE_DISTANCE;
      ai.position.z += action.direction.z * GAME_CONFIG.DODGE_DISTANCE;
      ai.position = clampToArena(ai.position);
      
      setTimeout(() => {
        ai.isDodging = false;
      }, GAME_CONFIG.DODGE_DURATION);
    }
    
    if (action.action === 'ultimate' && ai.energy >= GAME_CONFIG.ULTIMATE_ENERGY_COST) {
      ai.isAttacking = true;
      ai.energy = 0;
      
      setTimeout(() => {
        ai.isAttacking = false;
      }, GAME_CONFIG.ULTIMATE_DURATION);
    }
    
    if (ai.attackCooldown > 0) {
      ai.attackCooldown -= deltaTime;
    }
    if (ai.dodgeCooldown > 0) {
      ai.dodgeCooldown -= deltaTime;
    }
    
    this.updateFighterMesh(this.aiMesh, ai);
  }
  
  private handleCombat(): void {
    const player = this.gameState.player;
    const ai = this.gameState.ai;
    
    if (player.isAttacking) {
      const isUltimate = player.energy === 0;
      const attack = createAttackData(player, isUltimate);
      
      if (checkAttackCollision(attack, ai)) {
        const result = applyDamage(player, ai, attack);
        this.handleHit(result, ai.position, isUltimate);
      }
    }
    
    if (ai.isAttacking) {
      const isUltimate = ai.energy === 0;
      const attack = createAttackData(ai, isUltimate);
      
      if (checkAttackCollision(attack, player)) {
        const result = applyDamage(ai, player, attack);
        this.handleHit(result, player.position, isUltimate);
      }
    }
  }
  
  private handleHit(result: { hit: boolean; blocked: boolean; isUltimate: boolean }, position: { x: number; y: number; z: number }, isUltimate: boolean): void {
    if (!result.hit) return;
    
    this.comboCount++;
    this.comboTimer = 2000;
    
    if (result.blocked) {
      this.effectManager.addBlockEffect(position);
      this.hud.showHitEffect('block');
    } else {
      this.effectManager.addHitEffect(position, isUltimate);
      this.effectManager.addCameraShake(isUltimate ? 0.3 : 0.15, isUltimate ? 300 : 150);
      
      if (isUltimate) {
        this.hud.showHitEffect('ultimate');
      } else {
        this.hud.showHitEffect('hit');
      }
      
      if (this.comboCount > 1) {
        this.hud.updateCombo(this.comboCount);
      }
    }
  }
  
  private checkCombo(deltaTime: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }
  
  private updateFighterMesh(mesh: THREE.Group, state: { position: { x: number; y: number; z: number }; rotation: number; isAttacking: boolean; isBlocking: boolean }): void {
    mesh.position.x = state.position.x;
    mesh.position.z = state.position.z;
    mesh.rotation.y = state.rotation;
    
    if (state.isAttacking) {
      mesh.scale.set(1.1, 0.9, 1.1);
    } else if (state.isBlocking) {
      mesh.scale.set(0.95, 1.05, 0.95);
    } else {
      mesh.scale.set(1, 1, 1);
    }
  }
  
  private handleGameOver(): void {
    this.gameStats = updateGameStats(this.gameStats, this.gameState.isVictory, this.gameState.currentLevel);
    saveGameStats(this.gameStats);
    this.hud.updateStats(this.gameStats);
    
    if (this.gameState.isVictory) {
      this.modal.showVictory(
        this.gameState.currentLevel,
        this.gameStats,
        () => this.nextLevel(),
        () => this.resetGame()
      );
    } else {
      this.modal.showDefeat(
        this.gameState.currentLevel,
        this.gameStats,
        () => this.resetGame()
      );
    }
  }
  
  private nextLevel(): void {
    this.modal.hide();
    const nextLevel = this.gameState.currentLevel + 1;
    this.gameState = createInitialGameState(nextLevel);
    this.hud.update(this.gameState);
  }
  
  private resetGame(): void {
    this.modal.hide();
    this.gameState = createInitialGameState(this.gameState.currentLevel);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.hud.update(this.gameState);
    this.inputManager.reset();
  }
  
  private render(): void {
    const cameraOffset = this.effectManager.update();
    
    const playerPos = this.gameState.player.position;
    const aiPos = this.gameState.ai.position;
    const centerX = (playerPos.x + aiPos.x) / 2;
    const centerZ = (playerPos.z + aiPos.z) / 2;
    
    const targetX = centerX + cameraOffset.x;
    const targetY = 10;
    const targetZ = centerZ + 15 + cameraOffset.z;
    
    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
    
    this.camera.lookAt(centerX + cameraOffset.x, 1, centerZ + cameraOffset.z);
    
    this.renderer.render(this.scene, this.camera);
  }
  
  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    this.effectManager.dispose();
    this.hud.dispose();
    this.modal.dispose();
    this.inputManager.dispose();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}