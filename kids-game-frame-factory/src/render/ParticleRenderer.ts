// ============================================================================
// ✨ 粒子特效组件
// ============================================================================
// 
// 📌 说明:
//   负责创建和管理粒子特效
//   支持爆炸、收集、升级等多种特效
//   提供预定义特效模板和自定义配置
// ============================================================================

import { ComponentBase } from '../core/ComponentBase'
import { GameEvent, GameEventType } from '../core/GameEvent'
import Phaser from 'phaser'
import type { Position } from '../types/common'

/**
 * ⭐ 粒子特效类型
 */
export type ParticleEffectType = 
  | 'explosion'       // 爆炸
  | 'collection'      // 收集
  | 'sparkle'         // 闪光
  | 'trail'           // 尾迹
  | 'burst'           // 喷射
  | 'confetti'        // 彩带
  | 'smoke'           // 烟雾
  | 'fire'            // 火焰
  | 'custom'          // 自定义

/**
 * ⭐ 粒子配置接口
 */
interface ParticleConfig {
  /** 粒子纹理键名 */
  textureKey: string
  /** 粒子数量 */
  count: number
  /** X 坐标（像素） */
  x: number
  /** Y 坐标（像素） */
  y: number
  /** 发射角度范围（度） */
  angle?: { min: number; max: number }
  /** 速度范围（像素/秒） */
  speed?: { min: number; max: number }
  /** 缩放范围 */
  scale?: { start: number; end: number }
  /** 透明度范围 */
  alpha?: { start: number; end: number }
  /** 颜色数组（可选） */
  colors?: number[]
  /** 重力 Y 分量 */
  gravityY?: number
  /** 生命周期（毫秒） */
  lifespan?: number
  /** 混合模式（可选） */
  blendMode?: Phaser.BlendModes
  /** 是否跟随发射器移动 */
  followEmitter?: boolean
}

/**
 * ⭐ 预设粒子特效配置
 */
interface PresetParticleConfig {
  /** 特效类型 */
  type: ParticleEffectType
  /** 位置 */
  position: Position
  /** 额外参数 */
  params?: any
}

/**
 * ⭐ 活跃的粒子特效
 */
interface ActiveParticleEffect {
  /** 特效 ID */
  id: string
  /** 特效类型 */
  type: ParticleEffectType
  /** 粒子发射器 */
  emitter: Phaser.GameObjects.Particles.ParticleEmitter
  /** 创建时间戳 */
  createdAt: number
  /** 持续时间 */
  duration: number
  /** 回调函数 */
  onComplete?: () => void
}

/**
 * ⭐ 粒子特效组件参数
 */
interface ParticleRendererParams {
  /** 默认粒子数量（可选，默认 20） */
  defaultCount?: number
  /** 默认生命周期（可选，默认 1000ms） */
  defaultLifespan?: number
  /** 最大同时存在的特效数（可选，默认 50） */
  maxActiveEffects?: number
  /** 是否启用调试模式（可选，默认 false） */
  debugMode?: boolean
}

/**
 * ⭐ 粒子特效组件类
 * 
 * @remarks
 * 职责：
 * - 创建和管理粒子特效
 * - 提供预设特效模板
 * - 性能优化（对象池）
 * - 自动清理过期特效
 * 
 * @example
 * ```typescript
 * const particleRenderer = new ParticleRenderer(scene)
 * particleRenderer.init({
 *   defaultCount: 30,
 *   defaultLifespan: 1500,
 *   maxActiveEffects: 50
 * })
 * 
 * // 播放爆炸特效
 * particleRenderer.playPresetEffect({
 *   type: 'explosion',
 *   position: { x: 400, y: 300 }
 * })
 * 
 * // 播放自定义特效
 * particleRenderer.createEffect({
 *   textureKey: 'star',
 *   count: 50,
 *   x: 200,
 *   y: 150,
 *   speed: { min: 100, max: 200 },
 *   colors: [0xff0000, 0x00ff00, 0x0000ff]
 * })
 * ```
 */
export class ParticleRenderer extends ComponentBase {
  /** 活跃的特效列表 */
  private activeEffects: Map<string, ActiveParticleEffect> = new Map()
  
  /** 特效计数器 */
  private effectCounter: number = 0
  
  /** 当前参数 */
  private params: ParticleRendererParams | null = null
  
  /** 预设特效配置缓存 */
  private presetConfigs: Map<ParticleEffectType, ParticleConfig> = new Map()
  
