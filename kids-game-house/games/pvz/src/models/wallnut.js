import Plant from './plant.js'

export default class Wallnut extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 坚果墙使用豌豆射手的纹理作为占位（因为sprites.json中没有坚果墙）
    this.setTexture('sprites', 'ps-idle01.png')
    this.setTint(0x8B4513) // 棕色色调
    
    // 更新游戏数据 - 坚果墙有更高的生命值
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 20,  // 坚果墙有20点生命值
      maxHealth: 20
    }
    
    // 创建坚果墙动画
    this.createWallnutAnimations()
    this.play('wallnut-idle')
  }
  
  createWallnutAnimations() {
    // 简单的待机动画
    this.scene.anims.create({
      key: 'wallnut-idle',
      frames: [
        { key: 'sprites', frame: 'ps-idle01.png' }
      ],
      frameRate: 1,
      repeat: -1
    })
  }
  
  takeDamage(amount) {
    this.gameData.health -= amount
    
    // 根据生命值改变颜色
    const healthPercent = this.gameData.health / this.gameData.maxHealth
    if (healthPercent <= 0.3) {
      this.setTint(0xFF0000) // 红色（严重受损）
    } else if (healthPercent <= 0.6) {
      this.setTint(0xFF8C00) // 橙色（中度受损）
    }
    
    if (this.gameData.health <= 0) {
      this.destroy()
    }
  }
  
  // 坚果墙不射击，覆盖update方法
  update(time, delta) {
    // 坚果墙只是站在那里吸收伤害
  }
}