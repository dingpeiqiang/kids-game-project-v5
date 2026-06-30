/**
 * Canvas 2D 精灵图 / 图集工具（竖屏 2D 游戏共用）
 *
 * 支持：
 * - 单张 PNG 整图绘制
 * - 均匀切格的横向/网格精灵表（如 beatDragon 龙身 2 帧）
 * - 命名帧矩形（手工 JSON 或 TexturePacker 子集）
 * - 按时间播帧的 SpriteAnimator
 */

export type SpriteSource = string | HTMLImageElement

export interface SpriteRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

export interface SpriteAtlasJson {
  image: string
  frames: Record<string, { x: number; y: number; w: number; h: number }>
}

/** 加载单图；失败返回 null（与 plantZombieDefense2d / beatDragon 一致，便于 emoji 回退） */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadImages(
  entries: Record<string, string>,
): Promise<Record<string, HTMLImageElement | null>> {
  const out: Record<string, HTMLImageElement | null> = {}
  await Promise.all(
    Object.entries(entries).map(async ([key, url]) => {
      out[key] = await loadImage(url)
    }),
  )
  return out
}

/** 以中心点为锚点绘制某一帧；无图时返回 false */
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  frame: SpriteRect,
  cx: number,
  cy: number,
  dw: number,
  dh: number,
  options?: { flipX?: boolean; rotation?: number; alpha?: number },
): boolean {
  if (!image) return false
  const { flipX = false, rotation = 0, alpha = 1 } = options ?? {}
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(cx, cy)
  if (rotation) ctx.rotate(rotation)
  if (flipX) ctx.scale(-1, 1)
  ctx.drawImage(
    image,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    -dw / 2,
    -dh / 2,
    dw,
    dh,
  )
  ctx.restore()
  return true
}

export type DrawSpriteFrameOptions = { flipX?: boolean; rotation?: number; alpha?: number }

/** 整图缩放（与 PZD2d drawSprite 相同语义） */
export function drawSpriteImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  cx: number,
  cy: number,
  w: number,
  h: number,
): boolean {
  if (!image) return false
  ctx.drawImage(image, cx - w / 2, cy - h / 2, w, h)
  return true
}

/** 均匀网格切表：如 columns=2, rows=1 表示横向两帧 */
export class UniformSpriteSheet {
  readonly image: HTMLImageElement
  readonly frameWidth: number
  readonly frameHeight: number
  readonly columns: number
  readonly rows: number
  readonly frameCount: number

  constructor(image: HTMLImageElement, columns: number, rows = 1) {
    this.image = image
    this.columns = Math.max(1, columns)
    this.rows = Math.max(1, rows)
    this.frameWidth = image.width / this.columns
    this.frameHeight = image.height / this.rows
    this.frameCount = this.columns * this.rows
  }

  frameAt(index: number): SpriteRect {
    const i = ((index % this.frameCount) + this.frameCount) % this.frameCount
    const col = i % this.columns
    const row = Math.floor(i / this.columns)
    return {
      sx: col * this.frameWidth,
      sy: row * this.frameHeight,
      sw: this.frameWidth,
      sh: this.frameHeight,
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    cx: number,
    cy: number,
    dw: number,
    dh: number,
    options?: DrawSpriteFrameOptions,
  ): boolean {
    return drawSpriteFrame(ctx, this.image, this.frameAt(frameIndex), cx, cy, dw, dh, options)
  }
}

export async function loadUniformSpriteSheet(
  url: string,
  columns: number,
  rows = 1,
): Promise<UniformSpriteSheet | null> {
  const img = await loadImage(url)
  if (!img) return null
  return new UniformSpriteSheet(img, columns, rows)
}

/** 简单 JSON 图集：{ image, frames: { name: { x,y,w,h } } } */
export class SpriteAtlas {
  readonly image: HTMLImageElement
  readonly frames: Record<string, SpriteRect>

  constructor(image: HTMLImageElement, frames: Record<string, SpriteRect>) {
    this.image = image
    this.frames = frames
  }

  draw(
    ctx: CanvasRenderingContext2D,
    frameName: string,
    cx: number,
    cy: number,
    dw: number,
    dh: number,
    options?: DrawSpriteFrameOptions,
  ): boolean {
    const frame = this.frames[frameName]
    if (!frame) return false
    return drawSpriteFrame(ctx, this.image, frame, cx, cy, dw, dh, options)
  }
}

export async function loadSpriteAtlas(jsonUrl: string): Promise<SpriteAtlas | null> {
  try {
    const res = await fetch(jsonUrl)
    if (!res.ok) return null
    const data = (await res.json()) as SpriteAtlasJson
    const base = jsonUrl.replace(/[^/]+$/, '')
    const imageUrl = data.image.startsWith('/') ? data.image : base + data.image
    const img = await loadImage(imageUrl)
    if (!img) return null
    const frames: Record<string, SpriteRect> = {}
    for (const [name, f] of Object.entries(data.frames)) {
      frames[name] = { sx: f.x, sy: f.y, sw: f.w, sh: f.h }
    }
    return new SpriteAtlas(img, frames)
  } catch {
    return null
  }
}

export interface SpriteAnimationDef {
  /** 帧索引（UniformSpriteSheet）或帧名（SpriteAtlas） */
  frames: (number | string)[]
  /** 每帧时长（秒） */
  frameDuration: number
  loop?: boolean
}

/** 在 onUpdate 里 advance(dt)，在 onRender 里取 currentFrame 绘制 */
export class SpriteAnimator {
  private elapsed = 0
  private index = 0
  private finished = false

  constructor(private readonly def: SpriteAnimationDef) {}

  reset(): void {
    this.elapsed = 0
    this.index = 0
    this.finished = false
  }

  advance(dt: number): void {
    if (this.finished) return
    const { frames, frameDuration, loop = true } = this.def
    if (frames.length === 0) return
    this.elapsed += dt
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration
      this.index++
      if (this.index >= frames.length) {
        if (loop) {
          this.index = 0
        } else {
          this.index = frames.length - 1
          this.finished = true
          break
        }
      }
    }
  }

  get currentIndex(): number {
    return this.index
  }

  get currentUniformFrame(): number {
    const f = this.def.frames[this.index]
    return typeof f === 'number' ? f : 0
  }

  get currentAtlasFrame(): string | null {
    const f = this.def.frames[this.index]
    return typeof f === 'string' ? f : null
  }

  get isFinished(): boolean {
    return this.finished
  }
}