// ============================================================================
// 🎨【框架层】粒子渲染组件 - 通用游戏引擎
// ============================================================================
// 📌 说明：封装原有的 createParticleTexture() 方法，保持逻辑不变
// ⚠️ 注意：这是框架层组件，所有游戏通用
// ============================================================================

/**
 * ⭐ 粒子渲染组件
 * 
 * 📌 说明：封装原有的 createParticleTexture() 方法
 * 
 * 使用方式:
 * ```typescript
 * const renderer = new ParticleRenderer(scene, adaptParams)
 * renderer.createParticleTexture()
 * ```
 */
export class ParticleRenderer {
  private scene: Phaser.Scene | null = null
  private adaptParams: any

  /**
   * 构造函数
   * @param scene Phaser 场景对象
   * @param adaptParams 适配参数 (包含 screenW, screenH, cellSize, safeTop, safeBottom 等)
   */
  constructor(
    scene: Phaser.Scene | null,
    adaptParams: any
  ) {
    this.scene = scene
    this.adaptParams = adaptParams
  }

  /**
   * ⭐ 创建粒子纹理 - 通用游戏引擎核心渲染方法 (保持原有逻辑不变)
   */
  createParticleTexture(): void {
    if (!this.scene) return

    // 根据 cellSize 动态计算粒子大小 (保持原有计算逻辑)
    const particleSize = Math.max(4, this.adaptParams.cellSize * 0.15)
    const textureSize = particleSize * 2
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(particleSize, particleSize, particleSize)
    graphics.generateTexture('particle', textureSize, textureSize)
    
    console.log('✨ 粒子纹理:', {
      size: textureSize.toFixed(1),
      cellSize: this.adaptParams.cellSize.toFixed(2)
    })
  }

  /**
   * ⭐ 更新场景引用 (用于 resize 后重新绑定)
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene
  }

  /**
   * ⭐ 更新适配参数 (用于 resize 后重新计算)
   */
  setAdaptParams(adaptParams: any): void {
    this.adaptParams = adaptParams
  }
}
