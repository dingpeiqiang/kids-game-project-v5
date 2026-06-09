import * as THREE from 'three';
import { VehicleState } from '../types';
import { VEHICLE_CONFIG, COLORS } from '../config';

const PAINT = 0x1a8cff;
const PAINT_DARK = 0x0d4a8a;
const CHROME = 0xe8ecf0;
const NEON = 0x00f0ff;
const TAIL_RED = 0xff2244;

function addWheel(group: THREE.Group, x: number, z: number, radius: number): THREE.Group {
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(x, radius, z);

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, VEHICLE_CONFIG.WIDTH * 0.11, 24),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 })
  );
  tire.rotation.x = Math.PI / 2;
  tire.castShadow = true;
  wheelGroup.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, VEHICLE_CONFIG.WIDTH * 0.13, 16),
    new THREE.MeshStandardMaterial({
      color: CHROME,
      metalness: 0.95,
      roughness: 0.12,
      emissive: 0x223344,
      emissiveIntensity: 0.15,
    })
  );
  rim.rotation.x = Math.PI / 2;
  wheelGroup.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, VEHICLE_CONFIG.WIDTH * 0.14, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a3540, metalness: 0.8, roughness: 0.25 })
  );
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);

  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.55, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: CHROME, metalness: 0.9, roughness: 0.2 })
    );
    spoke.rotation.z = (i / 5) * Math.PI * 2;
    spoke.position.y = 0;
    hub.add(spoke);
  }

  group.add(wheelGroup);
  return wheelGroup;
}

export function createVehicle(): THREE.Group {
  const group = new THREE.Group();
  const W = VEHICLE_CONFIG.WIDTH;
  const L = VEHICLE_CONFIG.LENGTH;
  const H = VEHICLE_CONFIG.HEIGHT;

  const paintMat = new THREE.MeshStandardMaterial({
    color: PAINT,
    metalness: 0.72,
    roughness: 0.18,
    envMapIntensity: 1.2,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: PAINT_DARK,
    metalness: 0.65,
    roughness: 0.22,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1520,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.35,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const neonMat = new THREE.MeshStandardMaterial({
    color: NEON,
    emissive: NEON,
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.4,
  });

  // 底盘 + 侧裙（更低趴）
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, H * 0.42, L * 0.92), paintMat);
  chassis.position.y = H * 0.28;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, H * 0.12, L * 0.85), darkMat);
  skirtL.position.set(-W / 2 - 0.02, H * 0.22, 0);
  const skirtR = skirtL.clone();
  skirtR.position.x = W / 2 + 0.02;
  group.add(skirtL, skirtR);

  // 引擎盖隆起
  const hood = new THREE.Mesh(new THREE.BoxGeometry(W * 0.88, H * 0.18, L * 0.32), paintMat);
  hood.position.set(0, H * 0.52, L * 0.28);
  hood.castShadow = true;
  group.add(hood);

  const scoop = new THREE.Mesh(new THREE.BoxGeometry(W * 0.35, H * 0.08, L * 0.12), darkMat);
  scoop.position.set(0, H * 0.58, L * 0.32);
  group.add(scoop);

  // 座舱 + 溜背
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, H * 0.38, L * 0.38), paintMat);
  cabin.position.set(0, H * 0.62, -L * 0.08);
  cabin.castShadow = true;
  group.add(cabin);

  const roofGlass = new THREE.Mesh(new THREE.BoxGeometry(W * 0.82, H * 0.22, L * 0.34), glassMat);
  roofGlass.position.set(0, H * 0.78, -L * 0.1);
  group.add(roofGlass);

  const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.2, L * 0.22), paintMat);
  rearDeck.position.set(0, H * 0.48, -L * 0.36);
  group.add(rearDeck);

  // 大尾翼
  const wingBase = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.06, 0.12), darkMat);
  wingBase.position.set(0, H * 0.72, -L * 0.46);
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(W * 0.95, 0.04, 0.28), paintMat);
  wingBlade.position.set(0, H * 0.88, -L * 0.48);
  group.add(wingBase, wingBlade);

  const wingStrutL = new THREE.Mesh(new THREE.BoxGeometry(0.05, H * 0.22, 0.05), darkMat);
  wingStrutL.position.set(-W * 0.32, H * 0.78, -L * 0.47);
  const wingStrutR = wingStrutL.clone();
  wingStrutR.position.x = W * 0.32;
  group.add(wingStrutL, wingStrutR);

  // 车身霓虹腰线
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(W * 1.04, 0.03, L * 0.75), neonMat);
  stripe.position.set(0, H * 0.38, 0);
  group.add(stripe);

  // 前脸灯带
  const headBar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.75, 0.06, 0.08), neonMat);
  headBar.position.set(0, H * 0.4, L / 2 - 0.12);
  group.add(headBar);

  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.06), neonMat);
  hlL.position.set(-W / 2 + 0.25, H * 0.42, L / 2 - 0.1);
  const hlR = hlL.clone();
  hlR.position.x = W / 2 - 0.25;
  group.add(hlL, hlR);

  const headLight = new THREE.PointLight(0xaaccff, 0.35, 6);
  headLight.position.set(0, H * 0.45, L / 2);
  group.add(headLight);

  // 尾灯
  const tailMat = new THREE.MeshStandardMaterial({
    color: TAIL_RED,
    emissive: TAIL_RED,
    emissiveIntensity: 1.2,
  });
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.05, 0.06), tailMat);
  tailBar.position.set(0, H * 0.42, -L / 2 + 0.1);
  group.add(tailBar);

  // 底部氛围光
  const underGlow = new THREE.PointLight(NEON, 0.25, 4);
  underGlow.position.set(0, 0.15, 0);
  group.add(underGlow);

  const wheelR = H * 0.2;
  const wheelGroups: THREE.Group[] = [
    addWheel(group, -W / 2 - wheelR * 0.28, L * 0.34, wheelR),
    addWheel(group, -W / 2 - wheelR * 0.28, -L * 0.34, wheelR),
    addWheel(group, W / 2 + wheelR * 0.28, L * 0.34, wheelR),
    addWheel(group, W / 2 + wheelR * 0.28, -L * 0.34, wheelR),
  ];

  group.userData = { wheelGroups, wheelRoll: 0, tailMat };

  return group;
}

export function updateVehicleMesh(vehicleMesh: THREE.Group, state: VehicleState, deltaTime = 16): void {
  vehicleMesh.position.set(state.position.x, state.position.y, state.position.z);
  vehicleMesh.rotation.y = state.rotation;
  // 加减速轻微俯仰，更有驾驶感
  const pitch = THREE.MathUtils.clamp(-state.velocity * 0.018, -0.06, 0.05);
  vehicleMesh.rotation.x = pitch;

  const wheelGroups = vehicleMesh.userData.wheelGroups as THREE.Group[] | undefined;
  if (!wheelGroups?.length) return;

  const dt = deltaTime / 1000;
  vehicleMesh.userData.wheelRoll =
    (vehicleMesh.userData.wheelRoll as number) + state.velocity * dt * 2.6;
  const roll = vehicleMesh.userData.wheelRoll as number;
  const steer = state.steeringAngle * (state.velocity >= 0 ? 1 : -1);

  wheelGroups.forEach((wg, i) => {
    wg.rotation.y = i < 2 ? steer : 0;
    wg.children.forEach((child) => {
      child.rotation.x = Math.PI / 2 + roll;
    });
  });

  const tailMat = vehicleMesh.userData.tailMat as THREE.MeshStandardMaterial | undefined;
  if (tailMat) {
    tailMat.emissiveIntensity = state.isBraking ? 2.4 : 1.15;
  }
}