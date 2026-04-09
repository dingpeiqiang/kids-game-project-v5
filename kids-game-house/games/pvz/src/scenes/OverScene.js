import Phaser from 'phaser'

export default class OverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverScene' })
  }

  create() {
    // 添加游戏结束文本
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "The Zombies ate your Brains!\nTap to Restart.",
      {
        font: '20px sans-serif',
        fill: '#FFF',
        align: 'center'
      }
    )
    text.setOrigin(0.5, 0.5)

    // 监听点击事件重新开始游戏
    this.input.on('pointerdown', () => {
      this.scene.start('PlayScene')
    })
  }
}