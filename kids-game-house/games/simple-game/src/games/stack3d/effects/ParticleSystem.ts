import * as THREE from 'three'
import { COLORS } from '../config'

interface ParticleData {
  particles: THREE.Points | THREE.Mesh
  life: number
  isDebris?: boolean
}

export class ParticleSystem {
  private particles: ParticleData[] = []
  private rainbowRings: THREE.Mesh[] = []
  private trails: THREE.Mesh[] = []

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

  createCutParticles(x: number, y: number, width: number, color: number, cutFromLeft: boolean = true) {
    this.createCutGlowLine(x, y, color, cutFromLeft)
    this.createCutPointParticles(x, y, width, color, cutFromLeft)
    this.createCutBlockParticles(x, y, width, color, cutFromLeft)
    this.createCutDebris(x, y, width, color, cutFromLeft)
    this.createCutSparkles(x, y, color)
    this.createCutLightBurst(x, y, color)
    this.createCutTrails(x, y, width, color, cutFromLeft)
  }

  private createCutPointParticles(x: number, y: number, width: number, color: number, cutFromLeft: boolean = true) {
    const count = Math.floor(width * 25)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    const direction = cutFromLeft ? -1 : 1
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + direction * Math.random() * width * 0.5
      positions[i * 3 + 1] = y + Math.random() * 0.8
      positions[i * 3 + 2] = Math.random() * 3 - 1.5
      
      const velocity = 0.15 + Math.random() * 0.25
      const angle = (Math.random() - 0.5) * Math.PI * 0.6 + (cutFromLeft ? -Math.PI / 2 : Math.PI / 2)
      const radius = velocity * (0.6 + Math.random() * 0.6)
      
      velocities[i * 3] = Math.cos(angle) * radius * direction
      velocities[i * 3 + 1] = Math.random() * 0.35 + 0.1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * velocity * 1.2
      
      sizes[i] = 0.03 + Math.random() * 0.12
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        size: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 30.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    const particles = new THREE.Points(geometry, material)
    this.scene.add(particles)
    this.particles.push({ particles, life: 1 })
  }

