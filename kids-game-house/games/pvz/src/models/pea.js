import Phaser from 'phaser'

export default class Pea extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sprites', 'pea.png')
    
    // 添加到场景和物理世界
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    // 设置更大的尺寸以便看到（2倍）
    this.setScale(2)
    
    // 设置碰撞体大小
    this.body.setSize(30, 30)
    
    // 禁用重力
    this.body.setAllowGravity(false)
    
    // 设置边界碰撞
    this.setCollideWorldBounds(true)
    
    // 强制设置速度
    this.body.velocity.x = 150
    this.body.velocity.y = 0
    
    // 确保物理体被启用
    this.body.enable = true
    
    // 超出边界时自动销毁
    this.on('worldbounds', () => {
      this.destroy()
    })
  }
}