/**
 * UI场景 - 完全复刻原版实现
 */

import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  private gameScene!: Phaser.Scene
  private scoreText!: Phaser.GameObjects.Text
  private healthText!: Phaser.GameObjects.Text
  private turretsText!: Phaser.GameObjects.Text
  private roundTimeText!: Phaser.GameObjects.Text
  private enemiesText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UI', active: true })
  }

  init(): void {
    // 获取游戏场景引用
    this.gameScene = this.scene.get('Game')
  }

  create(): void {
    this.setupUIElements()
    this.setupEvents()
  }

  setupUIElements(): void {
    this.scoreText = this.add.text(5, 5, 'Score: 0', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.healthText = this.add.text(10, 490, 'Base Health: 0', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.turretsText = this.add.text(430, 5, 'Available turrets : 0', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.roundTimeText = this.add.text(180, 5, 'Round Start In: 10', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.enemiesText = this.add.text(10, 470, 'Enemies Remaining: 0', {
      fontSize: '16px',
      color: '#ffffff'
    })
    this.levelText = this.add.text(0, 0, 'Level: 0', {
      fontSize: '40px',
      color: '#ffffff'
    })

    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // 居中关卡文本
    Phaser.Display.Align.In.Center(
      this.levelText,
      this.add.zone(width / 2, height / 2, width, height)
    )

    this.hideUIElements()
  }

  hideUIElements(): void {
    this.scoreText.alpha = 0
    this.healthText.alpha = 0
    this.turretsText.alpha = 0
    this.roundTimeText.alpha = 0
    this.enemiesText.alpha = 0
    this.levelText.alpha = 0
  }

  setupEvents(): void {
    this.gameScene.events.on('displayUI', () => {
      this.scoreText.alpha = 1
      this.healthText.alpha = 1
      this.turretsText.alpha = 1
      this.enemiesText.alpha = 1
    })

    this.gameScene.events.on('updateScore', (score: number) => {
      this.scoreText.setText(`Score: ${score}`)
    })

    this.gameScene.events.on('updateEnemies', (enemies: number) => {
      this.enemiesText.setText(`Enemies Remaining: ${enemies}`)
    })

    this.gameScene.events.on('updateHealth', (health: number) => {
      this.healthText.setText(`Base Health: ${health}`)
    })

    this.gameScene.events.on('updateTurrets', (turrets: number) => {
      this.turretsText.setText(`Available turrets: ${turrets}`)
    })

    this.gameScene.events.on('hideUI', () => {
      this.hideUIElements()
    })

    this.gameScene.events.on('startRound', (level: number) => {
      this.levelText.setText(`Level: ${level}`)
      this.levelText.alpha = 1

      // 淡出关卡文本
      this.tweens.add({
        targets: this.levelText,
        ease: 'Sine.easeInOut',
        duration: 1000,
        delay: 2000,
        alpha: {
          getStart: () => 1,
          getEnd: () => 0
        },
        onComplete: () => {
          this.roundTimeText.setText('Round Start In: 10')
          this.roundTimeText.alpha = 1
          
          let countdown = 10
          const timedEvent = this.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
              countdown--
              this.roundTimeText.setText(`Round Start In: ${countdown}`)
              if (countdown === 0) {
                this.events.emit('roundReady')
                this.roundTimeText.alpha = 0
              }
            }
          })
        }
      })
    })
  }
}
