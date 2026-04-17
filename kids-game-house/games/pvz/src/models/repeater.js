import Plant from './plant.js'

export default class Repeater extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('repeater')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      lastShotAt: 0,
      firingRate: 1200,
      health: 5
    }

    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', this.update, this)
  }

  shoot(t) {
    this.gameData.lastShotAt = t
    if (this.scene.sounds) this.scene.sounds.peaShoot.play()

    // 第一颗
    this.shootPea()
    // 第二颗延迟
    this.scene.time.delayedCall(150, () => {
      if (this.active && this.scene) this.shootPea()
    })
  }

  shootPea() {
    // 使用 pea 纹理
    const pea = this.scene.projectiles.create(this.x + 40, this.y, 'pea')
    pea.setVelocityX(500)
    pea.isIcePea = false
  }
}
