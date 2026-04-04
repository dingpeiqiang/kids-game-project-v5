// ============================================================================
// 💥 伤害数字弹出管理器
// ============================================================================
// 
// 📌 说明:
//   显示伤害数字、暴击提示、连击数字等浮动文字效果
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 伤害数字类型
 */
export enum DamageType {
  NORMAL = 'normal',        // 普通伤害（白色）
  CRITICAL = 'critical',    // 暴击（红色，大字体）
  HEAL = 'heal',            // 治疗（绿色）
  SHIELD = 'shield',        // 护盾（蓝色）
  COMBO = 'combo',          // 连击数（金色）
  DODGE = 'dodge',          // 闪避（紫色）
  IMMUNE = 'immune'         // 免疫（灰色）
}

/**
 * ⭐ 伤害数字配置
 */
export interface IDamagePopupConfig {
  fontSize: number          // 基础字体大小
  criticalScale: number     // 暴击放大倍率
  floatSpeed: number        // 漂浮速度
  fadeDelay: number         // 淡出延迟
  colors: Record<DamageType, string>  // 各类型颜色
}

/**
 * ⭐ 伤害数字弹出管理器
 */
export class DamagePopupManager {
  private scene: TankGameScene
  
  // 配置
  private readonly config: IDamagePopupConfig = {
    fontSize: 24,
    criticalScale: 1.8,
    floatSpeed: 50,
    fadeDelay: 800,
    colors: {
      [DamageType.NORMAL]: '#ffffff',
      [DamageType.CRITICAL]: '#ff4444',
      [DamageType.HEAL]: '#00ff00',
      [DamageType.SHIELD]: '#4488ff',
      [DamageType.COMBO]: '#ffd700',
      [DamageType.DODGE]: '#da70d6',
      [DamageType.IMMUNE]: '#888888'
    }
  }
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ DamagePopupManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 显示伤害数字
   */
  showDamage(
    x: number,
    y: number,
    damage: number,
    type: DamageType = DamageType.NORMAL,
    isCritical: boolean = false
  ): void {
    const text = this.createDamageText(x, y, damage.toString(), type, isCritical)
    this.animateDamage(text, isCritical)
  }
  
  /**
   * ⭐ 显示文字提示
   */
  showText(
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    fontSize: number = 24
  ): void {
    const popup = this.scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial Black',
      color: color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5)
    
    // 简单上浮动画
    this.scene.tweens.add({
      targets: popup,
      y: y - 80,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy()
    })
  }
  
  /**
   * ⭐ 显示连击数字
   */
  showComboNumber(x: number, y: number, combo: number): void {
    const text = this.scene.add.text(x, y, `+${combo}`, {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5, 0.5)
    
    // 🎆 旋转 + 上浮
    this.scene.tweens.add({
      targets: text,
      y: y - 100,
      angle: 360,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => text.destroy()
    })
  }
  
  /**
   * ⭐ 显示暴击提示
   */
  showCritical(x: number, y: number): void {
    const text = this.scene.add.text(x, y, 'CRITICAL!', {
      fontSize: '42px',
      fontFamily: 'Arial Black',
      color: '#ff4444',
      stroke: '#ffffff',
      strokeThickness: 8
    }).setOrigin(0.5, 0.5).setScale(0.5)
    
    // 💥 冲击波效果
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      ease: 'Back.out',
      yoyo: true,
      onComplete: () => {
        // 然后上浮消失
        this.scene.tweens.add({
          targets: text,
          y: y - 120,
          alpha: 0,
          duration: 1000,
          onComplete: () => text.destroy()
        })
      }
    })
  }
  
  /**
   * ⭐ 摧毁所有弹窗（场景切换时调用）
   */
  destroyAll(): void {
    // Phaser 会自动清理，这里不需要额外操作
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 创建伤害数字文本
   */
  private createDamageText(
    x: number,
    y: number,
    text: string,
    type: DamageType,
    isCritical: boolean
  ): Phaser.GameObjects.Text {
    const fontSize = isCritical ? 
      this.config.fontSize * this.config.criticalScale : 
      this.config.fontSize
    
    const color = this.config.colors[type]
    
    const popup = this.scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial Black',
      color: color,
      stroke: '#000000',
      strokeThickness: isCritical ? 8 : 4
    }).setOrigin(0.5, 0.5)
    
    // 如果是暴击，添加阴影效果
    if (isCritical) {
      popup.setShadow(4, 4, '#000000', 0.5)
    }
    
    return popup
  }
  
  /**
   * 伤害数字动画
   */
  private animateDamage(text: Phaser.GameObjects.Text, isCritical: boolean): void {
    const baseY = text.y
    
    // 📊 先弹出来（缩放效果）
    text.setScale(0.3)
    
    this.scene.tweens.add({
      targets: text,
      scaleX: isCritical ? 1.8 : 1.0,
      scaleY: isCritical ? 1.8 : 1.0,
      duration: 150,
      ease: 'Back.out'
    })
    
    // 💫 轻微左右摇摆
    const startX = text.x
    this.scene.tweens.add({
      targets: text,
      x: startX + Math.sin(Date.now() / 200) * 10,
      duration: 200,
      repeat: 2,
      yoyo: true
    })
    
    // ⬆️ 向上漂浮
    this.scene.tweens.add({
      targets: text,
      y: baseY - 80,
      duration: this.config.fadeDelay,
      ease: 'Quad.easeOut'
    })
    
    // 👻 淡出
    this.scene.time.delayedCall(this.config.fadeDelay, () => {
      this.scene.tweens.add({
        targets: text,
        alpha: 0,
        duration: 300,
        onComplete: () => text.destroy()
      })
    })
  }
}
