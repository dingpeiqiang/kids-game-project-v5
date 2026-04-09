import Phaser from 'phaser'

export default class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    const row = Phaser.Math.Between(0, 6)
    const x = scene.cameras.main.width
    const y = scene.yForRow(row)
    
    super(scene, x, y, 'sprites', 'zombie1.png')
    
    // 添加到场景和物理组
    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.zombies.add(this)
    
    // 存储游戏数据
    this.gameData = {
      row: row,
      health: 5
    }
    
    // 创建动画
    this.createAnimations()
    
    // 启动行走动画
    this.play('zombie-walk')
    
    // 设置速度（向左移动）
    this.setVelocityX(-20)
    
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
    
    if (this.gameData.health <= 0) {
      this.destroy()
    }
  }
}