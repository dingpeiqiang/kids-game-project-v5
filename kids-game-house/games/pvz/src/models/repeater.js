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
    const pea = this.scene.projectiles.create(this.x + 40, this.y, 'pea')
    pea.setScale(1.0)
    pea.body.setSize(20, 20)
    pea.body.setAllowGravity(false)
    pea.setVelocityX(220)
  }
}
