import * as THREE from 'three'
import { COLORS } from '../config'

interface ParticleData {
  particles: THREE.Points | THREE.Mesh
  life: number
}

export class ParticleSystem {
  private particles: ParticleData[] = []
  private rainbowRings: THREE.Mesh[] = []

  constructor(private scene: THREE.Scene) {}

  createMagicParticles(pos: THREE.Vector3, color: number, count: number = 40) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 0.5 + Math.random() * 1.5
      
      positions[i * 3] = pos.x + Math.cos(angle) * radius
      positions[i * 3 + 1] = pos.y + Math.random() * 2
      positions[i * 3 + 2] = pos.z + Math.sin(angle) * radius
      
      const velocity = 0.1 + Math.random() * 0.15
      velocities[i * 3] = Math.cos(angle) * velocity
      velocities[i * 3 + 1] = Math.random() * 0.2 + 0.1
      velocities[i * 3 + 2] = Math.sin(angle) * velocity
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    
    const material = new THREE.PointsMaterial({
      color,
      size: 0.1,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.particles.push({ particles, life: 1 })
  }

  createStarBurst(pos: THREE.Vector3) {
    for (let i = 0; i < 12; i++) {
      const starGeo = new THREE.OctahedronGeometry(0.15, 0)
      const starMat = new THREE.MeshBasicMaterial({
        color: COLORS.goldStar,
        transparent: true,
        opacity: 1
      })
      const star = new THREE.Mesh(starGeo, starMat)
      star.position.set(pos.x, pos.y, pos.z)
      const angle = (i / 12) * Math.PI * 2
      star.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angle) * (0.15 + Math.random() * 0.1),
          Math.random() * 0.25 + 0.15,
          Math.sin(angle) * (0.15 + Math.random() * 0.1)
        ),
        life: 1
      }
      this.scene.add(star)
      this.particles.push({ particles: star, life: 1 })
    }
  }

  createRainbowRing(pos: THREE.Vector3) {
    const ringGeo = new THREE.RingGeometry(1.5, 1.8, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLORS.star,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(pos.x, pos.y + 0.5, pos.z)
    ring.rotation.x = -Math.PI / 2
    ring.userData = { life: 1, scale: 1 }
    this.scene.add(ring)
    this.rainbowRings.push(ring)
  }

  createCutParticles(x: number, y: number, width: number, color: number) {
    const count = Math.floor(width * 20)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * width * 0.5
      positions[i * 3 + 1] = y + Math.random() * 0.5
      positions[i * 3 + 2] = Math.random() * 2 - 1
      
      const velocity = 0.15 + Math.random() * 0.15
      velocities[i * 3] = (Math.random() - 0.5) * velocity * 2
      velocities[i * 3 + 1] = Math.random() * 0.2 + 0.1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * velocity
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    
    const material = new THREE.PointsMaterial({
      color,
      size: 0.08,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.particles.push({ particles, life: 1 })
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.life -= 0.012
      if (p.life <= 0) {
        this.scene.remove(p.particles)
        return false
      }
      
      if (p.particles instanceof THREE.Points) {
        const positions = p.particles.geometry.attributes.position.array as Float32Array
        const velocities = p.particles.geometry.attributes.velocity.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * 0.5
          positions[i + 1] += velocities[i + 1] * 0.5
          positions[i + 1] -= 0.012
          positions[i + 2] += velocities[i + 2] * 0.5
        }
        p.particles.geometry.attributes.position.needsUpdate = true
        ;(p.particles.material as THREE.PointsMaterial).opacity = p.life
      } else {
        p.particles.position.add(p.particles.userData.velocity as THREE.Vector3)
        p.particles.position.y -= 0.015
        ;(p.particles.material as THREE.MeshBasicMaterial).opacity = p.life
        p.particles.rotation.y += 0.08
        p.particles.scale.set(p.life, p.life, p.life)
      }
      
      return true
    })

    this.rainbowRings = this.rainbowRings.filter(ring => {
      ring.userData.life -= 0.02
      if (ring.userData.life <= 0) {
        this.scene.remove(ring)
        return false
      }
      ring.userData.scale += 0.03
      ring.scale.set(ring.userData.scale, ring.userData.scale, 1)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = ring.userData.life * 0.8
      return true
    })
  }

  dispose() {
    this.particles.forEach(p => {
      if (p.particles instanceof THREE.Points) {
        p.particles.geometry.dispose()
        ;(p.particles.material as THREE.Material).dispose()
      } else {
        p.particles.geometry.dispose()
        ;(p.particles.material as THREE.Material).dispose()
      }
      this.scene.remove(p.particles)
    })
    
    this.rainbowRings.forEach(ring => {
      ring.geometry.dispose()
      ;(ring.material as THREE.Material).dispose()
      this.scene.remove(ring)
    })
    
    this.particles = []
    this.rainbowRings = []
  }
}