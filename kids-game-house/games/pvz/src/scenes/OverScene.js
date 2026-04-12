import Phaser from 'phaser'

export default class OverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverScene' })
  }

  create() {
    const C = window.GAME_CONFIG
    const W = C.BASE_W
    const H = C.BASE_H

    this.cameras.main.setSize(W, H)

    // 背景
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)

    // 标题
    this.add.text(W / 2, H / 2 - 80, '🧟 僵尸吃掉了你的脑子!', {
      font: 'bold 36px sans-serif',
      fill: '#FF4444',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(W / 2, H / 2 - 30, 'The Zombies Ate Your Brains!', {
      font: '20px sans-serif',
      fill: '#FFFFFF'
    }).setOrigin(0.5)

    // 重新开始按钮
    const restartBtn = this.add.rectangle(W / 2, H / 2 + 40, 200, 50, 0x4CAF50)
      .setStrokeStyle(2, 0x388E3C)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2, H / 2 + 40, '重新开始', {
      font: 'bold 22px sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5)

    // 返回标题按钮
    const titleBtn = this.add.rectangle(W / 2, H / 2 + 110, 200, 50, 0xFF9800)
      .setStrokeStyle(2, 0xF57C00)
      .setInteractive({ useHandCursor: true })
    this.add.text(W / 2, H / 2 + 110, '返回标题', {
      font: 'bold 22px sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5)

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x66BB6A))
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x4CAF50))
    restartBtn.on('pointerdown', () => this.scene.start('PlayScene'))

    titleBtn.on('pointerover', () => titleBtn.setFillStyle(0xFFB74D))
    titleBtn.on('pointerout', () => titleBtn.setFillStyle(0xFF9800))
    titleBtn.on('pointerdown', () => this.scene.start('TitleScene'))
  }
}
