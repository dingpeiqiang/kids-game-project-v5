export default class Sun extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'sky') {
    super(scene, x, y, 'sun')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.type = type
    this.value = 25  // 默认值，可以被外部修改
    this.sunValue = 25  // 兼容旧代码
    this.isCollected = false
    this.setScale(1.0)
    this.setDepth(2000)

    this.body.setSize(30, 30)
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.collect()
    })

    if (type === 'sky') {
      this.fallFromSky()
    } else {
      // 花生阳光（向日葵产出）
      this.value = this.sunValue || 75  // 无尽模式：默认 75
      this.setScale(0)
      scene.tweens.add({ targets: this, scale: 1.0, duration: 400, ease: 'Back.out' })
      scene.time.delayedCall(8000, () => { if (!this.isCollected) this.fadeOut() })  // 延长存在时间
    }
  }

  fallFromSky() {
    const targetY = Phaser.Math.Between(100, 400)
    this.y = -50
    // 无尽模式：天空阳光也增加价值
    if (this.type === 'sky') {
      this.value = 50  // 天空阳光从 25 提升到 50
    }
    this.scene.tweens.add({
      targets: this, y: targetY, duration: 3000, ease: 'Sine.easeInOut',
      onComplete: () => { if (!this.isCollected) this.startFloat() }
    })
    this.scene.time.delayedCall(13000, () => { if (this.scene && !this.isCollected) this.fadeOut() })
  }

  startFloat() {
    this.scene.tweens.add({
      targets: this, y: this.y - 5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
  }

  collect() {
    if (this.isCollected) return
    this.isCollected = true
    this.scene.tweens.killTweensOf(this)

    this.scene.tweens.add({
      targets: this, x: 55, y: 25, scale: 0.4, alpha: 0.5, duration: 500, ease: 'Power2',
      onComplete: () => {
        let sunValue = this.value || this.sunValue || 25
        
        // 双倍阳光模式
        if (this.scene.doubleSunMode) {
          sunValue *= 2
        }
        
        this.scene.addSun(sunValue)
        this.destroy()
      }
    })
  }

  fadeOut() {
    this.scene.tweens.killTweensOf(this)
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 0.5, duration: 500,
      onComplete: () => this.destroy()
    })
  }
}
