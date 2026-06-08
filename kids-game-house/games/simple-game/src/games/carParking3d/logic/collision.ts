import { VehicleState, Obstacle, ParkingSpot, ParkingResult } from '../types';
import { VEHICLE_CONFIG } from '../config';

export function checkCollision(vehicle: VehicleState, obstacles: Obstacle[]): boolean {
  const vehicleCorners = getVehicleCorners(vehicle);

  for (const obstacle of obstacles) {
    const obstacleCorners = getObstacleCorners(obstacle);
    
    if (polygonCollision(vehicleCorners, obstacleCorners)) {
      return true;
    }
  }

  return false;
}

export function getVehicleCorners(vehicle: VehicleState): { x: number; z: number }[] {
  const hw = VEHICLE_CONFIG.WIDTH / 2;
  const hl = VEHICLE_CONFIG.LENGTH / 2;
  const { x, z } = vehicle.position;
  const r = vehicle.rotation;

  return [
    { x: x + Math.cos(r) * hl - Math.sin(r) * hw, z: z + Math.sin(r) * hl + Math.cos(r) * hw },
    { x: x + Math.cos(r) * hl + Math.sin(r) * hw, z: z + Math.sin(r) * hl - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hl + Math.sin(r) * hw, z: z - Math.sin(r) * hl - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hl - Math.sin(r) * hw, z: z - Math.sin(r) * hl + Math.cos(r) * hw },
  ];
}

function getObstacleCorners(obstacle: Obstacle): { x: number; z: number }[] {
  const hw = obstacle.width / 2;
  const hd = obstacle.depth / 2;
  const { x, z } = obstacle.position;
  const r = obstacle.rotation;

  return [
    { x: x + Math.cos(r) * hd - Math.sin(r) * hw, z: z + Math.sin(r) * hd + Math.cos(r) * hw },
    { x: x + Math.cos(r) * hd + Math.sin(r) * hw, z: z + Math.sin(r) * hd - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hd + Math.sin(r) * hw, z: z - Math.sin(r) * hd - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hd - Math.sin(r) * hw, z: z - Math.sin(r) * hd + Math.cos(r) * hw },
  ];
}

function polygonCollision(a: { x: number; z: number }[], b: { x: number; z: number }[]): boolean {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const nextJ = (j + 1) % b.length;
      if (pointInTriangle(a[i], b[j], b[nextJ], b[(j + 2) % b.length])) {
        return true;
      }
    }
  }
  for (let i = 0; i < b.length; i++) {
    for (let j = 0; j < a.length; j++) {
      const nextJ = (j + 1) % a.length;
      if (pointInTriangle(b[i], a[j], a[nextJ], a[(j + 2) % a.length])) {
        return true;
      }
    }
  }
  return false;
}

function pointInTriangle(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }, c: { x: number; z: number }): boolean {
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);

  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(hasNeg && hasPos);
}

function sign(p1: { x: number; z: number }, p2: { x: number; z: number }, p3: { x: number; z: number }): number {
  return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
}

export function checkParking(vehicle: VehicleState, spot: ParkingSpot): ParkingResult {
  const vehicleCorners = getVehicleCorners(vehicle);
  const spotCorners = getSpotCorners(spot);

  let allInside = true;
  for (const corner of vehicleCorners) {
    if (!isPointInPolygon(corner, spotCorners)) {
      allInside = false;
      break;
    }
  }

  const dx = vehicle.position.x - spot.position.x;
  const dz = vehicle.position.z - spot.position.z;
  const centerDeviation = Math.sqrt(dx * dx + dz * dz);
  const maxDeviation = Math.max(spot.width, spot.length) / 2;
  const normalizedCenterDeviation = Math.min(centerDeviation / maxDeviation, 1);

  const angleDiff = Math.abs(vehicle.rotation - spot.rotation);
  const normalizedAngleDeviation = Math.min(angleDiff / Math.PI, 1);

  const centerScore = Math.max(0, 30 * (1 - normalizedCenterDeviation));
  const angleScore = Math.max(0, 20 * (1 - normalizedAngleDeviation));
  const positionScore = allInside ? 30 : 0;

  const totalScore = Math.round(centerScore + angleScore + positionScore);

  return {
    success: allInside && normalizedAngleDeviation < 0.3 && normalizedCenterDeviation < 0.8,
    centerDeviation: normalizedCenterDeviation,
    angleDeviation: normalizedAngleDeviation,
    isFullyInside: allInside,
    score: totalScore,
  };
}

function getSpotCorners(spot: ParkingSpot): { x: number; z: number }[] {
  const hw = spot.width / 2;
  const hl = spot.length / 2;
  const { x, z } = spot.position;
  const r = spot.rotation;

  return [
    { x: x + Math.cos(r) * hl - Math.sin(r) * hw, z: z + Math.sin(r) * hl + Math.cos(r) * hw },
    { x: x + Math.cos(r) * hl + Math.sin(r) * hw, z: z + Math.sin(r) * hl - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hl + Math.sin(r) * hw, z: z - Math.sin(r) * hl - Math.cos(r) * hw },
    { x: x - Math.cos(r) * hl - Math.sin(r) * hw, z: z - Math.sin(r) * hl + Math.cos(r) * hw },
  ];
}

function isPointInPolygon(point: { x: number; z: number }, polygon: { x: number; z: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].z;
    const xj = polygon[j].x, yj = polygon[j].z;

    if (((yi > point.z) !== (yj > point.z)) &&
        (point.x < (xj - xi) * (point.z - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
