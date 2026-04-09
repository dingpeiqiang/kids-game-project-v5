export default class SeedCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, plantType, cost, iconFrame) {
    super(scene, x, y)
    
    this.plantType = plantType
    this.cost = cost
    this.onCooldown = false
    this.cooldownTime = 5000 // 5秒冷却
    this.isSelected = false
    
    // 卡片尺寸：高度从 75 缩小到 58，确保不超出顶部 65px 区域
    const cardW = 55
    const cardH = 58

    // 卡片背景
    this.bg = scene.add.rectangle(0, 0, cardW, cardH, 0x8B4513)
      .setStrokeStyle(2, 0x654321)
    this.add(this.bg)
    
    // 植物图标（上移，适配更小的卡片高度）
    this.icon = scene.add.image(0, -10, 'sprites', iconFrame)
      .setScale(1.3)
    this.add(this.icon)
    
    // 成本显示（下移到卡片底部）
    this.costBg = scene.add.rectangle(0, 20, 40, 16, 0x000000, 0.7)
    this.add(this.costBg)
    
    this.costText = scene.add.text(8, 20, cost.toString(), {
      fontSize: '13px',
      fill: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add(this.costText)
    
    // 阳光图标（成本左侧）
    this.sunIcon = scene.add.image(-13, 20, 'sprites', 'sun1.png')
      .setScale(0.55)
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
    
    // 设置为可交互 - 以 cardW×cardH 为点击区域，居中对齐 Container 原点
    this.setInteractive(
      new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
      Phaser.Geom.Rectangle.Contains,
      true   // dropZone = false, useHandCursor 通过下面的 options 传
    )
    this.input.cursor = 'pointer'
    this.on('pointerdown', (pointer, localX, localY, event) => {
      // 阻止事件传播，防止触发场景的 pointerdown（误种植）
      event.stopPropagation()
      this.select()
    })
    this.on('pointerover', () => {
      if (!this.onCooldown && scene.sunCount >= this.cost) {
        this.bg.setFillStyle(0xA0522D)
      }
    })
    this.on('pointerout', () => {
      this.bg.setFillStyle(0x8B4513)
    })
    
    scene.add.existing(this)
    
    // 卡片栏深度高于草地，但阳光（depth=2000）依然在其上层
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
        this.cooldownMask.height = 58
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
