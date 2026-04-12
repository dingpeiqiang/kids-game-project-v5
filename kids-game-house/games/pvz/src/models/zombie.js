import Phaser from 'phaser'

export default class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type = 'normal') {
    const row = Phaser.Math.Between(0, scene.game.ROWS - 1)
    const x = scene.getZombieSpawnX()
    const y = scene.yForRow(row)

    const textureMap = {
      normal: 'zombie_normal',
      conehead: 'zombie_conehead',
      buckethead: 'zombie_buckethead',
      newspaper: 'zombie_newspaper'
    }

    super(scene, x, y, textureMap[type] || 'zombie_normal')

    this.zombieType = type
    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.zombies.add(this)

    this.setScale(1.0)

    const configs = {
      normal:     { health: 5,  speed: -25, score: 10 },
      conehead:   { health: 10, speed: -25, score: 20 },
      buckethead: { health: 20, speed: -18, score: 40 },
      newspaper:  { health: 8,  speed: -30, score: 25 }
    }

    const cfg = configs[type] || configs.normal
    this.gameData = { row, health: cfg.health, maxHealth: cfg.health, speed: cfg.speed, score: cfg.score }

    this.setVelocityX(cfg.speed)

    this.on('worldbounds', () => {
      // 僵尸突破 → 游戏结束
      if (!scene.gameOver) {
        scene.gameOver = true
        scene.scene.start('OverScene')
      }
    })
    this.body.setCollideWorldBounds(true)
  }

  takeDamage(amount) {
    this.gameData.health -= amount

    // 受伤闪烁
    if (!this.isFlashing) {
      this.isFlashing = true
      this.scene.tweens.add({
        targets: this, alpha: 0.5, duration: 100, yoyo: true, repeat: 1,
        onComplete: () => { this.isFlashing = false }
      })
    }

    // 脱装备
    if (this.gameData.health <= 0) {
      this.destroy()
    } else if (this.zombieType === 'conehead' && this.gameData.health <= 5) {
      this.zombieType = 'normal'
      this.setTexture('zombie_normal')
      this.gameData.score = 10
    } else if (this.zombieType === 'buckethead' && this.gameData.health <= 10) {
      this.zombieType = 'conehead'
      this.setTexture('zombie_conehead')
      this.gameData.score = 20
    } else if (this.zombieType === 'buckethead' && this.gameData.health <= 5) {
      this.zombieType = 'normal'
      this.setTexture('zombie_normal')
      this.gameData.score = 10
    }
  }
}
