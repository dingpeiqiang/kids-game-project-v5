import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../config';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.BACKGROUND);
  return scene;
}

export function createCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 1, 0);
  return camera;
}

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createArena(): THREE.Group {
  const group = new THREE.Group();
  
  const size = GAME_CONFIG.ARENA_SIZE;
  const halfSize = size / 2;
  
  const arenaGeometry = new THREE.PlaneGeometry(size, size);
  const arenaMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.ARENA,
    roughness: 0.8,
    metalness: 0.2,
  });
  const arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
  arena.rotation.x = -Math.PI / 2;
  arena.receiveShadow = true;
  group.add(arena);
  
  const edgeGeometry = new THREE.BoxGeometry(size + 0.4, 0.3, size + 0.4);
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.ARENA_EDGE,
    roughness: 0.3,
    metalness: 0.8,
    emissive: COLORS.ARENA_EDGE,
    emissiveIntensity: 0.3,
  });
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
  edge.position.y = 0.15;
  edge.castShadow = true;
  group.add(edge);
  
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const cornerGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.ARENA_EDGE,
      roughness: 0.2,
      metalness: 0.9,
      emissive: COLORS.ARENA_EDGE,
      emissiveIntensity: 0.5,
    });
    const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
    corner.position.set(
      Math.cos(angle) * (halfSize + 0.2),
      0.4,
      Math.sin(angle) * (halfSize + 0.2)
    );
    corner.castShadow = true;
    group.add(corner);
  }
  
  return group;
}

export function createFighter(isPlayer: boolean): THREE.Group {
  const group = new THREE.Group();
  
  const bodyGeometry = new THREE.CapsuleGeometry(0.8, 1.2, 8, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: isPlayer ? COLORS.PLAYER : COLORS.AI,
    roughness: 0.4,
    metalness: 0.6,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  const headGeometry = new THREE.SphereGeometry(0.45, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: isPlayer ? COLORS.PLAYER : COLORS.AI,
    roughness: 0.3,
    metalness: 0.7,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.5;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);
  
  const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.18, 2.6, 0.38);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.18, 2.6, 0.38);
  group.add(rightEye);
  
  const pupilGeometry = new THREE.SphereGeometry(0.06, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.18, 2.6, 0.42);
  group.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.18, 2.6, 0.42);
  group.add(rightPupil);
  
  const glowGeometry = new THREE.SphereGeometry(0.55, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: isPlayer ? COLORS.PLAYER : COLORS.AI,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 2.5;
  group.add(glow);
  
  return group;
}

export function createLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.bottom = -15;
  scene.add(directionalLight);
  
  const pointLight1 = new THREE.PointLight(COLORS.PLAYER, 0.8, 20);
  pointLight1.position.set(-8, 5, -8);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(COLORS.AI, 0.8, 20);
  pointLight2.position.set(8, 5, 8);
  scene.add(pointLight2);
}

export function createHitEffect(position: THREE.Vector3, color: number): THREE.PointLight {
  const light = new THREE.PointLight(color, 2, 3);
  light.position.copy(position);
  light.position.y += 1;
  return light;
}

export function createParticleSystem(): THREE.Points {
  const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: COLORS.HIT_EFFECT,
    transparent: true,
    opacity: 1,
  });
  return new THREE.Points(particleGeometry, particleMaterial);
}