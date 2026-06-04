// ============================================================================
// 🎨 粒子渲染组件
// ============================================================================
// 
// 📌 说明:
//   负责渲染各种粒子效果（吃东西、碰撞等）
//   支持动态创建粒子系统和配置
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'

/**
 * 粒子效果类型
 */
type ParticleEffectType = 'eat' | 'collision' | 'powerup' | 'gameover'

/**
 * 粒子发射器配置
 */
interface ParticleEmitterConfig {
  /** 粒子纹理键值 */
  textureKey: string
  /** 最大粒子数 */
  maxParticles: number
  /** 发射速率（粒子/秒） */
  emissionRate?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** X 方向速度范围 */
  speedX?: { min: number; max: number }
  /** Y 方向速度范围 */
  speedY?: { min: number; max: number }
  /** 缩放范围 */
  scale?: { start: number; end: number }
  /** 透明度范围 */
  alpha?: { start: number; end: number }
  /** 重力 Y */
  gravityY?: number
}

/**
 * 粒子渲染组件参数
 */
interface ParticleRendererParams {
  /** GTRS 主题对象 */
  theme: any
  /** 单元格大小（像素） */
  cellSize: number
}

/**
 * 粒子渲染组件类
 * 
 * @remarks
 * 职责：
 * - 创建和管理粒子发射器
 * - 播放各种粒子效果
 * - 自动清理过期粒子
 * - 性能优化（对象池）
 * 
 * @example
 * ```typescript
 * const particleRenderer = new ParticleRenderer(scene)
 * container.add(particleRenderer)
 * 
 * particleRenderer.init({
 *   theme: loadedTheme,
 *   cellSize: 40
 * })
 * 
 * // 播放吃东西效果
 * particleRenderer.playEffect('eat', x, y)
 * ```
 */
export class ParticleRenderer extends ComponentBase {
  /** 粒子发射器映射表 */
  private emitters: Map<ParticleEffectType, Phaser.GameObjects.Particles.ParticleEmitter> = new Map()
  
  /** 当前参数 */
  private params: ParticleRendererParams | null = null
  
