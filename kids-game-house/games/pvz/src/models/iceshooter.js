import Plant from './plant.js'

export default class IceShooter extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('iceshooter')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      lastShotAt: 0,
      firingRate: 1500,
      health: 5
    }

    // 重新注册 update
    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', this.update, this)
  }

  shoot(t) {
    this.gameData.lastShotAt = t
    if (this.scene.sounds) this.scene.sounds.peaShoot.play()

    const pea = this.scene.projectiles.create(this.x + 40, this.y, 'ice_pea')
    pea.setScale(1.0)
    pea.isIcePea = true
    pea.body.setSize(20, 20)
    pea.body.setAllowGravity(false)
    pea.setVelocityX(180)
  }
}
