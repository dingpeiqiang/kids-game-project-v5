import * as THREE from 'three';
import { COLORS } from '../config';

const SKY_BOTTOM = new THREE.Color(COLORS.SKY);
const SKY_TOP = new THREE.Color(0x7ec8ff);

/** 天空与雾 */
export function applyEnvironment(scene: THREE.Scene): void {
  scene.background = SKY_BOTTOM.clone().lerp(SKY_TOP, 0.4);
  scene.fog = new THREE.Fog(SKY_BOTTOM.getHex(), 32, 78);
}

export function createAsphaltGround(scene: THREE.Scene): THREE.Mesh {
  const size = 52;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({
      color: 0x4a4f54,
      roughness: 0.94,
      metalness: 0.03,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

/** 车位白线（实体条，移动端更清晰） */
export function addParkingFrame(group: THREE.Group, width: number, length: number): void {
  const t = 0.14;
  const h = 0.04;
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    emissive: 0xffffff,
    emissiveIntensity: 0.06,
    roughness: 0.35,
  });
  const hw = width / 2;
  const hl = length / 2;

  const front = new THREE.Mesh(new THREE.BoxGeometry(width + t, h, t), mat);
  front.position.set(0, h / 2, -hl);
  const back = front.clone();
  back.position.z = hl;
  const left = new THREE.Mesh(new THREE.BoxGeometry(t, h, length), mat);
  left.position.set(-hw, h / 2, 0);
  const right = left.clone();
  right.position.x = hw;

  group.add(front, back, left, right);
}