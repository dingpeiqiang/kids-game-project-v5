import * as THREE from 'three';
import { GAME_CONFIG, COLORS } from '../config';
import { GeoPoint } from '../types';

function latLngToWorld(lat: number, lng: number): THREE.Vector3 {
  const x = ((lng - GAME_CONFIG.MAP.LNG_MIN) / (GAME_CONFIG.MAP.LNG_MAX - GAME_CONFIG.MAP.LNG_MIN)) * 40 - 20;
  const z = ((GAME_CONFIG.MAP.LAT_MAX - lat) / (GAME_CONFIG.MAP.LAT_MAX - GAME_CONFIG.MAP.LAT_MIN)) * 30 - 15;
  return new THREE.Vector3(x, 0, z);
}

export function createChinaMap(scene: THREE.Scene): THREE.Group {
  const mapGroup = new THREE.Group();
  
  const chinaShape = createChinaShape();
  
  const extrudeSettings = {
    depth: 0.5,
    bevelEnabled: false,
  };
  
  const geometry = new THREE.ExtrudeGeometry(chinaShape, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.MAP_HIGHLIGHT,
    roughness: 0.6,
    metalness: 0.1,
  });
  
  const mapMesh = new THREE.Mesh(geometry, material);
  mapMesh.castShadow = true;
  mapMesh.receiveShadow = true;
  mapGroup.add(mapMesh);
  
  const borderGeometry = new THREE.EdgesGeometry(geometry);
  const borderMaterial = new THREE.LineBasicMaterial({ color: COLORS.BORDERS, linewidth: 2 });
  const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
  mapGroup.add(borderLines);
  
  createProvinceHighlights(mapGroup);
  
  scene.add(mapGroup);
  return mapGroup;
}

function createChinaShape(): THREE.Shape {
  const shape = new THREE.Shape();
  
  const points: THREE.Vector2[] = [
    new THREE.Vector2(85, 49),
    new THREE.Vector2(92, 53),
    new THREE.Vector2(100, 52),
    new THREE.Vector2(106, 54),
    new THREE.Vector2(112, 52),
    new THREE.Vector2(120, 54),
    new THREE.Vector2(130, 52),
    new THREE.Vector2(135, 48),
    new THREE.Vector2(134, 45),
    new THREE.Vector2(128, 42),
    new THREE.Vector2(122, 38),
    new THREE.Vector2(118, 35),
    new THREE.Vector2(122, 32),
    new THREE.Vector2(124, 28),
    new THREE.Vector2(120, 23),
    new THREE.Vector2(114, 20),
    new THREE.Vector2(108, 18),
    new THREE.Vector2(102, 20),
    new THREE.Vector2(98, 22),
    new THREE.Vector2(94, 25),
    new THREE.Vector2(90, 28),
    new THREE.Vector2(86, 32),
    new THREE.Vector2(82, 35),
    new THREE.Vector2(78, 40),
    new THREE.Vector2(76, 44),
    new THREE.Vector2(78, 48),
    new THREE.Vector2(82, 50),
  ];
  
  const scaledPoints = points.map(p => {
    const x = ((p.x - GAME_CONFIG.MAP.LNG_MIN) / (GAME_CONFIG.MAP.LNG_MAX - GAME_CONFIG.MAP.LNG_MIN)) * 40 - 20;
    const y = ((GAME_CONFIG.MAP.LAT_MAX - p.y) / (GAME_CONFIG.MAP.LAT_MAX - GAME_CONFIG.MAP.LAT_MIN)) * 30 - 15;
    return new THREE.Vector2(x, y);
  });
  
  shape.moveTo(scaledPoints[0].x, scaledPoints[0].y);
  for (let i = 1; i < scaledPoints.length; i++) {
    shape.lineTo(scaledPoints[i].x, scaledPoints[i].y);
  }
  shape.closePath();
  
  return shape;
}

function createProvinceHighlights(group: THREE.Group): void {
  const provinces = [
    { name: 'Xinjiang', center: { lat: 41.15, lng: 85.32 }, size: 6 },
    { name: 'Tibet', center: { lat: 31.5, lng: 91.1 }, size: 5 },
    { name: 'Neimenggu', center: { lat: 41.9, lng: 111.7 }, size: 7 },
    { name: 'Guangdong', center: { lat: 23.13, lng: 113.26 }, size: 3 },
    { name: 'Sichuan', center: { lat: 30.57, lng: 104.06 }, size: 4 },
    { name: 'Heilongjiang', center: { lat: 45.8, lng: 126.63 }, size: 4 },
    { name: 'Yunnan', center: { lat: 24.89, lng: 102.83 }, size: 3 },
    { name: 'Shandong', center: { lat: 36.6, lng: 116.98 }, size: 3 },
    { name: 'Beijing', center: { lat: 39.9, lng: 116.4 }, size: 1 },
    { name: 'Shanghai', center: { lat: 31.23, lng: 121.47 }, size: 1 },
  ];
  
  provinces.forEach(province => {
    const pos = latLngToWorld(province.center.lat, province.center.lng);
    
    const geometry = new THREE.CircleGeometry(province.size * 0.3, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8bc34a,
      transparent: true,
      opacity: 0.3,
    });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(pos.x, 0.01, pos.z);
    circle.rotation.x = -Math.PI / 2;
    group.add(circle);
  });
}

export function createMarker(scene: THREE.Scene, position: THREE.Vector3, color: number): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(0.3, 1, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
  });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.set(position.x, position.y + 0.6, position.z);
  marker.castShadow = true;
  
  const baseGeometry = new THREE.CircleGeometry(0.4, 16);
  const baseMaterial = new THREE.MeshStandardMaterial({ color });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(position.x, position.y + 0.05, position.z);
  base.rotation.x = -Math.PI / 2;
  marker.add(base);
  
  scene.add(marker);
  return marker;
}

export function removeMarker(scene: THREE.Scene, marker: THREE.Mesh): void {
  scene.remove(marker);
  marker.geometry.dispose();
  (marker.material as THREE.Material).dispose();
}

export function geoPointToWorld(point: GeoPoint): THREE.Vector3 {
  return latLngToWorld(point.lat, point.lng);
}

export function screenToGeoPoint(
  event: MouseEvent | Touch,
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  mapGroup: THREE.Group
): GeoPoint | null {
  const rect = container.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersectPoint);
  
  if (!intersectPoint) return null;
  
  const x = (intersectPoint.x + 20) / 40;
  const z = (-intersectPoint.z + 15) / 30;
  
  const lng = GAME_CONFIG.MAP.LNG_MIN + x * (GAME_CONFIG.MAP.LNG_MAX - GAME_CONFIG.MAP.LNG_MIN);
  const lat = GAME_CONFIG.MAP.LAT_MAX - z * (GAME_CONFIG.MAP.LAT_MAX - GAME_CONFIG.MAP.LAT_MIN);
  
  if (
    lat >= GAME_CONFIG.MAP.LAT_MIN &&
    lat <= GAME_CONFIG.MAP.LAT_MAX &&
    lng >= GAME_CONFIG.MAP.LNG_MIN &&
    lng <= GAME_CONFIG.MAP.LNG_MAX
  ) {
    return { lat, lng };
  }
  
  return null;
}