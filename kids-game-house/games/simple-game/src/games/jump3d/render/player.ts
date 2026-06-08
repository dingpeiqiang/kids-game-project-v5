import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../config';
import { PlayerState } from '../types';

export function createPlayerMesh(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(GAME_CONFIG.PLAYER.SIZE, 32, 32);
  
  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = 256;
  gradientCanvas.height = 256;
  const ctx = gradientCanvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#4169E1');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  const texture = new THREE.CanvasTexture(gradientCanvas);
  
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    shininess: 100,
    specular: 0x4facfe,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}

export function updatePlayerMesh(mesh: THREE.Mesh, player: PlayerState): void {
  mesh.position.x = player.position.x;
  mesh.position.y = player.position.y;
  mesh.position.z = player.position.z;
  
  mesh.scale.set(player.scale, player.scale, player.scale);
}

export function createChargeEffect(playerMesh: THREE.Mesh): THREE.Mesh {
  const geometry = new THREE.RingGeometry(
    GAME_CONFIG.PLAYER.SIZE * 1.2,
    GAME_CONFIG.PLAYER.SIZE * 1.5,
    32
  );
  
  const material = new THREE.MeshBasicMaterial({
    color: COLORS.PLAYER_GLOW,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  
  playerMesh.add(ring);
  
  return ring;
}

export function updateChargeEffect(ring: THREE.Mesh, chargeRatio: number): void {
  ring.scale.setScalar(1 + chargeRatio * 0.5);
  (ring.material as THREE.MeshBasicMaterial).opacity = chargeRatio * 0.6;
}

export function createTrailEffect(scene: THREE.Scene): { addTrail: (position: THREE.Vector3) => void; update: () => void } {
  const trails: THREE.Mesh[] = [];
  
  return {
    addTrail: (position: THREE.Vector3) => {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.PLAYER_GLOW,
        transparent: true,
        opacity: 0.8,
      });
      
      const trail = new THREE.Mesh(geometry, material);
      trail.position.copy(position);
      scene.add(trail);
      trails.push(trail);
      
      if (trails.length > 20) {
        scene.remove(trails[0]);
        trails.shift();
      }
    },
    
    update: () => {
      trails.forEach((trail, index) => {
        const material = trail.material as THREE.MeshBasicMaterial;
        material.opacity = 0.8 * (index / trails.length);
        trail.scale.setScalar(0.5 + (trails.length - index) / trails.length * 0.5);
      });
    },
  };
}
