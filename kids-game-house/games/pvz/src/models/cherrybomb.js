import Plant from './plant.js'

export default class CherryBomb extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('cherrybomb')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 1,
      isExploded: false,
      armed: false
    }

    // 不射击
    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', this.updateCherry, this)

    // 1.5秒后激活
    this.scene.time.delayedCall(1500, () => {
      if (this.active && !this.gameData.isExploded) {
        this.gameData.armed = true
        this.startBlinking()
      }
    })
  }

  startBlinking() {
    if (!this.active) return
    this.scene.tweens.add({
      targets: this, alpha: 0.5, duration: 200, yoyo: true, repeat: -1
    })
    // 5秒后自动爆炸
    this.scene.time.delayedCall(5000, () => {
      if (this.active && !this.gameData.isExploded) this.explode()
    })
  }

  updateCherry() {
    if (!this.active || this.gameData.isExploded || !this.gameData.armed) return
    if (!this.scene || !this.scene.zombies) return

    let nearby = null
    this.scene.zombies.children.each(z => {
      if (z.active && !nearby) {
        if (Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y) < 100) nearby = z
      }
    })
    if (nearby) this.explode()
  }

  explode() {
    if (this.gameData.isExploded) return
    this.gameData.isExploded = true

    // 爆炸特效
    const boom = this.scene.add.circle(this.x, this.y, 50, 0xFF6B00, 0.9).setDepth(200)
    this.scene.tweens.add({ targets: boom, scale: 2, alpha: 0, duration: 400, onComplete: () => boom.destroy() })

    // 屏幕震动
    this.scene.cameras.main.shake(200, 0.01)

    // 消灭范围内僵尸
    this.scene.zombies.children.each(z => {
      if (z.active && Phaser.Math.Distance.Between(this.x, this.y, z.x, z.y) < 120) {
        if (z.takeDamage) z.takeDamage(100)
      }
    })

    this.scene.addScore(50)

    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 0.3, duration: 300,
      onComplete: () => this.destroy()
    })
  }

  takeDamage(amount) {
    if (!this.active || this.gameData.isExploded) return
    this.gameData.health -= amount
    if (this.gameData.health <= 0) this.explode()
  }
}
