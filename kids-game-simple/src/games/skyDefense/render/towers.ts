import * as THREE from 'three'
import type { Tower } from '../types'

export function createTowerMesh(tower: Tower): THREE.Group {
  const group = new THREE.Group()
  
  const baseGeometry = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 12)
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = 0.075
  base.castShadow = true
  group.add(base)
  
  const bodyHeight = 0.5 + tower.level * 0.15
  const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, bodyHeight, 8)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: tower.type.color })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0.15 + bodyHeight / 2
  body.castShadow = true
  group.add(body)
  
  const topGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 8)
  const topMaterial = new THREE.MeshStandardMaterial({ color: tower.type.bulletColor })
  const top = new THREE.Mesh(topGeometry, topMaterial)
  top.position.y = 0.15 + bodyHeight + 0.1
  top.castShadow = true
  group.add(top)
  
  const glowGeometry = new THREE.SphereGeometry(0.12, 8, 8)
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: tower.type.bulletColor,
    transparent: true,
    opacity: 0.6
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.y = 0.15 + bodyHeight + 0.3
  group.add(glow)
  
  group.position.set(tower.x, 0, tower.z)
  
  return group
}

export function updateTowerMesh(group: THREE.Group, tower: Tower, targetDirection?: THREE.Vector3): void {
  if (targetDirection) {
    const angle = Math.atan2(targetDirection.x, targetDirection.z)
    group.rotation.y = angle
  }
  
  const glow = group.children[3] as THREE.Mesh
  if (glow) {
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2
    glow.scale.set(scale, scale, scale)
  }
}

export function createTowerSelectionIndicator(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(0.5, 0.55, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    transparent: true, 
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  const indicator = new THREE.Mesh(geometry, material)
  indicator.rotation.x = -Math.PI / 2
  indicator.position.y = 0.02
  return indicator
}

export function createTowerRangeIndicator(radius: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const indicator = new THREE.Mesh(geometry, material)
  indicator.rotation.x = -Math.PI / 2
  indicator.position.y = 0.01
  return indicator
}