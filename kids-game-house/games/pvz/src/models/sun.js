export default class Sun extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'sky') {
    super(scene, x, y, 'sprites', 'sun1.png')
    
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    this.type = type // 'sky' 或 'flower'
    this.value = 25
    this.isCollected = false
    
    // 阳光收集连击
    if (!scene.sunCollectTime) {
      scene.sunCollectTime = 0
      scene.sunComboCount = 0
    }
    
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
    
    // 显示收集特效
    this.showCollectEffect()
    
    // 阳光收集连击系统
    const currentTime = Date.now()
    const SUN_COMBO_TIMEOUT = 3000 // 3秒内收集算连击
    
    let finalValue = this.value
    
    if (currentTime - this.scene.sunCollectTime < SUN_COMBO_TIMEOUT) {
      this.scene.sunComboCount++
      
      // 连击加成
      if (this.scene.sunComboCount >= 3) {
        finalValue = this.value + this.scene.sunComboCount * 5
        this.showSunComboEffect(this.scene.sunComboCount)
      }
    } else {
      this.scene.sunComboCount = 1
    }
    
    this.scene.sunCollectTime = currentTime
    
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
        this.scene.addSun(finalValue)
        this.destroy()
      }
    })
  }

  showSunComboEffect(combo) {
    // 简化阳光连击特效 - 性能优化
    const comboTexts = ['阳光连击!', '太阳风暴!']
    const textIndex = Math.min(combo - 3, comboTexts.length - 1)
    
    const comboText = this.scene.add.text(this.x, this.y - 25, comboTexts[textIndex], {
      fontSize: `${14 + Math.min(combo, 8)}px`,
      fill: '#FFD700',
      fontStyle: 'bold',
      stroke: '#FF6B00',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2002)
    
    this.scene.tweens.add({
      targets: comboText,
      y: comboText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => comboText.destroy()
    })
  }

  showCollectEffect() {
    // 简化收集特效 - 性能优化
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xFFFF00, 0.8)
      .setDepth(2001)
    
    this.scene.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy()
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
