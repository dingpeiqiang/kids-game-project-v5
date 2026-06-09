import * as THREE from 'three'
import type { Enemy } from '../types'

export function createEnemyMesh(enemy: Enemy): THREE.Group {
  const group = new THREE.Group()
  
  const bodyGeometry = new THREE.BoxGeometry(enemy.size * 1.2, enemy.size * 1.5, enemy.size * 1.2)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: enemy.color })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = enemy.size * 0.75
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)
  
  const eyeGeometry = new THREE.SphereGeometry(enemy.size * 0.15, 8, 8)
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-enemy.size * 0.3, enemy.size * 0.9, enemy.size * 0.3)
  group.add(leftEye)
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(enemy.size * 0.3, enemy.size * 0.9, enemy.size * 0.3)
  group.add(rightEye)
  
  const hpBarBackgroundGeometry = new THREE.BoxGeometry(enemy.size * 1.4, 0.08, 0.05)
  const hpBarBackgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 })
  const hpBarBackground = new THREE.Mesh(hpBarBackgroundGeometry, hpBarBackgroundMaterial)
  hpBarBackground.position.y = enemy.size * 1.7 + 0.1
  group.add(hpBarBackground)
  
  const hpBarGeometry = new THREE.BoxGeometry(enemy.size * 1.4, 0.06, 0.06)
  const hpBarMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa44 })
  const hpBar = new THREE.Mesh(hpBarGeometry, hpBarMaterial)
  hpBar.position.y = enemy.size * 1.7 + 0.1
  hpBar.name = 'hpBar'
  updateHpBar(hpBar, enemy)
  group.add(hpBar)
  
  if (enemy.type.isElite) {
    const auraGeometry = new THREE.RingGeometry(enemy.size * 0.8, enemy.size * 1, 16)
    const auraMaterial = new THREE.MeshBasicMaterial({ 
      color: enemy.color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
    const aura = new THREE.Mesh(auraGeometry, auraMaterial)
    aura.rotation.x = -Math.PI / 2
    aura.position.y = 0.05
    group.add(aura)
  }
  
  group.position.set(enemy.x, 0, enemy.z)
  
  return group
}

export function updateEnemyMesh(group: THREE.Group, enemy: Enemy): void {
  group.position.x = enemy.x
  group.position.z = enemy.z
  
  const body = group.children[0] as THREE.Mesh
  if (body) {
    body.rotation.y = Date.now() * 0.003
  }
  
  const hpBar = group.getObjectByName('hpBar') as THREE.Mesh
  if (hpBar) {
    updateHpBar(hpBar, enemy)
  }
  
  if (enemy.slowTimer > 0) {
    const slowEffect = group.getObjectByName('slowEffect') as THREE.Mesh
    if (!slowEffect) {
      const geometry = new THREE.SphereGeometry(enemy.size * 0.8, 8, 8)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x44aaff,
        transparent: true,
        opacity: 0.3
      })
      const effect = new THREE.Mesh(geometry, material)
      effect.name = 'slowEffect'
      effect.position.y = enemy.size * 0.75
      group.add(effect)
    }
  } else {
    const slowEffect = group.getObjectByName('slowEffect') as THREE.Mesh
    if (slowEffect) {
      group.remove(slowEffect)
    }
  }
}

function updateHpBar(hpBar: THREE.Mesh, enemy: Enemy): void {
  const hpPercent = enemy.hp / enemy.maxHp
  hpBar.scale.x = Math.max(0.01, hpPercent)
  hpBar.position.x = (1 - hpPercent) * (enemy.size * 0.7)
  
  const material = hpBar.material as THREE.MeshBasicMaterial
  if (hpPercent > 0.5) {
    material.color.setHex(0x44aa44)
  } else if (hpPercent > 0.2) {
    material.color.setHex(0xffaa00)
  } else {
    material.color.setHex(0xff4444)
  }
}