import Phaser from 'phaser'

/**
 * 道具基类 - 所有道具的父类
 */
export default class Item extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, itemType) {
    super(scene, x, y, texture)
    
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    this.itemType = itemType
    this.isCollected = false
    
    // 基础设置
    this.setScale(0.8)
    this.setDepth(1500)
    this.setInteractive({ useHandCursor: true })
    
    // 添加光晕效果
    this.glowEffect = scene.add.graphics()
    this.updateGlow()
    
    // 浮动动画
    this.startFloating()
    
    // 点击收集
    this.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.collect()
    })
    
    // 8秒后自动消失
    scene.time.delayedCall(8000, () => {
      if (!this.isCollected && this.active) {
        this.fadeOut()
      }
    })
  }
  
  updateGlow() {
    if (!this.glowEffect || !this.active) return
    
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0xFFFFFF, 0.3)
    this.glowEffect.fillCircle(this.x, this.y, 25)
  }
  
  startFloating() {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }
  
  collect() {
    if (this.isCollected) return
    this.isCollected = true
    
    // 更新场景的道具收集计数
    if (this.scene && this.scene.itemsCollected !== undefined) {
      this.scene.itemsCollected++
      if (this.scene.updateItemDisplay) {
        this.scene.updateItemDisplay()
      }
    }
    
    // 停止动画
    this.scene.tweens.killTweensOf(this)
    
    // 收集动画
    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.activate()
        // CherryBombItem 会自己控制销毁时机，其他道具立即销毁
        if (!this.shouldDelayDestroy) {
          this.destroy()
        }
        if (this.glowEffect) {
          this.glowEffect.destroy()
        }
      }
    })
    
    // 播放收集音效
    if (this.scene.sounds && this.scene.sounds.itemCollect) {
      this.scene.sounds.itemCollect.play()
    }
  }
  
  activate() {
    // 子类实现具体效果
    console.log(`[Item] ${this.itemType} activated`)
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
        if (this.glowEffect) {
          this.glowEffect.destroy()
        }
      }
    })
  }
  
  destroy(fromScene) {
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = null
    }
    super.destroy(fromScene)
  }
}
