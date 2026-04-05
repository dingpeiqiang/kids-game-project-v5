export default class Speedometer {
  private scene: Phaser.Scene
  private speedText: Phaser.GameObjects.Text | null = null
  private gearText: Phaser.GameObjects.Text | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createUI()
  }

  private createUI() {
    // 速度显示
    this.speedText = this.scene.add.text(this.scene.cameras.main.width - 10, 50, '0 km/h', {
      fontSize: '28px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    })
    this.speedText.setOrigin(1, 0)
    this.speedText.setScrollFactor(0)
    this.speedText.setDepth(100)

    // 档位显示
    this.gearText = this.scene.add.text(this.scene.cameras.main.width - 10, 85, 'N', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.gearText.setOrigin(1, 0)
    this.gearText.setScrollFactor(0)
    this.gearText.setDepth(100)
  }

  update(angularVelocity: number) {
    // 将角速度转换为速度 (km/h)
    const speed = Math.abs(Math.round(angularVelocity * 100))
    
    if (this.speedText) {
      this.speedText.setText(`${speed} km/h`)
      
      // 根据速度改变颜色
      if (speed > 60) {
        this.speedText.setColor('#ff0000')
      } else if (speed > 40) {
        this.speedText.setColor('#ffaa00')
      } else {
        this.speedText.setColor('#00ff00')
      }
    }

    // 更新档位
    if (this.gearText) {
      let gear = 'N'
      if (angularVelocity > 0.01) {
        gear = angularVelocity > 0.5 ? 'D3' : angularVelocity > 0.3 ? 'D2' : 'D1'
      } else if (angularVelocity < -0.01) {
        gear = 'R'
      }
      this.gearText.setText(gear)
    }
  }

  setPosition(x: number, y: number) {
    this.speedText?.setPosition(x, y)
    this.gearText?.setPosition(x, y + 35)
  }
}