  /**
   * 构造函数
   * 
   * @param scene - Phaser 场景对象
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 'particle_renderer', '粒子渲染器')
  }
  
  /**
   * ⭐ 初始化粒子特效组件
   * 
   * @param params - 初始化参数
   */
  public init(params: any): void {
    super.init(params)
    
    this.params = params as ParticleRendererParams
    
    // 设置默认值
    if (this.params.defaultCount === undefined) {
      this.params.defaultCount = 20
    }
    if (this.params.defaultLifespan === undefined) {
      this.params.defaultLifespan = 1000
    }
    if (this.params.maxActiveEffects === undefined) {
      this.params.maxActiveEffects = 50
    }
    if (this.params.debugMode === undefined) {
      this.params.debugMode = false
    }
    
    // 初始化预设配置
    this.initializePresetConfigs()
    
    console.log(`✅ [ParticleRenderer] 粒子渲染器初始化完成`)
    console.log(`   默认数量：${this.params.defaultCount}`)
    console.log(`   默认寿命：${this.params.defaultLifespan}ms`)
    console.log(`   最大特效：${this.params.maxActiveEffects}`)
  }
  
  /**
   * ⭐ 每帧更新（清理过期特效）
   * 
   * @param deltaTime - 距离上一帧的时间间隔（毫秒）
   */
  public update(_deltaTime: number): void {
    if (!this.enabled) return
    
    const now = Date.now()
    
    // 遍历所有活跃特效
    this.activeEffects.forEach((effect, id) => {
      const age = now - effect.createdAt
      
      // 检查是否到期（简单判断：超过寿命就认为结束）
      if (age >= effect.duration) {
        // 调用回调
        if (effect.onComplete) {
          effect.onComplete()
        }
        
        // 销毁特效
        this.destroyEffect(id)
        
        if (this.params?.debugMode) {
          console.log(`✨ [ParticleRenderer] 特效结束：${id}`)
        }
      }
    })
    
    // 限制最大特效数
    if (this.activeEffects.size > (this.params?.maxActiveEffects ?? 50)) {
      // 移除最老的特效
      const oldestId = Array.from(this.activeEffects.keys())[0]
      this.destroyEffect(oldestId)
      
      if (this.params?.debugMode) {
        console.log(`⚠️ [ParticleRenderer] 超过最大特效数，移除：${oldestId}`)
      }
    }
  }
  
  /**
   * ⭐ 播放预设特效
   * 
   * @param preset - 预设特效配置
   * @returns 特效 ID
   */
  public playPresetEffect(preset: PresetParticleConfig): string {
    const config = this.getPresetConfig(preset.type, preset.params)
    
    // 应用位置
    config.x = preset.position.x
    config.y = preset.position.y
    
    return this.createEffect(config)
  }
  
  /**
   * ⭐ 创建自定义粒子特效
   * 
   * @param config - 粒子配置
   * @returns 特效 ID
   */
  public createEffect(config: ParticleConfig): string {
    const id = `effect_${++this.effectCounter}`
    
    // 创建发射器
    const emitter = this.createEmitter(config)
    
    // 保存特效信息
    const effect: ActiveParticleEffect = {
      id,
      type: 'custom',
      emitter,
      createdAt: Date.now(),
      duration: config.lifespan ?? this.params?.defaultLifespan ?? 1000
    }
    
    this.activeEffects.set(id, effect)
    
    if (this.params?.debugMode) {
      console.log(`✨ [ParticleRenderer] 创建特效：${id}`)
    }
    
    return id
  }
  
  /**
   * ⭐ 停止指定特效
   * 
   * @param id - 特效 ID
   */
  public stopEffect(id: string): void {
    const effect = this.activeEffects.get(id)
    
    if (effect) {
      effect.emitter.stop()
      
      if (this.params?.debugMode) {
        console.log(`⏹️ [ParticleRenderer] 停止特效：${id}`)
      }
    }
  }
  
  /**
   * ⭐ 立即销毁指定特效
   * 
   * @param id - 特效 ID
   */
  public destroyEffect(id: string): void {
    const effect = this.activeEffects.get(id)
    
    if (effect) {
      effect.emitter.destroy()
      this.activeEffects.delete(id)
      
      if (this.params?.debugMode) {
        console.log(`🗑️ [ParticleRenderer] 销毁特效：${id}`)
      }
    }
  }
  
  /**
   * ⭐ 销毁所有特效
   */
  public destroyAllEffects(): void {
    this.activeEffects.forEach((effect) => {
      effect.emitter.destroy()
    })
    
    this.activeEffects.clear()
    
    console.log(`🗑️ [ParticleRenderer] 已销毁所有特效`)
  }
  
  /**
   * ⭐ 获取活跃特效数量
   * 
   * @returns 特效数量
   */
  public getActiveEffectCount(): number {
    return this.activeEffects.size
  }
  
