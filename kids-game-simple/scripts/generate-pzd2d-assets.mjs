/**
 * 生成 plantZombieDefense2d P0 占位精灵（程序绘制 PNG）
 * 运行: node scripts/generate-pzd2d-assets.mjs
 * 正式商用请按 docs/plantZombieDefense2d-GDD.md §6 Prompt 替换为 AI/美术出图
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../public/assets/plantZombieDefense2d')

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function writePng(filePath, w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const rowSize = 1 + w * 4
  const raw = Buffer.alloc(rowSize * h)
  for (let y = 0; y < h; y++) {
    raw[y * rowSize] = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const o = y * rowSize + 1 + x * 4
      raw[o] = rgba[i]
      raw[o + 1] = rgba[i + 1]
      raw[o + 2] = rgba[i + 2]
      raw[o + 3] = rgba[i + 3]
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, png)
}

function createBuffer(w, h, fill = [0, 0, 0, 0]) {
  const b = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    b[i * 4] = fill[0]
    b[i * 4 + 1] = fill[1]
    b[i * 4 + 2] = fill[2]
    b[i * 4 + 3] = fill[3]
  }
  return b
}

function setPixel(buf, w, x, y, c) {
  if (x < 0 || y < 0) return
  const i = (y * w + x) * 4
  const a = c[3] / 255
  const ia = 1 - a
  buf[i] = Math.round(c[0] * a + buf[i] * ia)
  buf[i + 1] = Math.round(c[1] * a + buf[i + 1] * ia)
  buf[i + 2] = Math.round(c[2] * a + buf[i + 2] * ia)
  buf[i + 3] = Math.round(255 * (a + (buf[i + 3] / 255) * ia))
}

function fillRect(buf, w, h, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) setPixel(buf, w, x, y, c)
}

function fillCircle(buf, w, cx, cy, r, c) {
  const r2 = r * r
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setPixel(buf, w, x, y, c)
}

function strokeRoundRect(buf, bw, bh, x0, y0, x1, y1, t, c) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const onEdge = x <= x0 + t || x >= x1 - t || y <= y0 + t || y >= y1 - t
      if (onEdge) setPixel(buf, bw, x, y, c)
    }
}

function drawPlantSprite(w, h, body, accent) {
  const buf = createBuffer(w, h)
  fillCircle(buf, w, w / 2, h * 0.55, w * 0.28, [...body, 255])
  fillCircle(buf, w, w / 2, h * 0.38, w * 0.22, [...accent, 255])
  fillRect(buf, w, h, w * 0.42, h * 0.72, w * 0.58, h * 0.88, [139, 90, 43, 255])
  strokeRoundRect(buf, w, h, 4, 4, w - 5, h - 5, 3, [255, 255, 255, 180])
  return buf
}

function drawZombieSprite(w, h, body, extra) {
  const buf = createBuffer(w, h)
  fillRect(buf, w, h, w * 0.28, h * 0.35, w * 0.72, h * 0.92, [...body, 255])
  fillCircle(buf, w, w / 2, h * 0.28, w * 0.22, [180, 200, 175, 255])
  if (extra === 'bucket')
    fillRect(buf, w, h, w * 0.32, h * 0.05, w * 0.68, h * 0.22, [115, 140, 166, 255])
  if (extra === 'flag') fillRect(buf, w, h, w * 0.62, h * 0.15, w * 0.88, h * 0.35, [240, 80, 80, 255])
  if (extra === 'sport') fillCircle(buf, w, w * 0.65, h * 0.55, w * 0.12, [255, 200, 80, 255])
  strokeRoundRect(buf, w, h, 2, 2, w - 3, h - 3, 2, [40, 60, 50, 200])
  return buf
}

function drawLawnBackground(w, h) {
  const buf = createBuffer(w, h)
  for (let y = 0; y < h; y++) {
    const t = y / h
    const sky = [
      Math.round(135 + t * 40),
      Math.round(206 + t * 20),
      Math.round(235 - t * 30),
      255,
    ]
    for (let x = 0; x < w; x++) setPixel(buf, w, x, y, sky)
  }
  const lawnY = Math.floor(h * 0.38)
  for (let y = lawnY; y < h; y++) {
    const stripe = ((y - lawnY) / 24) % 2 === 0
    const g = stripe ? [155, 217, 165, 255] : [107, 191, 122, 255]
    for (let x = 0; x < w; x++) setPixel(buf, w, x, y, g)
  }
  fillRect(buf, w, h, 0, lawnY + 40, Math.floor(w * 0.14), h - 10, [196, 164, 107, 255])
  fillRect(buf, w, h, 8, lawnY + 55, Math.floor(w * 0.1), h - 30, [160, 120, 80, 255])
  return buf
}

function drawIconSun(size) {
  const buf = createBuffer(size, size)
  fillCircle(buf, size, size / 2, size / 2, size * 0.38, [255, 210, 63, 255])
  fillCircle(buf, size, size / 2, size / 2, size * 0.28, [255, 240, 150, 255])
  return buf
}

function drawCardFrame(w, h) {
  const buf = createBuffer(w, h)
  strokeRoundRect(buf, w, h, 2, 2, w - 3, h - 3, 6, [114, 213, 102, 255])
  fillRect(buf, w, h, 8, 8, w - 9, h - 9, [45, 90, 61, 60])
  return buf
}

function drawHouseIcon(size) {
  const buf = createBuffer(size, size)
  fillRect(buf, size, size, size * 0.2, size * 0.45, size * 0.8, size * 0.85, [196, 164, 107, 255])
  for (let y = 0; y < size * 0.5; y++) {
    const x0 = size / 2 - y * 0.9
    const x1 = size / 2 + y * 0.9
    fillRect(
      buf,
      size,
      size,
      Math.floor(x0),
      Math.floor(size * 0.35 + y),
      Math.ceil(x1),
      Math.floor(size * 0.36 + y),
      [180, 80, 80, 255],
    )
  }
  return buf
}

function drawHpBarBg(w, h) {
  const buf = createBuffer(w, h)
  fillRect(buf, w, h, 0, 0, w - 1, h - 1, [40, 40, 40, 220])
  strokeRoundRect(buf, w, h, 0, 0, w - 1, h - 1, 2, [255, 255, 255, 100])
  return buf
}

const jobs = [
  ['backgrounds/lawn_day.png', 960, 540, () => drawLawnBackground(960, 540)],
  ['sprites/plant_peashooter.png', 128, 128, () => drawPlantSprite(128, 128, [114, 213, 102], [184, 240, 112])],
  ['sprites/plant_sunflower.png', 128, 128, () => drawPlantSprite(128, 128, [255, 210, 63], [255, 240, 120])],
  ['sprites/plant_wallnut.png', 128, 128, () => drawPlantSprite(128, 128, [166, 124, 82], [200, 160, 120])],
  ['sprites/plant_potato_mine.png', 96, 96, () => drawPlantSprite(96, 96, [196, 164, 107], [140, 100, 60])],
  ['sprites/plant_snow_pea.png', 128, 128, () => drawPlantSprite(128, 128, [135, 207, 240], [200, 240, 255])],
  ['sprites/zombie_normal.png', 128, 160, () => drawZombieSprite(128, 160, [148, 180, 159])],
  ['sprites/zombie_flag.png', 128, 160, () => drawZombieSprite(128, 160, [134, 151, 136], 'flag')],
  ['sprites/zombie_bucket.png', 128, 160, () => drawZombieSprite(128, 160, [115, 140, 166], 'bucket')],
  ['sprites/zombie_sport.png', 128, 160, () => drawZombieSprite(128, 160, [212, 150, 120], 'sport')],
  ['ui/icon_sun.png', 64, 64, () => drawIconSun(64)],
  ['ui/card_frame.png', 128, 96, () => drawCardFrame(128, 96)],
  ['ui/house.png', 96, 96, () => drawHouseIcon(96)],
  ['ui/hp_bar_bg.png', 180, 24, () => drawHpBarBg(180, 24)],
  [
    'ui/pea.png',
    32,
    32,
    () => {
      const b = createBuffer(32, 32)
      fillCircle(b, 32, 16, 16, 12, [184, 240, 112, 255])
      return b
    },
  ],
]

for (const [rel, w, h, fn] of jobs) {
  const out = path.join(ROOT, rel)
  writePng(out, w, h, fn())
  console.log('wrote', rel)
}

const audioReadme = `# plantZombieDefense2d audio (P0)

Place OGG files per GDD §6.3:

- bgm_lawn.ogg
- sun_pop.ogg (sun_collect)
- pea_hit.ogg
- zombie_pop.ogg (zombie_kill)
- wave_clear.ogg
- house_hit.ogg (house_hurt)
- win.ogg / lose.ogg
- ui_invalid.ogg (optional)

Until files exist, the game uses Web Audio via audioService in logic/events.ts.
`
fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'audio', 'README.md'), audioReadme, 'utf8')
console.log('done ->', ROOT)