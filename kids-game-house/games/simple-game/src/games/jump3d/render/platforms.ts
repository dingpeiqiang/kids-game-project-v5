import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../config';
import { Platform } from '../types';

interface PlatformMesh {
  group: THREE.Group;
  mesh: THREE.Mesh;
  obstacle?: THREE.Mesh;
}

const platformMeshes: Map<number, PlatformMesh> = new Map();

export function createPlatformMesh(platform: Platform): PlatformMesh {
  const group = new THREE.Group();
  
  const geometry = new THREE.BoxGeometry(platform.width, platform.height, platform.depth);
  
  let color = COLORS.PLATFORM_NORMAL;
  if (platform.type === 'special') {
    color = COLORS.PLATFORM_SPECIAL;
  } else if (platform.type === 'moving') {
    color = COLORS.PLATFORM_MOVING;
  }
  
  const material = new THREE.MeshPhongMaterial({
    color,
    shininess: 50,
    specular: 0x444444,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = platform.height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  group.add(mesh);
  
  if (platform.hasObstacle && platform.obstaclePosition) {
    const obstacleGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const obstacleMaterial = new THREE.MeshPhongMaterial({
      color: COLORS.OBSTACLE,
      shininess: 30,
    });
    
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
      platform.obstaclePosition.x - platform.position.x,
      platform.obstaclePosition.y - platform.position.y,
      platform.obstaclePosition.z - platform.position.z
    );
    obstacle.castShadow = true;
    group.add(obstacle);
  }
  
  group.position.set(platform.position.x, platform.position.y, platform.position.z);
  group.rotation.y = platform.rotation;
  
  return { group, mesh, obstacle: group.children[1] as THREE.Mesh | undefined };
}

export function addPlatformToScene(scene: THREE.Scene, platform: Platform): void {
  const mesh = createPlatformMesh(platform);
  platformMeshes.set(platform.id, mesh);
  scene.add(mesh.group);
}

export function updatePlatformMesh(platform: Platform): void {
  const meshData = platformMeshes.get(platform.id);
  if (meshData) {
    meshData.group.position.set(platform.position.x, platform.position.y, platform.position.z);
    meshData.group.rotation.y = platform.rotation;
  }
}

export function removePlatformFromScene(scene: THREE.Scene, platformId: number): void {
  const meshData = platformMeshes.get(platformId);
  if (meshData) {
    scene.remove(meshData.group);
    meshData.mesh.geometry.dispose();
    (meshData.mesh.material as THREE.Material).dispose();
    if (meshData.obstacle) {
      meshData.obstacle.geometry.dispose();
      (meshData.obstacle.material as THREE.Material).dispose();
    }
    platformMeshes.delete(platformId);
  }
}

export function cleanupAllPlatforms(scene: THREE.Scene): void {
  platformMeshes.forEach((meshData, id) => {
    scene.remove(meshData.group);
    meshData.mesh.geometry.dispose();
    (meshData.mesh.material as THREE.Material).dispose();
    if (meshData.obstacle) {
      meshData.obstacle.geometry.dispose();
      (meshData.obstacle.material as THREE.Material).dispose();
    }
  });
  platformMeshes.clear();
}

export function syncPlatforms(scene: THREE.Scene, platforms: Platform[]): void {
  const existingIds = new Set(platformMeshes.keys());
  const currentIds = new Set(platforms.map(p => p.id));
  
  existingIds.forEach(id => {
    if (!currentIds.has(id)) {
      removePlatformFromScene(scene, id);
    }
  });
  
  platforms.forEach(platform => {
    if (!platformMeshes.has(platform.id)) {
      addPlatformToScene(scene, platform);
    } else {
      updatePlatformMesh(platform);
    }
  });
}
