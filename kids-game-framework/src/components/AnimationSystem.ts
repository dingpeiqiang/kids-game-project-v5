/**
 * 🎬【可复用组件】动画系统
 *
 * 封装角色动画、UI 动画、过渡效果
 * 支持：帧动画、补间动画、过渡效果
 */

import type { Scene, GameObjects } from 'phaser'

/**
 * 帧动画配置
 */
export interface FrameAnimationConfig {
  /** 动画 key */
  key: string
  /** 帧图片 key 数组 */
  frames: string[]
  /** 帧率 */
  frameRate?: number
  /** 循环次数（-1 表示无限） */
  repeat?: number
  /** 是否 Yoyo（往返） */
  yoyo?: boolean
}

/**
 * 补间动画配置
 */
export interface TweenConfig {
  /** 目标对象 */
  targets: GameObjects.GameObject | GameObjects.GameObject[]
  /** 目标属性 */
  props?: Record<string, any>
  /** 持续时间（毫秒） */
  duration?: number
  /** 缓动函数 */
  ease?: string
  /** 重复次数 */
  repeat?: number
  /** Yoyo */
  yoyo?: boolean
  /** 延迟（毫秒） */
  delay?: number
  /** 完成回调 */
  onComplete?: () => void
}

/**
 * ⭐ 动画系统
 *
 * @example
 * const anims = new AnimationSystem(scene)
 *
 * // 创建帧动画
 * anims.createFrameAnimation({
 *   key: 'player_walk',
 *   frames: ['player_1', 'player_2', 'player_3'],
 *   frameRate: 10
 * })
 *
 * // 播放动画
 * anims.play('player_walk')
 *
 * // 补间动画
 * anims.tween({
 *   targets: sprite,
 *   props: { x: 200, alpha: 0 },
 *   duration: 500
 * })
 */
export class AnimationSystem {
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
  }

  // ============================================================================
  // 🎬 帧动画
  // ============================================================================

  /**
   * ⭐ 创建帧动画
   */
  createFrameAnimation(config: FrameAnimationConfig): void {
    const {
      key, frames, frameRate = 10, repeat = -1, yoyo = false
    } = config

    this.scene.anims.create({
      key,
      frames: frames.map(f => ({ key: f })),
      frameRate,
      repeat,
      yoyo
    })
  }

  /**
   * ⭐ 创建基于精灵表/纹理 atlas 的帧动画
   */
  createSpriteAnimation(config: {
    key: string
    startFrame: number
    endFrame: number
    frameRate?: number
    repeat?: number
    yoyo?: boolean
  }): void {
    const {
      key, startFrame, endFrame,
      frameRate = 10, repeat = -1, yoyo = false
    } = config

    this.scene.anims.create({
      key,
      frames: this.scene.anims.generateFrameNumbers(key, {
        start: startFrame,
        end: endFrame
      }),
      frameRate,
      repeat,
      yoyo
    })
  }

  /**
   * ⭐ 播放帧动画
   */
  play(key: string, ignoreIfPlaying: boolean = true): void {
    const sprite = this.scene.getSprites()
    sprite.forEach(s => {
      if (s.anims) {
        s.anims.play(key, ignoreIfPlaying)
      }
    })
  }

  /**
   * ⭐ 停止动画
   */
  stop(key?: string): void {
    const sprite = this.scene.getSprites()
    sprite.forEach(s => {
      if (s.anims) {
        if (key) {
          s.anims.stopOnFrame(s.anims.getCurrentFrame())
        } else {
          s.anims.stop()
        }
      }
    })
  }

  // ============================================================================
  // ✨ 补间动画
  // ============================================================================

  /**
   * ⭐ 补间动画
   */
  tween(config: TweenConfig): Phaser.Tweens.Tween {
    const {
      targets, props, duration = 300,
      ease = 'Sine.easeInOut', repeat = 0,
      yoyo = false, delay = 0, onComplete
    } = config

    return this.scene.tweens.add({
      targets,
      ...props,
      duration,
      ease,
      repeat,
      yoyo,
      delay,
      onComplete: onComplete ? () => onComplete() : undefined
    })
  }

  /**
   * ⭐ 淡入效果
   */
  fadeIn(target: GameObjects.GameObject, duration: number = 300): void {
    target.setAlpha(0)
    this.tween({
      targets: target,
      props: { alpha: 1 },
      duration
    })
  }

  /**
   * ⭐ 淡出效果
   */
  fadeOut(target: GameObjects.GameObject, duration: number = 300): void {
    this.tween({
      targets: target,
      props: { alpha: 0 },
      duration,
      onComplete: () => target.setVisible(false)
    })
  }

  /**
   * ⭐ 弹跳效果
   */
  bounceIn(target: GameObjects.GameObject, duration: number = 500): void {
    target.setScale(0)
    this.tween({
      targets: target,
      props: { scale: 1 },
      duration,
      ease: 'Back.easeOut'
    })
  }

  /**
   * ⭐ 抖动效果
   */
  shake(target: GameObjects.GameObject, intensity: number = 5): void {
    const originalX = target.x
    this.scene.tweens.add({
      targets: target,
      x: originalX + intensity,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        target.x = originalX
      }
    })
  }

  // ============================================================================
  // 🔄 预设动画
  // ============================================================================

  /**
   * ⭐ 脉冲效果（用于 UI 高亮）
   */
  pulse(target: GameObjects.GameObject, scale: number = 1.1): void {
    this.tween({
      targets: target,
      props: { scale },
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * ⭐ 浮动效果（用于提示）
   */
  float(target: GameObjects.GameObject, distance: number = 10): void {
    this.tween({
      targets: target,
      props: { y: target.y - distance },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  /**
   * ⭐ 旋转效果
   */
  rotate(target: GameObjects.GameObject, duration: number = 1000): void {
    this.tween({
      targets: target,
      props: { angle: 360 },
      duration,
      repeat: -1
    })
  }
}
