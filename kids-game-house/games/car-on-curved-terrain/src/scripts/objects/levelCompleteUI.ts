/**
 * 关卡完成界面
 */
export default class LevelCompleteUI {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container | null = null
  private isVisible: boolean = false
  private countdownText: Phaser.GameObjects.Text | null = null
  private autoNextTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 显示关卡完成界面
   */
  show(distance: number, stars: number, levelName: string, onNextLevel?: () => void, onRetry?: () => void, autoNextDelay: number = 0) {
    if (this.container) {
      this.container.setVisible(true)
      this.container.setAlpha(0)
    } else {
      this.createUI(distance, stars, levelName, onNextLevel, onRetry, autoNextDelay)
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 400,
      ease: 'Back.out'
    })

    this.isVisible = true

    // 星级动画
    this.animateStars(stars)

    // 如果有自动跳转延迟，设置倒计时
    if (autoNextDelay > 0 && onNextLevel) {
      this.showCountdown(autoNextDelay, onNextLevel)
    }
  }

  /**
   * 隐藏界面
   */
  hide() {
    // 清理定时器
    if (this.autoNextTimer) {
      this.autoNextTimer.remove()
      this.autoNextTimer = null
    }

    if (this.container && this.isVisible) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.container?.setVisible(false)
        }
      })
      this.isVisible = false
    }
  }

  /**
   * 创建UI
   */
  private createUI(distance: number, stars: number, levelName: string, onNextLevel?: () => void, onRetry?: () => void, autoNextDelay: number = 0) {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    this.container = this.scene.add.container(0, 0)
    this.container.setScrollFactor(0)
    this.container.setDepth(400)

    // 背景遮罩
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    this.container!.add(bg)

    // 主面板
    const panelWidth = 500
    const panelHeight = 400
    const panel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a1a, 1)
    panel.setStrokeStyle(4, 0x4CAF50)
    this.container!.add(panel)

    // 标题
    const title = this.scene.add.text(width / 2, height / 2 - 150, '🎉 关卡完成！', {
      fontSize: '42px',
      color: '#4CAF50',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5, 0.5)
    this.container!.add(title)

    // 关卡名称
    const levelText = this.scene.add.text(width / 2, height / 2 - 100, levelName, {
      fontSize: '24px',
      color: '#ffffff'
    })
    levelText.setOrigin(0.5, 0.5)
    this.container!.add(levelText)

    // 距离显示
    const distanceText = this.scene.add.text(width / 2, height / 2 - 50, `行驶距离: ${distance}m`, {
      fontSize: '28px',
      color: '#ffdd00',
      fontStyle: 'bold'
    })
    distanceText.setOrigin(0.5, 0.5)
    this.container!.add(distanceText)

    // 星级容器
    const starsContainer = this.scene.add.container(width / 2, height / 2 + 20)
    this.container!.add(starsContainer)

    // 创建3个星星（初始为空）
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add.text(i * 70 - 70, 0, '☆', {
        fontSize: '48px',
        color: '#666666'
      })
      star.setOrigin(0.5, 0.5)
      star.setName(`star${i}`)
      starsContainer.add(star)
    }

    // 按钮容器
    const btnY = height / 2 + 120

    // 重试按钮
    const retryBtn = this.createButton(width / 2 - 120, btnY, '🔄 重试', 0xFF9800, () => {
      this.hide()
      onRetry?.()
    })
    this.container!.add(retryBtn)

    // 下一关按钮
    const nextBtn = this.createButton(width / 2 + 120, btnY, '➡️ 下一关', 0x4CAF50, () => {
      this.hide()
      onNextLevel?.()
    })
    this.container!.add(nextBtn)

    // 如果已是最后一关，隐藏下一关按钮
    if (!onNextLevel) {
      nextBtn.setVisible(false)
    }

    // 如果有自动跳转，显示倒计时文本
    if (autoNextDelay > 0 && onNextLevel) {
      this.countdownText = this.scene.add.text(width / 2, btnY + 50, ``, {
        fontSize: '18px',
        color: '#ffdd00',
        fontStyle: 'bold'
      })
      this.countdownText.setOrigin(0.5, 0.5)
      this.container!.add(this.countdownText)
    }
  }

  /**
   * 创建按钮
   */
  private createButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const btnContainer = this.scene.add.container(x, y)

    // 按钮背景
    const btnBg = this.scene.add.rectangle(0, 0, 180, 50, color, 1)
    btnBg.setInteractive({ useHandCursor: true })
    btnContainer.add(btnBg)

    // 按钮文字
    const btnText = this.scene.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    btnText.setOrigin(0.5, 0.5)
    btnContainer.add(btnText)

    // 悬停效果
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(20).color)
    })
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(color)
    })

    // 点击事件
    btnBg.on('pointerdown', callback)

    return btnContainer
  }

  /**
   * 星级动画
   */
  private animateStars(targetStars: number) {
    if (!this.container) return

    const starsContainer = this.container.getByName('star0')?.parentContainer
    if (!starsContainer) return

    let currentStar = 0

    const showNextStar = () => {
      if (currentStar >= targetStars) return

      const star = starsContainer.getByName(`star${currentStar}`) as Phaser.GameObjects.Text
      if (star) {
        star.setText('⭐')
        star.setColor('#ffdd00')
        
        // 弹跳动画
        this.scene.tweens.add({
          targets: star,
          scale: 1.3,
          duration: 150,
          yoyo: true,
          ease: 'Sine.easeInOut'
        })

        currentStar++
        
        if (currentStar < targetStars) {
          this.scene.time.delayedCall(300, showNextStar, [], this.scene)
        }
      }
    }

    // 延迟后开始显示星星
    this.scene.time.delayedCall(500, showNextStar, [], this.scene)
  }

  /**
   * 显示倒计时并自动跳转
   */
  private showCountdown(seconds: number, onTimeout: () => void) {
    if (!this.countdownText) return

    let remaining = seconds
    
    // 更新倒计时显示
    const updateCountdown = () => {
      if (remaining > 0) {
        this.countdownText!.setText(`${remaining}秒后自动进入下一关...`)
        remaining--
        this.autoNextTimer = this.scene.time.delayedCall(1000, updateCountdown, [], this.scene)
      } else {
        // 时间到，自动跳转
        this.countdownText!.setText('正在跳转...')
        this.scene.time.delayedCall(500, () => {
          this.hide()
          onTimeout()
        }, [], this.scene)
      }
    }

    // 立即显示第一次
    updateCountdown()
  }

  /**
   * 销毁UI
   */
  destroy() {
    // 清理定时器
    if (this.autoNextTimer) {
      this.autoNextTimer.remove()
      this.autoNextTimer = null
    }
    
    this.countdownText?.destroy()
    this.countdownText = null
    
    this.container?.destroy()
    this.container = null
  }
}
