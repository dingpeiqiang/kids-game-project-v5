import * as THREE from 'three';
import { Obstacle, ParkingSpot } from '../types';
import { COLORS } from '../config';
import { applyEnvironment, createAsphaltGround, addParkingFrame } from './environment';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  applyEnvironment(scene);
  return scene;
}

export function createRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const hemi = new THREE.HemisphereLight(0xb8d4ff, 0x3d4a38, 0.45);
  scene.add(hemi);

  const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1.05);
  directionalLight.position.set(12, 22, 8);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 55;
  directionalLight.shadow.camera.left = -22;
  directionalLight.shadow.camera.right = 22;
  directionalLight.shadow.camera.top = 22;
  directionalLight.shadow.camera.bottom = -22;
  directionalLight.shadow.bias = -0.0002;
  scene.add(directionalLight);
}

export function createGround(scene: THREE.Scene): THREE.Mesh {
  return createAsphaltGround(scene);
}

export function createParkingSpot(scene: THREE.Scene, spot: ParkingSpot): THREE.Group {
  const group = new THREE.Group();

  addParkingFrame(group, spot.width, spot.length);

  const area = new THREE.Mesh(
    new THREE.PlaneGeometry(spot.width, spot.length),
    new THREE.MeshBasicMaterial({
      color: COLORS.PARKING_SPOT,
      transparent: true,
      opacity: 0.22,
    })
  );
  area.name = 'parkingArea';
  area.rotation.x = -Math.PI / 2;
  area.position.y = 0.015;
  group.add(area);
  
  group.position.set(spot.position.x, spot.position.y, spot.position.z);
  group.rotation.y = spot.rotation;
  
  scene.add(group);
  return group;
}

export function createObstacles(scene: THREE.Scene, obstacles: Obstacle[]): THREE.Group[] {
  const groups: THREE.Group[] = [];
  
  for (const obstacle of obstacles) {
    const group = new THREE.Group();
    
    let mesh: THREE.Mesh;
    
    switch (obstacle.type) {
      case 'cone': {
        const coneGroup = new THREE.Group();
        const coneGeometry = new THREE.ConeGeometry(obstacle.width / 2, obstacle.height, 12);
        const coneMaterial = new THREE.MeshStandardMaterial({ color: COLORS.CONE, roughness: 0.55 });
        const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
        coneMesh.position.y = obstacle.height / 2;
        coneMesh.castShadow = true;
        coneGroup.add(coneMesh);
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(obstacle.width * 0.22, obstacle.width * 0.28, 0.12, 12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.05 })
        );
        stripe.position.y = obstacle.height * 0.55;
        coneGroup.add(stripe);
        group.add(coneGroup);
        group.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
        group.rotation.y = obstacle.rotation;
        scene.add(group);
        groups.push(group);
        continue;
      }
        
      case 'barrier':
        const barrierGeometry = new THREE.BoxGeometry(obstacle.width, obstacle.height, obstacle.depth);
        const barrierMaterial = new THREE.MeshStandardMaterial({ color: COLORS.BARRIER });
        mesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
        mesh.position.y = obstacle.height / 2;
        break;
        
      case 'wall':
        const wallGeometry = new THREE.BoxGeometry(obstacle.width, obstacle.height, obstacle.depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.WALL });
        mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        mesh.position.y = obstacle.height / 2;
        break;
        
      case 'car':
        const carGroup = createOtherCar(obstacle.width, obstacle.height, obstacle.depth);
        carGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        group.add(carGroup);
        continue;
        
      default:
        continue;
    }
    
    if (mesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    
    group.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
    group.rotation.y = obstacle.rotation;
    
    scene.add(group);
    groups.push(group);
  }
  
  return groups;
}

function createOtherCar(width: number, height: number, depth: number): THREE.Group {
  const group = new THREE.Group();
  
  const bodyGeometry = new THREE.BoxGeometry(width, height * 0.7, depth);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.OTHER_CAR });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = height * 0.5;
  body.castShadow = true;
  group.add(body);
  
  const roofGeometry = new THREE.BoxGeometry(width * 0.9, height * 0.4, depth * 0.5);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: COLORS.VEHICLE_WINDOW });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, height * 0.85, -depth * 0.2);
  roof.castShadow = true;
  group.add(roof);
  
  const wheelRadius = height * 0.18;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, width * 0.15, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.VEHICLE_WHEEL });
  
  const wheelPositions = [
    [-width / 2 - wheelRadius * 0.5, wheelRadius, depth * 0.4],
    [-width / 2 - wheelRadius * 0.5, wheelRadius, -depth * 0.4],
    [width / 2 + wheelRadius * 0.5, wheelRadius, depth * 0.4],
    [width / 2 + wheelRadius * 0.5, wheelRadius, -depth * 0.4],
  ];
  
  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    group.add(wheel);
  }
  
  return group;
}

/** 场地边界护栏（视觉 + 出界判定参考） */
export function createLevelBounds(scene: THREE.Scene, halfSize: number): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.WALL });
  const h = 1.2;
  const t = 0.25;
  const len = halfSize * 2 + t;

  const walls: [number, number, number, number][] = [
    [0, h / 2, -halfSize, len],
    [0, h / 2, halfSize, len],
    [-halfSize, h / 2, 0, len],
    [halfSize, h / 2, 0, len],
  ];

  walls.forEach(([x, y, z, size], i) => {
    const geo =
      i < 2
        ? new THREE.BoxGeometry(size, h, t)
        : new THREE.BoxGeometry(t, h, size);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  const lampGeo = new THREE.CylinderGeometry(0.08, 0.1, 3, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
  const corners = [
    [-halfSize + 1, halfSize - 1],
    [halfSize - 1, halfSize - 1],
    [-halfSize + 1, -halfSize + 1],
    [halfSize - 1, -halfSize + 1],
  ];
  corners.forEach(([cx, cz]) => {
    const pole = new THREE.Mesh(lampGeo, lampMat);
    pole.position.set(cx, 1.5, cz);
    group.add(pole);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4cc })
    );
    bulb.position.set(cx, 3.1, cz);
    group.add(bulb);
  });

  scene.add(group);
  return group;
}

let resizeHandler: (() => void) | null = null;

export function handleResize(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  container?: HTMLElement
): void {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  resizeHandler = () => {
    const el = container ?? renderer.domElement.parentElement;
    if (!el) return;
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resizeHandler();
  window.addEventListener('resize', resizeHandler);
}
