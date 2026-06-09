import * as THREE from 'three';
import { Block, BlockType, PlayerState, GameState, RaycastResult } from './types';
import {
  BLOCK_SIZE,
  CHUNK_SIZE,
  VIEW_DISTANCE,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  JUMP_FORCE,
  GRAVITY,
  FRICTION,
  DAY_NIGHT_CYCLE,
  CONTROLS,
  BLOCK_KEYS,
} from './config';
import { generateChunk, getBlockKey } from './logic/terrain';
import { resolvePlayerCollision } from './logic/collision';
import { saveWorld, loadWorld, hasSavedWorld, blocksFromSaved } from './logic/storage';
import { createChunkMesh, createBlockMesh } from './render/blocks';
import { createScene, createRenderer, createCamera, createLighting, updateDayNightCycle, createHighlightBox } from './render/scene';
import { createCrosshair, createHUD, createStartScreen, showMessage } from './render/ui';

export class VoxelSandboxGame {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private highlightBox: THREE.LineSegments;

  private blocks: Map<string, Block> = new Map();
  private chunkMeshes: Map<string, THREE.Group> = new Map();
  private loadedChunks: Set<string> = new Set();

  private playerState: PlayerState = {
    x: 0,
    y: 10,
    z: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    rotationY: 0,
    rotationX: 0,
    isGrounded: false,
  };

  private gameState: GameState = {
    isPlaying: false,
    isPaused: false,
    currentBlockType: 'grass',
    gameTime: 0,
    isDay: true,
  };

