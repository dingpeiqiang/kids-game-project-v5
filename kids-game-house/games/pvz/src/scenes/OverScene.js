import Phaser from 'phaser'

export default class OverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverScene' })
  }

  create() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height

    // 半透明黑色背景
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)

    // 主标题
    const titleText = this.add.text(
      W / 2,
      H / 2 - 50,
      '僵尸吃掉了你的脑子!',
      {
        font: 'bold 26px sans-serif',
        fill: '#FF0000',
        align: 'center'
      }
    )
    titleText.setOrigin(0.5, 0.5)

    // 副标题
    const subText = this.add.text(
      W / 2,
      H / 2,
      'The Zombies Ate Your Brains!',
      {
        font: '18px sans-serif',
        fill: '#FFFFFF',
        align: 'center'
      }
    )
    subText.setOrigin(0.5, 0.5)

    // 重新开始按钮
    const restartBtn = this.add.rectangle(W / 2, H / 2 + 50, 160, 45, 0x4CAF50)
      .setInteractive({ useHandCursor: true })
    
    const restartText = this.add.text(W / 2, H / 2 + 50, '重新开始', {
      font: '18px sans-serif',
      fill: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5)

    // 返回标题按钮
    const titleBtn = this.add.rectangle(W / 2, H / 2 + 100, 160, 45, 0xFF9800)
      .setInteractive({ useHandCursor: true })
    
    const titleTextBtn = this.add.text(W / 2, H / 2 + 100, '返回标题', {
      font: '18px sans-serif',
      fill: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5)

    // 按钮悬停效果
    restartBtn.on('pointerover', () => {
      restartBtn.setFillStyle(0x45a049)
    })
    restartBtn.on('pointerout', () => {
      restartBtn.setFillStyle(0x4CAF50)
    })
    
    titleBtn.on('pointerover', () => {
      titleBtn.setFillStyle(0xf57c00)
    })
    titleBtn.on('pointerout', () => {
      titleBtn.setFillStyle(0xFF9800)
    })

    // 按钮事件
    restartBtn.on('pointerdown', () => {
      this.scene.start('PlayScene')
    })
    
    titleBtn.on('pointerdown', () => {
      this.scene.start('TitleScene')
    })
  }
}