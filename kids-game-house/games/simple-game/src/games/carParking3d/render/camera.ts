import * as THREE from 'three';
import { CameraMode } from '../types';
import { CAMERA_CONFIG } from '../config';

export function createCamera(container: HTMLDivElement): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  return camera;
}

export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  targetPosition: { x: number; y: number; z: number },
  targetRotation: number,
  mode: CameraMode,
  deltaTime: number
): void {
  let targetCameraPosition: THREE.Vector3;
  
  switch (mode) {
    case 'follow':
      targetCameraPosition = new THREE.Vector3(
        targetPosition.x - Math.cos(targetRotation) * CAMERA_CONFIG.followDistance,
        CAMERA_CONFIG.followHeight,
        targetPosition.z - Math.sin(targetRotation) * CAMERA_CONFIG.followDistance
      );
      break;
      
    case 'top':
      targetCameraPosition = new THREE.Vector3(
        targetPosition.x,
        CAMERA_CONFIG.topHeight,
        targetPosition.z - 2
      );
      break;
      
    case 'rear':
      targetCameraPosition = new THREE.Vector3(
        targetPosition.x - Math.cos(targetRotation) * CAMERA_CONFIG.rearDistance,
        CAMERA_CONFIG.followHeight * 0.8,
        targetPosition.z - Math.sin(targetRotation) * CAMERA_CONFIG.rearDistance
      );
      break;
      
    default:
      targetCameraPosition = new THREE.Vector3(
        targetPosition.x - CAMERA_CONFIG.followDistance,
        CAMERA_CONFIG.followHeight,
        targetPosition.z
      );
  }
  
  const lerpFactor = CAMERA_CONFIG.transitionSpeed * (deltaTime / 16.67);
  camera.position.lerp(targetCameraPosition, lerpFactor);
  
  const lookAtTarget = new THREE.Vector3(targetPosition.x, targetPosition.y + 0.5, targetPosition.z);
  
  const currentLookAt = new THREE.Vector3();
  camera.getWorldDirection(currentLookAt);
  currentLookAt.add(camera.position);
  
  const targetLookAt = lookAtTarget;
  currentLookAt.lerp(targetLookAt, lerpFactor);
  
  camera.lookAt(currentLookAt);
}

export function cycleCameraMode(currentMode: CameraMode): CameraMode {
  const modes: CameraMode[] = ['follow', 'top', 'rear'];
  const currentIndex = modes.indexOf(currentMode);
  return modes[(currentIndex + 1) % modes.length];
}
