export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function getDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function checkAABBCollision(
  pos1: { x: number; y: number; z: number },
  size1: { width: number; height: number; depth: number },
  pos2: { x: number; y: number; z: number },
  size2: { width: number; height: number; depth: number }
): boolean {
  return (
    pos1.x - size1.width / 2 < pos2.x + size2.width / 2 &&
    pos1.x + size1.width / 2 > pos2.x - size2.width / 2 &&
    pos1.y - size1.height / 2 < pos2.y + size2.height / 2 &&
    pos1.y + size1.height / 2 > pos2.y - size2.height / 2 &&
    pos1.z - size1.depth / 2 < pos2.z + size2.depth / 2 &&
    pos1.z + size1.depth / 2 > pos2.z - size2.depth / 2
  );
}