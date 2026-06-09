import * as THREE from 'three';
import { GAME_CONFIG } from '../config';
import { PlayerState } from '../types';

export function createCamera(container: HTMLDivElement): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    GAME_CONFIG.CAMERA.ANGLE,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  
  return camera;
}

export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  player: PlayerState,
  isFollowing: boolean
): void {
  if (!isFollowing) {
    return;
  }
  
  const targetX = player.position.x + GAME_CONFIG.CAMERA.TARGET_OFFSET.x;
  const targetY = player.position.y + GAME_CONFIG.CAMERA.TARGET_OFFSET.y;
  const targetZ = player.position.z + GAME_CONFIG.CAMERA.TARGET_OFFSET.z;
  
  camera.position.x += (targetX - camera.position.x) * GAME_CONFIG.CAMERA.FOLLOW_SPEED;
  camera.position.y += (targetY - camera.position.y) * GAME_CONFIG.CAMERA.FOLLOW_SPEED;
  camera.position.z += (targetZ - camera.position.z) * GAME_CONFIG.CAMERA.FOLLOW_SPEED;
  
  const lookAtX = player.position.x;
  const lookAtY = player.position.y + 0.5;
  const lookAtZ = player.position.z + 5;
  
  camera.lookAt(lookAtX, lookAtY, lookAtZ);
}

export function setInitialCameraPosition(camera: THREE.PerspectiveCamera, playerZ: number): void {
  camera.position.set(
    GAME_CONFIG.CAMERA.TARGET_OFFSET.x,
    GAME_CONFIG.CAMERA.TARGET_OFFSET.y,
    GAME_CONFIG.CAMERA.TARGET_OFFSET.z + playerZ
  );
  
  camera.lookAt(0, 0.5, playerZ + 5);
}
