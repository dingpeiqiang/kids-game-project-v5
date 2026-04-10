import Phaser from 'phaser'

export default class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type = 'normal') {
    const row = Phaser.Math.Between(0, 6)
    const x = scene.cameras.main.width
    const y = scene.yForRow(row)
    
    super(scene, x, y, 'sprites', 'zombie1.png')
    
    this.zombieType = type
    
    // 添加到场景和物理组
    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.zombies.add(this)
    
    // 不同僵尸类型的属性
    const zombieConfigs = {
      'normal': {
        health: 5,
        speed: -15,
        color: 0xFFFFFF,
        scale: 2,
        score: 10
      },
      'conehead': {
        health: 10,
        speed: -15,
        color: 0xFFA500,
        scale: 2,
        score: 20
      },
      'buckethead': {
        health: 20,
        speed: -12,
        color: 0x808080,
        scale: 2.2,
        score: 40
      },
      'newspaper': {
        health: 8,
        speed: -18,
        color: 0xFFFF00,
        scale: 2,
        score: 25
      }
    }
    
    const config = zombieConfigs[type] || zombieConfigs['normal']
    
    // 存储游戏数据
    this.gameData = {
      row: row,
      health: config.health,
      maxHealth: config.health,
      speed: config.speed,
      score: config.score
    }
    
    // 设置外观
    this.setTint(config.color)
    this.setScale(config.scale)
    
    // 创建动画
    this.createAnimations()
    
    // 启动行走动画
    this.play('zombie-walk')
    
    // 设置速度
    this.setVelocityX(config.speed)
    
    // 超出左边界时游戏结束
    this.on('worldbounds', () => {
      scene.scene.start('OverScene')
    })
  }
  
  createAnimations() {
    // 检查动画是否已存在，避免重复创建
    if (!this.scene.anims.exists('zombie-walk')) {
      this.scene.anims.create({
        key: 'zombie-walk',
        frames: [
          { key: 'sprites', frame: 'zombie1.png' },
          { key: 'sprites', frame: 'zombie2.png' },
          { key: 'sprites', frame: 'zombie3.png' }
        ],
        frameRate: 5,
        repeat: -1 // 无限循环
      })
    }
  }
  
  takeDamage(amount) {
    this.gameData.health -= amount
    
    // 受伤闪烁效果
    if (!this.isFlashing) {
      this.isFlashing = true
      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.isFlashing = false
        }
      })
    }
    
    // 路障和铁桶僵尸脱装备效果
    if (this.gameData.health <= 0) {
      this.destroy()
    } else if (this.zombieType === 'conehead' && this.gameData.health <= 5) {
      // 路障掉了，变回普通僵尸
      this.zombieType = 'normal'
      this.clearTint()
      this.gameData.score = 10
    } else if (this.zombieType === 'buckethead' && this.gameData.health <= 10) {
      // 铁桶掉了，变成路障僵尸
      this.zombieType = 'conehead'
      this.setTint(0xFFA500)
      this.gameData.score = 20
    } else if (this.zombieType === 'buckethead' && this.gameData.health <= 5) {
      // 路障也掉了，变成普通僵尸
      this.zombieType = 'normal'
      this.clearTint()
      this.gameData.score = 10
    }
  }
}