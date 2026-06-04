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
    if (this.scene.sounds && this.scene.sounds.peaShoot) {
      this.scene.sounds.peaShoot.play()
    }

    // 使用 icePea 纹理（来自图集）
    const pea = this.scene.projectiles.create(this.x + 40, this.y, 'icePea')
    pea.isIcePea = true
    pea.setTint(0x88CCFF) // 冰蓝色
    pea.setVelocityX(500)
  }
}
