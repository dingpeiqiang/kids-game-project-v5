/**
 * 终点旗帜
 * 在关卡目标距离处显示终点标志
 */
export default class FinishFlag {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container | null = null

  constructor(scene: Phaser.Scene, worldX: number, terrainY: number, targetDistance: number) {
    this.scene = scene
    this.createFlag(worldX, terrainY, targetDistance)
  }

  private createFlag(worldX: number, groundY: number, targetDistance: number) {
    this.container = this.scene.add.container(worldX, groundY)
    this.container.setDepth(1000)

    const flagGraphics = this.scene.add.graphics()

    // 旗杆
    flagGraphics.lineStyle(4, 0x888888)
    flagGraphics.lineBetween(0, -120, 0, 0)

    // 旗杆顶部球
    flagGraphics.fillStyle(0xFFD700)
    flagGraphics.fillCircle(0, -122, 5)

    // 旗帜（三角形状）
    flagGraphics.fillStyle(0xFF0000, 1)
    flagGraphics.beginPath()
    flagGraphics.moveTo(2, -120)
    flagGraphics.lineTo(60, -100)
    flagGraphics.lineTo(2, -80)
    flagGraphics.closePath()
    flagGraphics.fillPath()

    // 终点线（棋盘格纹理）
    const checkSize = 15
    for (let i = -3; i <= 3; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          flagGraphics.fillStyle(0x000000, 0.7)
        } else {
          flagGraphics.fillStyle(0xFFFFFF, 0.7)
        }
        flagGraphics.fillRect(i * checkSize, j * checkSize - checkSize, checkSize, checkSize)
      }
    }

    // 底座
    flagGraphics.fillStyle(0x888888)
    flagGraphics.fillRect(-15, -2, 30, 6)

    this.container.add(flagGraphics)

    // 文字标签
    const label = this.scene.add.text(0, -140, `${targetDistance}m`, {
      fontSize: '18px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    })
    label.setOrigin(0.5, 0.5)
    this.container.add(label)

    // 旗帜飘动动画
    this.scene.tweens.add({
      targets: flagGraphics,
      scaleX: 1.02,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 闪烁效果
    this.scene.tweens.add({
      targets: label,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  destroy() {
    this.container?.destroy()
    this.container = null
  }
}
