/**
 * 关卡完成界面（不用 Container，避免 Phaser 3.16 嵌套交互问题）
 */
export default class LevelCompleteUI {
  private scene: Phaser.Scene
  private uiElements: Phaser.GameObjects.GameObject[] = []
  private isVisible: boolean = false
  private countdownText: Phaser.GameObjects.Text | null = null
  private autoNextTimer: Phaser.Time.TimerEvent | null = null
  private jumpExecuted: boolean = false  // 防止自动跳转和按钮点击双重触发

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 显示关卡完成界面（每次都重建）
   */
  show(distance: number, stars: number, levelName: string, onNextLevel?: () => void, onRetry?: () => void, autoNextDelay: number = 0) {
    this.destroy()

    this.jumpExecuted = false
    this.createUI(distance, stars, levelName, onNextLevel, onRetry, autoNextDelay)

    // 淡入
    this.uiElements.forEach(el => { el.setAlpha(0) })
    this.scene.tweens.add({
      targets: this.uiElements,
      alpha: 1,
      duration: 400,
      ease: 'Back.out'
    })

    this.isVisible = true
    this.animateStars(stars)

    // 自动跳转倒计时
    if (autoNextDelay > 0 && onNextLevel) {
      this.showCountdown(autoNextDelay, onNextLevel)
    }
  }

