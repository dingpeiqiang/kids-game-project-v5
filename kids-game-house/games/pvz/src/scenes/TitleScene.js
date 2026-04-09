import Phaser from 'phaser'

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    // 添加标题文本
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Tap to Start',
      {
        font: '20px sans-serif',
        fill: '#FFF'
      }
    )
    text.setOrigin(0.5, 0.5)

    // 监听点击事件
    this.input.on('pointerdown', () => {
      this.scene.start('PlayScene')
    })
  }
}