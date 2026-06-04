import Plant from './plant.js'

export default class PotatoMine extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('potatomine')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 2,
      isArmed: false,
      isExploded: false
    }

    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', this.updatePotato, this)

    // 15秒准备
    this.scene.time.delayedCall(15000, () => {
      if (this.active && !this.gameData.isArmed && !this.gameData.isExploded) {
        this.gameData.isArmed = true
        // 弹跳动画
        this.scene.tweens.add({
          targets: this, y: this.y - 5, duration: 200, yoyo: true, repeat: -1
        })
      }
    })
  }

  updatePotato() {
    if (!this.active || this.gameData.isExploded || !this.gameData.isArmed) return
    if (!this.scene || !this.scene.zombies) return

    let nearby = null
    this.scene.zombies.children.each(z => {
      if (z.active && !nearby && Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y) < 60) {
        nearby = z
      }
    })
    if (nearby) this.explode()
  }

  explode() {
    if (this.gameData.isExploded) return
    this.gameData.isExploded = true

    const boom = this.scene.add.circle(this.x, this.y, 40, 0xFF6B00, 0.9).setDepth(200)
    this.scene.tweens.add({ targets: boom, scale: 1.5, alpha: 0, duration: 350, onComplete: () => boom.destroy() })

    this.scene.cameras.main.shake(150, 0.008)

    this.scene.zombies.children.each(z => {
      if (z.active && Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y) < 80) {
        if (z.takeDamage) z.takeDamage(100)
      }
    })

    this.scene.addScore(30)

    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 0.3, duration: 200,
      onComplete: () => this.destroy()
    })
  }

  takeDamage(amount) {
    if (!this.active || this.gameData.isExploded) return
    this.gameData.health -= amount
    if (this.gameData.health <= 0) this.explode()
  }
}
