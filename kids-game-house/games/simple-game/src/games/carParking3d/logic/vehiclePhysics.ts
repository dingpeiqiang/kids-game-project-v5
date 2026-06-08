import { VehicleState } from '../types';
import { VEHICLE_CONFIG } from '../config';

export function updateVehicle(
  state: VehicleState,
  input: { throttle: number; steering: number; brake: boolean },
  deltaTime: number
): VehicleState {
  const dt = deltaTime / 16.67;

  let newVelocity = state.velocity;
  let newAngularVelocity = state.angularVelocity;
  let newSteeringAngle = state.steeringAngle;

  if (input.brake) {
    newVelocity *= Math.pow(1 - VEHICLE_CONFIG.BRAKE_FORCE * dt, 0.5);
    newAngularVelocity *= 0.9;
    newSteeringAngle *= 0.8;
  } else {
    if (input.throttle !== 0) {
      newVelocity += input.throttle * VEHICLE_CONFIG.ACCELERATION * dt;
      newVelocity = Math.max(-VEHICLE_CONFIG.MAX_VELOCITY, Math.min(VEHICLE_CONFIG.MAX_VELOCITY, newVelocity));
    } else {
      newVelocity *= Math.pow(VEHICLE_CONFIG.INERTIA, dt);
      if (Math.abs(newVelocity) < 0.01) {
        newVelocity = 0;
      }
    }

    newSteeringAngle += input.steering * VEHICLE_CONFIG.MAX_STEERING_ANGLE * 0.15 * dt;
    newSteeringAngle = Math.max(-VEHICLE_CONFIG.MAX_STEERING_ANGLE, Math.min(VEHICLE_CONFIG.MAX_STEERING_ANGLE, newSteeringAngle));
    newSteeringAngle *= Math.pow(VEHICLE_CONFIG.STEERING_INERTIA, dt);
  }

  const speedFactor = Math.abs(newVelocity) / VEHICLE_CONFIG.MAX_VELOCITY;
  const turnFactor = (1 - speedFactor * 0.6);
  
  const turningRadius = VEHICLE_CONFIG.WHEEL_BASE / Math.sin(Math.abs(newSteeringAngle) || 0.01);
  const turnSpeed = (newVelocity / turningRadius) * turnFactor;
  
  if (newVelocity > 0) {
    newAngularVelocity = turnSpeed * Math.sign(newSteeringAngle);
  } else if (newVelocity < 0) {
    newAngularVelocity = -turnSpeed * Math.sign(newSteeringAngle);
  } else {
    newAngularVelocity *= 0.95;
  }

  newAngularVelocity *= Math.pow(VEHICLE_CONFIG.INERTIA, dt);

  const moveDistance = newVelocity * dt * 0.1;
  const rotationDelta = newAngularVelocity * dt;

  const newRotation = state.rotation + rotationDelta;
  const newPosition = {
    x: state.position.x + Math.cos(newRotation) * moveDistance,
    y: state.position.y,
    z: state.position.z + Math.sin(newRotation) * moveDistance,
  };

  return {
    position: newPosition,
    rotation: newRotation,
    velocity: newVelocity,
    angularVelocity: newAngularVelocity,
    steeringAngle: newSteeringAngle,
    isBraking: input.brake,
  };
}

export function getVehicleCorners(state: VehicleState): { x: number; z: number }[] {
  const pos = state.position;
  const rotation = state.rotation;
  const width = VEHICLE_CONFIG.WIDTH;
  const length = VEHICLE_CONFIG.LENGTH;

  const hw = width / 2;
  const hl = length / 2;

  const corners = [
    { x: pos.x + Math.cos(rotation) * hl - Math.sin(rotation) * hw, z: pos.z + Math.sin(rotation) * hl + Math.cos(rotation) * hw },
    { x: pos.x + Math.cos(rotation) * hl + Math.sin(rotation) * hw, z: pos.z + Math.sin(rotation) * hl - Math.cos(rotation) * hw },
    { x: pos.x - Math.cos(rotation) * hl + Math.sin(rotation) * hw, z: pos.z - Math.sin(rotation) * hl - Math.cos(rotation) * hw },
    { x: pos.x - Math.cos(rotation) * hl - Math.sin(rotation) * hw, z: pos.z - Math.sin(rotation) * hl + Math.cos(rotation) * hw },
  ];

  return corners;
}