  private createCutBlockParticles(x: number, y: number, width: number, color: number, cutFromLeft: boolean = true) {
    const blockCount = Math.floor(width * 6) + 4
    const direction = cutFromLeft ? -1 : 1
    
    for (let i = 0; i < blockCount; i++) {
      const sizeVariation = Math.random()
      const blockWidth = 0.06 + sizeVariation * 0.15
      const blockHeight = 0.04 + Math.random() * 0.12
      const blockDepth = 0.05 + Math.random() * 0.1
      
      const shapes = [
        () => new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth),
        () => new THREE.CylinderGeometry(blockWidth * 0.4, blockWidth * 0.4, blockHeight, 6),
        () => new THREE.OctahedronGeometry(blockWidth * 0.5, 0),
        () => new THREE.TetrahedronGeometry(blockWidth * 0.5),
        () => new THREE.SphereGeometry(blockWidth * 0.4, 8, 8)
      ]
      
      const shapeIndex = Math.floor(Math.random() * shapes.length)
      const blockGeo = shapes[shapeIndex]()
      
      const blockMat = new THREE.MeshStandardMaterial({
        color: color + Math.floor((Math.random() - 0.5) * 0x333333),
        emissive: color,
        emissiveIntensity: 0.4 + Math.random() * 0.4,
        transparent: true,
        opacity: 0.75 + Math.random() * 0.2,
        metalness: 0.5 + Math.random() * 0.3,
        roughness: 0.3 + Math.random() * 0.4
      })
      const block = new THREE.Mesh(blockGeo, blockMat)
      
      block.position.set(
        x + direction * Math.random() * width * 0.7,
        y + Math.random() * 0.7,
        (Math.random() - 0.5) * 2.5
      )
      
      const velocity = 0.18 + Math.random() * 0.35
      const angle = (Math.random() - 0.5) * Math.PI * 0.7 + (cutFromLeft ? -Math.PI / 2 : Math.PI / 2)
      
      block.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angle) * velocity * direction * (1 + Math.random() * 0.5),
          Math.random() * 0.3 + 0.15,
          (Math.random() - 0.5) * velocity * 1.5
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        life: 1,
        gravity: 0.015 + Math.random() * 0.02
      }
      
      this.scene.add(block)
      this.particles.push({ particles: block, life: 1 })
    }
  }

  private createCutSparkles(x: number, y: number, color: number) {
    const sparkleCount = 12
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkleGeo = new THREE.OctahedronGeometry(0.06 + Math.random() * 0.04, 0)
      const sparkleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      })
      const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat)
      
      sparkle.position.set(
        x + (Math.random() - 0.5) * 0.8,
        y + Math.random() * 0.6,
        Math.random() * 2 - 1
      )
      
      const velocity = 0.2 + Math.random() * 0.3
      const angle = (i / sparkleCount) * Math.PI * 2 + Math.random() * 0.5
      
      sparkle.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angle) * velocity,
          Math.random() * 0.3 + 0.2,
          Math.sin(angle) * velocity
        ),
        life: 1,
        twinkle: Math.random() * Math.PI * 2
      }
      
      this.scene.add(sparkle)
      this.particles.push({ particles: sparkle, life: 1 })
    }
  }

  private createCutLightBurst(x: number, y: number, color: number) {
    const burstGeo = new THREE.SphereGeometry(0.4, 16, 16)
    const burstMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    })
    const burst = new THREE.Mesh(burstGeo, burstMat)
    
    burst.position.set(x, y, 0)
    burst.userData = { life: 0.5, scale: 0.5 }
    
    this.scene.add(burst)
    this.rainbowRings.push(burst)
  }

  private createCutGlowLine(x: number, y: number, color: number, cutFromLeft: boolean) {
    const glowLineGeo = new THREE.BufferGeometry()
    const glowPositions = new Float32Array([
      x, y - 0.5, -0.8,
      x, y + 0.5, -0.8,
      x, y + 0.5, 0.8,
      x, y - 0.5, 0.8
    ])
    glowLineGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3))
    
    const glowLineMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    
    const glowLine = new THREE.Mesh(glowLineGeo, glowLineMat)
    glowLine.userData = { life: 0.3, scale: 1 }
    
    this.scene.add(glowLine)
    this.rainbowRings.push(glowLine)
    
    for (let i = 0; i < 8; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.03, 8, 8)
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      })
      const spark = new THREE.Mesh(sparkGeo, sparkMat)
      spark.position.set(
        x + (Math.random() - 0.5) * 0.1,
        y + (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 1.6
      )
      spark.userData = {
        life: 0.25,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )
      }
      this.scene.add(spark)
      this.particles.push({ particles: spark, life: 1 })
    }
  }

  private createCutDebris(x: number, y: number, width: number, color: number, cutFromLeft: boolean) {
    const debrisCount = Math.floor(width * 10) + 5
    const direction = cutFromLeft ? -1 : 1
    
    for (let i = 0; i < debrisCount; i++) {
      const debrisSize = 0.04 + Math.random() * 0.08
      const debrisGeo = new THREE.BoxGeometry(
        debrisSize * (0.7 + Math.random() * 0.6),
        debrisSize * (0.5 + Math.random() * 0.8),
        debrisSize * (0.6 + Math.random() * 0.6)
      )
      const debrisMat = new THREE.MeshStandardMaterial({
        color: color + Math.floor((Math.random() - 0.5) * 0x555555),
        emissive: color,
        emissiveIntensity: 0.3 + Math.random() * 0.5,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
        metalness: 0.4 + Math.random() * 0.4,
        roughness: 0.4 + Math.random() * 0.4
      })
      const debris = new THREE.Mesh(debrisGeo, debrisMat)
      
      debris.position.set(
        x + direction * Math.random() * width * 0.6,
        y + (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 1.8
      )
      
      const velocity = 0.2 + Math.random() * 0.4
      const angleVariation = (Math.random() - 0.5) * Math.PI * 0.8
      
      debris.userData = {
        velocity: new THREE.Vector3(
          Math.cos(angleVariation) * velocity * direction * (1 + Math.random() * 0.6),
          Math.random() * 0.4 + 0.1,
          (Math.random() - 0.5) * velocity * 1.8
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
        life: 1,
        gravity: 0.018 + Math.random() * 0.022,
        friction: 0.98 + Math.random() * 0.015
      }
      
      this.scene.add(debris)
      this.particles.push({ particles: debris, life: 1, isDebris: true })
    }
  }

  private createCutTrails(x: number, y: number, width: number, color: number, cutFromLeft: boolean) {
    const trailCount = Math.floor(width * 3) + 2
    const direction = cutFromLeft ? -1 : 1
    
    for (let i = 0; i < trailCount; i++) {
      const trailLength = 0.3 + Math.random() * 0.5
      const trailGeo = new THREE.CylinderGeometry(0.015, 0.005, trailLength, 8)
      const trailMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      })
      const trail = new THREE.Mesh(trailGeo, trailMat)
      
      const startX = x + direction * Math.random() * width * 0.4
      trail.position.set(
        startX,
        y + Math.random() * 0.3,
        (Math.random() - 0.5) * 1.5
      )
      
      const trailVelocity = 0.15 + Math.random() * 0.25
      trail.userData = {
        startPos: new THREE.Vector3(startX, trail.position.y, trail.position.z),
        velocity: new THREE.Vector3(
          direction * trailVelocity * (1 + Math.random()),
          Math.random() * 0.2 + 0.05,
          (Math.random() - 0.5) * trailVelocity
        ),
        life: 1,
        maxLength: trailLength
      }
      
      this.scene.add(trail)
      this.trails.push(trail)
    }
  }

  update() {
    const time = Date.now() * 0.001
    
    this.particles = this.particles.filter(p => {
      p.life -= p.isDebris ? 0.012 : 0.018
      if (p.life <= 0) {
        this.scene.remove(p.particles)
        return false
      }
      
      if (p.particles instanceof THREE.Points) {
        const positions = p.particles.geometry.attributes.position.array as Float32Array
        const velocities = p.particles.geometry.attributes.velocity.array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * 0.85
          positions[i + 1] += velocities[i + 1] * 0.85
          positions[i + 1] -= 0.022
          positions[i + 2] += velocities[i + 2] * 0.85
          velocities[i + 1] -= 0.008
          velocities[i] *= 0.995
          velocities[i + 2] *= 0.995
        }
        p.particles.geometry.attributes.position.needsUpdate = true
        const material = p.particles.material as THREE.ShaderMaterial
        if (material.uniforms && material.uniforms.opacity !== undefined) {
          material.uniforms.opacity.value = p.life
        }
      } else {
        const velocity = p.particles.userData.velocity as THREE.Vector3
        const rotationSpeed = p.particles.userData.rotationSpeed as THREE.Vector3
        const friction = p.particles.userData.friction as number || 0.99
        
        if (velocity) {
          p.particles.position.add(velocity)
          velocity.y -= p.particles.userData.gravity || 0.025
          velocity.x *= friction
          velocity.z *= friction
        } else {
          p.particles.position.y -= 0.025
        }
        
        if (rotationSpeed) {
          p.particles.rotation.x += rotationSpeed.x
          p.particles.rotation.y += rotationSpeed.y
          p.particles.rotation.z += rotationSpeed.z
        } else {
          p.particles.rotation.y += 0.08
        }
        
        const mat = p.particles.material as THREE.MeshBasicMaterial
        mat.opacity = p.life * (p.isDebris ? 0.9 : 1)
        
        const twinkle = p.particles.userData.twinkle as number
        if (twinkle !== undefined) {
          mat.opacity = p.life * (0.6 + 0.4 * Math.sin(time * 15 + twinkle))
        }
        
        const shrinkRate = p.isDebris ? 0.99 : 0.995
        const currentScale = p.particles.scale.x * shrinkRate
        p.particles.scale.set(currentScale, currentScale, currentScale)
      }
      
      return true
    })

    this.trails = this.trails.filter(trail => {
      trail.userData.life -= 0.03
      if (trail.userData.life <= 0) {
        this.scene.remove(trail)
        trail.geometry.dispose()
        ;(trail.material as THREE.Material).dispose()
        return false
      }
      
      const velocity = trail.userData.velocity as THREE.Vector3
      if (velocity) {
        trail.position.add(velocity)
        velocity.y -= 0.015
      }
      
      const startPos = trail.userData.startPos as THREE.Vector3
      const currentLength = trail.position.distanceTo(startPos)
      const maxLength = trail.userData.maxLength as number
      
      if (currentLength > maxLength) {
        const direction = new THREE.Vector3()
          .subVectors(trail.position, startPos)
          .normalize()
        startPos.add(direction.clone().multiplyScalar(currentLength - maxLength * 0.8))
      }
      
      trail.lookAt(startPos)
      
      const mat = trail.material as THREE.MeshBasicMaterial
      mat.opacity = trail.userData.life * 0.6
      
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
    
    this.trails.forEach(trail => {
      trail.geometry.dispose()
      ;(trail.material as THREE.Material).dispose()
      this.scene.remove(trail)
    })
    
    this.particles = []
    this.rainbowRings = []
    this.trails = []
  }
}