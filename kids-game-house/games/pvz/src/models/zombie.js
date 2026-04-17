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
    this.setDepth(40)  // 设置层级，确保在植物之上

    const configs = {
      normal:     { health: 5,  speed: -25, score: 10 },
      conehead:   { health: 10, speed: -25, score: 20 },
      buckethead: { health: 20, speed: -18, score: 40 },
      newspaper:  { health: 8,  speed: -30, score: 25 }
    }

    const cfg = configs[type] || configs.normal
    this.gameData = { row, health: cfg.health, maxHealth: cfg.health, speed: cfg.speed, score: cfg.score }

    this.setVelocityX(cfg.speed)
    this.body.setCollideWorldBounds(true)

    // 启用世界边界检测
    this.body.onWorldBounds = true
  }

  // 在场景的 update 中检测是否突破防线
  checkBoundary(scene) {
    // 僵尸突破到左侧边界（割草机区域左侧）
    if (this.active && this.x < scene.game.GRID_LEFT - 30) {
      if (!scene.gameOver) {
        scene.gameOver = true
        scene.physics.world.pause()
        scene.showGameOverScreen()
      }
    }
  }

  takeDamage(amount) {
    this.gameData.health -= amount

    // 受伤闪烁
    if (!this.isFlashing) {
      this.isFlashing = true
      const originalAlpha = this.alpha  // 保存原始透明度
      
      this.scene.tweens.add({
        targets: this, 
        alpha: 0.4,  // 更明显的闪烁
        duration: 80, 
        yoyo: true, 
        repeat: 1,
        onComplete: () => { 
          this.isFlashing = false
          this.setAlpha(originalAlpha)  // 恢复到原始透明度
          
          // 调试：如果透明度不是1，记录警告
          if (this.alpha < 1) {
            console.warn('[Zombie] 透明度异常:', this.alpha, '| Type:', this.zombieType)
            this.setAlpha(1)  // 强制修复
          }
        }
      })
    }

    // 脱装备
    if (this.gameData.health <= 0) {
      // 清理定时器
      if (this.attackTimer) {
        this.attackTimer.remove()
        this.attackTimer = null
      }
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
