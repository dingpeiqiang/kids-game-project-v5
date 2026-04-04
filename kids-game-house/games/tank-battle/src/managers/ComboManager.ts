// ============================================================================
// ⚡ 连击管理器
// ============================================================================
// 
// 📌 说明:
//   管理连击计数、连击等级、伤害倍率、UI 显示
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 连击等级配置
 */
export interface IComboRank {
  minCombo: number          // 最小连击数
  maxCombo: number          // 最大连击数
  multiplier: number        // 伤害倍率
  color: string             // 文字颜色
  effect: string            // 特效名称
  label: string             // 等级标签
}

/**
 * ⭐ 连击系统配置
 */
export interface IComboConfig {
  comboDecayTime: number    // 连击衰减时间（毫秒）
  ranks: IComboRank[]       // 连击等级配置
}

/**
 * ⭐ 连击管理器
 */
export class ComboManager {
  private scene: TankGameScene
  
  // 连击状态
  private currentCombo: number = 0
  private maxCombo: number = 0
  private comboTimer: Phaser.Time.TimerEvent | null = null
  private comboText: Phaser.GameObjects.Text | null = null
  
  // 配置
  private readonly config: IComboConfig = {
    comboDecayTime: 3000,  // 3 秒内没有击杀，连击中断
    
    ranks: [
      { minCombo: 1, maxCombo: 5, multiplier: 1.0, color: '#ffffff', effect: 'none', label: '' },
      { minCombo: 6, maxCombo: 10, multiplier: 1.2, color: '#ffd700', effect: 'glow_gold', label: 'Great!' },
      { minCombo: 11, maxCombo: 20, multiplier: 1.5, color: '#00bfff', effect: 'flame_blue', label: 'Amazing!' },
      { minCombo: 21, maxCombo: 50, multiplier: 2.0, color: '#9370db', effect: 'lightning', label: 'Unstoppable!' },
      { minCombo: 51, maxCombo: 99, multiplier: 3.0, color: '#ff4500', effect: 'shockwave_red', label: 'Dominating!' },
      { minCombo: 100, maxCombo: Infinity, multiplier: 5.0, color: '#ff69b4', effect: 'rainbow_aura', label: 'GODLIKE!' }
    ]
  }
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ ComboManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 添加连击（击杀敌人时调用）
   */
  addCombo(enemyX: number, enemyY: number): void {
    this.currentCombo++
    
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo
    }
    
    Logger.debug(`⚡ 连击 +1: ${this.currentCombo}`)
    
    // 🔁 重置连击计时器
    this.resetComboTimer()
    
    // 🎨 播放连击特效
    this.playComboEffect(enemyX, enemyY)
    
    // 📊 更新 UI
    this.updateComboUI()
    
