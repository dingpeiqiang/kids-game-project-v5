import { Level, CameraConfig } from './types';

export const VEHICLE_CONFIG = {
  LENGTH: 4.5,
  WIDTH: 1.8,
  HEIGHT: 1.4,
  WHEEL_BASE: 2.7,
  MAX_STEERING_ANGLE: 0.6,
  MAX_VELOCITY: 8,
  ACCELERATION: 0.2,
  DECELERATION: 0.3,
  BRAKE_FORCE: 0.8,
  FRICTION: 0.02,
  TURN_RADIUS_MULTIPLIER: 0.05,
  INERTIA: 0.92,
  LOW_SPEED_FRICTION: 0.88,
  STEERING_INERTIA: 0.9,
};

export const CAMERA_CONFIG: CameraConfig = {
  followDistance: 8,
  followHeight: 4,
  topHeight: 15,
  rearDistance: 6,
  transitionSpeed: 0.1,
};

export const GAME_CONFIG = {
  MAX_COLLISIONS: 3,
  COLLISION_PENALTY: 10,
  PERFECT_SCORE_THRESHOLD: 90,
  PARKING_CHECK_INTERVAL: 500,
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '基础行驶',
    description: '超大空旷场地，熟悉车速、转向与惯性',
    timeLimit: 120,
    parkingSpot: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      width: 6,
      length: 3.5,
    },
    obstacles: [],
    startPosition: { x: -8, y: 0, z: 0 },
    startRotation: 0,
    difficulty: 'easy',
  },
  {
    id: 2,
    name: '正向停车',
    description: '标准正向车位，周边有护栏',
    timeLimit: 90,
    parkingSpot: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      width: 5,
      length: 3.2,
    },
    obstacles: [
      { id: 'barrier1', type: 'barrier', position: { x: 3, y: 0, z: 0 }, rotation: 0, width: 0.2, height: 0.6, depth: 4 },
      { id: 'barrier2', type: 'barrier', position: { x: -3, y: 0, z: 0 }, rotation: 0, width: 0.2, height: 0.6, depth: 4 },
    ],
    startPosition: { x: -10, y: 0, z: 0 },
    startRotation: 0,
    difficulty: 'easy',
  },
  {
    id: 3,
    name: '侧方停车',
    description: '经典侧方停车，两侧有车辆',
    timeLimit: 90,
    parkingSpot: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      width: 2.8,
      length: 5,
    },
    obstacles: [
      { id: 'car1', type: 'car', position: { x: 0, y: 0, z: 3 }, rotation: 0, width: 1.8, height: 1.4, depth: 4.5 },
      { id: 'car2', type: 'car', position: { x: 0, y: 0, z: -3 }, rotation: 0, width: 1.8, height: 1.4, depth: 4.5 },
    ],
    startPosition: { x: -8, y: 0, z: 0 },
    startRotation: 0,
    difficulty: 'medium',
  },
  {
    id: 4,
    name: '倒车入库',
    description: '标准倒车入库，入口狭窄',
    timeLimit: 60,
    parkingSpot: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      width: 3,
      length: 5.5,
    },
    obstacles: [
      { id: 'cone1', type: 'cone', position: { x: 1.2, y: 0, z: -4 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'cone2', type: 'cone', position: { x: -1.2, y: 0, z: -4 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'wall1', type: 'wall', position: { x: 0, y: 0, z: 3 }, rotation: 0, width: 4, height: 2, depth: 0.3 },
      { id: 'wall2', type: 'wall', position: { x: 2, y: 0, z: 0 }, rotation: 0, width: 0.3, height: 2, depth: 6 },
      { id: 'wall3', type: 'wall', position: { x: -2, y: 0, z: 0 }, rotation: 0, width: 0.3, height: 2, depth: 6 },
    ],
    startPosition: { x: 0, y: 0, z: -8 },
    startRotation: Math.PI,
    difficulty: 'hard',
  },
  {
    id: 5,
    name: '极限停车',
    description: '超窄车位，多障碍包围',
    timeLimit: 45,
    parkingSpot: {
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      width: 2.5,
      length: 4.8,
    },
    obstacles: [
      { id: 'cone1', type: 'cone', position: { x: 1.5, y: 0, z: -3 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'cone2', type: 'cone', position: { x: -1.5, y: 0, z: -3 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'cone3', type: 'cone', position: { x: 1.5, y: 0, z: 3 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'cone4', type: 'cone', position: { x: -1.5, y: 0, z: 3 }, rotation: 0, width: 0.4, height: 0.6, depth: 0.4 },
      { id: 'car1', type: 'car', position: { x: 2.5, y: 0, z: 0 }, rotation: 0, width: 1.8, height: 1.4, depth: 4.5 },
      { id: 'car2', type: 'car', position: { x: -2.5, y: 0, z: 0 }, rotation: 0, width: 1.8, height: 1.4, depth: 4.5 },
    ],
    startPosition: { x: 0, y: 0, z: -10 },
    startRotation: Math.PI,
    difficulty: 'hard',
  },
];

export const COLORS = {
  VEHICLE_BODY: 0x3498db,
  VEHICLE_WINDOW: 0x2c3e50,
  VEHICLE_WHEEL: 0x2c2c2c,
  GROUND: 0x5a5a5a,
  PARKING_LINE: 0xffffff,
  PARKING_SPOT: 0x4a90d9,
  CONE: 0xff6b35,
  BARRIER: 0xe74c3c,
  WALL: 0x7f8c8d,
  OTHER_CAR: 0xe67e22,
  SKY: 0x87ceeb,
};