  /** 粒子容器组 */
  private particleGroup: Phaser.GameObjects.Group | null = null
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'particle_renderer', '粒子渲染器')
  }
  
  /**
   * 初始化粒子渲染器
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as ParticleRendererParams
    this.createParticleEmitters()
    
    console.log(`✨ [ParticleRenderer] 粒子渲染器初始化完成`)
  }
  
  /**
   * 销毁粒子渲染器
   */
  public destroy(): void {
    super.destroy()
    
    // 停止并销毁所有发射器
    this.emitters.forEach(emitter => {
      emitter.stop()
      emitter.destroy()
    })
    this.emitters.clear()
    
    if (this.particleGroup) {
      this.particleGroup.clear(true, true)
      this.particleGroup = null
    }
    
    console.log(`🗑️ [ParticleRenderer] 粒子渲染器已销毁`)
  }
  
  /**
   * 播放粒子效果
   * 
   * @param type - 效果类型
   * @param x - X 坐标（像素）
   * @param y - Y 坐标（像素）
   * 
   * @public
   */
  public playEffect(type: ParticleEffectType, x: number, y: number): void {
    if (!this.scene) return
    
    const emitter = this.emitters.get(type)
    if (!emitter) {
      console.warn(`⚠️ [ParticleRenderer] 未找到粒子效果：${type}`)
      return
    }
    
    // 设置发射位置
    emitter.setPosition(x, y)
    
    // 根据效果类型配置发射参数
    switch (type) {
      case 'eat':
        this.configureEatEffect(emitter)
        break
      case 'collision':
        this.configureCollisionEffect(emitter)
        break
      case 'powerup':
        this.configurePowerUpEffect(emitter)
        break
      case 'gameover':
        this.configureGameOverEffect(emitter)
        break
    }
    
    // 爆炸式发射
    emitter.explode()
    
    console.log(`✨ [ParticleRenderer] 播放粒子效果：${type}`)
  }
  
  /**
   * 创建所有粒子发射器
   * 
   * @private
   */
  private createParticleEmitters(): void {
    if (!this.params || !this.scene) return
    
    // 创建基础粒子纹理
    this.createParticleTexture('particle_circle', 0xffffff)
    this.createParticleTexture('particle_star', 0xffd700)
    this.createParticleTexture('particle_spark', 0x00ffff)
    
    // 为每种效果类型创建发射器
    this.createEmitter('eat', {
      textureKey: 'particle_circle',
      maxParticles: 10,
      speedX: { min: -50, max: 50 },
      speedY: { min: -50, max: 50 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      duration: 300
    })
    
    this.createEmitter('collision', {
      textureKey: 'particle_spark',
      maxParticles: 20,
      speedX: { min: -100, max: 100 },
      speedY: { min: -100, max: 100 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      duration: 500
    })
    
    this.createEmitter('powerup', {
      textureKey: 'particle_star',
      maxParticles: 15,
      speedX: { min: -80, max: 80 },
      speedY: { min: -80, max: 80 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      gravityY: -50,
      duration: 600
    })
    
    this.createEmitter('gameover', {
      textureKey: 'particle_circle',
      maxParticles: 50,
      speedX: { min: -150, max: 150 },
      speedY: { min: -150, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      duration: 1000
    })
    
    console.log(`🎆 [ParticleRenderer] 创建了 ${this.emitters.size} 个粒子发射器`)
  }
  
  /**
   * 创建单个粒子发射器
   * 
   * @param type - 效果类型
   * @param config - 发射器配置
   * 
   * @private
   */
  private createEmitter(type: ParticleEffectType, config: ParticleEmitterConfig): void {
    if (!this.scene) return
    
    const emitter = this.scene.add.particles(0, 0, config.textureKey, {
      maxParticles: config.maxParticles,
      speedX: config.speedX,
      speedY: config.speedY,
      scale: config.scale,
      alpha: config.alpha,
      gravityY: config.gravityY ?? 0,
      lifespan: config.duration ?? 500,
      blendMode: Phaser.BlendModes.ADD
    })
    
    emitter.stop() // 初始停止，需要时再触发
    this.emitters.set(type, emitter)
  }
  
  /**
   * 创建粒子纹理
   * 
   * @param textureKey - 纹理键值
   * @param color - 颜色值
   * 
   * @private
   */
  private createParticleTexture(textureKey: string, color: number): void {
    if (!this.params || !this.scene) return
    
    const size = Math.max(8, this.params.cellSize * 0.3)
    const graphics = this.scene.add.graphics()
    
    // 绘制圆形粒子
    graphics.fillStyle(color, 1)
    graphics.fillCircle(size / 2, size / 2, size / 2)
    
    // 生成纹理
    graphics.generateTexture(textureKey, size, size)
    graphics.destroy()
  }
  
  /**
   * 配置吃东西效果
   * 
   * @param emitter - 粒子发射器
   * 
   * @private
   */
  private configureEatEffect(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    // Phaser 粒子发射器配置在创建时已设置，这里不需要动态修改
    // 如果需要修改，可以通过 emitter 的属性直接设置
    emitter.speedX = { min: -50, max: 50 }
    emitter.speedY = { min: -50, max: 50 }
  }
  
  /**
   * 配置碰撞效果
   * 
   * @param emitter - 粒子发射器
   * 
   * @private
   */
  private configureCollisionEffect(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    emitter.speedX = { min: -100, max: 100 }
    emitter.speedY = { min: -100, max: 100 }
  }
  
  /**
   * 配置升级效果
   * 
   * @param emitter - 粒子发射器
   * 
   * @private
   */
  private configurePowerUpEffect(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    emitter.gravityY = -50
  }
  
  /**
   * 配置游戏结束效果
   * 
   * @param emitter - 粒子发射器
   * 
   * @private
   */
  private configureGameOverEffect(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    emitter.speedX = { min: -150, max: 150 }
    emitter.speedY = { min: -150, max: 150 }
  }
  
  /**
   * 处理组件事件
   * 
   * @param event - 游戏事件对象
   * 
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.SNAKE_EAT:
        // 吃到食物，播放粒子效果
        if (event.payload.position) {
          this.playEffect('eat', event.payload.position.x, event.payload.position.y)
        }
        break
        
      case GameEventType.SNAKE_COLLIDE_WALL:
      case GameEventType.SNAKE_COLLIDE_SELF:
        // 碰撞，播放碰撞效果
        if (event.payload.position) {
          this.playEffect('collision', event.payload.position.x, event.payload.position.y)
        }
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束，播放结束效果
        if (event.payload.position) {
          this.playEffect('gameover', event.payload.position.x, event.payload.position.y)
        }
        break
        
      default:
        // 忽略其他事件
        break
    }
  }
}
