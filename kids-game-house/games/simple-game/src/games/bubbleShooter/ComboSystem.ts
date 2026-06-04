import { FloatingScore } from './types'

export class ComboSystem {
  private combo: number = 0
  private floatingScores: FloatingScore[] = []
  private lastComboTime: number = 0
  private readonly COMBO_TIMEOUT: number = 3000 // 3秒内连续消除才算连击

  // 增加连击
  addCombo(score: number, x: number, y: number, color: string = '#FFD700'): number {
    const now = Date.now()
    
    // 如果距离上次连击超过 timeout，重置连击
    if (now - this.lastComboTime > this.COMBO_TIMEOUT) {
      this.combo = 0
    }
    
    this.combo++
    this.lastComboTime = now
    
    // 计算连击加分
    const multiplier = Math.min(this.combo, 5) // 最多5倍
    const totalScore = score * multiplier
    
    // 添加漂浮分数
    this.addFloatingScore(x, y, `+${totalScore}`, color, 24 + this.combo * 2)
    
    // 如果连击数高，添加特殊效果文字
    if (this.combo >= 3) {
      setTimeout(() => {
        this.addFloatingScore(x, y - 30, `${this.combo} 连击!`, '#FF6B6B', 28)
      }, 200)
    }
    
    if (this.combo >= 5) {
      setTimeout(() => {
        this.addFloatingScore(x, y - 60, '超爽!', '#FF69B4', 32)
      }, 400)
    }
    
    return totalScore
  }

  // 重置连击
  resetCombo() {
    this.combo = 0
  }

  // 获取当前连击数
  getCombo(): number {
    return this.combo
  }

  // 添加漂浮分数
  addFloatingScore(x: number, y: number, text: string, color: string, size: number) {
    this.floatingScores.push({
      x,
      y,
      text,
      color,
      size,
      life: 1.5
    })
  }

  // 添加奖励分数
  addBonusScore(x: number, y: number, bonus: number, reason: string) {
    this.floatingScores.push({
      x,
      y,
      text: `${reason}+${bonus}!`,
      color: '#FF69B4',
      size: 28,
      life: 1.5
    })
  }

  // 更新漂浮分数
  update() {
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const f = this.floatingScores[i]
      f.life -= 0.02
      f.y -= 1.5 // 向上漂浮
      
      if (f.life <= 0) {
        this.floatingScores.splice(i, 1)
      }
    }
  }

  // 获取所有漂浮分数
  getFloatingScores(): FloatingScore[] {
    return this.floatingScores
  }

  // 清除所有漂浮分数
  clear() {
    this.floatingScores = []
    this.combo = 0
  }
}
