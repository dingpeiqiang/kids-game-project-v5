import { VehicleState } from '../types';
import { VEHICLE_CONFIG } from '../config';

export function updateVehicle(
  state: VehicleState,
  input: { throttle: number; steering: number; brake: boolean },
  deltaTime: number
): VehicleState {
  const dt = Math.min(deltaTime / 16.67, 2.5);

  let newVelocity = state.velocity;
  let newAngularVelocity = state.angularVelocity;
  let newSteeringAngle = state.steeringAngle;

  const speedAbs = Math.abs(newVelocity);
  const lowSpeedFactor = speedAbs < 2 ? 1.35 : 1 - (speedAbs / VEHICLE_CONFIG.MAX_VELOCITY) * 0.55;

  if (input.brake) {
    newVelocity *= Math.pow(1 - VEHICLE_CONFIG.BRAKE_FORCE * dt, 0.65);
    if (Math.abs(newVelocity) < 0.05) newVelocity = 0;
    newAngularVelocity *= 0.85;
    newSteeringAngle *= 0.75;
  } else {
    if (input.throttle !== 0) {
      const accel = VEHICLE_CONFIG.ACCELERATION * (input.throttle < 0 ? 0.85 : 1);
      newVelocity += input.throttle * accel * dt;
      newVelocity = Math.max(-VEHICLE_CONFIG.MAX_VELOCITY * 0.55, Math.min(VEHICLE_CONFIG.MAX_VELOCITY, newVelocity));
    } else {
      const coast = speedAbs < 1.2 ? VEHICLE_CONFIG.LOW_SPEED_FRICTION : VEHICLE_CONFIG.INERTIA;
      newVelocity *= Math.pow(coast, dt);
      if (Math.abs(newVelocity) < 0.008) newVelocity = 0;
    }

    const steerRate = 0.18 * lowSpeedFactor;
    newSteeringAngle += input.steering * VEHICLE_CONFIG.MAX_STEERING_ANGLE * steerRate * dt;
    newSteeringAngle = Math.max(
      -VEHICLE_CONFIG.MAX_STEERING_ANGLE,
      Math.min(VEHICLE_CONFIG.MAX_STEERING_ANGLE, newSteeringAngle)
    );
    if (input.steering === 0) {
      newSteeringAngle *= Math.pow(VEHICLE_CONFIG.STEERING_INERTIA, dt);
    }
  }

  const steerMag = Math.abs(newSteeringAngle);
  const turnFactor = lowSpeedFactor * (0.35 + steerMag * 1.2);
  const sinSteer = Math.sin(steerMag || 0.001);
  const turningRadius = VEHICLE_CONFIG.WHEEL_BASE / sinSteer;
  let turnSpeed = (newVelocity / turningRadius) * turnFactor;

  if (newVelocity > 0.02) {
    newAngularVelocity = turnSpeed * Math.sign(newSteeringAngle);
  } else if (newVelocity < -0.02) {
    newAngularVelocity = -turnSpeed * Math.sign(newSteeringAngle);
  } else {
    newAngularVelocity *= 0.9;
  }

  newAngularVelocity *= Math.pow(VEHICLE_CONFIG.INERTIA, dt * 0.5);

  const moveDistance = newVelocity * dt * 0.12;
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

/** 碰撞后轻微反弹与位移修正 */
export function applyCollisionResponse(state: VehicleState): VehicleState {
  const push = 0.35;
  const nx = -Math.cos(state.rotation);
  const nz = -Math.sin(state.rotation);
  return {
    ...state,
    position: {
      x: state.position.x + nx * push,
      y: state.position.y,
      z: state.position.z + nz * push,
    },
    velocity: state.velocity * -0.25,
    angularVelocity: state.angularVelocity * 0.5,
  };
}