  private inputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    sprint: false,
  };

  private worldSeed = Math.floor(Math.random() * 1000000);
  private animationId: number = 0;
  private lastTime: number = 0;
  private lastSaveTime: number = 0;

  private crosshair: HTMLDivElement;
  private hud: {
    blockBar: HTMLDivElement;
    statusBar: HTMLDivElement;
    updateBlockBar: (currentBlock: BlockType) => void;
    updateStatus: (time: number, isDay: boolean) => void;
  };
  private startScreen: HTMLDivElement;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private onStateChange?: (state: GameState) => void;

  constructor(container: HTMLDivElement) {
    this.container = container;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    this.scene = createScene();
    this.camera = createCamera(container);
    this.renderer = createRenderer(container);
    const lighting = createLighting(this.scene);
    this.sunLight = lighting.sun;
    this.ambientLight = lighting.ambient;
    this.highlightBox = createHighlightBox();
    this.scene.add(this.highlightBox);

    this.crosshair = createCrosshair(container);
    this.hud = createHUD(container);
    this.startScreen = createStartScreen(container, () => this.startNewGame(), () => this.loadSavedGame());

    this.initEventListeners();
    this.render();

    if (hasSavedWorld()) {
      showMessage(container, '检测到存档，点击"加载存档"继续游戏');
    }
  }

  private initEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (CONTROLS.moveForward.includes(e.code)) this.inputState.moveForward = true;
    if (CONTROLS.moveBackward.includes(e.code)) this.inputState.moveBackward = true;
    if (CONTROLS.moveLeft.includes(e.code)) this.inputState.moveLeft = true;
    if (CONTROLS.moveRight.includes(e.code)) this.inputState.moveRight = true;
    if (CONTROLS.jump.includes(e.code)) this.inputState.jump = true;
    if (CONTROLS.sprint.includes(e.code)) this.inputState.sprint = true;

    if (BLOCK_KEYS[e.code]) {
      this.gameState.currentBlockType = BLOCK_KEYS[e.code];
      this.hud.updateBlockBar(this.gameState.currentBlockType);
    }

    if (e.code === 'KeyO') {
      this.gameState.gameTime += DAY_NIGHT_CYCLE / 2;
    }

    if (e.code === 'KeyR' && this.gameState.isPlaying) {
      this.resetWorld();
    }

    if (e.code === 'Escape') {
      document.exitPointerLock();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (CONTROLS.moveForward.includes(e.code)) this.inputState.moveForward = false;
    if (CONTROLS.moveBackward.includes(e.code)) this.inputState.moveBackward = false;
    if (CONTROLS.moveLeft.includes(e.code)) this.inputState.moveLeft = false;
    if (CONTROLS.moveRight.includes(e.code)) this.inputState.moveRight = false;
    if (CONTROLS.jump.includes(e.code)) this.inputState.jump = false;
    if (CONTROLS.sprint.includes(e.code)) this.inputState.sprint = false;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!document.pointerLockElement) return;

    const result = this.raycastBlocks();
    if (result.hit && result.block) {
      if (e.button === 0) {
        this.removeBlock(result.block);
      } else if (e.button === 2) {
        this.placeBlock(result.position!, result.face!);
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!document.pointerLockElement) return;

    const sensitivity = 0.002;
    this.playerState.rotationY += e.movementX * sensitivity;
    this.playerState.rotationX -= e.movementY * sensitivity;
    this.playerState.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.playerState.rotationX));

    const result = this.raycastBlocks();
    if (result.hit && result.block) {
      this.highlightBox.visible = true;
      this.highlightBox.position.set(
        result.block.x * BLOCK_SIZE + BLOCK_SIZE / 2,
        result.block.y * BLOCK_SIZE + BLOCK_SIZE / 2,
        result.block.z * BLOCK_SIZE + BLOCK_SIZE / 2
      );
    } else {
      this.highlightBox.visible = false;
    }
  }

  private handlePointerLockChange(): void {
    if (document.pointerLockElement === this.renderer.domElement) {
      this.crosshair.style.display = 'block';
    } else {
      this.crosshair.style.display = 'none';
      this.highlightBox.visible = false;
    }
  }

  private requestPointerLock(): void {
    if (!document.pointerLockElement) {
      this.renderer.domElement.requestPointerLock();
    }
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private raycastBlocks(): RaycastResult {
    this.mouse.set(0, 0);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const blockObjects: THREE.Object3D[] = [];
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Group) {
        child.children.forEach(obj => {
          if (obj instanceof THREE.Mesh && obj.userData.block) {
            blockObjects.push(obj);
          }
        });
      }
    });

    const intersects = this.raycaster.intersectObjects(blockObjects);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const block = (intersect.object as THREE.Mesh).userData.block as Block;
      const face = this.getFaceFromNormal(intersect.face?.normal);

      let newPos = { x: block.x, y: block.y, z: block.z };
      if (face) {
        switch (face) {
          case 'right': newPos.x++; break;
          case 'left': newPos.x--; break;
          case 'top': newPos.y++; break;
          case 'bottom': newPos.y--; break;
          case 'front': newPos.z++; break;
          case 'back': newPos.z--; break;
        }
      }

      return {
        hit: true,
        block,
        face: face as 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | undefined,
        position: newPos,
      };
    }

    return { hit: false };
  }

  private getFaceFromNormal(normal?: THREE.Vector3): string | undefined {
    if (!normal) return undefined;
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    if (absX > absY && absX > absZ) {
      return normal.x > 0 ? 'right' : 'left';
    } else if (absY > absX && absY > absZ) {
      return normal.y > 0 ? 'top' : 'bottom';
    } else {
      return normal.z > 0 ? 'front' : 'back';
    }
  }

  private startNewGame(): void {
    this.worldSeed = Math.floor(Math.random() * 1000000);
    this.blocks.clear();
    this.chunkMeshes.forEach(mesh => this.scene.remove(mesh));
    this.chunkMeshes.clear();
    this.loadedChunks.clear();

    this.playerState = {
      x: 0,
      y: 20,
      z: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      rotationY: 0,
      rotationX: 0,
      isGrounded: false,
    };

    this.gameState = {
      isPlaying: true,
      isPaused: false,
      currentBlockType: 'grass',
      gameTime: 0,
      isDay: true,
    };

    this.container.removeChild(this.startScreen);
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
    this.camera.rotation.set(0, 0, 0);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private loadSavedGame(): void {
    const saved = loadWorld();
    if (!saved) {
      showMessage(this.container, '没有找到存档');
      return;
    }

    this.worldSeed = saved.seed;
    this.blocks = blocksFromSaved(saved.blocks);
    this.chunkMeshes.forEach(mesh => this.scene.remove(mesh));
    this.chunkMeshes.clear();
    this.loadedChunks.clear();

    this.playerState = {
      x: saved.playerPosition.x,
      y: saved.playerPosition.y,
      z: saved.playerPosition.z,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
      rotationY: 0,
      rotationX: 0,
      isGrounded: false,
    };

    this.gameState = {
      isPlaying: true,
      isPaused: false,
      currentBlockType: 'grass',
      gameTime: saved.gameTime,
      isDay: true,
    };

    this.container.removeChild(this.startScreen);
    this.camera.position.set(this.playerState.x, this.playerState.y, this.playerState.z);
    this.camera.rotation.set(0, 0, 0);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private resetWorld(): void {
    this.startNewGame();
    showMessage(this.container, '世界已重置');
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (!this.gameState.isPaused) {
      this.update(deltaTime);
    }

    this.render();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    this.gameState.gameTime += deltaTime * 1000;
    this.gameState.isDay = (this.gameState.gameTime % DAY_NIGHT_CYCLE) < DAY_NIGHT_CYCLE / 2;

    this.hud.updateStatus(this.gameState.gameTime, this.gameState.isDay);
    updateDayNightCycle(this.scene, this.sunLight, this.ambientLight, this.gameState.gameTime, DAY_NIGHT_CYCLE);

    this.updatePlayer(deltaTime);
    this.updateChunks();

    if (this.gameState.isPlaying && Date.now() - this.lastSaveTime > 5000) {
      this.saveGame();
      this.lastSaveTime = Date.now();
    }

    if (this.playerState.y < -50) {
      this.playerState.y = 50;
      this.playerState.velocityY = 0;
      showMessage(this.container, '坠落虚空，已重生');
    }

    this.notifyStateChange();
  }

  private updatePlayer(deltaTime: number): void {
    const speed = this.inputState.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

    let moveX = 0;
    let moveZ = 0;

    if (this.inputState.moveForward) moveZ -= 1;
    if (this.inputState.moveBackward) moveZ += 1;
    if (this.inputState.moveLeft) moveX -= 1;
    if (this.inputState.moveRight) moveX += 1;

    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    const cosY = Math.cos(this.playerState.rotationY);
    const sinY = Math.sin(this.playerState.rotationY);

    this.playerState.velocityX += (moveX * cosY - moveZ * sinY) * speed * deltaTime * 10;
    this.playerState.velocityZ += (moveX * sinY + moveZ * cosY) * speed * deltaTime * 10;

    if (this.inputState.jump && this.playerState.isGrounded) {
      this.playerState.velocityY = JUMP_FORCE;
      this.playerState.isGrounded = false;
    }

    this.playerState.velocityY -= GRAVITY * deltaTime;

    this.playerState.velocityX *= Math.pow(1 - FRICTION * deltaTime, 3);
    this.playerState.velocityZ *= Math.pow(1 - FRICTION * deltaTime, 3);

    const result = resolvePlayerCollision(
      this.playerState.x,
      this.playerState.y,
      this.playerState.z,
      this.playerState.velocityX * deltaTime,
      this.playerState.velocityY * deltaTime,
      this.playerState.velocityZ * deltaTime,
      this.blocks
    );

    this.playerState.x = result.x;
    this.playerState.y = result.y;
    this.playerState.z = result.z;
    this.playerState.velocityX = result.velocityX;
    this.playerState.velocityY = result.velocityY;
    this.playerState.velocityZ = result.velocityZ;
    this.playerState.isGrounded = result.isGrounded;

    this.camera.position.set(
      this.playerState.x,
      this.playerState.y + PLAYER_HEIGHT,
      this.playerState.z
    );
    this.camera.rotation.set(this.playerState.rotationX, this.playerState.rotationY, 0);
  }

  private updateChunks(): void {
    const playerChunkX = Math.floor(this.playerState.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(this.playerState.z / CHUNK_SIZE);

    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        const chunkX = playerChunkX + dx;
        const chunkZ = playerChunkZ + dz;
        const chunkKey = `${chunkX},${chunkZ}`;

        if (!this.loadedChunks.has(chunkKey)) {
          this.loadChunk(chunkX, chunkZ);
        }
      }
    }

    this.loadedChunks.forEach(chunkKey => {
      const [x, z] = chunkKey.split(',').map(Number);
      const dist = Math.abs(x - playerChunkX) + Math.abs(z - playerChunkZ);
      if (dist > VIEW_DISTANCE + 1) {
        this.unloadChunk(chunkKey);
      }
    });
  }

  private loadChunk(chunkX: number, chunkZ: number): void {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    let chunkBlocks: Map<string, Block>;
    
    const existingBlocks = new Map<string, Block>();
    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;
    
    for (let x = startX; x < startX + CHUNK_SIZE; x++) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
        for (let y = 0; y < 100; y++) {
          const key = getBlockKey(x, y, z);
          if (this.blocks.has(key)) {
            existingBlocks.set(key, this.blocks.get(key)!);
          }
        }
      }
    }

    if (existingBlocks.size > 0) {
      chunkBlocks = existingBlocks;
    } else {
      chunkBlocks = generateChunk(chunkX, chunkZ, this.worldSeed);
      chunkBlocks.forEach(block => {
        this.blocks.set(getBlockKey(block.x, block.y, block.z), block);
      });
    }

    const mesh = createChunkMesh(chunkBlocks);
    this.scene.add(mesh);
    this.chunkMeshes.set(chunkKey, mesh);
    this.loadedChunks.add(chunkKey);
  }

  private unloadChunk(chunkKey: string): void {
    const mesh = this.chunkMeshes.get(chunkKey);
    if (mesh) {
      this.scene.remove(mesh);
      this.chunkMeshes.delete(chunkKey);
      this.loadedChunks.delete(chunkKey);
    }
  }

  private removeBlock(block: Block): void {
    const key = getBlockKey(block.x, block.y, block.z);
    this.blocks.delete(key);

    const chunkX = Math.floor(block.x / CHUNK_SIZE);
    const chunkZ = Math.floor(block.z / CHUNK_SIZE);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    this.reloadChunk(chunkKey);
  }

  private placeBlock(position: { x: number; y: number; z: number }, face: string): void {
    const key = getBlockKey(position.x, position.y, position.z);
    if (this.blocks.has(key)) return;

    const newBlock: Block = {
      type: this.gameState.currentBlockType,
      x: position.x,
      y: position.y,
      z: position.z,
    };

    this.blocks.set(key, newBlock);

    const chunkX = Math.floor(position.x / CHUNK_SIZE);
    const chunkZ = Math.floor(position.z / CHUNK_SIZE);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    this.reloadChunk(chunkKey);
  }

  private reloadChunk(chunkKey: string): void {
    const mesh = this.chunkMeshes.get(chunkKey);
    if (mesh) {
      this.scene.remove(mesh);
    }

    const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;
    const chunkBlocks = new Map<string, Block>();

    for (let x = startX; x < startX + CHUNK_SIZE; x++) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z++) {
        for (let y = 0; y < 100; y++) {
          const key = getBlockKey(x, y, z);
          if (this.blocks.has(key)) {
            chunkBlocks.set(key, this.blocks.get(key)!);
          }
        }
      }
    }

    const newMesh = createChunkMesh(chunkBlocks);
    this.scene.add(newMesh);
    this.chunkMeshes.set(chunkKey, newMesh);
  }

  private saveGame(): void {
    saveWorld(
      this.worldSeed,
      this.blocks,
      this.playerState.x,
      this.playerState.y,
      this.playerState.z,
      this.gameState.gameTime
    );
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private notifyStateChange(): void {
    this.onStateChange?.({ ...this.gameState });
  }

  public on(event: string, callback: (state: GameState) => void): void {
    if (event === 'stateChange') {
      this.onStateChange = callback;
    }
  }

  public getState(): GameState {
    return { ...this.gameState };
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
  }
}