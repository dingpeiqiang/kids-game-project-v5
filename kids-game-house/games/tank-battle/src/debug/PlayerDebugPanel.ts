/**
 * 玩家属性调试面板
 * 实时显示玩家的游戏状态和属性信息
 *
 * ⭐ 重构说明：所有数据从 PlayerController.data 只读快照获取
 *    不再直接读取 combatManager / stateManager / gameStore 的内部字段
 */

export class PlayerDebugPanel {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private texts: Map<string, Phaser.GameObjects.Text>
  private isVisible: boolean = false
  private updateInterval: number = 100
  private lastUpdateTime: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.texts = new Map()

    this.container = this.scene.add.container(10, 10)
    this.container.setDepth(9999)
    this.container.setVisible(false)
  }

  show(): void {
    this.container.setVisible(true)
    this.isVisible = true
  }

  hide(): void {
    this.container.setVisible(false)
    this.isVisible = false
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * ⭐ 更新玩家属性信息（从 PlayerController.data 只读快照获取）
   */
  update(time: number): void {
    if (!this.isVisible) return

    if (time - this.lastUpdateTime < this.updateInterval) return
    this.lastUpdateTime = time

    // ⭐ 从 PlayerController 获取只读快照
    const controller = (this.scene as any).playerController
    if (!controller) return

    const pd = controller.data
    const player = (this.scene as any).player

    if (!player || !player.active) {
      this.setText('status', '❌ 玩家不存在')
      this.setText('visible', `👁️ 可见：❌`)
      this.setText('active', `✅ 激活：❌`)
      return
    }

    // 📊 基础属性（全部来自 PlayerController.data）
    this.setText('position', `📍 位置：(${player.x.toFixed(0)}, ${player.y.toFixed(0)})`)
    this.setText('velocity', `➡️ 速度：(${player.body?.velocity.x.toFixed(0) || 0}, ${player.body?.velocity.y.toFixed(0) || 0})`)

    // 🎯 生命与护甲
    this.setText('lives', `💚 生命：${pd.lives}`)
    this.setText('armor', `🛡️ 护甲：${pd.armor}/${pd.maxArmor}`)
    this.setText('score', `🏆 分数：${pd.score}`)

    // ⚔️ 战斗状态
    this.setText('shield', `✨ 护盾：${pd.isShieldActive ? '✅' : '❌'}`)
    this.setText('invincible', `🛡️ 无敌：${pd.isInvincible ? '✅' : '❌'}`)
    this.setText('state', `📊 状态：${pd.state}`)
    this.setText('frozen', `❄️ 冻结：${pd.isFrozen ? '✅' : '❌'}`)
    this.setText('homing', `🚀 追踪：${pd.isHoming ? '✅' : '❌'}`)

    // 🔫 战斗能力
    this.setText('bulletDmg', `💥 子弹伤害：${pd.bulletDamage}`)
    this.setText('fireRate', `⚡ 射速：${pd.shootCooldown}ms`)
    this.setText('canShoot', `🔫 可射击：${pd.canShoot ? '✅' : '❌'}`)

    // 🎮 移动状态
    const movementManager = (this.scene as any).movementManager
    const direction = movementManager?.getCurrentDirection() || 'NONE'
    this.setText('direction', `🧭 方向：${direction}`)
    this.setText('moving', `🏃 移动中：${direction !== 'NONE' ? '✅' : '❌'}`)
    this.setText('speed', `⚡ 速度倍率：${pd.speedMultiplier}x`)

    // 🎨 渲染状态
    const isVisible = player.visible && player.alpha > 0.1
    this.setText('visible', `👁️ 可见：${isVisible ? '✅' : '❌'} ${!player.visible ? '(visible=false)' : player.alpha < 1 ? `(alpha=${player.alpha.toFixed(2)})` : ''}`)
    this.setText('alpha', `🌟 透明度：${player.alpha.toFixed(2)}`)
    this.setText('active', `✅ 激活：${player.active ? '✅' : '❌'}`)
    this.setText('texture', `🖼️ 纹理：${player.texture?.key || 'none'}`)
  }

  private setText(key: string, content: string): void {
    let textObj = this.texts.get(key)

    if (!textObj) {
      const lineHeight = 24
      const index = Array.from(this.texts.keys()).indexOf(key)
      const y = index >= 0 ? index * lineHeight : this.texts.size * lineHeight

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

  clear(): void {
    this.texts.forEach(text => text.destroy())
    this.texts.clear()
  }

  destroy(): void {
    this.clear()
    this.container.destroy()
  }
}
