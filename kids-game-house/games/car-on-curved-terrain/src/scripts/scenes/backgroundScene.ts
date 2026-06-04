/**
 * 背景场景（性能优化版）
 *
 * 核心变化：
 *   - 所有 Graphics 都设 scrollFactor(0)，固定在屏幕上
 *   - 在 update() 里手动平移，模拟视差 → 无论世界多宽，只渲染屏幕宽度
 *   - 全场景只有 4 个 Graphics 对象（sky / sun / hills / midGround）
 */

export default class BackgroundScene extends Phaser.Scene {
  private sky!:      Phaser.GameObjects.Graphics
  private sun!:      Phaser.GameObjects.Graphics
  private hills!:    Phaser.GameObjects.Graphics
  private midGround!:Phaser.GameObjects.Graphics

  // 预渲染时的图形宽度（3倍屏宽，循环平移）
  private W = 0
  private H = 0

  // 各层平移偏移
  private hillsOffX   = 0
  private midOffX     = 0
  private sunOffX     = 0

  private currentStyle: string = 'meadow'

  constructor() {
    super({ key: 'BackgroundScene' })
  }

  create() {
    this.W = this.cameras.main.width
    this.H = this.cameras.main.height
    this.buildBackground()
  }

  private buildBackground() {
    this.createSky()
    this.createSun()
    this.createHills()
    this.createMidGround()
  }

  /** 天空渐变 —— 固定全屏矩形，不需要随帧更新 */
  private createSky() {
    if (this.sky) try { this.sky.destroy() } catch (_) {}
    this.sky = this.add.graphics()
    this.sky.setScrollFactor(0).setDepth(0)
    this.sky.fillGradientStyle(0x1a1a4e, 0x1a1a4e, 0x87CEEB, 0x87CEEB, 1)
    this.sky.fillRect(0, 0, this.W, this.H)
  }

  /** 太阳 —— 固定屏幕位置，极慢视差 */
  private createSun() {
    if (this.sun) try { this.sun.destroy() } catch (_) {}
    this.sun = this.add.graphics()
    this.sun.setScrollFactor(0).setDepth(1)
    this.sun.fillStyle(0xFFFF99, 0.25)
    this.sun.fillCircle(150, 85, 58)
    this.sun.fillStyle(0xFFFFCC, 0.45)
    this.sun.fillCircle(150, 85, 38)
    this.sun.fillStyle(0xFFFFEE, 0.9)
    this.sun.fillCircle(150, 85, 24)
  }

  /**
   * 远山 —— 绘制 3 倍屏宽的一段山脉到 Graphics，
   * update 里通过 x 平移实现无限滚动（用 % 取模循环）
   */
  private createHills() {
    if (this.hills) try { this.hills.destroy() } catch (_) {}
    this.hills = this.add.graphics()
    this.hills.setScrollFactor(0).setDepth(2)

    const tileW = this.W * 2  // 绘制 2 倍屏宽作为一段
    const colors = [0x5B8C5A, 0x4a7a4a, 0x6aA06a]

    for (let i = 0; i < 7; i++) {
      const bx  = (i / 7) * tileW
      const by  = this.H * 0.55 + Math.sin(i * 0.9) * 25
      const hw  = tileW / 7 * 0.7
      const hh  = 70 + Math.sin(i * 1.7) * 30
      const col = colors[i % colors.length]

      this.hills.fillStyle(col, 0.38)
      this.hills.beginPath()
      this.hills.moveTo(bx - hw, by + 60)
      this.hills.lineTo(bx - hw * 0.25, by - hh)
      this.hills.lineTo(bx,             by - hh * 0.9)
      this.hills.lineTo(bx + hw * 0.3,  by - hh * 0.95)
      this.hills.lineTo(bx + hw,        by + 60)
      this.hills.closePath()
      this.hills.fillPath()
    }
    // 存一下 tileW 供 update 使用
    this.hills.setData('tileW', tileW)
  }

  /**
   * 中景丘陵 —— 同上，绘制 2 倍屏宽一段，循环平移
   */
  private createMidGround() {
    if (this.midGround) try { this.midGround.destroy() } catch (_) {}
    this.midGround = this.add.graphics()
    this.midGround.setScrollFactor(0).setDepth(3)

    const tileW = this.W * 2

    for (let i = 0; i < 9; i++) {
      const x     = (i / 9) * tileW
      const y     = this.H * 0.68 + Math.sin(i * 0.7) * 15
      const peakH = 35 + Math.sin(i * 2.1) * 18

      this.midGround.fillStyle(0x6B8E23, 0.45)
      this.midGround.beginPath()
      this.midGround.moveTo(x - tileW / 9 * 0.6, y + 25)
      this.midGround.lineTo(x - tileW / 9 * 0.2, y - peakH * 0.6)
      this.midGround.lineTo(x,                    y - peakH)
      this.midGround.lineTo(x + tileW / 9 * 0.2, y - peakH * 0.6)
      this.midGround.lineTo(x + tileW / 9 * 0.6, y + 25)
      this.midGround.closePath()
      this.midGround.fillPath()

      // 小树（圆）
      this.midGround.fillStyle(0x228B22, 0.55)
      this.midGround.fillCircle(x + Math.sin(i * 3.7) * 40, y - 18, 12)
    }
    this.midGround.setData('tileW', tileW)
  }

  /**
   * 每帧：根据主场景相机位置更新各层偏移，模拟视差
   */
  update() {
    const mainScene = this.scene.get('MainScene') as any
    if (!mainScene?.cameras?.main) return

    const camX = mainScene.cameras.main.scrollX

    // 远山视差系数 0.05，中景 0.10，太阳 0.02
    const hillTileW = (this.hills?.getData('tileW') as number) || this.W * 2
    const midTileW  = (this.midGround?.getData('tileW') as number) || this.W * 2

    // 取模实现无限循环平移
    this.hillsOffX = -(camX * 0.05) % hillTileW
    this.midOffX   = -(camX * 0.10) % midTileW
    this.sunOffX   =  -(camX * 0.02)

    if (this.hills)     this.hills.x     = this.hillsOffX
    if (this.midGround) this.midGround.x = this.midOffX
    if (this.sun)       this.sun.x       = this.sunOffX
  }

  /** 切换背景风格（仅重建背景，不切换颜色主题——简化实现避免频繁重绘） */
  switchStyle(style: string) {
    if (this.currentStyle === style) return
    this.currentStyle = style
    // 暂时只重置偏移，不重绘（背景简单，颜色差异不大）
    this.hillsOffX = 0
    this.midOffX   = 0
  }
}
