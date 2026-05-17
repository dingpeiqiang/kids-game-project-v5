import Item from './Item.js'

/**
 * 樱桃炸弹道具 - 立即在随机3个位置放置樱桃炸弹
 */
export default class CherryBombItem extends Item {
  constructor(scene, x, y) {
    super(scene, x, y, 'sun', 'cherry_bomb')
    
    // 标记为延迟销毁，由 activate() 控制何时销毁
    this.shouldDelayDestroy = true
    
    // 红色光晕
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0xFF0000, 0.5)
    this.glowEffect.fillCircle(this.x, this.y, 25)
    
    // 添加标签
    this.label = scene.add.text(x, y - 35, '🍒', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(1501)
  }
  
  activate() {
    console.log('[CherryBombItem] 激活樱桃炸弹雨！')
    
    const bombCount = 3
    let placedCount = 0
    let completedCount = 0
    
    // 保存 this 引用
    const self = this
    
    // 在随机位置放置樱桃炸弹
    for (let i = 0; i < bombCount; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        self.placeRandomCherryBomb()
        placedCount++
        completedCount++
        
        // 所有炸弹放置完成后才销毁道具
        if (completedCount === bombCount) {
          // 延迟一点再显示通知，确保炸弹已经放置
          self.scene.time.delayedCall(200, () => {
            self.showNotification(`🍒 樱桃炸弹雨！放置了${bombCount}个炸弹`)
            // 现在可以安全销毁了
            self.safeDestroy()
          })
        }
      })
    }
    
    // 清理标签
    if (this.label) {
      this.label.destroy()
      this.label = null
    }
  }
  
  // 安全销毁方法
  safeDestroy() {
    if (this.active) {
      super.destroy()
    }
  }
  
  placeRandomCherryBomb() {
    // 检查场景是否仍然存在
    if (!this.scene || !this.scene.game) {
      console.warn('[CherryBombItem] 场景已销毁，跳过放置樱桃炸弹')
      return
    }
    
    const GL = this.scene.game.GRID_LEFT
    const COLS = this.scene.game.COLS
    const ROWS = this.scene.game.ROWS
    const CELL = this.scene.game.CELL
    const GY = this.scene.game.GAME_Y
    
    // 随机选择一个格子
    const col = Phaser.Math.Between(0, COLS - 1)
    const row = Phaser.Math.Between(0, ROWS - 1)
    
    const x = GL + col * CELL + CELL / 2
    const y = GY + row * CELL + CELL / 2
    
    // 检查该位置是否已有植物
    let hasPlant = false
    this.scene.plants.children.each(plant => {
      if (plant.active && plant.gameData && 
          plant.gameData.row === row && 
          plant.gameData.col === col) {
        hasPlant = true
      }
    })
    
    // 如果位置为空，放置樱桃炸弹
    if (!hasPlant) {
      // 动态导入 CherryBomb
      import('../models/cherrybomb.js').then(module => {
        const CherryBomb = module.default
        new CherryBomb(this.scene, { x, y, row, col })
      })
    }
  }
  
  showNotification(text) {
    // 检查场景是否仍然存在
    if (!this.scene || !this.scene.game) {
      console.warn('[CherryBombItem] 场景已销毁，跳过显示通知')
      return
    }
    
    const W = this.scene.game.BASE_W
    const H = this.scene.game.BASE_H
    
    const notifyText = this.scene.add.text(W / 2, H / 2 - 50, text, {
      fontSize: '32px',
      fill: '#FF4444',
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
