export default class ScoreManager {
  private scene: Phaser.Scene
  private score: number = 0
  private highScore: number = 0
  private scoreText: Phaser.GameObjects.Text | null = null
  private highScoreText: Phaser.GameObjects.Text | null = null
  private startX: number = 0

  constructor(scene: Phaser.Scene, startX: number) {
    this.scene = scene
    this.startX = startX
    this.highScore = parseInt(localStorage.getItem('carGameHighScore') || '0')
    this.createUI()
  }

  private createUI() {
    // 当前分数
    this.scoreText = this.scene.add.text(10, 50, 'Distance: 0m', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
    this.scoreText.setScrollFactor(0)
    this.scoreText.setDepth(100)

    // 最高分
    this.highScoreText = this.scene.add.text(10, 80, `Best: ${this.highScore}m`, {
      fontSize: '20px',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.highScoreText.setScrollFactor(0)
    this.highScoreText.setDepth(100)
  }

  update(carX: number) {
    // 计算行驶距离
    const distance = Math.max(0, Math.floor((carX - this.startX) / 10))
    
    if (distance > this.score) {
      this.score = distance
      this.scoreText?.setText(`Distance: ${this.score}m`)
      
      // 更新最高分
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.highScoreText?.setText(`Best: ${this.highScore}m`)
        localStorage.setItem('carGameHighScore', this.highScore.toString())
      }
    }
  }

  getScore(): number {
    return this.score
  }

  getHighScore(): number {
    return this.highScore
  }

  reset() {
    this.score = 0
    // 安全地更新文本，避免在纹理未准备好时调用
    if (this.scoreText) {
      try {
        this.scoreText.setText('Distance: 0m')
      } catch (e) {
        console.warn('Failed to reset score text:', e)
      }
    }
  }
}
