import * as THREE from 'three';
import { SKY_COLORS, FOG_CONFIG, SUN_CONFIG, AMBIENT_CONFIG } from '../config';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLORS.day);
  scene.fog = new THREE.Fog(0x87ceeb, FOG_CONFIG.day.near, FOG_CONFIG.day.far);
  return scene;
}

export function createRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera(container: HTMLDivElement): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.8, 0);
  return camera;
}

export function createLighting(scene: THREE.Scene): { sun: THREE.DirectionalLight; ambient: THREE.AmbientLight } {
  const ambientLight = new THREE.AmbientLight(AMBIENT_CONFIG.day, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(50, 50, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  return { sun: sunLight, ambient: ambientLight };
}

export function updateDayNightCycle(
  scene: THREE.Scene,
  sun: THREE.DirectionalLight,
  ambient: THREE.AmbientLight,
  time: number,
  cycleDuration: number
): void {
  const normalizedTime = (time % cycleDuration) / cycleDuration;
  
  let skyColor: THREE.Color;
  let fogColor: number;
  let fogNear: number;
  let fogFar: number;
  let sunIntensity: number;
  let ambientColor: number;

  if (normalizedTime < 0.4 || normalizedTime >= 0.9) {
    skyColor = new THREE.Color(SKY_COLORS.day);
    fogColor = SKY_COLORS.day;
    fogNear = FOG_CONFIG.day.near;
    fogFar = FOG_CONFIG.day.far;
    sunIntensity = SUN_CONFIG.day.intensity;
    ambientColor = AMBIENT_CONFIG.day;
  } else if (normalizedTime < 0.5) {
    const t = (normalizedTime - 0.4) / 0.1;
    skyColor = new THREE.Color().lerpColors(
      new THREE.Color(SKY_COLORS.day),
      new THREE.Color(SKY_COLORS.dusk),
      t
    );
    fogColor = skyColor.getHex();
    fogNear = FOG_CONFIG.day.near + (FOG_CONFIG.night.near - FOG_CONFIG.day.near) * t;
    fogFar = FOG_CONFIG.day.far + (FOG_CONFIG.night.far - FOG_CONFIG.day.far) * t;
    sunIntensity = SUN_CONFIG.day.intensity + (SUN_CONFIG.night.intensity - SUN_CONFIG.day.intensity) * t;
    ambientColor = lerpColor(AMBIENT_CONFIG.day, AMBIENT_CONFIG.night, t);
  } else if (normalizedTime < 0.8) {
    skyColor = new THREE.Color(SKY_COLORS.night);
    fogColor = SKY_COLORS.night;
    fogNear = FOG_CONFIG.night.near;
    fogFar = FOG_CONFIG.night.far;
    sunIntensity = SUN_CONFIG.night.intensity;
    ambientColor = AMBIENT_CONFIG.night;
  } else {
    const t = (normalizedTime - 0.8) / 0.1;
    skyColor = new THREE.Color().lerpColors(
      new THREE.Color(SKY_COLORS.night),
      new THREE.Color(SKY_COLORS.dawn),
      t
    );
    fogColor = skyColor.getHex();
    fogNear = FOG_CONFIG.night.near + (FOG_CONFIG.day.near - FOG_CONFIG.night.near) * t;
    fogFar = FOG_CONFIG.night.far + (FOG_CONFIG.day.far - FOG_CONFIG.night.far) * t;
    sunIntensity = SUN_CONFIG.night.intensity + (SUN_CONFIG.day.intensity - SUN_CONFIG.night.intensity) * t;
    ambientColor = lerpColor(AMBIENT_CONFIG.night, AMBIENT_CONFIG.day, t);
  }

  scene.background = skyColor;
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  sun.intensity = sunIntensity;
  ambient.color.setHex(ambientColor);

  const sunAngle = normalizedTime * Math.PI * 2 - Math.PI / 2;
  sun.position.x = Math.cos(sunAngle) * 100;
  sun.position.y = Math.sin(sunAngle) * 50 + 20;
  sun.position.z = Math.cos(sunAngle) * 100;
}

function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 255;
  const g1 = (color1 >> 8) & 255;
  const b1 = color1 & 255;
  
  const r2 = (color2 >> 16) & 255;
  const g2 = (color2 >> 8) & 255;
  const b2 = color2 & 255;
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return (r << 16) | (g << 8) | b;
}

export function createHighlightBox(): THREE.LineSegments {
  const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const highlightBox = new THREE.LineSegments(edges, lineMaterial);
  highlightBox.visible = false;
  return highlightBox;
}