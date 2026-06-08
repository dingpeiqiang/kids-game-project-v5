import * as THREE from 'three';
import { Obstacle, ParkingSpot } from '../types';
import { COLORS } from '../config';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.SKY);
  return scene;
}

export function createRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);
}

export function createGround(scene: THREE.Scene): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(50, 50);
  const material = new THREE.MeshStandardMaterial({ color: COLORS.GROUND });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  
  const gridHelper = new THREE.GridHelper(50, 50, 0x666666, 0x444444);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);
  
  scene.add(ground);
  return ground;
}

export function createParkingSpot(scene: THREE.Scene, spot: ParkingSpot): THREE.Group {
  const group = new THREE.Group();
  
  const hw = spot.width / 2;
  const hl = spot.length / 2;
  
  const cornerPoints = [
    new THREE.Vector3(-hw, 0.02, -hl),
    new THREE.Vector3(hw, 0.02, -hl),
    new THREE.Vector3(hw, 0.02, hl),
    new THREE.Vector3(-hw, 0.02, hl),
  ];
  
  const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.PARKING_LINE, linewidth: 3 });
  
  for (let i = 0; i < 4; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      cornerPoints[i],
      cornerPoints[(i + 1) % 4],
    ]);
    const line = new THREE.Line(geometry, lineMaterial);
    group.add(line);
  }
  
  const areaGeometry = new THREE.PlaneGeometry(spot.width, spot.length);
  const areaMaterial = new THREE.MeshBasicMaterial({ 
    color: COLORS.PARKING_SPOT, 
    transparent: true, 
    opacity: 0.3 
  });
  const area = new THREE.Mesh(areaGeometry, areaMaterial);
  area.rotation.x = -Math.PI / 2;
  area.position.y = 0.01;
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
      case 'cone':
        const coneGeometry = new THREE.ConeGeometry(obstacle.width / 2, obstacle.height, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ color: COLORS.CONE });
        mesh = new THREE.Mesh(coneGeometry, coneMaterial);
        mesh.position.y = obstacle.height / 2;
        break;
        
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

export function handleResize(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
  const handleResize = () => {
    const container = renderer.domElement.parentElement;
    if (container) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  };
  
  window.addEventListener('resize', handleResize);
}
