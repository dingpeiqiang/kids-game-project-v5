/**
 * 敌人类 - 完全复刻原版实现
 */

import Phaser from 'phaser'
import { levelConfig } from '../config/levelConfig'

export default class Enemy extends Phaser.GameObjects.Image {
  public path: Phaser.Curves.Path
  public hp: number = 0
  public enemySpeed: number = 0
  public follower: {
    t: number
    vec: Phaser.Math.Vector2
  }

  constructor(scene: Phaser.Scene, x: number, y: number, path: Phaser.Curves.Path) {
    super(scene, x, y, 'enemy_red')

    this.path = path
    this.hp = 0
    this.enemySpeed = 0
    this.follower = {
      t: 0,
      vec: new Phaser.Math.Vector2()
    }

    // 添加敌人到场景
    scene.add.existing(this)
  }

  update(time: number, delta: number): void {
    // 沿路径移动 t 点
    this.follower.t += this.enemySpeed * delta

    // 获取给定 t 点的 x 和 y
    this.path.getPoint(this.follower.t, this.follower.vec)

    // 旋转敌人
    if (this.follower.vec.y > this.y && this.follower.vec.y !== this.y) {
      this.angle = 0
    }
    if (this.follower.vec.x > this.x && this.follower.vec.x !== this.x) {
      this.angle = -90
    }

    // 设置敌人的 x 和 y
    this.setPosition(this.follower.vec.x, this.follower.vec.y)

    // 如果到达路径终点，移除敌人
    if (this.follower.t >= 1) {
      this.setActive(false)
      this.setVisible(false)
      ;(this.scene as any).updateHealth(1)
    }
  }

  startOnPath(level: number): void {
    // 重置生命值
    this.hp =
      levelConfig.initial.enemyHealth +
      level * levelConfig.incremental.enemyHealth
    
    // 重置速度
    this.enemySpeed =
      levelConfig.initial.enemySpeed *
      (level * levelConfig.incremental.enemySpeed)

    // 将 t 参数设置在路径起点
    this.follower.t = 0

    // 获取给定 t 点的 x 和 y
    this.path.getPoint(this.follower.t, this.follower.vec)

    // 设置敌人的 x 和 y
    this.setPosition(this.follower.vec.x, this.follower.vec.y)
  }

  recieveDamage(damage: number): void {
    this.hp -= damage

    // 如果 hp < 0 => 停用敌人
    if (this.hp <= 0) {
      this.setActive(false)
      this.setVisible(false)
      ;(this.scene as any).updateScore(10)
      ;(this.scene as any).updateEnemies(-1)
    }
  }
}
