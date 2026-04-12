import Plant from './plant.js'

export default class Wallnut extends Plant {
  constructor(scene, cell) {
    super(scene, cell)

    this.setTexture('wallnut')
    this.setScale(1.0)

    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 20,
      maxHealth: 20
    }

    // 不射击
    this.scene.events.off('update', this.update, this)
    this.scene.events.on('update', () => {}, this)
  }

  takeDamage(amount) {
    this.gameData.health -= amount
    const pct = this.gameData.health / this.gameData.maxHealth
    if (pct <= 0.3) this.setTint(0xFF4444)
    else if (pct <= 0.6) this.setTint(0xFF8C00)
    if (this.gameData.health <= 0) this.destroy()
  }
}