  /**
   * ⭐ 获取统计信息
   * 
   * @returns 统计信息对象
   */
  public getStats(): {
    activeEffects: number
    totalEmitters: number
    maxActiveEffects: number
  } {
    return {
      activeEffects: this.activeEffects.size,
      totalEmitters: this.activeEffects.size,
      maxActiveEffects: this.params?.maxActiveEffects ?? 50
    }
  }
  
  /**
   * ⭐ 设置特效完成回调
   * 
   * @param id - 特效 ID
   * @param callback - 回调函数
   */
  public setOnCompleteCallback(id: string, callback: () => void): void {
    const effect = this.activeEffects.get(id)
    
    if (effect) {
      effect.onComplete = callback
    }
  }
  
  /**
   * ⭐ 销毁组件
   */
  public destroy(): void {
    this.destroyAllEffects()
    super.destroy()
  }
  
  /**
   * ⭐ 初始化预设配置
   * 
   * @protected
   */
  protected initializePresetConfigs(): void {
    // 爆炸特效
    this.presetConfigs.set('explosion', {
      textureKey: 'circle',
      count: 30,
      x: 0,
      y: 0,
      angle: { min: 0, max: 360 },
      speed: { min: 100, max: 300 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      colors: [0xff4400, 0xff8800, 0xffff00],
      gravityY: 0,
      lifespan: 800
    })
    
    // 收集特效
    this.presetConfigs.set('collection', {
      textureKey: 'star',
      count: 15,
      x: 0,
      y: 0,
      angle: { min: 0, max: 360 },
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      colors: [0xffff00, 0x00ff00, 0x00ffff],
      gravityY: -50,
      lifespan: 600
    })
    
    // 闪光特效
    this.presetConfigs.set('sparkle', {
      textureKey: 'glow',
      count: 10,
      x: 0,
      y: 0,
      angle: { min: 0, max: 360 },
      speed: { min: 20, max: 80 },
      scale: { start: 1, end: 0.5 },
      alpha: { start: 0.8, end: 0 },
      colors: [0xffffff, 0xffffaa],
      gravityY: 0,
      lifespan: 500
    })
    
    // 尾迹特效
    this.presetConfigs.set('trail', {
      textureKey: 'circle',
      count: 5,
      x: 0,
      y: 0,
      angle: { min: 0, max: 360 },
      speed: { min: 10, max: 30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      colors: [0x8888ff],
      gravityY: 0,
      lifespan: 400
    })
    
    // 喷射特效
    this.presetConfigs.set('burst', {
      textureKey: 'circle',
      count: 20,
      x: 0,
      y: 0,
      angle: { min: 80, max: 100 },
      speed: { min: 200, max: 400 },
      scale: { start: 0.7, end: 0.3 },
      alpha: { start: 1, end: 0.5 },
      colors: [0x00ffff, 0x0088ff],
      gravityY: 100,
      lifespan: 600
    })
    
    // 彩带特效
    this.presetConfigs.set('confetti', {
      textureKey: 'rect',
      count: 50,
      x: 0,
      y: 0,
      angle: { min: 0, max: 360 },
      speed: { min: 100, max: 200 },
      scale: { start: 0.8, end: 0.4 },
      alpha: { start: 1, end: 0 },
      colors: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
      gravityY: 200,
      lifespan: 1500
    })
    
    // 烟雾特效
    this.presetConfigs.set('smoke', {
      textureKey: 'circle',
      count: 20,
      x: 0,
      y: 0,
      angle: { min: -30, max: 30 },
      speed: { min: 30, max: 60 },
      scale: { start: 1, end: 2 },
      alpha: { start: 0.5, end: 0 },
      colors: [0x888888, 0xaaaaaa],
      gravityY: -50,
      lifespan: 1200
    })
    
    // 火焰特效
    this.presetConfigs.set('fire', {
      textureKey: 'circle',
      count: 30,
      x: 0,
      y: 0,
      angle: { min: -20, max: 20 },
      speed: { min: 50, max: 100 },
      scale: { start: 1, end: 0.5 },
      alpha: { start: 0.8, end: 0 },
      colors: [0xff0000, 0xff4400, 0xff8800],
      gravityY: -80,
      lifespan: 800
    })
    
    console.log(`🎨 [ParticleRenderer] 预设配置初始化完成 (${this.presetConfigs.size}种)`)
  }
  
  /**
   * ⭐ 获取预设配置
   * 
   * @param type - 特效类型
   * @param params - 额外参数
   * @returns 粒子配置
   * @protected
   */
  protected getPresetConfig(type: ParticleEffectType, params?: any): ParticleConfig {
    const baseConfig = this.presetConfigs.get(type)
    
    if (!baseConfig) {
      console.warn(`⚠️ [ParticleRenderer] 未知的特效类型：${type}，使用爆炸特效`)
      return this.presetConfigs.get('explosion')!
    }
    
    // 复制并合并配置
    const config = { ...baseConfig, ...params }
    
    return config
  }
  
  /**
   * ⭐ 创建粒子发射器
   * 
   * @param config - 粒子配置
   * @returns 粒子发射器
   * @protected
   */
  protected createEmitter(config: ParticleConfig): Phaser.GameObjects.Particles.ParticleEmitter {
    // 确保纹理存在
    if (!this.scene.textures.exists(config.textureKey)) {
      // 创建默认纹理
      this.createDefaultTexture(config.textureKey)
    }
    
    // 准备发射器配置
    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: config.x,
      y: config.y,
      texture: config.textureKey,
      quantity: config.count,
      lifespan: config.lifespan ?? this.params?.defaultLifespan ?? 1000,
      gravityY: config.gravityY ?? 0,
      scale: {
        start: config.scale?.start ?? 1,
        end: config.scale?.end ?? 0
      },
      alpha: {
        start: config.alpha?.start ?? 1,
        end: config.alpha?.end ?? 0
      },
      speed: {
        min: config.speed?.min ?? 50,
        max: config.speed?.max ?? 150
      },
      angle: {
        min: config.angle?.min ?? 0,
        max: config.angle?.max ?? 360
      },
      blendMode: config.blendMode ?? Phaser.BlendModes.ADD,
      tint: config.colors ? config.colors[Math.floor(Math.random() * config.colors.length)] : undefined
    }
    
    // 创建发射器
    const particles = this.scene.add.particles(0, 0, config.textureKey, emitterConfig)
    
    // 立即发射一次
    particles.explode()
    
    // 设置为自动销毁
    setTimeout(() => {
      particles.destroy()
    }, (config.lifespan ?? this.params?.defaultLifespan ?? 1000) + 100)
    
    return particles
  }
  
  /**
   * ⭐ 创建默认纹理
   * 
   * @param key - 纹理键名
   * @protected
   */
  protected createDefaultTexture(key: string): void {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 })
    
