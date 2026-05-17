import Item from './Item.js'

/**
 * 毁灭菇道具 - 消灭全屏所有僵尸！
 */
export default class DoomShroomItem extends Item {
  constructor(scene, x, y) {
    super(scene, x, y, 'sun', 'doom_shroom')
    
    // 紫色光晕（代表毁灭性力量）
    this.glowEffect.clear()
    this.glowEffect.fillStyle(0x9932CC, 0.6)
    this.glowEffect.fillCircle(this.x, this.y, 30)
    
    // 添加标签
    this.label = scene.add.text(x, y - 35, '☢️', {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(1501)
  }
  
  activate() {
    console.log('[DoomShroomItem] 激活毁灭菇 - 全屏清除！')
    
    let killedCount = 0
    let totalScore = 0
    
    // 消灭所有僵尸
    this.scene.zombies.children.each(zombie => {
      if (zombie.active && zombie.gameData) {
        const score = zombie.gameData.score || 10
        
        // 创建爆炸特效
        this.createExplosionEffect(zombie.x, zombie.y)
        
        // 立即消灭
        zombie.takeDamage(999)
        
        killedCount++
        totalScore += score
      }
    })
    
    // 屏幕剧烈震动
    this.scene.cameras.main.shake(800, 0.03)
    
    // 闪光效果
    const flash = this.scene.add.rectangle(
      this.scene.game.BASE_W / 2,
      this.scene.game.BASE_H / 2,
      this.scene.game.BASE_W,
      this.scene.game.BASE_H,
      0xFFFFFF,
      0.8
    ).setDepth(3000)
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy()
    })
    
    // 显示提示
    this.showNotification(`☢️ 毁灭菇爆发！消灭${killedCount}个僵尸，获得${totalScore}分`)
    
    // 清理标签
    if (this.label) {
      this.label.destroy()
    }
  }
  
  createExplosionEffect(x, y) {
    // 创建多个爆炸粒子
    for (let i = 0; i < 3; i++) {
      const delay = i * 100
      this.scene.time.delayedCall(delay, () => {
        const explosion = this.scene.add.graphics().setDepth(1999)
        explosion.fillStyle(0xFF0000, 0.9)
        explosion.fillCircle(x, y, 40)
        
        this.scene.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 3,
          duration: 400,
          onComplete: () => explosion.destroy()
        })
      })
    }
  }
  
  showNotification(text) {
    const W = this.scene.game.BASE_W
    const H = this.scene.game.BASE_H
    
    const notifyText = this.scene.add.text(W / 2, H / 2 - 50, text, {
      fontSize: '36px',
      fill: '#9932CC',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(2001)
    
    // 震动文字
    this.scene.tweens.add({
      targets: notifyText,
      x: '+=5',
      duration: 50,
      yoyo: true,
      repeat: 5
    })
    
    this.scene.tweens.add({
      targets: notifyText,
      alpha: 0,
      y: H / 2 - 150,
      duration: 3000,
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
