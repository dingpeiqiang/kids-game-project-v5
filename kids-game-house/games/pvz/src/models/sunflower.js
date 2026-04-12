import Plant from './plant.js'
import Sun from './sun.js'

export default class Sunflower extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('sunflower')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 5,
      lastSunProduced: 0,
      sunProductionRate: 18000
    }

    // 重新注册 update
    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', this.update, this)
  }

  update(time, delta) {
    if (!this.scene || !this.active) return
    if (time - this.gameData.lastSunProduced > this.gameData.sunProductionRate) {
      this.produceSun()
      this.gameData.lastSunProduced = time
    }
  }

  produceSun() {
    if (!this.scene) return
    this.scene.time.delayedCall(500, () => {
      if (this.scene && this.active) new Sun(this.scene, this.x, this.y - 30, 'flower')
    })
  }
}
