import Plant from './plant.js'
import Sun from './sun.js'

export default class Sunflower extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 覆盖纹理为向日葵
    this.setTexture('sprites', 'sunflower-idle.png')
    
    // 更新游戏数据
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 5,
      lastSunProduced: 0,
      sunProductionRate: 20000 // 20秒生产一次阳光
    }
    
    // 创建向日葵动画
    this.createSunflowerAnimations()
    this.play('sunflower-idle')
    
    // 注册到场景更新
    scene.events.on('update', this.update, this)
  }
  
  createSunflowerAnimations() {
    // 简单的摇摆动画
    this.scene.anims.create({
      key: 'sunflower-idle',
      frames: [
        { key: 'sprites', frame: 'sunflower-idle.png' }
      ],
      frameRate: 2,
      repeat: -1
    })
  }
  
  update(time, delta) {
    // 检查是否需要生产阳光
    if (time - this.gameData.lastSunProduced > this.gameData.sunProductionRate) {
      this.produceSun()
      this.gameData.lastSunProduced = time
    }
  }
  
  produceSun() {
    // 播放生产动画（可以后续添加）
    
    // 延迟生成阳光（从花中冒出）
    this.scene.time.delayedCall(500, () => {
      const sun = new Sun(this.scene, this.x, this.y - 20, 'flower')
    })
  }
}
