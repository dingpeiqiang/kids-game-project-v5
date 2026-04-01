// ============================================================================
// 📳 屏幕震动管理器（增强版）
// ============================================================================
// 
// 📌 说明:
//   分级震动效果，从轻微到极致，配合视觉特效增强打击感
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'

/**
 * ⭐ 震动等级
 */
export enum ShakeLevel {
  NONE = 0,           // 无震动
  LIGHT = 1,          // 轻微（普通击中）
  MEDIUM = 2,         // 中等（摧毁敌人）
  HEAVY = 3,          // 强烈（爆炸）
  EXTREME = 4,        // 极致（Boss 死亡/大招）
  ULTRA = 5           // 终极（全屏清场）
}

/**
 * ⭐ 震动配置
 */
export interface IShakeConfig {
  duration: number    // 持续时间（毫秒）
  intensity: number   // 强度（像素）
  flash: boolean      // 是否闪光
  slowMo: number      // 慢动作倍率（0-1，0 为正常）
  chromaticAberration: boolean  // 色差效果
}

/**
 * ⭐ 屏幕震动管理器
 */
export class CameraShakeManager {
  private scene: TankGameScene
  
  // 当前状态
  private isShaking: boolean = false
  private currentLevel: ShakeLevel = ShakeLevel.NONE
  
  // 配置表
  private readonly config: Record<ShakeLevel, IShakeConfig> = {
    [ShakeLevel.NONE]: { duration: 0, intensity: 0, flash: false, slowMo: 1, chromaticAberration: false },
    [ShakeLevel.LIGHT]: { duration: 200, intensity: 3, flash: false, slowMo: 1, chromaticAberration: false },
    [ShakeLevel.MEDIUM]: { duration: 400, intensity: 6, flash: true, slowMo: 1, chromaticAberration: false },
    [ShakeLevel.HEAVY]: { duration: 600, intensity: 10, flash: true, slowMo: 0.9, chromaticAberration: false },
    [ShakeLevel.EXTREME]: { duration: 1000, intensity: 15, flash: true, slowMo: 0.8, chromaticAberration: true },
    [ShakeLevel.ULTRA]: { duration: 1500, intensity: 20, flash: true, slowMo: 0.5, chromaticAberration: true }
  }
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    console.log('✅ CameraShakeManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 触发震动（通过等级）
   */
  shake(level: ShakeLevel): void {
    if (level === ShakeLevel.NONE) return
    
    const config = this.config[level]
    this.executeShake(config, level)
    
    console.log(`📳 屏幕震动：Lv.${level} (${config.duration}ms, ${config.intensity}px)`)
  }
  
  /**
   * ⭐ 触发震动（自定义参数）
   */
  shakeCustom(duration: number, intensity: number, options?: Partial<IShakeConfig>): void {
    const config: IShakeConfig = {
      duration,
      intensity,
      flash: options?.flash ?? false,
      slowMo: options?.slowMo ?? 1,
      chromaticAberration: options?.chromaticAberration ?? false
    }
    
    this.executeShake(config, ShakeLevel.NONE)
    
    console.log(`📳 自定义震动：${duration}ms, ${intensity}px`)
  }
  
  /**
   * ⭐ 立即停止震动
   */
  stop(): void {
    if (!this.isShaking) return
    
    console.log('⏹️ 强制停止震动')
    
    // 恢复相机（Phaser 3.90 没有 stopShake，震动会自动结束）
    this.scene.cameras.main.setZoom(1)
    this.clearFlash()
    
    this.isShaking = false
    this.currentLevel = ShakeLevel.NONE
  }
  
  /**
   * ⭐ 获取当前震动等级
   */
  getCurrentLevel(): ShakeLevel {
    return this.currentLevel
  }
  
  /**
   * ⭐ 是否正在震动
   */
  isCurrentlyShaking(): boolean {
    return this.isShaking
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 执行震动
   */
  private executeShake(config: IShakeConfig, level: ShakeLevel): void {
    // 如果已经在震动，且新震动等级更高，则打断当前震动
    if (this.isShaking && level <= this.currentLevel) {
      console.log('⚠️ 忽略低级震动')
      return
    }
    
    // 停止之前的震动
    this.stop()
    
    this.isShaking = true
    this.currentLevel = level
    
    // 1️⃣ 开始震动
    this.scene.cameras.main.shake(config.duration, config.intensity / 1000)
    
    // 2️⃣ 闪光效果（如果有）
    if (config.flash) {
      this.triggerFlash(config.duration)
    }
    
    // 3️⃣ 慢动作效果（如果有）
    if (config.slowMo < 1) {
      this.applySlowMotion(config.slowMo, config.duration)
    }
    
    // 4️⃣ 色差效果（如果有）
    if (config.chromaticAberration) {
      this.applyChromaticAberration(config.duration)
    }
    
    // 5️⃣ 震动结束后恢复
    this.scene.time.delayedCall(config.duration, () => {
      this.isShaking = false
      this.currentLevel = ShakeLevel.NONE
    })
  }
  
  /**
   * 触发闪光
   */
  private triggerFlash(duration: number): void {
    // 获取相机视图尺寸
    const camera = this.scene.cameras.main
    const width = camera.width
    const height = camera.height
    
    // 创建白色覆盖层
    const flash = this.scene.add.rectangle(
      camera.scrollX + width / 2,
      camera.scrollY + height / 2,
      width,
      height,
      0xffffff
    ).setScrollFactor(0).setAlpha(0.8).setDepth(9999)
    
    // 淡出动画
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration / 2,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    })
    
    console.log('✨ 屏幕闪光')
  }
  
