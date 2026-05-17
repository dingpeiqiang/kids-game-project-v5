/**
 * 子弹类 - 完全复刻原版实现
 */

import Phaser from 'phaser'

export default class Bullet extends Phaser.GameObjects.Image {
  public dx: number = 0
  public dy: number = 0
  public lifespan: number = 0
  private speed: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet')

    this.dx = 0
    this.dy = 0
    this.lifespan = 0
    this.speed = Phaser.Math.GetSpeed(600, 1)

    // 添加子弹到场景
    scene.add.existing(this)
  }

  update(time: number, delta: number): void {
    this.lifespan -= delta

    this.x += this.dx * (this.speed * delta)
    this.y += this.dy * (this.speed * delta)

    if (this.lifespan <= 0) {
      this.setActive(false)
      this.setVisible(false)
    }
  }

  fire(x: number, y: number, angle: number): void {
    this.setActive(true)
    this.setVisible(true)

    // 更新子弹位置
    this.setPosition(x, y)

    this.dx = Math.cos(angle)
    this.dy = Math.sin(angle)

    this.lifespan = 300
  }
}
