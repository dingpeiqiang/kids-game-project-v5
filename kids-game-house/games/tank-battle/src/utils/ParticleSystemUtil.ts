// ============================================================================
// ✨ 坦克大战 - 粒子系统工具
// ============================================================================
// 
// 📌 说明:
//   解决粒子特效性能问题：
//   - Graphics 硬编码（错误用法）
//   - 每帧重绘（性能差）
//   - 无法独立运动（共享 Graphics）
// ============================================================================

/**
 * ⭐ 粒子配置
 */
interface IParticleConfig {
  x: number
  y: number
  texture?: string
  color?: number
  count: number
  size: number
  speed: { min: number; max: number }
  lifespan: number
  gravityY?: number
  scale?: { start: number; end: number }
  alpha?: { start: number; end: number }
  blendMode?: Phaser.BlendModes
}

/**
 * ⭐ 粒子系统工具类
 */
export class ParticleSystemUtil {
  private scene: Phaser.Scene
  
  // 纹理缓存（避免重复创建）
  private textureCache: Map<number, string> = new Map()
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  /**
   * ⭐ 创建爆炸碎片粒子
   */
  createExplosionDebris(
    x: number,
    y: number,
    color: number,
    count: number,
    size: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.createParticles({
      x,
      y,
      color,
      count,
      size,
      speed: { min: 50, max: 150 },
      lifespan: 500,
      gravityY: 0,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: Phaser.BlendModes.ADD
    })
  }
  
  /**
   * ⭐ 创建火花粒子
   */
  createSparks(
    x: number,
    y: number,
    color: number,
    count: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.createParticles({
      x,
      y,
      color,
      count,
      size: 2,
      speed: { min: 100, max: 300 },
      lifespan: 300,
      gravityY: 200,
      scale: { start: 1, end: 0.5 },
      alpha: { start: 1, end: 0 },
      blendMode: Phaser.BlendModes.ADD
    })
  }
  
  /**
   * ⭐ 创建烟雾粒子
   */
  createSmoke(
    x: number,
    y: number,
    count: number
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.createParticles({
      x,
      y,
      color: 0x888888,
      count,
      size: 20,
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      gravityY: -50,  // ✅ 向上飘
      scale: { start: 0.5, end: 2 },
      alpha: { start: 0.6, end: 0 },
      blendMode: Phaser.BlendModes.NORMAL
    })
  }
  
  /**
   * ⭐ 通用粒子创建方法
   */
  createParticles(config: IParticleConfig): Phaser.GameObjects.Particles.ParticleEmitter {
    // ✅ 获取或创建纹理
    const textureKey = config.color ? `particle_${config.color}` : (config.texture || 'particle_default')
    
    if (config.color && !this.scene.textures.exists(textureKey)) {
      this.createColorTexture(textureKey, config.color, config.size)
    }
    
    // ✅ 创建粒子发射器
    const particles = this.scene.add.particles(config.x, config.y, textureKey, {
      speed: config.speed,
      angle: { min: 0, max: 360 },
      scale: config.scale || { start: 1, end: 0 },
      alpha: config.alpha || { start: 1, end: 0 },
      lifespan: config.lifespan,
      gravityY: config.gravityY || 0,
      quantity: config.count,
      blendMode: config.blendMode || Phaser.BlendModes.NORMAL,
      emitting: true
    })
    
    // ✅ 自动销毁（防止泄漏）
    this.scene.time.delayedCall(config.lifespan + 100, () => {
      if (particles.active) {
        particles.destroy()
      }
    })
    
    return particles
  }
  
  /**
   * ⭐ 创建颜色纹理（用于粒子）- 增加容错处理
   */
  private createColorTexture(key: string, color: number, size: number): void {
    // ✅ 检查纹理是否已存在
    if (this.scene.textures.exists(key)) {
      return
    }
    
    // 🔧 修复：验证 size 参数，防止为 0 或负数
    const validSize = Math.max(1, Math.floor(size))
    
    console.log('🎨 [ParticleSystemUtil] 创建颜色纹理:', { key, color, size: validSize })
    
    try {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 })
      graphics.fillStyle(color, 1)
      graphics.fillRect(0, 0, validSize, validSize)
      graphics.generateTexture(key, validSize, validSize)
      graphics.destroy()
      console.log('✅ [ParticleSystemUtil] 纹理创建成功:', key)
    } catch (error) {
      console.error('❌ [ParticleSystemUtil] 纹理创建失败:', { key, color, size: validSize, error })
      // 不抛出错误，避免影响游戏运行
    }
  }
  
  /**
   * ⭐ 批量销毁粒子
   */
  destroyAllParticles(): void {
    const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    
    this.scene.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        emitters.push(child)
      }
    })
    
    emitters.forEach(emitter => {
      emitter.stop()
      emitter.destroy()
    })
    
    console.log(`🗑️ [ParticleSystem] 已销毁 ${emitters.length} 个粒子发射器`)
  }
}
