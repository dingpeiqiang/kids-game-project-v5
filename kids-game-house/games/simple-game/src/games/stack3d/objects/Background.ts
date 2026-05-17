import * as THREE from 'three'
import { COLORS } from '../config'

export class Background {
  private stars: THREE.Mesh[] = []

  constructor(private scene: THREE.Scene) {
    this.createStars()
  }

  private createStars() {
    for (let i = 0; i < 25; i++) {
      const starGeo = new THREE.SphereGeometry(0.08, 6, 6)
      const starMat = new THREE.MeshBasicMaterial({
        color: COLORS.star,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.4
      })
      const star = new THREE.Mesh(starGeo, starMat)
      star.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 20
      )
      star.userData = {
        baseY: star.position.y,
        speed: 0.001 + Math.random() * 0.002
      }
      this.stars.push(star)
      this.scene.add(star)
    }
  }

  update() {
    this.stars.forEach(star => {
      star.position.y += star.userData.speed
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