  /**
   * 清除闪光
   */
  private clearFlash(): void {
    // Phaser 会自动清理，这里不需要额外操作
  }
  
  /**
   * 应用慢动作
   */
  private applySlowMotion(slowMoFactor: number, duration: number): void {
    // 设置时间缩放
    this.scene.time.timeScale = slowMoFactor
    
    console.log(`⏱️ 慢动作：x${slowMoFactor}`)
    
    // 恢复时间流速
    this.scene.time.delayedCall(duration, () => {
      this.scene.time.timeScale = 1
      console.log('⏱️ 恢复正常时间')
    })
  }
  
  /**
   * 应用色差效果（RGB 分离）
   */
  private applyChromaticAberration(duration: number): void {
    // 使用 post-fx 实现色差（需要 Phaser 3.60+）
    const camera = this.scene.cameras.main
    
    // 检查是否支持后期处理
    if ('postFX' in camera) {
      try {
        const fx = camera.postFX.addChromaticAberration()
        
        // 动画效果：从无到有再到无
        this.scene.tweens.add({
          targets: fx,
          offsetX: 8,
          offsetY: 8,
          duration: duration / 2,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            camera.postFX.remove(fx)
          }
        })
        
        console.log('🌈 色差效果')
      } catch (error) {
        console.warn('⚠️ 色差效果不支持:', error)
      }
    } else {
      // 降级方案：用颜色叠加模拟
      this.simulateChromaticAberration(duration)
    }
  }
  
  /**
   * 模拟色差效果（降级方案）
   */
  private simulateChromaticAberration(duration: number): void {
    // 获取相机视图尺寸
    const camera = this.scene.cameras.main
    const width = camera.width
    const height = camera.height
    
    // 创建红蓝两层覆盖
    const redLayer = this.scene.add.rectangle(
      camera.scrollX + width / 2,
      camera.scrollY + height / 2,
      width,
      height,
      0xff0000
    ).setScrollFactor(0).setAlpha(0.1).setDepth(9998).setBlendMode(Phaser.BlendModes.ADD)
    
    const blueLayer = this.scene.add.rectangle(
      camera.scrollX + width / 2,
      camera.scrollY + height / 2,
      width,
      height,
      0x0000ff
    ).setScrollFactor(0).setAlpha(0.1).setDepth(9998).setBlendMode(Phaser.BlendModes.ADD)
    
    // 错开位置
    this.scene.tweens.add({
      targets: redLayer,
      x: redLayer.x + 10,
      y: redLayer.y + 10,
      duration: duration / 2,
      yoyo: true,
      onComplete: () => redLayer.destroy()
    })
    
    this.scene.tweens.add({
      targets: blueLayer,
      x: blueLayer.x - 10,
      y: blueLayer.y - 10,
      duration: duration / 2,
      yoyo: true,
      onComplete: () => blueLayer.destroy()
    })
    
    console.log('🌈 模拟色差效果')
  }
}
