export default class ControlsHint {
  private scene: Phaser.Scene
  private hintContainer: Phaser.GameObjects.Container | null = null
  private isVisible: boolean = true

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createHint()
    
    // 5秒后自动隐藏提示
    scene.time.delayedCall(5000, () => {
      this.hide()
    }, [], scene)
  }

  private createHint() {
    this.hintContainer = this.scene.add.container(10, this.scene.cameras.main.height - 120)
    this.hintContainer.setScrollFactor(0)
    this.hintContainer.setDepth(200)

    // 背景框
    const bg = this.scene.add.rectangle(0, 0, 280, 110, 0x000000, 0.7)
    bg.setOrigin(0, 0)
    this.hintContainer.add(bg)

    // 标题
    const title = this.scene.add.text(10, 8, '🎮 控制方式', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.hintContainer.add(title)

    // 键盘提示
    const keyboardText = this.scene.add.text(10, 30, '⌨️  方向键 或 WASD', {
      fontSize: '14px',
      color: '#00ff00'
    })
    this.hintContainer.add(keyboardText)

    // 详细说明
    const detailText = this.scene.add.text(10, 50, '→/D/W 前进   ←/A/S 后退', {
      fontSize: '12px',
      color: '#cccccc'
    })
    this.hintContainer.add(detailText)

    // 快捷键提示
    const shortcutText = this.scene.add.text(10, 70, 'L 关卡选择   R 重试', {
      fontSize: '12px',
      color: '#ffdd00'
    })
    this.hintContainer.add(shortcutText)

    // 触摸提示
    const touchText = this.scene.add.text(10, 90, '👆 也可使用屏幕按钮', {
      fontSize: '12px',
      color: '#aaaaaa'
    })
    this.hintContainer.add(touchText)
  }

  hide() {
    if (this.hintContainer) {
      this.scene.tweens.add({
        targets: this.hintContainer,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.hintContainer?.setVisible(false)
          this.isVisible = false
        }
      })
    }
  }

  show() {
    if (this.hintContainer && !this.isVisible) {
      this.hintContainer.setVisible(true)
      this.scene.tweens.add({
        targets: this.hintContainer,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          this.isVisible = true
        }
      })
    }
  }

  destroy() {
    this.hintContainer?.destroy()
  }
}
