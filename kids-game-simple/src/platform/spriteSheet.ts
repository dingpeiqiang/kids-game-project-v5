/**
 * 2D 精灵图 / 图集（Canvas drawImage）
 * 支持 TexturePacker JSON（hash / array）与等分网格图集。
 */

export interface SpriteFrameRect {
  x: number
  y: number
  w: number
  h: number
}

/** 图集中某一帧（源矩形 + 可选裁剪偏移，与 TexturePacker trimmed 一致） */
export interface SpriteFrame {
  /** 在图集 PNG 上的像素矩形 */
  source: SpriteFrameRect
  /** 绘制时的逻辑尺寸（trimmed 时为 sourceSize） */
  sourceSize: { w: number; h: number }
  /** 相对 sourceSize 的偏移（trimmed 时 spriteSourceSize.x/y） */
  offset: { x: number; y: number }
  rotated: boolean
}

export interface SpriteSheet {
  image: HTMLImageElement
  /** 图集总宽高 */
  size: { w: number; h: number }
  frames: Map<string, SpriteFrame>
  get(name: string): SpriteFrame | undefined
}

export interface GridSheetConfig {
  /** 图集 URL（相对 public 或绝对路径） */
  url: string
  frameWidth: number
  frameHeight: number
  /** 从左到右、从上到下；不传则按行列数自动生成 frame_0, frame_1… */
  names?: string[]
  columns?: number
  margin?: number
  spacing?: number
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function resolveUrl(jsonUrl: string, imageName: string): string {
  if (/^https?:\/\//i.test(imageName) || imageName.startsWith('/')) return imageName
  const base = jsonUrl.replace(/[^/]+$/, '')
  return `${base}${imageName}`
}

type TpHashFrame = {
  frame: { x: number; y: number; w: number; h: number }
  rotated?: boolean
  trimmed?: boolean
  spriteSourceSize?: { x: number; y: number; w: number; h: number }
  sourceSize?: { w: number; h: number }
}

function parseTpFrame(raw: TpHashFrame): SpriteFrame {
  const source = raw.frame
  const sourceSize = raw.sourceSize ?? { w: source.w, h: source.h }
  const offset = raw.trimmed && raw.spriteSourceSize
    ? { x: raw.spriteSourceSize.x, y: raw.spriteSourceSize.y }
    : { x: 0, y: 0 }
  return {
    source: { x: source.x, y: source.y, w: source.w, h: source.h },
    sourceSize,
    offset,
    rotated: !!raw.rotated,
  }
}

function parseHashJson(
  data: { frames: Record<string, TpHashFrame>; meta?: { image?: string; size?: { w: number; h: number } } },
  jsonUrl: string,
): { imagePath: string; size: { w: number; h: number }; frames: Map<string, SpriteFrame> } {
  const imagePath = resolveUrl(jsonUrl, data.meta?.image ?? 'sheet.png')
  const size = data.meta?.size ?? { w: 0, h: 0 }
  const frames = new Map<string, SpriteFrame>()
  for (const [key, raw] of Object.entries(data.frames)) {
    const name = key.replace(/\.(png|jpg|webp)$/i, '')
    frames.set(name, parseTpFrame(raw))
    frames.set(key, parseTpFrame(raw))
  }
  return { imagePath, size, frames }
}

function parseArrayJson(
  data: {
    textures: Array<{
      image: string
      size: { w: number; h: number }
      frames: Array<{
        filename: string
        rotated?: boolean
        trimmed?: boolean
        frame: { x: number; y: number; w: number; h: number }
        spriteSourceSize?: { x: number; y: number; w: number; h: number }
        sourceSize?: { w: number; h: number }
      }>
    }>
  },
  jsonUrl: string,
): { imagePath: string; size: { w: number; h: number }; frames: Map<string, SpriteFrame> } {
  const tex = data.textures[0]
  if (!tex) throw new Error('spriteSheet: empty textures[]')
  const imagePath = resolveUrl(jsonUrl, tex.image)
  const frames = new Map<string, SpriteFrame>()
  for (const f of tex.frames) {
    frames.set(f.filename, parseTpFrame(f as TpHashFrame))
  }
  return { imagePath, size: tex.size, frames }
}

const sheetCache = new Map<string, Promise<SpriteSheet | null>>()

/**
 * 从 TexturePacker 导出的 JSON + 同目录 PNG 加载图集。
 * @param jsonUrl 例如 `/assets/myGame/atlas/player.json`
 */
export async function loadSpriteSheet(jsonUrl: string): Promise<SpriteSheet | null> {
  const cached = sheetCache.get(jsonUrl)
  if (cached) return cached

  const promise = (async () => {
    try {
      const res = await fetch(jsonUrl)
      if (!res.ok) return null
      const data = await res.json()

      let imagePath: string
      let size: { w: number; h: number }
      let frames: Map<string, SpriteFrame>

      if (data.textures && Array.isArray(data.textures)) {
        ;({ imagePath, size, frames } = parseArrayJson(data, jsonUrl))
      } else if (data.frames && typeof data.frames === 'object') {
        ;({ imagePath, size, frames } = parseHashJson(data, jsonUrl))
      } else {
        return null
      }

      const image = await loadImage(imagePath)
      if (!image) return null
      if (!size.w || !size.h) {
        size = { w: image.naturalWidth, h: image.naturalHeight }
      }

      const sheet: SpriteSheet = {
        image,
        size,
        frames,
        get(name: string) {
          return this.frames.get(name) ?? this.frames.get(`${name}.png`)
        },
      }
      return sheet
    } catch {
      return null
    }
  })()

  sheetCache.set(jsonUrl, promise)
  return promise
}

/** 等分网格图集（无 JSON，适合 uniform 切片） */
export async function loadGridSpriteSheet(config: GridSheetConfig): Promise<SpriteSheet | null> {
  const key = `grid:${config.url}:${config.frameWidth}x${config.frameHeight}`
  const cached = sheetCache.get(key)
  if (cached) return cached

  const promise = (async () => {
    const image = await loadImage(config.url)
    if (!image) return null
    const margin = config.margin ?? 0
    const spacing = config.spacing ?? 0
    const fw = config.frameWidth
    const fh = config.frameHeight
    const cols =
      config.columns ??
      Math.floor((image.naturalWidth - margin * 2 + spacing) / (fw + spacing))
    const frames = new Map<string, SpriteFrame>()
    let index = 0
    for (let row = 0; ; row++) {
      let any = false
      for (let col = 0; col < cols; col++) {
        const x = margin + col * (fw + spacing)
        const y = margin + row * (fh + spacing)
        if (y + fh > image.naturalHeight) break
        if (x + fw > image.naturalWidth) continue
        any = true
        const name = config.names?.[index] ?? `frame_${index}`
        frames.set(name, {
          source: { x, y, w: fw, h: fh },
          sourceSize: { w: fw, h: fh },
          offset: { x: 0, y: 0 },
          rotated: false,
        })
        index++
      }
      if (!any) break
    }

    return {
      image,
      size: { w: image.naturalWidth, h: image.naturalHeight },
      frames,
      get(name: string) {
        return this.frames.get(name)
      },
    } satisfies SpriteSheet
  })()

  sheetCache.set(key, promise)
  return promise
}

export function clearSpriteSheetCache(): void {
  sheetCache.clear()
}

export interface DrawSpriteOptions {
  /** 目标中心点（默认左上角为 x,y） */
  anchor?: 'center' | 'topleft'
  /** 水平翻转 */
  flipX?: boolean
  /** 绘制宽度（默认 frame 逻辑宽） */
  width?: number
  height?: number
  /** 整体透明度 0–1 */
  alpha?: number
  /** 旋转弧度（绕锚点） */
  rotation?: number
}

/**
 * 在 Canvas 上绘制图集中的一帧。
 * @returns 是否成功（帧存在且已加载）
 */
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  frameName: string,
  x: number,
  y: number,
  options: DrawSpriteOptions = {},
): boolean {
  const frame = sheet.get(frameName)
  if (!frame) return false

  const dw = options.width ?? frame.sourceSize.w
  const dh = options.height ?? frame.sourceSize.h
  const anchor = options.anchor ?? 'center'

  ctx.save()
  if (options.alpha != null) ctx.globalAlpha *= options.alpha

  let dx = x
  let dy = y
  if (anchor === 'center') {
    dx -= dw / 2
    dy -= dh / 2
  }
  dx += frame.offset.x * (dw / frame.sourceSize.w)
  dy += frame.offset.y * (dh / frame.sourceSize.h)

  const cx = x
  const cy = y
  if (options.rotation) {
    ctx.translate(cx, cy)
    ctx.rotate(options.rotation)
    ctx.translate(-cx, -cy)
  }
  if (options.flipX) {
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    dx = 0
    dy = 0
  }

  if (frame.rotated) {
    // TexturePacker rotated：帧在图集中顺时针 90° 存储
    ctx.translate(dx + dw / 2, dy + dh / 2)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(
      sheet.image,
      frame.source.x,
      frame.source.y,
      frame.source.w,
      frame.source.h,
      -dh / 2,
      -dw / 2,
      dh,
      dw,
    )
  } else {
    ctx.drawImage(
      sheet.image,
      frame.source.x,
      frame.source.y,
      frame.source.w,
      frame.source.h,
      dx,
      dy,
      dw,
      dh,
    )
  }

  ctx.restore()
  return true
}

/** 按命名前缀或显式列表播放序列帧 */
export class SpriteAnimation {
  private index = 0
  private elapsed = 0

  constructor(
    readonly frameNames: string[],
    readonly fps: number,
    readonly loop = true,
  ) {}

  static fromPrefix(sheet: SpriteSheet, prefix: string, fps: number, loop = true): SpriteAnimation | null {
    const names = [...sheet.frames.keys()]
      .filter(n => n.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    if (!names.length) return null
    return new SpriteAnimation(names, fps, loop)
  }

  reset(): void {
    this.index = 0
    this.elapsed = 0
  }

  /** 推进时间，返回当前帧名 */
  update(dt: number): string | null {
    if (!this.frameNames.length) return null
    this.elapsed += dt
    const frameDuration = 1 / this.fps
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration
      this.index++
      if (this.index >= this.frameNames.length) {
        if (this.loop) this.index = 0
        else {
          this.index = this.frameNames.length - 1
          break
        }
      }
    }
    return this.frameNames[this.index] ?? null
  }

  get currentFrame(): string | null {
    return this.frameNames[this.index] ?? null
  }
}