import Phaser from 'phaser'

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const C = window.GAME_CONFIG
    const W = C.BASE_W
    const H = C.BASE_H

    this.cameras.main.setSize(W, H)

    // 绿色渐变背景
    this.add.rectangle(0, 0, W, H, 0x4a7c2e).setOrigin(0, 0)

    // 装饰草地
    for (let i = 0; i < W; i += 60) {
      const shade = i % 120 === 0 ? 0x5a8c3e : 0x4a7c2e
      this.add.rectangle(i, H - 80, 60, 80, shade).setOrigin(0, 0).setAlpha(0.5)
    }

    // 标题
    this.add.text(W / 2, H / 2 - 80, '🌻 植物大战僵尸 🧟', {
      font: 'bold 48px "Microsoft YaHei", sans-serif',
      fill: '#FFD700',
      stroke: '#5a3a0a',
      strokeThickness: 6
    }).setOrigin(0.5)

    // 副标题
    this.add.text(W / 2, H / 2 - 20, 'Plants vs. Zombies', {
      font: '24px sans-serif',
      fill: '#FFFFFF',
      stroke: '#333',
      strokeThickness: 2
    }).setOrigin(0.5)

    // 开始按钮
    const startBtn = this.add.rectangle(W / 2, H / 2 + 60, 220, 55, 0x4CAF50)
      .setStrokeStyle(3, 0x388E3C)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2, H / 2 + 60, '开始游戏', {
      font: 'bold 24px sans-serif', fill: '#FFFFFF', stroke: '#2E7D32', strokeThickness: 2
    }).setOrigin(0.5)

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x66BB6A))
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4CAF50))
    startBtn.on('pointerdown', () => this.scene.start('PlayScene'))

    // 闪烁提示
    const tip = this.add.text(W / 2, H / 2 + 120, '点击「开始游戏」进入战斗', {
      font: '16px sans-serif', fill: 'rgba(255,255,255,0.7)'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: tip, alpha: 0.3, duration: 1000, yoyo: true, repeat: -1
    })

    // 资源管理按钮（右上角）
    const resourceBtnSize = 50
    const resourceBtnX = W - resourceBtnSize - 20
    const resourceBtnY = 20
    
    // 按钮背景（圆形）
    const resourceBtn = this.add.circle(resourceBtnX, resourceBtnY, resourceBtnSize / 2, 0x48dbfb)
      .setStrokeStyle(2, 0x0abde3)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0) // 固定位置，不随相机滚动
    
    // 按钮图标
    const resourceIcon = this.add.text(resourceBtnX, resourceBtnY, '🖼️', {
      font: '24px sans-serif'
    }).setOrigin(0.5).setScrollFactor(0)
    
    // 悬停效果
    resourceBtn.on('pointerover', () => {
      resourceBtn.setFillStyle(0x6be4ff)
      resourceBtn.setScale(1.1)
    })
    
    resourceBtn.on('pointerout', () => {
      resourceBtn.setFillStyle(0x48dbfb)
      resourceBtn.setScale(1)
    })
    
    // 点击事件 - 打开资源管理页面
    resourceBtn.on('pointerdown', () => {
      const resourceManagerUrl = `${window.location.origin}/resource-manager.html`
      console.log('[PVZ] 打开资源管理器:', resourceManagerUrl)
      window.open(resourceManagerUrl, '_blank')
    })
    
    // 添加提示文本
    const resourceTip = this.add.text(resourceBtnX, resourceBtnY + resourceBtnSize / 2 + 15, '资源管理', {
      font: '12px sans-serif',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0)
  }
}
