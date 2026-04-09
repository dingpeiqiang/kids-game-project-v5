export default class Sun extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'sky') {
    super(scene, x, y, 'sprites', 'sun1.png')
    
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    this.type = type // 'sky' 或 'flower'
    this.value = 25
    this.isCollected = false
    
    // 设置碰撞体
    this.body.setSize(30, 30)
    
    // 阳光渲染在最顶层，确保高于卡片栏（depth=100）和草地
    this.setDepth(2000)
    
    // 设置为可交互，拦截点击事件防止穿透到场景 pointerdown
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', (pointer, localX, localY, event) => {
      // 阻止事件继续传播到场景的全局 pointerdown，避免误触发种植逻辑
      event.stopPropagation()
      this.collect()
    })

    if (type === 'sky') {
      this.fallFromSky()
    } else {
      // 从花中产生的阳光，先缩放出现
      this.setScale(0)
      scene.tweens.add({
        targets: this,
        scale: 1.5,
        duration: 500,
        ease: 'Back.out'
      })
      
      // 5秒后自动消失
      scene.time.delayedCall(5000, () => {
        if (!this.isCollected) {
          this.fadeOut()
        }
      })
    }
  }
  
  fallFromSky() {
    const targetY = Phaser.Math.Between(80, 250)
    
    // 从天而降
    this.y = -50
    this.scene.tweens.add({
      targets: this,
      y: targetY,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.isCollected) {
          this.startIdleAnimation()
        }
      }
    })
    
    // 10秒后自动消失（从落地时开始算）
    this.scene.time.delayedCall(13000, () => {
      if (!this.isCollected) {
        this.fadeOut()
      }
    })
  }
  
  startIdleAnimation() {
    // 轻微上下浮动
    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // 交替使用 sun1 和 sun2 帧
    this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (this.active) {
          const frame = this.frame.name === 'sun1.png' ? 'sun2.png' : 'sun1.png'
          this.setFrame(frame)
        }
      },
      loop: true
    })
  }
  
  collect() {
    if (this.isCollected) return
    this.isCollected = true
    
    // 先停止所有正在进行的补间动画，再开始收集飞行动画
    this.scene.tweens.killTweensOf(this)
    
    // 播放收集音效（如果有的话）
    if (this.scene.sounds && this.scene.sounds.sunCollect) {
      this.scene.sounds.sunCollect.play()
    }
    
    // 飞向阳光计数器（左上角）
    this.scene.tweens.add({
      targets: this,
      x: 40,
      y: 25,
      scale: 0.3,
      alpha: 0.5,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        // 增加阳光
        this.scene.addSun(this.value)
        this.destroy()
      }
    })
  }
  
  fadeOut() {
    this.scene.tweens.killTweensOf(this)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 500,
      onComplete: () => {
        this.destroy()
      }
    })
  }
}
