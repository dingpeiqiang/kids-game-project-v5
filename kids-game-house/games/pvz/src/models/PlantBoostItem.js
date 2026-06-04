import Item from './Item.js'

/**
 * 植物强化道具 - 所有现有植物血量翻倍，持续20秒
 */
export default class PlantBoostItem extends Item {
  constructor(scene, x, y) {
    super(scene, x, y, 'sun', 'plant_boost')
    
    // 绿色光晕
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0x00FF00, 0.4)
    this.glowEffect.fillCircle(this.x, this.y, 25)
    
    // 添加标签
    this.label = scene.add.text(x, y - 35, '🌿', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(1501)
  }
  
  activate() {
    console.log('[PlantBoostItem] 激活植物强化！')
    
    const duration = 20000 // 20秒
    let boostedCount = 0
    
    // 强化所有现有植物
    this.scene.plants.children.each(plant => {
      if (plant.active && plant.gameData) {
        // 保存原始血量
        if (!plant.originalHealth) {
          plant.originalHealth = plant.gameData.health
        }
        
        // 血量翻倍
        plant.gameData.health *= 2
        
        // 视觉反馈 - 绿色光晕
        plant.setTint(0x88FF88)
        
        boostedCount++
        
        // 20秒后恢复
        this.scene.time.delayedCall(duration, () => {
          if (plant.active && plant.originalHealth) {
            plant.gameData.health = plant.originalHealth
            plant.clearTint()
          }
        })
      }
    })
    
    // 显示提示
    this.showNotification(`🌿 植物强化！${boostedCount}个植物血量翻倍，持续20秒`)
    
    // 清理标签
    if (this.label) {
      this.label.destroy()
    }
  }
  
  showNotification(text) {
    const W = this.scene.game.BASE_W
    const H = this.scene.game.BASE_H
    
    const notifyText = this.scene.add.text(W / 2, H / 2 - 50, text, {
      fontSize: '28px',
      fill: '#00FF00',
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
