import Plant from './plant.js'

export default class PotatoMine extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 土豆雷使用棕色圆形作为占位
    this.createPotatoMineGraphics(true) // 初始为埋地状态
    
    // 更新游戏数据
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 2,
      isArmed: false,
      isExploded: false
    }
    
    // 需要15秒才能准备好
    this.scene.time.delayedCall(15000, () => {
      if (this.active && !this.gameData.isArmed && !this.gameData.isExploded) {
        this.arm()
      }
    })
  }
  
  createPotatoMineGraphics(isBuried) {
    const graphics = this.scene.add.graphics()
      .setDepth(10)
    
    if (isBuried) {
      // 埋地状态：只有一点土堆
      graphics.fillStyle(0x8B4513, 1)
      graphics.beginPath()
      graphics.ellipse(this.x, this.y + 10, 15, 8, 0, 0, Math.PI * 2)
      graphics.fill()
    } else {
      // 准备状态：完整的土豆雷
      graphics.fillStyle(0xD2B48C, 1) // 土豆色
      graphics.fillCircle(this.x, this.y, 14)
      
      // 眼睛
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(this.x - 5, this.y - 3, 2)
      graphics.fillCircle(this.x + 5, this.y - 3, 2)
      
      // 嘴巴/引信
      graphics.fillStyle(0xFF0000, 1)
      graphics.fillCircle(this.x, this.y + 5, 3)
    }
    
    const textureKey = 'potato-mine-' + (isBuried ? 'buried' : 'armed') + '-' + Date.now()
    graphics.generateTexture(textureKey, 40, 40)
    graphics.destroy()
    
    if (this.texture) {
      this.setTexture(textureKey)
    } else {
      this.setTexture(textureKey)
    }
    this.setDisplaySize(40, 40)
  }
  
  arm() {
    if (this.gameData.isArmed || this.gameData.isExploded) return
    
    this.gameData.isArmed = true
    
    // 改变外观为准备状态
    this.createPotatoMineGraphics(false)
    
    // 轻微弹跳动画
    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 200,
      yoyo: true,
      repeat: -1
    })
  }
  
  explode() {
    if (this.gameData.isExploded) return
    
    this.gameData.isExploded = true
    
    // 创建爆炸特效
    this.showExplosionEffect()
    
    // 屏幕震动
    this.scene.shakeScreen(10, 180)
    
    // 爆炸范围内消灭所有僵尸
    this.destroyNearbyZombies()
    
    // 加分
    this.scene.addScore(30)
    
    // 销毁自己
    this.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => this.destroy()
    })
  }
  
  showExplosionEffect() {
    // 简化的爆炸效果
    const explosion = this.scene.add.circle(this.x, this.y, 30, 0xFF6B00, 0.9)
      .setDepth(200)
    
    this.scene.tweens.add({
      targets: explosion,
      scale: 1.3,
      alpha: 0,
      duration: 350,
      onComplete: () => explosion.destroy()
    })
    
    // 减少粒子数量 - 性能优化
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(this.x, this.y, 2 + Math.random() * 2, 0xFFD700)
        .setDepth(201)
      
      const angle = (i / 6) * Math.PI * 2
      const distance = 25 + Math.random() * 20
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Cubic.out',
        onComplete: () => particle.destroy()
      })
    }
  }
  
  destroyNearbyZombies() {
    const explosionRadius = 70
    
    this.scene.zombies.children.each(zombie => {
      if (zombie.active) {
        const distance = Phaser.Math.Distance.Between(
          this.x, this.y, zombie.x, zombie.y
        )
        
        if (distance < explosionRadius) {
          if (zombie.takeDamage) {
            zombie.takeDamage(100) // 直接消灭
          }
          
          // 加分
          this.scene.addScore(15)
          
          // 减少额外特效调用 - 性能优化
        }
      }
    })
  }
  
  update() {
    if (!this.active || this.gameData.isExploded || !this.gameData.isArmed) return
    
    // 检查附近是否有僵尸
    let nearbyZombie = null
    const triggerRadius = 50
    
    this.scene.zombies.children.each(zombie => {
      if (zombie.active && !nearbyZombie) {
        const distance = Phaser.Math.Distance.Between(
          this.x, this.y, zombie.x, zombie.y
        )
        
        if (distance < triggerRadius) {
          nearbyZombie = zombie
        }
      }
    })
    
    if (nearbyZombie) {
      this.explode()
    }
  }
  
  // 土豆雷不需要射击
  shoot(currentTime) {}
}
