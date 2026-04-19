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
      sunProductionRate: 12000,  // 无尽模式：加快阳光产出（原 18000ms）
      sunValue: 75  // 无尽模式：增加阳光值（原 50）
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
      if (this.scene && this.active) {
        const sun = new Sun(this.scene, this.x, this.y - 30, 'flower')
        // 设置向日葵产出的阳光值
        if (sun && this.gameData.sunValue) {
          sun.sunValue = this.gameData.sunValue
        }
      }
    })
  }
}
