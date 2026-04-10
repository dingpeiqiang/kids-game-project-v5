import Plant from './plant.js'
import Pea from './pea.js'

export default class Repeater extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 双发射手使用豌豆射手的纹理，稍微调整一下
    this.setTexture('sprites', 'ps-idle01.png')
    
    // 更新游戏数据
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      lastShotAt: 0,
      firingRate: 1200, // 射击频率稍快
      health: 5
    }
    
    // 创建双发射手动画
    this.createRepeaterAnimations()
    this.play('repeater-idle')
  }
  
  createRepeaterAnimations() {
    // 简单的待机动画
    this.scene.anims.create({
      key: 'repeater-idle',
      frames: [
        { key: 'sprites', frame: 'ps-idle01.png' }
      ],
      frameRate: 1,
      repeat: -1
    })
  }
  
  shoot(currentTime) {
    this.gameData.lastShotAt = currentTime
    this.scene.sounds.peaShoot.play()
    
    // 发射第一颗豌豆
    this.shootPea(this.x + 10, this.y)
    
    // 延迟发射第二颗豌豆
    this.scene.time.delayedCall(150, () => {
      if (this.active) { // 确保植物还在
        this.shootPea(this.x + 10, this.y)
      }
    })
  }
  
  shootPea(x, y) {
    const pea = this.scene.projectiles.create(x, y, 'sprites', 'pea.png')
    
    // 配置子弹
    pea.setScale(2)
    pea.body.setSize(30, 30)
    pea.body.setAllowGravity(false)
    pea.setVelocityX(160) // 双发射手子弹稍快一点
  }
}