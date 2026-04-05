export default class ParticleEffects {
  private scene: Phaser.Scene
  private wheelParticles: any | null = null  // Phaser 3.16 ParticleEmitterManager
  private exhaustParticles: any | null = null  // Phaser 3.16 ParticleEmitterManager
  private wheelEmitter: any | null = null  // 实际的发射器
  private exhaustEmitter: any | null = null  // 实际的发射器

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createParticles()
  }

  private createParticles() {
    console.log('🎨 Creating particle textures...')
    
    // 创建车轮烟雾粒子纹理
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('particle-circle', 8, 8)
    graphics.destroy()
    console.log('✅ Wheel smoke texture created: particle-circle')

    // 创建尾气粒子纹理（稍大的圆形）
    const exhaustGraphics = this.scene.add.graphics()
    exhaustGraphics.fillStyle(0xcccccc, 0.8)
    exhaustGraphics.fillCircle(3, 3, 3)
    exhaustGraphics.generateTexture('particle-exhaust', 6, 6)
    exhaustGraphics.destroy()
    console.log('✅ Exhaust texture created: particle-exhaust')

    // 车轮烟雾粒子
    try {
      // @ts-ignore - Phaser 3.16 particle API
      const wheelManager = this.scene.add.particles(0, 0, 'particle-circle', {
        speed: { min: 20, max: 50 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 400,
        gravityY: 20,
        quantity: 2,
        emitting: false
      })
      this.wheelParticles = wheelManager
      // Phaser 3.16: particles() returns ParticleEmitterManager, need to get emitter
      this.wheelEmitter = wheelManager
      console.log('✅ Wheel particles created')
    } catch (e) {
      console.warn('❌ Failed to create wheel particles:', e)
    }

    // 汽车尾气粒子
    try {
      // @ts-ignore - Phaser 3.16 particle API
      const exhaustManager = this.scene.add.particles(0, 0, 'particle-exhaust', {
        speed: { min: 30, max: 60 },
        angle: { min: 170, max: 190 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 300,
        gravityY: -10,  // 尾气向上升
        quantity: 1,
        emitting: false
      })
      this.exhaustParticles = exhaustManager
      this.exhaustEmitter = exhaustManager
      console.log('✅ Exhaust particles created')
    } catch (e) {
      console.warn('❌ Failed to create exhaust particles:', e)
    }
  }

  emitWheelSmoke(x: number, y: number, intensity: number = 1) {
    if (this.wheelEmitter) {
      try {
        this.wheelEmitter.emitParticleAt(x, y, Math.floor(3 * intensity))
      } catch (e) {
        console.warn('Wheel smoke emission error:', e)
      }
    }
  }

  emitExhaust(x: number, y: number) {
    if (this.exhaustEmitter) {
      try {
        console.log(`💨 Emitting exhaust at (${x.toFixed(0)}, ${y.toFixed(0)})`)
        this.exhaustEmitter.emitParticleAt(x, y, 1)
      } catch (e) {
        console.warn('Exhaust emission error:', e)
      }
    } else {
      console.warn('⚠️ Exhaust emitter is null!')
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
      
      // 加速时产生尾气
      if (Math.random() > 0.5) {
        this.emitExhaust(wheelRearX - 30, wheelRearY - 10)
      }
    }

    // 刹车时产生更多烟雾
    if (!isAccelerating && wheelsDown.rear && Math.random() > 0.9) {
      this.emitWheelSmoke(wheelRearX, wheelRearY + 20, 0.8)
    }
    
    // 正常行驶时也有少量尾气
    if (wheelsDown.rear && Math.random() > 0.85) {
      this.emitExhaust(wheelRearX - 30, wheelRearY - 10)
    }
  }

  destroy() {
    if (this.wheelParticles) {
      try { 
        this.wheelParticles.destroy() 
      } catch (e) { 
        console.warn('Error destroying wheel particles:', e)
      }
      this.wheelParticles = null
      this.wheelEmitter = null
    }
    
    if (this.exhaustParticles) {
      try { 
        this.exhaustParticles.destroy() 
      } catch (e) { 
        console.warn('Error destroying exhaust particles:', e)
      }
      this.exhaustParticles = null
      this.exhaustEmitter = null
    }
  }
}
