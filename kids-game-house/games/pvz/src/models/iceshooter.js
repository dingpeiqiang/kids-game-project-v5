import Plant from './plant.js'
import Pea from './pea.js'

export default class IceShooter extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 寒冰射手使用豌豆射手的纹理，加上蓝色色调
    this.setTexture('sprites', 'ps-idle01.png')
    this.setTint(0x00FFFF) // 青色冰冻效果
    
    // 更新游戏数据
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      lastShotAt: 0,
      firingRate: 1500, // 寒冰射手射击稍慢一点
      health: 5
    }
    
    // 创建寒冰豌豆动画
    this.createIceShooterAnimations()
    this.play('iceshooter-idle')
  }
  
  createIceShooterAnimations() {
    // 简单的待机动画
    this.scene.anims.create({
      key: 'iceshooter-idle',
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
    
    // 创建寒冰豌豆子弹
    const pea = this.scene.projectiles.create(this.x + 10, this.y, 'sprites', 'pea.png')
    pea.setTint(0x00FFFF) // 蓝色冰冻效果
    pea.isIcePea = true // 标记这是寒冰豌豆
    
    // 配置子弹
    pea.setScale(2)
    pea.body.setSize(30, 30)
    pea.body.setAllowGravity(false)
    pea.setVelocityX(120) // 寒冰豌豆稍慢一点
  }
}