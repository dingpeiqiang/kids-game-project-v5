import * as THREE from 'three'
import type { Bullet, Particle } from '../types'

export function createBulletMesh(bullet: Bullet): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.1, 8, 8)
  const material = new THREE.MeshBasicMaterial({ color: bullet.color })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(bullet.x, bullet.y, bullet.z)
  return mesh
}

export function updateBulletMesh(mesh: THREE.Mesh, bullet: Bullet): void {
  mesh.position.x = bullet.x
  mesh.position.y = bullet.y + Math.sin(Date.now() * 0.01) * 0.1
  mesh.position.z = bullet.z
  
  const scale = 1 + Math.sin(Date.now() * 0.008) * 0.3
  mesh.scale.set(scale, scale, scale)
}

export function createParticleMesh(particle: Particle): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(particle.size, 8, 8)
  const material = new THREE.MeshBasicMaterial({ 
    color: particle.color,
    transparent: true,
    opacity: 1
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(particle.x, particle.y, particle.z)
  return mesh
}

export function updateParticleMesh(mesh: THREE.Mesh, particle: Particle): void {
  mesh.position.x = particle.x
  mesh.position.y = particle.y
  mesh.position.z = particle.z
  
  const material = mesh.material as THREE.MeshBasicMaterial
  material.opacity = particle.life / particle.maxLife
  
  const scale = (particle.life / particle.maxLife) * 0.8 + 0.2
  mesh.scale.set(scale, scale, scale)
}

export function createExplosionEffect(x: number, z: number, color: number): THREE.Group {
  const group = new THREE.Group()
  
  const mainGeometry = new THREE.SphereGeometry(0.5, 16, 16)
  const mainMaterial = new THREE.MeshBasicMaterial({ 
    color,
    transparent: true,
    opacity: 0.8
  })
  const main = new THREE.Mesh(mainGeometry, mainMaterial)
  main.position.set(x, 0.5, z)
  group.add(main)
  
  for (let i = 0; i < 8; i++) {
    const fragmentGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const fragmentMaterial = new THREE.MeshBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.6
    })
    const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial)
    const angle = (Math.PI * 2 * i) / 8
    fragment.position.set(
      x + Math.cos(angle) * 0.3,
      0.3,
      z + Math.sin(angle) * 0.3
    )
    fragment.userData.velocity = {
      vx: Math.cos(angle) * 0.02,
      vy: 0.015,
      vz: Math.sin(angle) * 0.02
    }
    group.add(fragment)
  }
  
  return group
}

export function updateExplosionEffect(group: THREE.Group, deltaTime: number): boolean {
  const main = group.children[0] as THREE.Mesh
  if (main) {
    const material = main.material as THREE.MeshBasicMaterial
    material.opacity -= deltaTime * 0.003
    main.scale.multiplyScalar(1 + deltaTime * 0.003)
    
    if (material.opacity <= 0) {
      return false
    }
  }
  
  for (let i = 1; i < group.children.length; i++) {
    const fragment = group.children[i] as THREE.Mesh
    const velocity = fragment.userData.velocity
    if (velocity) {
      fragment.position.x += velocity.vx * deltaTime
      fragment.position.y += velocity.vy * deltaTime
      fragment.position.z += velocity.vz * deltaTime
      velocity.vy -= 0.0001 * deltaTime
      
      const material = fragment.material as THREE.MeshBasicMaterial
      material.opacity -= deltaTime * 0.002
    }
  }
  
  return true
}