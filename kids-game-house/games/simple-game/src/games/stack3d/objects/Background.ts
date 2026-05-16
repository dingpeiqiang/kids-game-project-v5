import * as THREE from 'three'
import { COLORS } from '../config'

export class Background {
  private stars: THREE.Mesh[] = []

  constructor(private scene: THREE.Scene) {
    this.createStars()
  }

  private createStars() {
    for (let i = 0; i < 50; i++) {
      const starGeo = new THREE.OctahedronGeometry(0.1 + Math.random() * 0.1, 0)
      const starMat = new THREE.MeshBasicMaterial({
        color: COLORS.star,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.6
      })
      const star = new THREE.Mesh(starGeo, starMat)
      star.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 20
      )
      star.userData = {
        baseY: star.position.y,
        speed: 0.001 + Math.random() * 0.002,
        twinkle: Math.random() * Math.PI * 2
      }
      this.stars.push(star)
      this.scene.add(star)
    }
  }

  update() {
    this.stars.forEach(star => {
      star.userData.twinkle += 0.03
      ;(star.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(star.userData.twinkle) * 0.4
      star.position.y += star.userData.speed
      star.rotation.y += 0.015
      if (star.position.y > star.userData.baseY + 3) {
        star.position.y = star.userData.baseY - 3
      }
    })
  }

  dispose() {
    this.stars.forEach(star => {
      star.geometry.dispose()
      ;(star.material as THREE.Material).dispose()
      this.scene.remove(star)
    })
    this.stars = []
  }
}