    // 根据键名创建不同形状的纹理
    if (key === 'circle') {
      graphics.fillStyle(0xffffff)
      graphics.fillCircle(8, 8, 8)
    } else if (key === 'star') {
      graphics.fillStyle(0xffffff)
      // 绘制简单的星形
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const x = 8 + 7 * Math.cos(angle)
        const y = 8 + 7 * Math.sin(angle)
        
        if (i === 0) {
          graphics.beginPath()
          graphics.moveTo(x, y)
        } else {
          graphics.lineTo(x, y)
        }
      }
      graphics.closePath()
      graphics.fillPath()
    } else if (key === 'rect') {
      graphics.fillStyle(0xffffff)
      graphics.fillRect(4, 4, 8, 12)
    } else if (key === 'glow') {
      // 发光效果
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(8, 8, 8)
      graphics.fillStyle(0xffffff, 0.5)
      graphics.fillCircle(8, 8, 12)
    } else {
      // 默认圆形
      graphics.fillStyle(0xffffff)
      graphics.fillCircle(8, 8, 8)
    }
    
    graphics.generateTexture(key, 16, 16)
    graphics.destroy()
  }
  
  /**
   * ⭐ 处理事件（实现基类的抽象方法）
   * 
   * @param event - 游戏事件
   * @protected
   */
  protected handleEvent(event: GameEvent): void {
    // 响应游戏事件自动播放特效
    switch (event.type) {
      case GameEventType.COLLISION_DETECTED:
        // 碰撞时播放爆炸特效
        if (event.payload.eventType === 'start') {
          const pos = event.payload.contactPoint
          if (pos) {
            this.playPresetEffect({
              type: 'explosion',
              position: pos
            })
          }
        }
        break
        
      case GameEventType.ITEM_COLLECTED:
        // 物品被收集时播放收集特效
        const itemPos = event.payload.position
        if (itemPos) {
          this.playPresetEffect({
            type: 'collection',
            position: itemPos
          })
        }
        break
        
      case GameEventType.GAME_OVER:
        // 游戏结束时播放庆祝或爆炸特效
        this.playPresetEffect({
          type: 'confetti',
          position: { 
            x: this.scene.scale.width / 2, 
            y: this.scene.scale.height / 2 
          }
        })
        break
    }
  }
}
