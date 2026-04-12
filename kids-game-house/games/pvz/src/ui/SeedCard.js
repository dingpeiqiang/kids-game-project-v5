export default class SeedCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, plantType, cost, iconTexture, cardW, cardH) {
    super(scene, x, y)

    this.plantType = plantType
    this.cost = cost
    this.onCooldown = false
    this.isSelected = false
    this.cardW = cardW
    this.cardH = cardH

    const cooldowns = {
      sunflower: 7500, peashooter: 7500, iceshooter: 7500,
      repeater: 7500, cherrybomb: 30000, potatomine: 30000, wallnut: 30000
    }
    this.cooldownTime = cooldowns[plantType] || 5000

    const plantColors = {
      sunflower: { bg: 0xFFD700, hover: 0xFFA500 },
      peashooter: { bg: 0x228B22, hover: 0x32CD32 },
      iceshooter: { bg: 0x00CED1, hover: 0x00FFFF },
      repeater: { bg: 0x9ACD32, hover: 0xADFF2F },
      cherrybomb: { bg: 0xDC143C, hover: 0xFF4500 },
      potatomine: { bg: 0x8B4513, hover: 0xA0522D },
      wallnut: { bg: 0xD2691E, hover: 0xCD853F }
    }
    this.plantColors = plantColors[plantType] || { bg: 0x8B4513, hover: 0xA0522D }
    const colors = this.plantColors

    // 卡片背景
    this.bg = scene.add.rectangle(0, 0, cardW, cardH, colors.bg)
      .setStrokeStyle(2, 0x654321)
    this.add(this.bg)

    // 植物图标（使用新素材）
    this.icon = scene.add.image(0, -8, iconTexture)
      .setScale(cardW / 100)  // 80px 素材适配卡片尺寸
    this.add(this.icon)

    // 成本背景
    this.costBg = scene.add.rectangle(0, cardH / 2 - 12, cardW - 8, 16, 0x000000, 0.7)
    this.add(this.costBg)

    // 成本文字
    this.costText = scene.add.text(0, cardH / 2 - 12, cost.toString(), {
      fontSize: '13px', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add(this.costText)

    // 冷却遮罩
    this.cooldownMask = scene.add.rectangle(0, 0, cardW, cardH, 0x000000, 0.6)
    this.cooldownMask.setVisible(false)
    this.add(this.cooldownMask)

    // 选中边框
    this.selectBorder = scene.add.rectangle(0, 0, cardW + 4, cardH + 4)
      .setStrokeStyle(3, 0xFFFF00)
      .setFillStyle()
      .setVisible(false)
    this.add(this.selectBorder)

    // 交互
    this.setInteractive(
      new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
      Phaser.Geom.Rectangle.Contains,
      true
    )
    this.input.cursor = 'pointer'

    this.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.select()
    })
    this.on('pointerover', () => {
      if (!this.onCooldown && scene.sunCount >= this.cost) this.bg.setFillStyle(colors.hover)
    })
    this.on('pointerout', () => this.bg.setFillStyle(colors.bg))

    scene.add.existing(this)
    this.setDepth(100)
  }

  select() {
    if (this.onCooldown) return
    if (this.scene.sunCount < this.cost) {
      const hint = this.scene.add.text(this.x, this.y - this.cardH / 2 - 15, '阳光不足!', {
        fontSize: '12px', fill: '#FF0000', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(300)
      this.scene.tweens.add({
        targets: hint, y: hint.y - 20, alpha: 0, duration: 600,
        onComplete: () => hint.destroy()
      })
      return
    }

    this.scene.seedCards.forEach(card => { if (card !== this) card.deselect() })
    this.isSelected = true
    this.selectBorder.setVisible(true)
    this.scene.selectedPlantType = this.plantType
  }

  deselect() {
    this.isSelected = false
    this.selectBorder.setVisible(false)
  }

  startCooldown() {
    this.onCooldown = true
    this.cooldownMask.setVisible(true)
    this.deselect()

    this.scene.tweens.add({
      targets: this.cooldownMask,
      height: 0,
      duration: this.cooldownTime,
      ease: 'Linear',
      onComplete: () => {
        this.onCooldown = false
        this.cooldownMask.setVisible(false)
        this.cooldownMask.height = this.cardH
      }
    })
  }

  updateAvailability(sunCount) {
    this.setAlpha(sunCount < this.cost ? 0.5 : 1)
  }
}
