export default class SeedCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, plantType, cost, iconFrame) {
    super(scene, x, y)
    
    this.plantType = plantType
    this.cost = cost
    this.onCooldown = false
    
    // 设置不同植物的冷却时间
    const cooldowns = {
      'sunflower': 7500,
      'peashooter': 7500,
      'iceshooter': 7500,
      'repeater': 7500,
      'cherrybomb': 30000,  // 樱桃炸弹30秒冷却
      'potatomine': 30000,  // 土豆雷30秒冷却
      'wallnut': 30000      // 坚果墙30秒冷却
    }
    this.cooldownTime = cooldowns[plantType] || 5000
    
    this.isSelected = false
    
    // 不同植物的颜色配置
    const plantColors = {
      'sunflower': { bg: 0xFFD700, hover: 0xFFA500 },
      'peashooter': { bg: 0x228B22, hover: 0x32CD32 },
      'iceshooter': { bg: 0x00CED1, hover: 0x00FFFF },
      'repeater': { bg: 0x9ACD32, hover: 0xADFF2F },
      'cherrybomb': { bg: 0xDC143C, hover: 0xFF4500 },
      'potatomine': { bg: 0x8B4513, hover: 0xA0522D },
      'wallnut': { bg: 0xD2691E, hover: 0xCD853F }
    }
    
    const colors = plantColors[plantType] || { bg: 0x8B4513, hover: 0xA0522D }
    
    // 卡片尺寸：更紧凑
    const cardW = 50
    const cardH = 58

    // 卡片背景
    this.bg = scene.add.rectangle(0, 0, cardW, cardH, colors.bg)
      .setStrokeStyle(2, 0x654321)
    this.add(this.bg)
    
    // 植物图标（上移，适配更小的卡片高度）
    this.icon = scene.add.image(0, -10, 'sprites', iconFrame)
      .setScale(1.2)
    
    // 根据植物类型设置图标颜色
    if (plantType === 'iceshooter') {
      this.icon.setTint(0x00FFFF) // 青色
    } else if (plantType === 'cherrybomb') {
      this.icon.setTint(0xFF0000) // 红色
    } else if (plantType === 'potatomine') {
      this.icon.setTint(0xD2B48C) // 棕色
    }
    
    this.add(this.icon)
    
    // 成本显示（下移到卡片底部）
    this.costBg = scene.add.rectangle(0, 20, 38, 14, 0x000000, 0.7)
    this.add(this.costBg)
    
    this.costText = scene.add.text(8, 20, cost.toString(), {
      fontSize: '12px',
      fill: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add(this.costText)
    
    // 阳光图标（成本左侧）
    this.sunIcon = scene.add.image(-12, 20, 'sprites', 'sun1.png')
      .setScale(0.5)
    this.add(this.sunIcon)
    
    // 冷却遮罩（高度与卡片一致）
    this.cooldownMask = scene.add.rectangle(0, 0, cardW, cardH, 0x000000, 0.6)
    this.cooldownMask.setVisible(false)
    this.add(this.cooldownMask)
    
    // 选择高亮边框
    this.selectBorder = scene.add.rectangle(0, 0, cardW + 2, cardH + 2, 0xFFFF00)
      .setStrokeStyle(3, 0xFFFF00)
      .setFillStyle()   // 透明填充，只显示边框
    this.selectBorder.setVisible(false)
    this.add(this.selectBorder)
    
    // 保存颜色供后续使用
    this.plantColors = colors
    this.cardW = cardW
    this.cardH = cardH
    
    // 设置为可交互
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
      if (!this.onCooldown && scene.sunCount >= this.cost) {
        this.bg.setFillStyle(colors.hover)
      }
    })
    this.on('pointerout', () => {
      this.bg.setFillStyle(colors.bg)
    })
    
    scene.add.existing(this)
    this.setDepth(100)
  }
  
  select() {
    if (this.onCooldown) {
      console.log('On cooldown!')
      return
    }
    
    if (this.scene.sunCount < this.cost) {
      console.log('Not enough sun!')
      this.showNotEnoughSunHint()
      return
    }
    
    // 取消其他卡片的选中状态
    this.scene.seedCards.forEach(card => {
      if (card !== this) {
        card.deselect()
      }
    })
    
    // 选中当前卡片
    this.isSelected = true
    this.selectBorder.setVisible(true)
    this.scene.selectedPlantType = this.plantType
    
    console.log(`Selected: ${this.plantType}`)
  }
  
  deselect() {
    this.isSelected = false
    this.selectBorder.setVisible(false)
  }
  
  startCooldown() {
    this.onCooldown = true
    this.cooldownMask.setVisible(true)
    this.deselect()
    
    // 冷却进度动画
    this.scene.tweens.add({
      targets: this.cooldownMask,
      height: 0,
      duration: this.cooldownTime,
      ease: 'Linear',
      onComplete: () => {
        this.onCooldown = false
        this.cooldownMask.setVisible(false)
        this.cooldownMask.height = this.cardH || 58
      }
    })
  }
  
  showNotEnoughSunHint() {
    const hint = this.scene.add.text(this.x, this.y - 40, '阳光不足!', {
      fontSize: '12px',
      fill: '#FF0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(300)
    
    this.scene.tweens.add({
      targets: hint,
      y: this.y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => hint.destroy()
    })
  }
  
  updateAvailability(sunCount) {
    if (sunCount < this.cost) {
      this.setAlpha(0.5)
    } else {
      this.setAlpha(1)
    }
  }
}
