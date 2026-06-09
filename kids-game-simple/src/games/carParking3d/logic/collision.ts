import { VehicleState, Obstacle, ParkingSpot, ParkingResult } from '../types';
import { VEHICLE_CONFIG } from '../config';

/** 车辆四角（世界坐标 XZ） */
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

function projectPolygon(axis: { x: number; z: number }, poly: { x: number; z: number }[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const proj = p.x * axis.x + p.z * axis.z;
    min = Math.min(min, proj);
    max = Math.max(max, proj);
  }
  return [min, max];
}

function getAxes(corners: { x: number; z: number }[]): { x: number; z: number }[] {
  const axes: { x: number; z: number }[] = [];
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    const edge = { x: p2.x - p1.x, z: p2.z - p1.z };
    const len = Math.hypot(edge.x, edge.z) || 1;
    axes.push({ x: -edge.z / len, z: edge.x / len });
  }
  return axes;
}

/** SAT 分离轴：两凸四边形是否相交 */
function polygonsOverlap(a: { x: number; z: number }[], b: { x: number; z: number }[]): boolean {
  const axes = [...getAxes(a), ...getAxes(b)];
  for (const axis of axes) {
    const [minA, maxA] = projectPolygon(axis, a);
    const [minB, maxB] = projectPolygon(axis, b);
    if (maxA < minB || maxB < minA) return false;
  }
  return true;
}

export function checkCollision(vehicle: VehicleState, obstacles: Obstacle[]): boolean {
  const vehicleCorners = getVehicleCorners(vehicle);
  for (const obstacle of obstacles) {
    if (polygonsOverlap(vehicleCorners, getObstacleCorners(obstacle))) {
      return true;
    }
  }
  return false;
}

function normalizeAngleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  return diff;
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
    const xi = polygon[i].x;
    const yi = polygon[i].z;
    const xj = polygon[j].x;
    const yj = polygon[j].z;
    if ((yi > point.z) !== (yj > point.z) && point.x < ((xj - xi) * (point.z - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** 多维度停车评分（不含时间加分，时间由 scoreSystem 叠加） */
export function checkParking(vehicle: VehicleState, spot: ParkingSpot): ParkingResult {
  const vehicleCorners = getVehicleCorners(vehicle);
  const spotCorners = getSpotCorners(spot);

  let allInside = true;
  let cornersInside = 0;
  for (const corner of vehicleCorners) {
    if (isPointInPolygon(corner, spotCorners)) {
      cornersInside++;
    } else {
      allInside = false;
    }
  }

  const dx = vehicle.position.x - spot.position.x;
  const dz = vehicle.position.z - spot.position.z;
  const centerDeviation = Math.sqrt(dx * dx + dz * dz);
  const maxDeviation = Math.min(spot.width, spot.length) * 0.5;
  const normalizedCenterDeviation = Math.min(centerDeviation / (maxDeviation || 1), 1);

  const angleDiff = normalizeAngleDiff(vehicle.rotation, spot.rotation);
  const normalizedAngleDeviation = Math.min(angleDiff / (Math.PI / 4), 1);

  const centerScore = Math.max(0, 30 * (1 - normalizedCenterDeviation));
  const angleScore = Math.max(0, 20 * (1 - normalizedAngleDeviation));
  const positionScore = allInside ? 30 : Math.round(30 * (cornersInside / 4));

  const totalScore = Math.round(centerScore + angleScore + positionScore);

  const success =
    allInside &&
    normalizedAngleDeviation < 0.35 &&
    normalizedCenterDeviation < 0.85 &&
    Math.abs(vehicle.velocity) < 0.15;

  return {
    success,
    centerDeviation: normalizedCenterDeviation,
    angleDeviation: normalizedAngleDeviation,
    isFullyInside: allInside,
    score: totalScore,
  };
}

/** 场地边界（压线过久可判失败，由 game 累计） */
export function isOutOfBounds(vehicle: VehicleState, halfSize = 24): boolean {
  const corners = getVehicleCorners(vehicle);
  return corners.some((c) => Math.abs(c.x) > halfSize || Math.abs(c.z) > halfSize);
}