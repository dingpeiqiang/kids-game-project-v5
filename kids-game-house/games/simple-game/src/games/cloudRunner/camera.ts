import * as THREE from 'three';
import { lerp } from './utils';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3;
  private targetRotation: THREE.Euler;
  private offset: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(-8, 8, -12);
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
  }

  setTarget(playerPosition: THREE.Vector3): void {
    this.targetPosition.copy(playerPosition).add(this.offset);
    this.targetRotation.set(-0.4, 0, 0);
  }

  update(deltaTime: number): void {
    const smoothFactor = Math.min(deltaTime / 16, 1) * 0.15;

    this.camera.position.x = lerp(this.camera.position.x, this.targetPosition.x, smoothFactor);
    this.camera.position.y = lerp(this.camera.position.y, this.targetPosition.y, smoothFactor);
    this.camera.position.z = lerp(this.camera.position.z, this.targetPosition.z, smoothFactor);

    this.camera.rotation.x = lerp(this.camera.rotation.x, this.targetRotation.x, smoothFactor * 2);
    this.camera.rotation.y = lerp(this.camera.rotation.y, this.targetRotation.y, smoothFactor * 2);
    this.camera.rotation.z = lerp(this.camera.rotation.z, this.targetRotation.z, smoothFactor * 2);

    const lookAtTarget = new THREE.Vector3(
      this.targetPosition.x + 10,
      this.targetPosition.y - 3,
      this.targetPosition.z + 20
    );
    this.camera.lookAt(lookAtTarget);
  }

  reset(): void {
    this.camera.position.set(-8, 8, -12);
    this.camera.rotation.set(-0.4, 0, 0);
  }

  getZ(): number {
    return this.camera.position.z;
  }
}