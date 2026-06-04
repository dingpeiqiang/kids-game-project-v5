/**
 * 炮塔类 - 完全复刻原版实现
 */

import Phaser from 'phaser'

export default class Turret extends Phaser.GameObjects.Image {
  private map: number[][]
  private nextTick: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, map: number[][]) {
    super(scene, x, y, 'turret')

    this.map = map
    this.nextTick = 0

    // 添加炮塔到场景
    scene.add.existing(this)
    this.setScale(-0.8) // 负值翻转对象
  }

  update(time: number, delta: number): void {
    // 射击时间到了
    if (time > this.nextTick) {
      this.fire()
      this.nextTick = time + 1000
    }
  }

  place(i: number, j: number): void {
    this.x = j * 64 + 32
    this.y = i * 64 + 32
    this.map[i][j] = 1
  }

  fire(): void {
    const enemy = (this.scene as any).getEnemy(this.x, this.y, 100)
    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y)
      ;(this.scene as any).addBullet(this.x, this.y, angle)
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG
    }
  }
}
