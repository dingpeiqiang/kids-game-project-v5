import * as THREE from 'three';
import { COLORS } from '../config';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.skyTop);
  
  const fog = new THREE.Fog(COLORS.skyTop, 50, 150);
  scene.fog = fog;
  
  return scene;
}

export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
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

export function createLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  scene.add(directionalLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);
}

export function createBall(radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.ball,
    metalness: 0.3,
    roughness: 0.4,
  });
  const ball = new THREE.Mesh(geometry, material);
  ball.castShadow = true;
  ball.receiveShadow = true;
  return ball;
}

export function createTrack(trackData: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; width: number; type: string }[]): THREE.Group {
  const group = new THREE.Group();
  
  for (const segment of trackData) {
    const length = Math.sqrt(
      Math.pow(segment.end.x - segment.start.x, 2) +
      Math.pow(segment.end.z - segment.start.z, 2)
    );
    
    const geometry = new THREE.BoxGeometry(length, 0.5, segment.width);
    const color = segment.type === 'ice' ? COLORS.ice : segment.type === 'sand' ? COLORS.sand : COLORS.normal;
    
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: segment.type === 'ice' ? 0.1 : 0.7,
      metalness: segment.type === 'ice' ? 0.3 : 0.1,
    });
    
    const trackPiece = new THREE.Mesh(geometry, material);
    trackPiece.position.x = (segment.start.x + segment.end.x) / 2;
    trackPiece.position.y = segment.start.y + 0.25;
    trackPiece.position.z = (segment.start.z + segment.end.z) / 2;
    
    const angle = Math.atan2(segment.end.z - segment.start.z, segment.end.x - segment.start.x);
    trackPiece.rotation.y = angle;
    
    trackPiece.receiveShadow = true;
    trackPiece.castShadow = true;
    group.add(trackPiece);
    
    if (segment.type === 'ice') {
      const edgeGeometry = new THREE.BoxGeometry(length, 0.1, segment.width + 0.2);
      const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.copy(trackPiece.position);
      edge.position.y += 0.3;
      edge.rotation.y = trackPiece.rotation.y;
      group.add(edge);
    }
  }
  
  return group;
}

export function createCrystals(crystalsData: { position: { x: number; y: number; z: number }; size: number }[]): THREE.Group {
  const group = new THREE.Group();
  
  for (const crystal of crystalsData) {
    const geometry = new THREE.OctahedronGeometry(crystal.size, 0);
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.crystal,
      emissive: COLORS.crystalGlow,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const crystalMesh = new THREE.Mesh(geometry, material);
    crystalMesh.position.set(crystal.position.x, crystal.position.y, crystal.position.z);
    crystalMesh.castShadow = true;
    crystalMesh.userData = { originalPosition: { ...crystal.position } };
    group.add(crystalMesh);
  }
  
  return group;
}

export function createObstacles(obstaclesData: { position: { x: number; y: number; z: number }; type: string; size: { x: number; y: number; z: number } }[]): THREE.Group {
  const group = new THREE.Group();
  
  for (const obstacle of obstaclesData) {
    let geometry: THREE.BufferGeometry;
    
    if (obstacle.type === 'pendulum') {
      geometry = new THREE.CylinderGeometry(obstacle.size.x / 2, obstacle.size.x / 2, obstacle.size.z, 16);
    } else {
      geometry = new THREE.BoxGeometry(obstacle.size.x, obstacle.size.y, obstacle.size.z);
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.obstacle,
      metalness: 0.5,
      roughness: 0.6,
    });
    
    const obstacleMesh = new THREE.Mesh(geometry, material);
    obstacleMesh.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
    obstacleMesh.castShadow = true;
    obstacleMesh.receiveShadow = true;
    obstacleMesh.userData = { type: obstacle.type };
    group.add(obstacleMesh);
  }
  
  return group;
}

export function createEndZone(position: { x: number; y: number; z: number }, radius: number = 3): THREE.Group {
  const group = new THREE.Group();
  
  const ringGeometry = new THREE.RingGeometry(radius - 0.3, radius + 0.3, 32);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.endZone,
    emissive: COLORS.endZone,
    emissiveIntensity: 0.8,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(position.x, position.y + 0.1, position.z);
  ring.rotation.x = -Math.PI / 2;
  ring.receiveShadow = true;
  group.add(ring);
  
  return group;
}

export function createSkybox(scene: THREE.Scene): void {
  const geometry = new THREE.SphereGeometry(1000, 32, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(COLORS.skyTop) },
      bottomColor: { value: new THREE.Color(COLORS.skyBottom) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, 100.0, 0.0)).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.5), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  
  const skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
}

export function createParticles(scene: THREE.Scene): THREE.Points {
  const particleCount = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 50 + 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
  });
  
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  
  return particles;
}
