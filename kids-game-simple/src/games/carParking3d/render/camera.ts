import * as THREE from 'three';
import { CameraMode } from '../types';
import { CAMERA_CONFIG } from '../config';

const _lookAt = new THREE.Vector3();
const _desiredLook = new THREE.Vector3();

export function createCamera(container: HTMLDivElement): THREE.PerspectiveCamera {
  const w = container.clientWidth || 400;
  const h = container.clientHeight || 600;
  const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 200);
  camera.position.set(0, 8, 12);
  return camera;
}

export function updateCameraPosition(
  camera: THREE.PerspectiveCamera,
  targetPosition: { x: number; y: number; z: number },
  targetRotation: number,
  mode: CameraMode,
  deltaTime: number
): void {
  const dt = Math.min(deltaTime, 50) / 16.67;
  const lerp = 1 - Math.pow(1 - CAMERA_CONFIG.transitionSpeed * 1.8, dt);

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
        targetPosition.z + 0.5
      );
      break;
    case 'rear':
      targetCameraPosition = new THREE.Vector3(
        targetPosition.x - Math.cos(targetRotation) * CAMERA_CONFIG.rearDistance,
        CAMERA_CONFIG.followHeight * 0.75,
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

  camera.position.lerp(targetCameraPosition, lerp);

  _desiredLook.set(targetPosition.x, targetPosition.y + 0.55, targetPosition.z);
  camera.getWorldDirection(_lookAt);
  _lookAt.add(camera.position);
  _lookAt.lerp(_desiredLook, lerp);
  camera.lookAt(_lookAt);
}

export function cycleCameraMode(currentMode: CameraMode): CameraMode {
  const modes: CameraMode[] = ['follow', 'top', 'rear'];
  const currentIndex = modes.indexOf(currentMode);
  return modes[(currentIndex + 1) % modes.length];
}