    // 🎵 播放音效
    this.playComboSound()
  }
  
  /**
   * ⭐ 重置连击（玩家死亡时调用）
   */
  reset(): void {
    if (this.currentCombo > 0) {
      Logger.debug(`💔 连击中断！最终连击：${this.currentCombo}`)
    }
    
    this.currentCombo = 0
    this.clearComboTimer()
    this.hideComboUI()
  }
  
  /**
   * ⭐ 获取当前伤害倍率
   */
  getDamageMultiplier(): number {
    const rank = this.getCurrentRank()
    return rank ? rank.multiplier : 1.0
  }
  
  /**
   * ⭐ 获取当前连击等级
   */
  getCurrentRank(): IComboRank | null {
    return this.config.ranks.find(rank => 
      this.currentCombo >= rank.minCombo && 
      this.currentCombo <= rank.maxCombo
    ) || null
  }
  
  /**
   * ⭐ 获取当前连击数
   */
  getCurrentCombo(): number {
    return this.currentCombo
  }
  
  /**
   * ⭐ 获取最大连击记录
   */
  getMaxCombo(): number {
    return this.maxCombo
  }
  
  /**
   * ⭐ 销毁
   */
  destroy(): void {
    this.clearComboTimer()
    this.hideComboUI()
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 重置连击计时器
   */
  private resetComboTimer(): void {
    this.clearComboTimer()
    
    this.comboTimer = this.scene.time.delayedCall(this.config.comboDecayTime, () => {
      this.reset()
    })
  }
  
  /**
   * 清除连击计时器
   */
  private clearComboTimer(): void {
    if (this.comboTimer) {
      this.comboTimer.destroy()
      this.comboTimer = null
    }
  }
  
  /**
   * 播放连击特效
   */
  private playComboEffect(x: number, y: number): void {
    const rank = this.getCurrentRank()
    if (!rank || rank.effect === 'none') return
    
    // 🎆 升级特效
    if (this.currentCombo === rank.minCombo && rank.label) {
      // 显示等级标签
      this.showRankLabel(rank.label, x, y)
      
      // 根据等级播放不同特效
      switch (rank.effect) {
        case 'glow_gold':
          this.spawnGoldenBurst(x, y)
          break
        case 'flame_blue':
          this.spawnBlueFlame(x, y)
          break
        case 'lightning':
          this.spawnLightningStrike(x, y)
          break
        case 'shockwave_red':
          this.spawnRedShockwave(x, y)
          break
        case 'rainbow_aura':
          this.spawnRainbowAura(x, y)
          break
      }
    }
  }
  
  /**
   * 显示连击 UI
   */
  private updateComboUI(): void {
    // 创建或更新 UI 文本
    if (!this.comboText) {
      this.comboText = this.scene.add.text(
        this.scene.cameras.main.scrollX + 100,
        this.scene.cameras.main.scrollY + 80,
        '',
        {
          fontSize: '32px',
          fontFamily: 'Arial Black',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setScrollFactor(0).setDepth(1000)
    }
    
    const rank = this.getCurrentRank()
    const comboText = `COMBO x${this.currentCombo}`
    const labelText = rank?.label || ''
    
    this.comboText.setText(comboText)
    this.comboText.setColor(rank?.color || '#ffffff')
    this.comboText.setStroke(rank?.color || '#ffffff', 4)
    
    // 💫 动画效果
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    })
    
    // 如果有等级标签，显示在上方
    if (labelText) {
      const label = this.scene.add.text(
        this.scene.cameras.main.scrollX + 100,
        this.scene.cameras.main.scrollY + 40,
        labelText,
        {
          fontSize: '24px',
          fontFamily: 'Arial Black',
          color: rank?.color || '#ffffff',
          stroke: '#000000',
          strokeThickness: 4
        }
      ).setScrollFactor(0).setDepth(1000)
      
      // 3 秒后消失
      this.scene.time.delayedCall(3000, () => {
        this.scene.tweens.add({
          targets: label,
          alpha: 0,
          y: label.y - 50,
          duration: 500,
          onComplete: () => label.destroy()
        })
      })
    }
  }
  
  /**
   * 隐藏连击 UI
   */
  private hideComboUI(): void {
    if (this.comboText) {
      this.scene.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.comboText?.destroy()
          this.comboText = null
        }
      })
    }
  }
  
  /**
   * 播放连击音效
   */
  private playComboSound(): void {
    const rank = this.getCurrentRank()
    if (!rank) return
    
    // 🎵 根据连击数播放不同音效
    let soundKey = 'sfx_combo_small'
    
    if (this.currentCombo >= 100) {
      soundKey = 'sfx_combo_godlike'
    } else if (this.currentCombo >= 50) {
      soundKey = 'sfx_combo_dominating'
    } else if (this.currentCombo >= 20) {
      soundKey = 'sfx_combo_amazing'
    } else if (this.currentCombo >= 10) {
      soundKey = 'sfx_combo_great'
    } else if (this.currentCombo % 5 === 0) {
      soundKey = 'sfx_combo_milestone'
    }
    
    // 如果音效不存在，使用默认音效
    if (this.scene.sound.get(soundKey)) {
      this.scene.sound.play(soundKey, { volume: 0.5 })
    }
  }
  
  /**
   * 显示等级标签
   */
  private showRankLabel(label: string, x: number, y: number): void {
    const text = this.scene.add.text(x, y - 50, label, {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5, 0.5)
    
    // 🎆 弹出动画
    this.scene.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => text.destroy()
    })
  }
  
  // ===========================================================================
  // ✨ 特效方法
  // ===========================================================================
  
  private spawnGoldenBurst(x: number, y: number): void {
    Logger.debug('✨ 金色爆发特效', x, y)
    
    // 创建金色粒子爆发
    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: 0xFFD700,
      quantity: 20,
      lifespan: 600,
      gravityY: 0
    })
    
    // 自动销毁
    this.scene.time.delayedCall(600, () => particles.destroy())
  }
  
  private spawnBlueFlame(x: number, y: number): void {
    Logger.debug('🔥 蓝色火焰特效', x, y)
    
    // 创建蓝色火焰粒子
    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      tint: 0x0080FF,
      quantity: 15,
      lifespan: 500,
      gravityY: -50
    })
    
    this.scene.time.delayedCall(500, () => particles.destroy())
  }
  
  private spawnLightningStrike(x: number, y: number): void {
    Logger.debug('⚡ 雷电特效', x, y)
    
    // 创建闪电效果（使用图形）
    const graphics = this.scene.add.graphics()
    graphics.lineStyle(3, 0xFFFF00, 1.0)
    
    // 绘制闪电路径
    let currentX = x
    let currentY = y
    graphics.moveTo(currentX, currentY)
    
    for (let i = 0; i < 10; i++) {
      currentX += (Math.random() - 0.5) * 40
      currentY += Math.random() * 20
      graphics.lineTo(currentX, currentY)
    }
    
    graphics.strokePath()
    
    // 闪烁效果
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 300,
      onComplete: () => graphics.destroy()
    })
  }
  
  private spawnRedShockwave(x: number, y: number): void {
    Logger.debug('🌊 红色冲击波特效', x, y)
    
    // 创建圆形冲击波
    const shockwave = this.scene.add.circle(x, y, 10, 0xFF0000, 0.8)
    
    this.scene.tweens.add({
      targets: shockwave,
      scale: 5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => shockwave.destroy()
    })
  }
  
  private spawnRainbowAura(x: number, y: number): void {
    Logger.debug('🌈 彩虹光环特效', x, y)
    
    // 创建彩虹色光环
    const colors = [0xFF0000, 0xFFA500, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0xEE82EE]
    
    colors.forEach((color, index) => {
      const ring = this.scene.add.circle(x, y, 20 + index * 5, color, 0.3)
      
      this.scene.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 800 + index * 100,
        delay: index * 50,
        ease: 'Sine.easeOut',
        onComplete: () => ring.destroy()
      })
    })
  }
}
