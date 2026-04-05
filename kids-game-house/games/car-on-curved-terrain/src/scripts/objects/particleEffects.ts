export default class ParticleEffects {
  private scene: Phaser.Scene
  private wheelParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createParticles()
  }

  private createParticles() {
    // 创建车轮烟雾粒子纹理
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('particle-circle', 8, 8)
    graphics.destroy()

    // Phaser 3.16 粒子 API: scene.add.particles(x, y, key, config)
    // @ts-ignore - Phaser 3.16 uses different particle API
    const particles = this.scene.add.particles(0, 0, 'particle-circle', {
      speed: { min: 20, max: 50 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      gravityY: 20,
      quantity: 2,
      blendMode: 'ADD',
      emitting: false
    })
    this.wheelParticles = particles
  }

  emitWheelSmoke(x: number, y: number, intensity: number = 1) {
    if (this.wheelParticles) {
      this.wheelParticles.emitParticleAt(x, y, Math.floor(3 * intensity))
    }
  }

  startWheelSmoke(x: number, y: number) {
    // 不做持续发射，使用 emitWheelSmoke 按需发射
  }

  stopWheelSmoke() {
    // 无需操作
  }

  update(wheelRearX: number, wheelRearY: number, wheelFrontX: number, wheelFrontY: number, 
         wheelsDown: { rear: boolean; front: boolean }, isAccelerating: boolean) {
    // 当加速且车轮着地时产生烟雾
    if (isAccelerating && wheelsDown.rear) {
      if (Math.random() > 0.7) {
        this.emitWheelSmoke(wheelRearX, wheelRearY + 20, 1.5)
      }
    }

    // 刹车时产生更多烟雾
    if (!isAccelerating && wheelsDown.rear && Math.random() > 0.9) {
      this.emitWheelSmoke(wheelRearX, wheelRearY + 20, 0.8)
    }
  }

  destroy() {
    if (this.wheelParticles) {
      try { this.wheelParticles.destroy() } catch (e) { /* ignore */ }
      this.wheelParticles = null
    }
  }
}
