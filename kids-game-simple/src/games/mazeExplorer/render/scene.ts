import * as THREE from 'three';
import { Cell, Position, Key, Trap, LevelConfig } from '../types';
import { GAME_CONFIG, COLORS } from '../config';

export class MazeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private wallGroup: THREE.Group;
  private floor: THREE.Mesh | null = null;
  private ceiling: THREE.Mesh | null = null;
  private keys: THREE.Mesh[] = [];
  private traps: THREE.Mesh[] = [];
  private exit: THREE.Mesh | null = null;
  private fogMesh: THREE.Mesh | null = null;
  private fogMaterial: THREE.MeshBasicMaterial | null = null;
  private animationId: number | null = null;
  private isFogEnabled: boolean = false;

  constructor(container: HTMLDivElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.wallGroup = new THREE.Group();
    this.scene.add(this.wallGroup);

    this.keys = [];
    this.traps = [];
    this.isFogEnabled = false;

    this.createFogMesh();
    this.setupLighting();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
  }

  private createFogMesh(): void {
    const fogGeometry = new THREE.SphereGeometry(20, 32, 32);
    this.fogMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.FOG,
      transparent: true,
      opacity: 0.9,
      side: THREE.BackSide,
    });
    this.fogMesh = new THREE.Mesh(fogGeometry, this.fogMaterial);
    this.fogMesh.visible = false;
    this.scene.add(this.fogMesh);
  }

  setFogEnabled(enabled: boolean): void {
    this.isFogEnabled = enabled;
    if (this.fogMesh) {
      this.fogMesh.visible = enabled;
    }
  }

  setFogRadius(radius: number): void {
    if (this.fogMesh) {
      this.fogMesh.scale.set(radius, radius, radius);
    }
  }

  createMaze(maze: Cell[][], cellSize: number, wallHeight: number): void {
    this.clearMaze();

    const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, 0.2);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.WALL,
      roughness: 0.8,
      metalness: 0.2,
    });

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        const cellCenterX = x * cellSize + cellSize / 2;
        const cellCenterZ = y * cellSize + cellSize / 2;

        if (cell.walls.north) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(cellCenterX, wallHeight / 2, cellCenterZ - cellSize / 2);
          this.wallGroup.add(wall);
        }

        if (cell.walls.south) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(cellCenterX, wallHeight / 2, cellCenterZ + cellSize / 2);
          this.wallGroup.add(wall);
        }

        if (cell.walls.east) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.rotation.y = Math.PI / 2;
          wall.position.set(cellCenterX + cellSize / 2, wallHeight / 2, cellCenterZ);
          this.wallGroup.add(wall);
        }

        if (cell.walls.west) {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.rotation.y = Math.PI / 2;
          wall.position.set(cellCenterX - cellSize / 2, wallHeight / 2, cellCenterZ);
          this.wallGroup.add(wall);
        }
      }
    }

    const mazeWidth = maze[0].length * cellSize;
    const mazeDepth = maze.length * cellSize;

    const floorGeometry = new THREE.PlaneGeometry(mazeWidth, mazeDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.FLOOR,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(mazeWidth / 2, 0, mazeDepth / 2);
    this.scene.add(this.floor);

    const ceilingGeometry = new THREE.PlaneGeometry(mazeWidth, mazeDepth);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.CEILING,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    this.ceiling.rotation.x = Math.PI / 2;
    this.ceiling.position.set(mazeWidth / 2, GAME_CONFIG.CEILING_HEIGHT, mazeDepth / 2);
    this.scene.add(this.ceiling);
  }

  clearMaze(): void {
    this.wallGroup.clear();
    
    if (this.floor) {
      this.scene.remove(this.floor);
      this.floor.geometry.dispose();
      (this.floor.material as THREE.Material).dispose();
    }
    
    if (this.ceiling) {
      this.scene.remove(this.ceiling);
      this.ceiling.geometry.dispose();
      (this.ceiling.material as THREE.Material).dispose();
    }

    this.clearKeys();
    this.clearTraps();
    this.clearExit();
  }

  createKeys(keyData: Key[]): void {
    this.clearKeys();

    const keyGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.KEY,
      emissive: COLORS.KEY_GLOW,
      emissiveIntensity: 0.3,
    });

    keyData.forEach(key => {
      const keyMesh = new THREE.Mesh(keyGeometry, keyMaterial);
      keyMesh.position.set(key.position.x, 0.3, key.position.z);
      keyMesh.rotation.x = Math.PI / 2;
      keyMesh.userData = { keyId: key.id, collected: key.collected };
      keyMesh.visible = !key.collected;
      this.scene.add(keyMesh);
      this.keys.push(keyMesh);
    });
  }

  clearKeys(): void {
    this.keys.forEach(key => {
      this.scene.remove(key);
      key.geometry.dispose();
      (key.material as THREE.Material).dispose();
    });
    this.keys = [];
  }

  updateKey(keyId: number, collected: boolean): void {
    const keyMesh = this.keys.find(k => k.userData.keyId === keyId);
    if (keyMesh) {
      keyMesh.visible = !collected;
      keyMesh.userData.collected = collected;
    }
  }

  createTraps(trapData: Trap[]): void {
    this.clearTraps();

    trapData.forEach(trap => {
      let color: number;
      switch (trap.type) {
        case 'slow':
          color = COLORS.TRAP_SLOW;
          break;
        case 'fog':
          color = COLORS.TRAP_FOG;
          break;
        case 'time':
          color = COLORS.TRAP_TIME;
          break;
        default:
          color = COLORS.TRAP_SLOW;
      }

      const trapGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.1, 16);
      const trapMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });

      const trapMesh = new THREE.Mesh(trapGeometry, trapMaterial);
      trapMesh.position.set(trap.position.x, 0.05, trap.position.z);
      trapMesh.userData = { trapId: trap.id, type: trap.type, active: trap.active };
      trapMesh.visible = trap.active;
      this.scene.add(trapMesh);
      this.traps.push(trapMesh);
    });
  }

  clearTraps(): void {
    this.traps.forEach(trap => {
      this.scene.remove(trap);
      trap.geometry.dispose();
      (trap.material as THREE.Material).dispose();
    });
    this.traps = [];
  }

  updateTrap(trapId: number, active: boolean): void {
    const trapMesh = this.traps.find(t => t.userData.trapId === trapId);
    if (trapMesh) {
      trapMesh.visible = active;
      trapMesh.userData.active = active;
    }
  }

  createExit(position: Position): void {
    this.clearExit();

    const exitGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.3, 32);
    const exitMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.EXIT,
      emissive: COLORS.EXIT_GLOW,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    this.exit = new THREE.Mesh(exitGeometry, exitMaterial);
    this.exit.position.set(position.x, 0.15, position.z);
    this.scene.add(this.exit);
  }

  clearExit(): void {
    if (this.exit) {
      this.scene.remove(this.exit);
      this.exit.geometry.dispose();
      (this.exit.material as THREE.Material).dispose();
      this.exit = null;
    }
  }

  updateCamera(position: Position, rotation: number): void {
    this.camera.position.x = position.x;
    this.camera.position.y = GAME_CONFIG.PLAYER_HEIGHT;
    this.camera.position.z = position.z;
    this.camera.rotation.y = rotation;

    if (this.isFogEnabled && this.fogMesh) {
      this.fogMesh.position.copy(this.camera.position);
    }
  }

  animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.002;
    
    this.keys.forEach(key => {
      if (key.visible) {
        key.rotation.z = time;
        key.position.y = 0.3 + Math.sin(time * 2) * 0.1;
      }
    });

    this.traps.forEach(trap => {
      if (trap.visible) {
        trap.rotation.z = time;
        const material = trap.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.2;
      }
    });

    if (this.exit) {
      this.exit.rotation.y = time;
      const material = this.exit.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.3;
    }

    this.renderer.render(this.scene, this.camera);
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private onWindowResize(): void {
    const container = this.renderer.domElement.parentElement;
    if (container) {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    this.clearMaze();
    this.scene.clear();
    this.renderer.dispose();
  }
}