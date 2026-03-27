/**
 * 🎆【可复用组件】粒子系统
 *
 * 封装粒子效果，支持：
 * - 爆炸效果
 * - 飘落效果
 * - 轨迹效果
 * - 自定义粒子
 */

import type { Scene } from 'phaser'

/**
 * 粒子配置
 */
export interface ParticleConfig {
  /** 粒子纹理 key */
  texture: string
  /** 发射位置 X */
  x: number
  /** 发射位置 Y */
  y: number
  /** 粒子数量 */
  quantity?: number
  /** 速度范围 */
  speed?: { min: number; max: number }
  /** 角度范围 { min, max }（度）*/
  angle?: { min: number; max: number }
  /** 缩放范围 { min, max } */
  scale?: { min: number; max: number }
  /** 透明度范围 { min, max } */
  alpha?: { min: number; max: number }
  /** 生命周期（毫秒） */
  lifespan?: number
  /** 发射器持续时间（毫秒，0 表示一次性） */
  duration?: number
  /** 频率（每多少毫秒发射一个） */
  frequency?: number
  /** 重力 Y */
  gravityY?: number
}

/**
 * ⭐ 粒子系统
 *
 * @example
 * const particles = new ParticleSystem(scene)
 *
 * // 爆炸效果
 * particles.explode({ x: 100, y: 100, texture: 'particle' })
 *
 * // 飘落效果
 * particles.emitter({
 *   x: 200, y: 0,
 *   texture: 'snow',
 *   duration: 5000,
 *   frequency: 100
 * })
 */
export class ParticleSystem {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  /**
   * ⭐ 一次性爆炸效果
   */
  explode(config: ParticleConfig): void {
    const {
      x, y, texture,
      quantity = 20,
      speed = { min: 50, max: 150 },
      angle = { min: 0, max: 360 },
      scale = { min: 0.5, max: 1 },
      alpha = { min: 0.5, max: 1 },
      lifespan = 1000
    } = config

    const emitter = this.scene.add.particles(x, y, texture, {
      quantity,
      speed: { min: speed.min, max: speed.max },
      angle: { min: angle.min, max: angle.max },
      scale: { start: scale.max, end: scale.min },
      alpha: { start: alpha.max, end: alpha.min },
      lifespan,
      gravityY: 100,
      emitting: false
    })

    // 发射后自动销毁
    this.scene.time.delayedCall(lifespan + 100, () => {
      emitter.destroy()
    })
  }

  /**
   * ⭐ 持续发射粒子
   */
  emitter(config: ParticleConfig): Phaser.GameObjects.Particles.ParticleEmitter {
    const {
      x, y, texture,
      duration = 0,
      frequency = 100,
      quantity = 1,
      speed = { min: 30, max: 80 },
      scale = { min: 0.3, max: 0.8 },
      alpha = { min: 0.3, max: 0.8 },
      lifespan = 2000,
      gravityY = 50
    } = config

    return this.scene.add.particles(x, y, texture, {
      emitting: true,
      frequency,
      quantity,
      speed: { min: speed.min, max: speed.max },
      scale: { start: scale.max, end: scale.min },
      alpha: { start: alpha.max, end: alpha.min },
      lifespan,
      gravityY,
      ...(duration > 0 ? { duration } : {})
    })
  }

  /**
   * ⭐ 创建粒子纹理（程序生成）
   */
  createTexture(key: string, color: number = 0xffffff, size: number = 8): void {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 })
    graphics.fillStyle(color, 1)
    graphics.fillCircle(size / 2, size / 2, size / 2)
    graphics.generateTexture(key, size, size)
  }

  /**
   * ⭐ 收集粒子效果（吃道具时）
   */
  collect(x: number, y: number, color: number = 0xffff00): void {
    this.explode({
      x, y,
      texture: 'particle',
      quantity: 10,
      speed: { min: 30, max: 80 },
      scale: { min: 0.2, max: 0.5 },
      lifespan: 500,
      gravityY: -50
    })
  }
}
