/**
 * 玩家属性调试面板
 * 实时显示玩家的游戏状态和属性信息
 */

export class PlayerDebugPanel {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private texts: Map<string, Phaser.GameObjects.Text>
  private isVisible: boolean = false
  private updateInterval: number = 100 // 更新间隔（毫秒）
  private lastUpdateTime: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.texts = new Map()
    
    // 创建调试面板容器（右上角）
    this.container = this.scene.add.container(10, 10)
    this.container.setDepth(9999) // 确保在最上层
    this.container.setVisible(false)
  }

  /**
   * 显示调试面板
   */
  show(): void {
    this.container.setVisible(true)
    this.isVisible = true
    console.log('✅ [调试面板] 已开启')
  }

  /**
   * 隐藏调试面板
   */
  hide(): void {
    this.container.setVisible(false)
    this.isVisible = false
    console.log('❌ [调试面板] 已关闭')
  }

  /**
   * 切换调试面板显示状态
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 更新玩家属性信息
   */
  update(time: number): void {
    if (!this.isVisible) return
    
    // 限制更新频率
    if (time - this.lastUpdateTime < this.updateInterval) return
    this.lastUpdateTime = time

    const player = (this.scene as any).player
    if (!player || !player.active) {
      this.setText('status', '❌ 玩家不存在')
      // 🔧 关键修复：即使玩家不存在，也要更新可见性显示
      this.setText('visible', `👁️ 可见：❌`)
      this.setText('active', `✅ 激活：❌`)
      return
    }

    const combatManager = (this.scene as any).combatManager
    const stateManager = (this.scene as any).stateManager
    const movementManager = (this.scene as any).movementManager
    const gameStore = (this.scene as any).gameStore

    // 📊 基础属性
    this.setText('position', `📍 位置：(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`)
    this.setText('velocity', `➡️ 速度：(${player.body?.velocity.x.toFixed(0) || 0}, ${player.body?.velocity.y.toFixed(0) || 0})`)
    this.setText('health', `❤️ 生命：${player.health || 1}`)
    this.setText('armor', `🛡️ 护甲：${combatManager?.currentArmor || 0}`)
    
    // 🎯 战斗状态
    this.setText('shield', `✨ 护盾：${combatManager?.hasShield() ? '✅' : '❌'}`)
    this.setText('invincible', `🛡️ 无敌：${stateManager?.isInvincible() ? '✅' : '❌'}`)
    this.setText('state', `📊 状态：${stateManager?.getState() || 'UNKNOWN'}`)
    this.setText('lives', `💚 生命数：${gameStore?.lives || 0}`)
    
    // 🎮 移动状态
    this.setText('direction', `🧭 方向：${movementManager?.getCurrentDirection() || 'NONE'}`)
    const isMoving = movementManager?.getCurrentDirection() !== 'NONE'
    this.setText('moving', `🏃 移动中：${isMoving ? '✅' : '❌'}`)
    
    // 🔫 战斗能力
    const config = (combatManager as any).config
    this.setText('bulletDmg', `💥 子弹伤害：${config?.bulletDamage || 10}`)
    this.setText('fireRate', `⚡ 射速：${config?.shootCooldown || 300}ms`)
    const canShoot = (combatManager as any).lastShootTime && 
                     (Date.now() - (combatManager as any).lastShootTime) > (config?.shootCooldown || 300)
    this.setText('canShoot', `🔫 可射击：${canShoot ? '✅' : '❌'}`)
    
    // 🎨 渲染状态（添加详细调试）
    const isVisible = player.visible && player.alpha > 0.1  // 🔧 提高阈值到 0.1，避免误判
    this.setText('visible', `👁️ 可见：${isVisible ? '✅' : '❌'} ${!player.visible ? '(visible=false)' : player.alpha < 1 ? `(alpha=${player.alpha.toFixed(2)})` : ''}`)
    this.setText('alpha', `🌟 透明度：${player.alpha.toFixed(2)}`)
    this.setText('active', `✅ 激活：${player.active ? '✅' : '❌'}`)
    this.setText('texture', `🖼️ 纹理：${player.texture?.key || 'none'}`)
    
    // ⚙️ 道具效果
    this.setText('frozen', `❄️ 冻结：${(combatManager as any).isFrozen ? '✅' : '❌'}`)
    this.setText('speedUp', `⚡ 加速：${player.speed > 200 ? '✅' : '❌'}`)
  }

  /**
   * 设置文本内容（自动创建或更新）
   */
  private setText(key: string, content: string): void {
    let textObj = this.texts.get(key)
    
    if (!textObj) {
      // 计算 Y 位置（根据 key 在 map 中的顺序）
      const lineHeight = 24
      const index = Array.from(this.texts.keys()).indexOf(key)
      const y = index >= 0 ? index * lineHeight : this.texts.size * lineHeight
      
      // 创建新的文本对象
      textObj = this.scene.add.text(0, y, content, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      })
      
      this.container.add(textObj)
      this.texts.set(key, textObj)
    } else {
      textObj.setText(content)
    }
  }

  /**
   * 清除所有文本
   */
  clear(): void {
    this.texts.forEach(text => text.destroy())
    this.texts.clear()
  }

  /**
   * 销毁调试面板
   */
  destroy(): void {
    this.clear()
    this.container.destroy()
  }
}
