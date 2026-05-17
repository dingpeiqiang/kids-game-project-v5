/**
 * 地图装饰系统 (性能优化版)
 * 把所有装饰合并到 3 个 Graphics 层，而非每个元素独立对象
 *
 * 性能核心原则：
 *   - farLayer  (1个 Graphics, scrollFactor=0.15) — 远山
 *   - midLayer  (1个 Graphics, scrollFactor=0.35) — 树木/灌木/石头
 *   - nearLayer (1个 Graphics, scrollFactor=0.7)  — 花朵/草
 * 共 3 个 Graphics 对象（原来 200+）
 */

export interface DecorationConfig {
  worldWidth: number
  style: 'meadow' | 'forest' | 'desert' | 'snow' | 'canyon'
  density: number   // 0~1，控制数量
  seed?: number     // 种子，保证可复现（避免 Math.random）
}

const COLOR_THEMES = {
  meadow: {
    treeTrunk:    0x8B4513,
    treeLeaves:   [0x228B22, 0x2E8B57, 0x32CD32, 0x006400] as number[],
    flowerColors: [0xFF69B4, 0xFFFF00, 0xFF4500, 0x9370DB] as number[],
    rockColors:   [0x808080, 0x696969, 0x778899] as number[],
    bushColor:    0x3CB371,
    cloudColor:   0xFFFFFF,
    mountainColors:[0x6B8E23, 0x556B2F, 0x8FBC8F] as number[],
  },
  forest: {
    treeTrunk:    0x5C3317,
    treeLeaves:   [0x006400, 0x008000, 0x004d00, 0x1a5c1a] as number[],
    flowerColors: [0x8B4513, 0xDAA520] as number[],
    rockColors:   [0x555555, 0x444444] as number[],
    bushColor:    0x006400,
    cloudColor:   0xE8E8E8,
    mountainColors:[0x2F4F2F, 0x1a3a1a, 0x3a5a3a] as number[],
  },
  desert: {
    treeTrunk:    0x8B7355,
    treeLeaves:   [0x9ACD32, 0x6B8E23] as number[],
    flowerColors: [0xFFD700, 0xFF8C00] as number[],
    rockColors:   [0xC2B280, 0xD2B48C, 0x8B7355] as number[],
    bushColor:    0x9ACD32,
    cloudColor:   0xFFF8DC,
    mountainColors:[0xC2B280, 0xD2B48C, 0x8B7355] as number[],
  },
  snow: {
    treeTrunk:    0x4a3728,
    treeLeaves:   [0x1a5c2a, 0x2E8B57] as number[],
    flowerColors: [0xFFFFFF, 0xE0E0FF] as number[],
    rockColors:   [0xBBBBBB, 0x999999] as number[],
    bushColor:    0x1a5c2a,
    cloudColor:   0xF0F8FF,
    mountainColors:[0xBBBBBB, 0x999999, 0xDDDDDD] as number[],
  },
  canyon: {
    treeTrunk:    0x5C3317,
    treeLeaves:   [0x556B2F, 0x6B8E23, 0x8B7355] as number[],
    flowerColors: [0xFF6347, 0xFFD700, 0xFF8C00] as number[],
    rockColors:   [0x8B4513, 0xA0522D, 0x6B3A2A] as number[],
    bushColor:    0x556B2F,
    cloudColor:   0xFFFACD,
    mountainColors:[0x8B4513, 0xA0522D, 0xCD853F] as number[],
  }
}

/** 轻量级确定性伪随机（LCG），避免 Math.random() */
class SeededRandom {
  private s: number
  constructor(seed: number) { this.s = seed >>> 0 }
  next(): number {
    this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0
    return this.s / 0x100000000
  }
  range(lo: number, hi: number): number { return lo + this.next() * (hi - lo) }
  int(lo: number, hi: number): number { return Math.floor(this.range(lo, hi + 1)) }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)] }
}

export class MapDecorator {
  private scene: Phaser.Scene
  private config: DecorationConfig
  private c: typeof COLOR_THEMES.meadow
  private rng: SeededRandom

