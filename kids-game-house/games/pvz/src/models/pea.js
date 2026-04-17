import Phaser from 'phaser'

export default class Pea extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'pea')
    
    // 添加到场景和物理世界
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    // 40×40 原图，setScale(0.8) → 32px 显示（与射手协调）
    this.setScale(0.8)
    
    // 设置碰撞体大小
    this.body.setSize(40, 40)
    
    // 禁用重力
    this.body.setAllowGravity(false)
    
    // 设置边界碰撞
    this.setCollideWorldBounds(true)
    
    // 强制设置速度（与原版 PVZ 一致，约 500px/s）
    this.body.velocity.x = 500
    this.body.velocity.y = 0
    
    // 确保物理体被启用
    this.body.enable = true
    
    // 超出边界时自动销毁
    this.on('worldbounds', () => {
      this.destroy()
    })
  }
}