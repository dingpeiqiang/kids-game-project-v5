import * as THREE from 'three';
import { COLORS } from '../config';
import type { ParticleEffect, CameraShake, Vector3 } from '../types';

export class EffectManager {
  private particles: THREE.Points[] = [];
  private particlePool: THREE.Points[] = [];
  private cameraShakes: CameraShake[] = [];
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticlePool();
  }
  
  private initParticlePool(): void {
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: COLORS.HIT_EFFECT,
        transparent: true,
        opacity: 1,
      });
      const particle = new THREE.Points(geometry, material);
      particle.visible = false;
      this.particlePool.push(particle);
      this.scene.add(particle);
    }
  }
  
  addHitEffect(position: Vector3, isUltimate: boolean = false): void {
    const color = isUltimate ? COLORS.ULTIMATE_EFFECT : COLORS.HIT_EFFECT;
    this.createParticles(position, color, 8, isUltimate ? 0.8 : 0.5);
    
    const light = new THREE.PointLight(color, 3, 4);
    light.position.set(position.x, position.y + 1.5, position.z);
    this.scene.add(light);
    
    setTimeout(() => {
      this.scene.remove(light);
      light.dispose();
    }, 200);
  }
  
  addBlockEffect(position: Vector3): void {
    this.createParticles(position, COLORS.BLOCK_EFFECT, 6, 0.4);
    
    const geometry = new THREE.RingGeometry(0.5, 0.8, 32);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.BLOCK_EFFECT,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(position.x, position.y + 0.5, position.z);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    
    setTimeout(() => {
      this.scene.remove(ring);
      geometry.dispose();
      material.dispose();
    }, 300);
  }
  
  private createParticles(position: Vector3, color: number, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.find(p => !p.visible);
      if (!particle) continue;
      
      const material = particle.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
      material.opacity = 1;
      
      particle.position.set(position.x, position.y + 1, position.z);
      particle.visible = true;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.5 + 0.2,
        (Math.random() - 0.5) * speed
      );
      
      const startTime = Date.now();
      const duration = 500;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
          particle.visible = false;
          return;
        }
        
        particle.position.add(velocity.clone().multiplyScalar(0.02));
        velocity.y -= 0.015;
        material.opacity = 1 - progress;
        
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  }
  
  addCameraShake(intensity: number, duration: number): void {
    this.cameraShakes.push({
      intensity,
      duration,
      startTime: Date.now(),
    });
  }
  
  getCameraOffset(): Vector3 {
    const now = Date.now();
    let offset = { x: 0, y: 0, z: 0 };
    
    this.cameraShakes = this.cameraShakes.filter(shake => {
      const elapsed = now - shake.startTime;
      if (elapsed >= shake.duration) return false;
      
      const progress = elapsed / shake.duration;
      const decay = 1 - progress;
      const intensity = shake.intensity * decay;
      
      offset.x += (Math.random() - 0.5) * intensity * 2;
      offset.y += (Math.random() - 0.5) * intensity * 2;
      offset.z += (Math.random() - 0.5) * intensity * 2;
      
      return true;
    });
    
    return offset;
  }
  
  update(): Vector3 {
    return this.getCameraOffset();
  }
  
  dispose(): void {
    this.particles.forEach(p => {
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
    this.particlePool.forEach(p => {
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
  }
}