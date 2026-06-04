import Item from './Item.js'

/**
 * 全屏冻结道具 - 冻结所有僵尸10秒
 */
export default class FreezeItem extends Item {
  constructor(scene, x, y) {
    super(scene, x, y, 'sun', 'freeze') // 临时使用sun纹理，后续替换为ice图标
    
    // 蓝色光晕
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0x00FFFF, 0.4)
    this.glowEffect.fillCircle(this.x, this.y, 25)
    
    // 添加标签
    this.label = scene.add.text(x, y - 35, '❄️', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(1501)
  }
  
  activate() {
    console.log('[FreezeItem] 激活全屏冻结！')
    
    const freezeDuration = 10000 // 10秒
    
    // 冻结所有僵尸
    let frozenCount = 0
    this.scene.zombies.children.each(zombie => {
      if (zombie.active && !zombie.isFrozen) {
        zombie.isFrozen = true
        
        // 保存原始速度
        if (!zombie.originalSpeed) {
          zombie.originalSpeed = zombie.body.velocity.x
        }
        
        // 停止移动
        zombie.setVelocityX(0)
        
        // 冰冻视觉效果
        zombie.setTint(0x88CCFF)
        zombie.alpha = 0.7
        
        frozenCount++
        
        // 10秒后解冻
        this.scene.time.delayedCall(freezeDuration, () => {
          if (zombie.active && zombie.isFrozen) {
            zombie.isFrozen = false
            zombie.clearTint()
            zombie.alpha = 1
            
            // 恢复速度
            if (zombie.originalSpeed) {
              zombie.setVelocityX(zombie.originalSpeed)
            }
          }
        })
      }
    })
    
    // 显示提示
    this.showNotification(`❄️ 全屏冻结！${frozenCount}个僵尸被冻结10秒`)
    
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
      fill: '#00FFFF',
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
