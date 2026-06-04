import LevelManager from './levelManager'

/**
 * 关卡选择界面 - 支持5关布局
 */
export default class LevelSelectUI {
  private scene: Phaser.Scene
  private levelManager: LevelManager
  private container: Phaser.GameObjects.Container | null = null
  private isVisible: boolean = false
  private onLevelSelected: ((levelId: number) => void) | null = null

  constructor(scene: Phaser.Scene, levelManager: LevelManager) {
    this.scene = scene
    this.levelManager = levelManager
  }

  show(onLevelSelected: (levelId: number) => void) {
    this.onLevelSelected = onLevelSelected

    if (this.container) {
      this.container.destroy()
      this.container = null
    }

    this.createUI()
    this.isVisible = true
  }

  hide() {
    if (this.container && this.isVisible) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.container?.setVisible(false)
        }
      })
      this.isVisible = false
    }
  }

  private createUI() {
    const width = this.scene.cameras.main.width
    const height = this.scene.cameras.main.height

    this.container = this.scene.add.container(0, 0)
    this.container.setScrollFactor(0)
    this.container.setDepth(300)
    this.container.setAlpha(0)

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300
    })

    // 半透明背景
    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
    this.container.add(bg)

    // 标题
    const title = this.scene.add.text(width / 2, 50, '🏁 选择关卡', {
      fontSize: '44px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    title.setOrigin(0.5, 0.5)
    this.container.add(title)

    // 获取所有关卡
    const levels = this.levelManager.getLevels()
    const cols = Math.min(levels.length, 3) // 最多3列
    const rows = Math.ceil(levels.length / cols)
    const cardWidth = 240
    const cardHeight = 280
    const spacingX = 30
    const spacingY = 25
    const totalWidth = cols * cardWidth + (cols - 1) * spacingX
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const startY = 140

    levels.forEach((level, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (cardWidth + spacingX)
      const y = startY + row * (cardHeight + spacingY)
      this.createLevelCard(level, x, y, cardWidth, cardHeight)
    })

    // 关闭按钮
    const closeBtn = this.scene.add.text(width - 40, 30, '✕', {
      fontSize: '40px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })
    closeBtn.setOrigin(0.5, 0.5)
    closeBtn.setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.hide())
    this.container.add(closeBtn)

    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'))
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'))
  }

  private createLevelCard(level: any, x: number, y: number, w: number, h: number) {
    const isUnlocked = this.levelManager.isLevelUnlocked(level.id)
    const stars = this.levelManager.getLevelStars(level.id)

    // 卡片背景
    const cardBg = this.scene.add.rectangle(x, y, w, h, isUnlocked ? 0x2a2a2a : 0x1a1a1a, 1)
    cardBg.setStrokeStyle(3, isUnlocked ? 0x4CAF50 : 0x444444)
    this.container!.add(cardBg)

    // 关卡编号
    const levelNum = this.scene.add.text(x, y - h / 2 + 25, `关卡 ${level.id}`, {
      fontSize: '22px',
      color: isUnlocked ? '#ffffff' : '#555555',
      fontStyle: 'bold'
    })
    levelNum.setOrigin(0.5, 0.5)
    this.container!.add(levelNum)

    // 关卡名称
    const levelName = this.scene.add.text(x, y - h / 2 + 60, level.name, {
      fontSize: '20px',
      color: isUnlocked ? '#ffdd00' : '#555555',
      fontStyle: 'bold',
      wordWrap: { width: w - 30 }
    })
    levelName.setOrigin(0.5, 0.5)
    this.container!.add(levelName)

    // 难度标识
    const difficultyConfig: Record<string, { text: string; color: string }> = {
      easy: { text: '⭐ 简单', color: '#4CAF50' },
      medium: { text: '⭐⭐ 中等', color: '#FF9800' },
      hard: { text: '⭐⭐⭐ 困难', color: '#F44336' }
    }
    const diff = difficultyConfig[level.difficulty] || difficultyConfig.medium
    const difficulty = this.scene.add.text(x, y - h / 2 + 95, diff.text, {
      fontSize: '16px',
      color: isUnlocked ? diff.color : '#555555'
    })
    difficulty.setOrigin(0.5, 0.5)
    this.container!.add(difficulty)

    // 星级显示
    let starsText = ''
    for (let i = 0; i < 3; i++) {
      starsText += i < stars ? '⭐' : '☆'
    }
    const starsDisplay = this.scene.add.text(x, y - h / 2 + 130, starsText, {
      fontSize: '22px'
    })
    starsDisplay.setOrigin(0.5, 0.5)
    this.container!.add(starsDisplay)

    // 目标距离
    const targetText = this.scene.add.text(x, y - h / 2 + 165, `目标: ${level.targetDistance}m`, {
      fontSize: '15px',
      color: isUnlocked ? '#cccccc' : '#555555'
    })
    targetText.setOrigin(0.5, 0.5)
    this.container!.add(targetText)

    // 描述
    const desc = this.scene.add.text(x, y - h / 2 + 200, level.description, {
      fontSize: '13px',
      color: isUnlocked ? '#aaaaaa' : '#555555',
      align: 'center',
      wordWrap: { width: w - 30 }
    })
    desc.setOrigin(0.5, 0.5)
    this.container!.add(desc)

    // 地形风格标签
    if (isUnlocked) {
      const styleLabel = this.scene.add.text(x, y + h / 2 - 35, `🗺️ ${level.terrainStyle} | ${level.decorStyle}`, {
        fontSize: '11px',
        color: '#888888'
      })
      styleLabel.setOrigin(0.5, 0.5)
      this.container!.add(styleLabel)
    }

    // 点击交互
    if (isUnlocked) {
      cardBg.setInteractive({ useHandCursor: true })

      cardBg.on('pointerover', () => {
        cardBg.setFillStyle(0x3a3a3a)
        cardBg.setStrokeStyle(3, 0x66BB6A)
      })
      cardBg.on('pointerout', () => {
        cardBg.setFillStyle(0x2a2a2a)
        cardBg.setStrokeStyle(3, 0x4CAF50)
      })

      cardBg.on('pointerdown', () => {
        if (this.onLevelSelected) {
          this.onLevelSelected(level.id)
          this.hide()
        }
      })
    } else {
      const lockIcon = this.scene.add.text(x, y + 10, '🔒', {
        fontSize: '42px'
      })
      lockIcon.setOrigin(0.5, 0.5)
      lockIcon.setAlpha(0.4)
      this.container!.add(lockIcon)
    }
  }

  destroy() {
    this.container?.destroy()
    this.container = null
  }
}
