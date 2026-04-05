/**
 * 粒子效果系统 - Phaser 3.16 兼容版
 *
 * Phaser 3.16 API:
 *   scene.add.particles(texture, frame, emitterConfig) → ParticleEmitterManager
 *   ParticleEmitterManager.emitParticleAt(x, y, count) 直接在 manager 上发射
 *   注意：emitters 是 Phaser.Structs.List，不能用 [0] 取值，需用 .list[0]
 */
export default class ParticleEffects {
  private scene: Phaser.Scene
  private wheelManager: any | null = null
  private exhaustManager: any | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createParticles()
  }

  private createParticles() {
    // ---------- 生成纹理 ----------
    // 车轮烟雾 - 灰色小圆
    const g1 = this.scene.add.graphics()
    g1.fillStyle(0xaaaaaa, 1)
    g1.fillCircle(4, 4, 4)
    g1.generateTexture('particle-circle', 8, 8)
    g1.destroy()

    // 尾气 - 浅灰大圆
    const g2 = this.scene.add.graphics()
    g2.fillStyle(0xcccccc, 1)
    g2.fillCircle(5, 5, 5)
    g2.generateTexture('particle-exhaust', 10, 10)
    g2.destroy()

    // ---------- 创建发射器 ----------
    // Phaser 3.16: scene.add.particles(texture, frame?, emitterConfig?)
    //   → 返回 ParticleEmitterManager（自带 emitParticleAt 方法）

    // 车轮烟雾
    try {
      // @ts-ignore
      const wm = this.scene.add.particles('particle-circle', undefined, {
        speed: { min: 20, max: 50 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 350,
        gravityY: 20,
        quantity: 2,
        on: false
      })
      this.wheelManager = wm
      console.log('✅ Wheel particles OK, manager type:', wm.type, 'emitParticleAt:', typeof wm.emitParticleAt)
    } catch (e) {
      console.warn('❌ Wheel particles failed:', e)
    }

    // 汽车尾气
    try {
      // @ts-ignore
      const em = this.scene.add.particles('particle-exhaust', undefined, {
        speed: { min: 30, max: 70 },
        angle: { min: 170, max: 190 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 500,
        gravityY: -20,
        quantity: 1,
        on: false
      })
      this.exhaustManager = em
      console.log('✅ Exhaust particles OK, manager type:', em.type, 'emitParticleAt:', typeof em.emitParticleAt)
    } catch (e) {
      console.warn('❌ Exhaust particles failed:', e)
    }
  }

  /** 在指定位置发射车轮烟雾 */
  private emitWheelSmoke(x: number, y: number, count: number) {
    if (!this.wheelManager) return
    try {
      // 直接在 ParticleEmitterManager 上调用 emitParticleAt
      this.wheelManager.emitParticleAt(x, y, count)
    } catch (_) { /* 静默 */ }
  }

  /** 在指定位置发射尾气 */
  private emitExhaust(x: number, y: number) {
    if (!this.exhaustManager) return
    try {
      this.exhaustManager.emitParticleAt(x, y, 1)
    } catch (_) { /* 静默 */ }
  }

  /** 每帧调用：根据车辆状态产生粒子 */
  update(
    wheelRearX: number, wheelRearY: number,
    wheelFrontX: number, wheelFrontY: number,
    wheelsDown: { rear: boolean; front: boolean },
    isAccelerating: boolean
  ) {
    if (!wheelsDown.rear) return

    if (isAccelerating) {
      if (Math.random() > 0.5) {
        this.emitWheelSmoke(wheelRearX, wheelRearY + 15, 2)
      }
      if (Math.random() > 0.3) {
        this.emitExhaust(wheelRearX - 25, wheelRearY - 10)
      }
    } else {
      if (Math.random() > 0.9) {
        this.emitWheelSmoke(wheelRearX, wheelRearY + 15, 1)
      }
      if (Math.random() > 0.8) {
        this.emitExhaust(wheelRearX - 25, wheelRearY - 10)
      }
    }
  }

  destroy() {
    try { this.wheelManager && this.wheelManager.destroy() } catch (_) {}
    try { this.exhaustManager && this.exhaustManager.destroy() } catch (_) {}
    this.wheelManager = null
    this.exhaustManager = null
  }
}
