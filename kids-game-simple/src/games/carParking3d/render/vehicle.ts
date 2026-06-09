import * as THREE from 'three';
import { VehicleState } from '../types';
import { VEHICLE_CONFIG, COLORS } from '../config';

export function createVehicle(): THREE.Group {
  const group = new THREE.Group();
  
  const bodyGeometry = new THREE.BoxGeometry(VEHICLE_CONFIG.WIDTH, VEHICLE_CONFIG.HEIGHT * 0.7, VEHICLE_CONFIG.LENGTH);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.VEHICLE_BODY });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = VEHICLE_CONFIG.HEIGHT * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  const roofGeometry = new THREE.BoxGeometry(VEHICLE_CONFIG.WIDTH * 0.9, VEHICLE_CONFIG.HEIGHT * 0.4, VEHICLE_CONFIG.LENGTH * 0.5);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: COLORS.VEHICLE_WINDOW });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, VEHICLE_CONFIG.HEIGHT * 0.85, -VEHICLE_CONFIG.LENGTH * 0.2);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
  
  const wheelRadius = VEHICLE_CONFIG.HEIGHT * 0.18;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, VEHICLE_CONFIG.WIDTH * 0.12, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.VEHICLE_WHEEL });
  
  const wheelPositions = [
    { x: -VEHICLE_CONFIG.WIDTH / 2 - wheelRadius * 0.4, y: wheelRadius, z: VEHICLE_CONFIG.LENGTH * 0.35 },
    { x: -VEHICLE_CONFIG.WIDTH / 2 - wheelRadius * 0.4, y: wheelRadius, z: -VEHICLE_CONFIG.LENGTH * 0.35 },
    { x: VEHICLE_CONFIG.WIDTH / 2 + wheelRadius * 0.4, y: wheelRadius, z: VEHICLE_CONFIG.LENGTH * 0.35 },
    { x: VEHICLE_CONFIG.WIDTH / 2 + wheelRadius * 0.4, y: wheelRadius, z: -VEHICLE_CONFIG.LENGTH * 0.35 },
  ];
  
  const wheels: THREE.Mesh[] = [];
  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }
  
  const headlightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
  headlight1.position.set(-VEHICLE_CONFIG.WIDTH / 2 + 0.2, VEHICLE_CONFIG.HEIGHT * 0.4, VEHICLE_CONFIG.LENGTH / 2 - 0.3);
  group.add(headlight1);
  
  const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
  headlight2.position.set(VEHICLE_CONFIG.WIDTH / 2 - 0.2, VEHICLE_CONFIG.HEIGHT * 0.4, VEHICLE_CONFIG.LENGTH / 2 - 0.3);
  group.add(headlight2);
  
  group.userData = { wheels };
  
  return group;
}

export function updateVehicleMesh(vehicleMesh: THREE.Group, state: VehicleState): void {
  vehicleMesh.position.set(state.position.x, state.position.y, state.position.z);
  vehicleMesh.rotation.y = state.rotation;
  
  const wheels = vehicleMesh.userData.wheels as THREE.Mesh[];
  if (wheels) {
    const wheelRotation = state.velocity * 0.1;
    const steerAngle = state.steeringAngle * (state.velocity >= 0 ? 1 : -1);
    
    wheels[0].rotation.x += wheelRotation;
    wheels[0].rotation.y = steerAngle;
    wheels[1].rotation.x += wheelRotation;
    wheels[1].rotation.y = steerAngle;
    wheels[2].rotation.x += wheelRotation;
    wheels[3].rotation.x += wheelRotation;
  }
}