  /**
   * 隐藏界面
   */
  hide() {
    if (this.autoNextTimer) {
      this.autoNextTimer.remove()
      this.autoNextTimer = null
    }

    if (this.uiElements.length > 0 && this.isVisible) {
      this.scene.tweens.add({
        targets: this.uiElements,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.destroy()
        }
      })
      this.isVisible = false
    }
  }

  /**
   * 创建UI（所有元素直接添加到 Scene，不用 Container）
   */
  private createUI(distance: number, stars: number, levelName: string, onNextLevel?: () => void, onRetry?: () => void, autoNextDelay: number = 0) {
    const cam = this.scene.cameras.main
    const width = cam.width
    const height = cam.height
    const scrollX = cam.scrollX
    const scrollY = cam.scrollY
    const depth = 400

    // 屏幕固定坐标（加上相机偏移，然后用 setScrollFactor(0)）
    const cx = scrollX + width / 2
    const cy = scrollY + height / 2

    // 背景遮罩
    const bg = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.8)
    bg.setScrollFactor(0)
    bg.setDepth(depth)
    this.uiElements.push(bg)

    // 主面板
    const panel = this.scene.add.rectangle(cx, cy, 500, 400, 0x1a1a1a, 1)
    panel.setStrokeStyle(4, 0x4CAF50)
    panel.setScrollFactor(0)
    panel.setDepth(depth + 1)
    this.uiElements.push(panel)

    // 标题
    const title = this.scene.add.text(cx, cy - 150, '🎉 关卡完成！', {
      fontSize: '42px',
      color: '#4CAF50',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5, 0.5)
    title.setScrollFactor(0)
    title.setDepth(depth + 2)
    this.uiElements.push(title)

    // 关卡名称
    const levelText = this.scene.add.text(cx, cy - 100, levelName, {
      fontSize: '24px',
      color: '#ffffff'
    })
    levelText.setOrigin(0.5, 0.5)
    levelText.setScrollFactor(0)
    levelText.setDepth(depth + 2)
    this.uiElements.push(levelText)

    // 距离显示
    const distanceText = this.scene.add.text(cx, cy - 50, `行驶距离: ${distance}m`, {
      fontSize: '28px',
      color: '#ffdd00',
      fontStyle: 'bold'
    })
    distanceText.setOrigin(0.5, 0.5)
    distanceText.setScrollFactor(0)
    distanceText.setDepth(depth + 2)
    this.uiElements.push(distanceText)

    // 星星
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add.text(cx + (i - 1) * 70, cy + 20, '☆', {
        fontSize: '48px',
        color: '#666666'
      })
      star.setOrigin(0.5, 0.5)
      star.setScrollFactor(0)
      star.setDepth(depth + 2)
      star.setName(`levelCompleteStar${i}`)
      this.uiElements.push(star)
    }

    // 按钮Y坐标
    const btnY = cy + 120

    // 重试按钮
    this.createButton(cx - 120, btnY, '🔄 重试', 0xFF9800, depth + 3, () => {
      if (this.jumpExecuted) return
      this.jumpExecuted = true
      console.log('🔄 Retry button clicked')
      this.hide()
      // 等淡出动画完成
      this.scene.time.delayedCall(250, () => {
        onRetry?.()
      }, [], this.scene)
    })

    // 下一关按钮
    if (onNextLevel) {
      this.createButton(cx + 120, btnY, '➡️ 下一关', 0x4CAF50, depth + 3, () => {
        if (this.jumpExecuted) return
        this.jumpExecuted = true
        console.log('➡️ Next button clicked')
        this.hide()
        this.scene.time.delayedCall(250, () => {
          onNextLevel()
        }, [], this.scene)
      })
    }

    // 倒计时文本
    if (autoNextDelay > 0 && onNextLevel) {
      this.countdownText = this.scene.add.text(cx, btnY + 50, '', {
        fontSize: '18px',
        color: '#ffdd00',
        fontStyle: 'bold'
      })
      this.countdownText.setOrigin(0.5, 0.5)
      this.countdownText.setScrollFactor(0)
      this.countdownText.setDepth(depth + 3)
      this.uiElements.push(this.countdownText)
    }
  }

  /**
   * 创建按钮（直接添加到 Scene，不用 Container）
   */
  private createButton(x: number, y: number, text: string, color: number, depth: number, callback: () => void) {
    const btnBg = this.scene.add.rectangle(x, y, 180, 50, color, 1)
    btnBg.setOrigin(0.5, 0.5)
    btnBg.setScrollFactor(0)
    btnBg.setDepth(depth)
    btnBg.setInteractive({ useHandCursor: true })

    const btnText = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    btnText.setOrigin(0.5, 0.5)
    btnText.setScrollFactor(0)
    btnText.setDepth(depth + 1)

    // 手动计算高亮色
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    const hoverColor = ((Math.min(255, r + 30)) << 16) | ((Math.min(255, g + 30)) << 8) | Math.min(255, b + 30)

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(hoverColor)
    })
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(color)
    })
    btnBg.on('pointerdown', callback)

    this.uiElements.push(btnBg)
    this.uiElements.push(btnText)
  }

  /**
   * 星级动画
   */
  private animateStars(targetStars: number) {
    let currentStar = 0

    const showNextStar = () => {
      if (currentStar >= targetStars) return

      const star = this.scene.children.getByName(`levelCompleteStar${currentStar}`) as Phaser.GameObjects.Text | null
      if (star) {
        star.setText('⭐')
        star.setColor('#ffdd00')

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

    this.scene.time.delayedCall(500, showNextStar, [], this.scene)
  }

  /**
   * 显示倒计时并自动跳转
   */
  private showCountdown(seconds: number, onTimeout: () => void) {
    if (!this.countdownText) return

    let remaining = seconds

    const updateCountdown = () => {
      if (this.jumpExecuted) return  // 已手动触发，停止倒计时

      if (remaining > 0) {
        this.countdownText!.setText(`${remaining}秒后自动进入下一关...`)
        remaining--
        this.autoNextTimer = this.scene.time.delayedCall(1000, updateCountdown, [], this.scene)
      } else {
        this.countdownText!.setText('正在跳转...')
        this.jumpExecuted = true

        this.scene.time.delayedCall(500, () => {
          console.log('⏱️ Auto-jump triggered')
          this.destroy()
          onTimeout()
        }, [], this.scene)
      }
    }

    updateCountdown()
  }

  /**
   * 销毁UI
   */
  destroy() {
    if (this.autoNextTimer) {
      this.autoNextTimer.remove()
      this.autoNextTimer = null
    }

    this.countdownText = null

    this.uiElements.forEach(el => {
      try { el.destroy() } catch (_) {}
    })
    this.uiElements = []

    this.isVisible = false
  }
}
