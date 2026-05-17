import Item from './Item.js'

/**
 * 双倍阳光道具 - 接下来30秒内所有阳光产出翻倍
 */
export default class DoubleSunItem extends Item {
  constructor(scene, x, y) {
    super(scene, x, y, 'sun', 'double_sun')
    
    // 金色光晕
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0xFFD700, 0.5)
    this.glowEffect.fillCircle(this.x, this.y, 25)
    
    // 添加标签
    this.label = scene.add.text(x, y - 35, '💰', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(1501)
  }
  
  activate() {
    console.log('[DoubleSunItem] 激活双倍阳光！')
    
    const duration = 30000 // 30秒
    
    // 启用双倍阳光模式
    this.scene.doubleSunMode = true
    
    // 显示提示
    this.showNotification('💰 双倍阳光！持续30秒')
    
    // 30秒后关闭
    this.scene.time.delayedCall(duration, () => {
      if (this.scene) {
        this.scene.doubleSunMode = false
        this.showNotification('双倍阳光效果结束')
      }
    })
    
    // 清理标签
    if (this.label) {
      this.label.destroy()
    }
  }
  
  showNotification(text) {
    const W = this.scene.game.BASE_W
    const H = this.scene.game.BASE_H
    
    const notifyText = this.scene.add.text(W / 2, H / 2 - 50, text, {
      fontSize: '32px',
      fill: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2001)
    
    this.scene.tweens.add({
      targets: notifyText,
      alpha: 0,
      y: H / 2 - 120,
      duration: 2500,
      onComplete: () => notifyText.destroy()
    })
  }
  
  destroy(fromScene) {
    if (this.label) {
      this.label.destroy()
      this.label = null
    }
    super.destroy(fromScene)
  }
}
