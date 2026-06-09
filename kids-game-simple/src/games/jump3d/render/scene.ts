import * as THREE from 'three';
import { COLORS } from '../config';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.BACKGROUND_TOP);
  
  return scene;
}

export function createLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
}

export function createClouds(scene: THREE.Scene): THREE.Group {
  const clouds = new THREE.Group();
  
  for (let i = 0; i < 8; i++) {
    const cloudGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
      color: COLORS.CLOUD,
      transparent: true,
      opacity: 0.8
    });
    
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(
      (Math.random() - 0.5) * 30,
      8 + Math.random() * 4,
      (Math.random() - 0.5) * 30
    );
    cloud.scale.set(
      1 + Math.random(),
      0.5 + Math.random() * 0.5,
      1 + Math.random()
    );
    
    clouds.add(cloud);
  }
  
  scene.add(clouds);
  return clouds;
}

export function createRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  container.appendChild(renderer.domElement);
  
  return renderer;
}

export function handleResize(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
  window.addEventListener('resize', () => {
    const container = renderer.domElement.parentElement;
    if (container) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  });
}
