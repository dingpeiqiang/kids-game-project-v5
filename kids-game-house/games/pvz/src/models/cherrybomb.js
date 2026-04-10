import Plant from './plant.js'

export default class CherryBomb extends Plant {
  constructor(scene, cell) {
    super(scene, cell)
    
    // 樱桃炸弹使用红色圆形作为占位
    this.createCherryBombGraphics()
    
    // 更新游戏数据 - 樱桃炸弹不会射击
    this.gameData = {
      row: this.gameData.row,
      col: this.gameData.col,
      health: 1, // 非常脆弱，一碰就炸
      isExploded: false,
      armed: false
    }
    
    // 稍微准备一下再爆炸（1.5秒）
    this.scene.time.delayedCall(1500, () => {
      if (this.active && !this.gameData.isExploded) {
        this.gameData.armed = true
        this.startBlinking()
      }
    })
  }
  
  createCherryBombGraphics() {
    // 绘制两个红色圆形作为樱桃炸弹
    const graphics = this.scene.add.graphics()
      .setDepth(10)
    
    // 左边樱桃
    graphics.fillStyle(0xFF0000, 1)
    graphics.fillCircle(this.x - 8, this.y - 5, 12)
    
    // 右边樱桃
    graphics.fillStyle(0xFF3333, 1)
    graphics.fillCircle(this.x + 8, this.y - 5, 12)
    
    // 绿色茎
    graphics.fillStyle(0x00AA00, 1)
    graphics.lineStyle(3, 0x00AA00, 1)
    graphics.beginPath()
    graphics.moveTo(this.x - 3, this.y - 15)
    graphics.quadraticCurveTo(this.x, this.y - 25, this.x + 3, this.y - 15)
    graphics.strokePath()
    
    // 叶子
    graphics.fillStyle(0x00CC00, 1)
    graphics.beginPath()
    graphics.ellipse(this.x + 5, this.y - 22, 5, 3, 0.5, 0, Math.PI * 2)
    graphics.fill()
    
    // 把图形添加到游戏对象上
    const textureKey = 'cherry-bomb-' + Date.now()
    graphics.generateTexture(textureKey, 40, 40)
    graphics.destroy()
    
    this.setTexture(textureKey)
    this.setDisplaySize(40, 40)
  }
  
  startBlinking() {
    if (!this.active) return
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1
    })
    
    // 5秒后无论如何都爆炸
    this.scene.time.delayedCall(5000, () => {
      if (this.active && !this.gameData.isExploded) {
        this.explode()
      }
    })
  }
  
  explode() {
    if (this.gameData.isExploded) return
    
    this.gameData.isExploded = true
    
    // 创建爆炸特效
    this.showExplosionEffect()
    
    // 屏幕震动
    this.scene.shakeScreen(12, 200)
    
    // 爆炸范围内消灭所有僵尸
    this.destroyNearbyZombies()
    
    // 加分
    this.scene.addScore(50)
    
    // 销毁自己
    this.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => this.destroy()
    })
  }
  
  update() {
    if (!this.active || this.gameData.isExploded || !this.gameData.armed) return
    
    // 检查附近是否有僵尸，如果有就爆炸
    const triggerRadius = 90
    let nearbyZombie = null
    
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
  
  showExplosionEffect() {
    // 简化的爆炸效果
    const explosion = this.scene.add.circle(this.x, this.y, 40, 0xFF6B00, 0.9)
      .setDepth(200)
    
    this.scene.tweens.add({
      targets: explosion,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => explosion.destroy()
    })
    
    // 减少粒子数量 - 性能优化
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(this.x, this.y, 3 + Math.random() * 3, 0xFFD700)
        .setDepth(201)
      
      const angle = (i / 8) * Math.PI * 2
      const distance = 35 + Math.random() * 25
      
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Cubic.out',
        onComplete: () => particle.destroy()
      })
    }
  }
  
  destroyNearbyZombies() {
    const explosionRadius = 100
    
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
          this.scene.addScore(20)
          
          // 减少额外特效调用 - 性能优化
        }
      }
    })
  }
  
  // 重写takeDamage方法，受伤直接爆炸
  takeDamage(amount) {
    if (!this.active || this.gameData.isExploded) return
    
    this.gameData.health -= amount
    
    if (this.gameData.health <= 0) {
      this.explode()
    }
  }
  
  // 樱桃炸弹不需要射击
  shoot(currentTime) {}
}
