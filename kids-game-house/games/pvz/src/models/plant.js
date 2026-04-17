import Phaser from 'phaser'

export default class Plant extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, cell) {
    super(scene, cell.x, cell.y, 'peashooter')

    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.plants.add(this)

    // 原始 80px，格子 100px → scale 1.0（自动填充 80%）
    this.setScale(1.0)

    this.gameData = {
      row: cell.row,
      col: cell.col,
      lastShotAt: 0,
      firingRate: 1200,
      health: 5
    }

    scene.events.on('update', this.update, this)
  }

  update(time, delta) {
    if (this.zombieAhead() && this.canShoot(time)) {
      this.shoot(time)
    }
  }

  zombieAhead() {
    if (!this.scene || !this.scene.zombies) return false
    let found = false
    this.scene.zombies.children.each(z => {
      if (z.active && z.gameData && z.gameData.row === this.gameData.row && z.x > this.x) found = true
    })
    return found
  }

  canShoot(t) {
    return (t - this.gameData.lastShotAt) > this.gameData.firingRate
  }

  shoot(t) {
    this.gameData.lastShotAt = t
    if (this.scene.sounds && this.scene.sounds.peaShoot) {
      this.scene.sounds.peaShoot.play()
    }

    // 使用独立 pea 纹理（40×40，setScale(0.8) → 32px 显示）
    const pea = this.scene.projectiles.create(this.x + 40, this.y, 'pea')
    // Pea 构造函数已设置 scale(0.8)
    pea.body.setAllowGravity(false)
    pea.setVelocityX(500)
    pea.isIcePea = false
  }

  takeDamage(amount) {
    this.gameData.health -= amount
    if (this.gameData.health <= 0) this.destroy()
  }
}