  // 只有 3 个 Graphics 对象
  private farLayer!:  Phaser.GameObjects.Graphics
  private midLayer!:  Phaser.GameObjects.Graphics
  private nearLayer!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, config: DecorationConfig) {
    this.scene = scene
    this.config = config
    this.c = COLOR_THEMES[config.style] || COLOR_THEMES.meadow
    this.rng = new SeededRandom(config.seed ?? 42)
  }

  generate(): void {
    const W = this.config.worldWidth

    // 创建 3 层（远→近）
    this.farLayer = this.scene.add.graphics()
    this.farLayer.setScrollFactor(0.15).setDepth(3)

    this.midLayer = this.scene.add.graphics()
    this.midLayer.setScrollFactor(0.5).setDepth(5)

    this.nearLayer = this.scene.add.graphics()
    this.nearLayer.setScrollFactor(0.8).setDepth(7)

    // 按层绘制（都画到同一 Graphics 上）
    this.drawMountains(this.farLayer, W)
    this.drawClouds(this.farLayer, W)
    this.drawTrees(this.midLayer, W)
    this.drawBushesAndRocks(this.midLayer, W)
    this.drawFlowers(this.nearLayer, W)
  }

  /** 远山：折线多边形，不用曲线 */
  private drawMountains(g: Phaser.GameObjects.Graphics, W: number): void {
    const count = Math.floor(W / 500) + 3
    for (let i = 0; i < count; i++) {
      const x    = i * 480 + this.rng.range(-80, 80)
      const baseY= 280 + this.rng.range(-30, 30)
      const w2   = this.rng.range(150, 280)
      const h    = this.rng.range(80, 160)
      const color= this.rng.pick(this.c.mountainColors)

      g.fillStyle(color, 0.55)
      g.beginPath()
      g.moveTo(x - w2, baseY + 80)
      g.lineTo(x - w2 * 0.3, baseY - h)
      g.lineTo(x + w2 * 0.15, baseY - h * 0.88)
      g.lineTo(x + w2, baseY + 80)
      g.closePath()
      g.fillPath()
    }
  }

  /** 云朵：画到 farLayer，用整数坐标避免亚像素锯齿 */
  private drawClouds(g: Phaser.GameObjects.Graphics, W: number): void {
    const count = Math.floor(W / 900) + 4
    g.fillStyle(this.c.cloudColor, 0.80)
    for (let i = 0; i < count; i++) {
      const x = Math.floor(i * 850 + this.rng.range(0, 400))
      const y = Math.floor(this.rng.range(40, 130))
      const s = Math.floor(this.rng.range(20, 45))
      // 5 个圆拼云
      g.fillCircle(x,        y,        s)
      g.fillCircle(x - s,    y + 4,    s * 0.72)
      g.fillCircle(x + s,    y + 3,    s * 0.82)
      g.fillCircle(x - s * 0.3, y - s * 0.4, s * 0.62)
      g.fillCircle(x + s * 0.4, y - s * 0.35, s * 0.58)
    }
  }

  /** 树木：画到 midLayer，数量按密度控制 */
  private drawTrees(g: Phaser.GameObjects.Graphics, W: number): void {
    // 密度 0.5 → 每 300px 一棵，最多 60 棵
    const spacing = Math.max(200, Math.floor(300 / this.config.density))
    const count   = Math.min(60, Math.floor(W / spacing))
    for (let i = 0; i < count; i++) {
      const x  = i * spacing + this.rng.range(0, spacing * 0.8)
      const y  = this.rng.range(360, 430)
      const s  = this.rng.range(18, 32)
      const lc = this.rng.pick(this.c.treeLeaves)
      // 树干
      g.fillStyle(this.c.treeTrunk)
      g.fillRect(Math.floor(x - s * 0.15), Math.floor(y - s * 0.5), Math.ceil(s * 0.3), Math.ceil(s * 1.4))
      // 树冠（3个圆代替4个，减少顶点）
      g.fillStyle(lc)
      g.fillCircle(Math.floor(x),            Math.floor(y - s * 1.2), Math.ceil(s * 0.85))
      g.fillCircle(Math.floor(x - s * 0.55), Math.floor(y - s * 0.75), Math.ceil(s * 0.6))
      g.fillCircle(Math.floor(x + s * 0.5),  Math.floor(y - s * 0.75), Math.ceil(s * 0.6))
    }
  }

  /** 灌木 + 石头 */
  private drawBushesAndRocks(g: Phaser.GameObjects.Graphics, W: number): void {
    const spacing = Math.max(300, Math.floor(500 / this.config.density))
    const count   = Math.min(40, Math.floor(W / spacing))
    for (let i = 0; i < count; i++) {
      const x = i * spacing + this.rng.range(0, spacing * 0.9)
      const y = this.rng.range(390, 440)

      // 灌木（2个圆）
      const bc   = this.c.bushColor
      const bsz  = this.rng.range(10, 18)
      g.fillStyle(bc, 0.9)
      g.fillCircle(Math.floor(x),          Math.floor(y - bsz * 0.5), Math.ceil(bsz))
      g.fillCircle(Math.floor(x + bsz * 0.7), Math.floor(y - bsz * 0.3), Math.ceil(bsz * 0.7))

      // 石头（椭圆用矩形+透明度模拟即可）
      const rc  = this.rng.pick(this.c.rockColors)
      const rsz = this.rng.range(6, 14)
      g.fillStyle(rc, 0.88)
      g.fillRect(
        Math.floor(x + bsz * 1.8),
        Math.floor(y - rsz * 0.5),
        Math.ceil(rsz * 1.6),
        Math.ceil(rsz)
      )
    }
  }

  /** 花朵：画到 nearLayer，每朵只用 1 个填充圆（去掉花茎/花瓣细节） */
  private drawFlowers(g: Phaser.GameObjects.Graphics, W: number): void {
    const spacing = Math.max(120, Math.floor(200 / this.config.density))
    const count   = Math.min(80, Math.floor(W / spacing))
    for (let i = 0; i < count; i++) {
      const x  = i * spacing + this.rng.range(0, spacing * 0.95)
      const y  = this.rng.range(415, 445)
      const fc = this.rng.pick(this.c.flowerColors)
      const r  = this.rng.range(3, 6)
      g.fillStyle(fc, 0.9)
      g.fillCircle(Math.floor(x), Math.floor(y), Math.ceil(r))
    }
  }

  /** 销毁 3 个 Graphics 对象 */
  destroy(): void {
    try { this.farLayer?.destroy()  } catch (_) {}
    try { this.midLayer?.destroy()  } catch (_) {}
    try { this.nearLayer?.destroy() } catch (_) {}
  }
}

export const STYLE_FOR_DIFFICULTY: Record<string, 'meadow' | 'forest' | 'desert' | 'snow' | 'canyon'> = {
  easy:   'meadow',
  medium: 'forest',
  hard:   'canyon'
}
