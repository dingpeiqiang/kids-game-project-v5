import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── 配置 ──────────────────────────────────────────────
const GAME_CODE = 'puzzle'
const THEME_CODE = `${GAME_CODE}_animal_default`
const GAME_NAME = '快乐拼图屋 - 动物主题'
const PUBLIC_DIR = path.join(__dirname, 'public', 'themes', THEME_CODE)
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets')
const SCENE_DIR = path.join(ASSETS_DIR, 'scene')
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio')

// 创建目录
;[SCENE_DIR, AUDIO_DIR].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true })
  console.log(`📁 创建目录：${dir}`)
})

// ─── 工具函数 ──────────────────────────────────────────

/**
 * 生成彩虹渐变色的矩形
 */
function generateRainbowGradient(width, height, hueOffset = 0) {
  const buffer = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gradient = ((x + y + hueOffset) / (width + height)) % 1
      const r = Math.floor(255 * Math.abs(Math.sin(gradient * Math.PI)))
      const g = Math.floor(255 * Math.abs(Math.sin(gradient * Math.PI + 2)))
      const b = Math.floor(255 * Math.abs(Math.sin(gradient * Math.PI + 4)))
      
      const idx = (y * width + x) * 4
      buffer[idx] = r
      buffer[idx + 1] = g
      buffer[idx + 2] = b
      buffer[idx + 3] = 255
    }
  }
  return buffer
}

/**
 * 生成卡通动物脸谱（程序化生成）
 */
async function generateAnimalFace(type, size = 256) {
  // 基础背景
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`
  
  // 圆形背景（每种动物不同颜色）
  const bgColors = {
    cat: '#FFA500',      // 橘色
    dog: '#8B4513',      // 棕色
    rabbit: '#FFB6C1',   // 粉色
    panda: '#E0E0E0'     // 浅灰
  }
  
  svg += `<rect width="${size}" height="${size}" fill="none"/>` // 透明背景
  svg += `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="${bgColors[type]}" stroke="#FFFFFF" stroke-width="${Math.max(4, size/64)}"/>`
  
  // 根据动物类型添加特征（所有坐标按比例缩放）
  const scale = size / 256 // 以 256 为基准比例
  
  if (type === 'cat') {
    // 猫咪：三角形耳朵，蓝色眼睛，粉色鼻子
    svg += `
      <!-- 左耳 -->
      <polygon points="${size/2-60*scale},${size/2-80*scale} ${size/2-90*scale},${size/2-110*scale} ${size/2-30*scale},${size/2-100*scale}" fill="#FFA500" stroke="#FFFFFF" stroke-width="${3*scale}"/>
      <!-- 右耳 -->
      <polygon points="${size/2+60*scale},${size/2-80*scale} ${size/2+90*scale},${size/2-110*scale} ${size/2+30*scale},${size/2-100*scale}" fill="#FFA500" stroke="#FFFFFF" stroke-width="${3*scale}"/>
      <!-- 左眼 -->
      <ellipse cx="${size/2-30*scale}" cy="${size/2-10*scale}" rx="${15*scale}" ry="${20*scale}" fill="#4169E1" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2-30*scale}" cy="${size/2-10*scale}" r="${5*scale}" fill="#FFFFFF"/>
      <!-- 右眼 -->
      <ellipse cx="${size/2+30*scale}" cy="${size/2-10*scale}" rx="${15*scale}" ry="${20*scale}" fill="#4169E1" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2+30*scale}" cy="${size/2-10*scale}" r="${5*scale}" fill="#FFFFFF"/>
      <!-- 鼻子 -->
      <ellipse cx="${size/2}" cy="${size/2+15*scale}" rx="${10*scale}" ry="${8*scale}" fill="#FFB6C1"/>
      <!-- 嘴巴 -->
      <path d="M ${size/2-15*scale} ${size/2+25*scale} Q ${size/2} ${size/2+30*scale} ${size/2+15*scale} ${size/2+25*scale}" stroke="#FFFFFF" stroke-width="${3*scale}" fill="none"/>
      <!-- 胡须 -->
      <line x1="${size/2-40*scale}" y1="${size/2+15*scale}" x2="${size/2-70*scale}" y2="${size/2+10*scale}" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <line x1="${size/2-40*scale}" y1="${size/2+20*scale}" x2="${size/2-70*scale}" y2="${size/2+20*scale}" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <line x1="${size/2+40*scale}" y1="${size/2+15*scale}" x2="${size/2+70*scale}" y2="${size/2+10*scale}" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <line x1="${size/2+40*scale}" y1="${size/2+20*scale}" x2="${size/2+70*scale}" y2="${size/2+20*scale}" stroke="#FFFFFF" stroke-width="${2*scale}"/>
    `
  } else if (type === 'dog') {
    // 小狗：下垂耳朵，黑色大鼻子，吐舌头
    svg += `
      <!-- 左耳（下垂） -->
      <ellipse cx="${size/2-70*scale}" cy="${size/2-20*scale}" rx="${25*scale}" ry="${40*scale}" fill="#654321" stroke="#FFFFFF" stroke-width="${3*scale}"/>
      <!-- 右耳（下垂） -->
      <ellipse cx="${size/2+70*scale}" cy="${size/2-20*scale}" rx="${25*scale}" ry="${40*scale}" fill="#654321" stroke="#FFFFFF" stroke-width="${3*scale}"/>
      <!-- 左眼 -->
      <ellipse cx="${size/2-30*scale}" cy="${size/2-10*scale}" rx="${18*scale}" ry="${15*scale}" fill="#000000" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2-30*scale}" cy="${size/2-10*scale}" r="${6*scale}" fill="#FFFFFF"/>
      <!-- 右眼 -->
      <ellipse cx="${size/2+30*scale}" cy="${size/2-10*scale}" rx="${18*scale}" ry="${15*scale}" fill="#000000" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2+30*scale}" cy="${size/2-10*scale}" r="${6*scale}" fill="#FFFFFF"/>
      <!-- 大鼻子 -->
      <ellipse cx="${size/2}" cy="${size/2+10*scale}" rx="${20*scale}" ry="${15*scale}" fill="#000000"/>
      <ellipse cx="${size/2-5*scale}" cy="${size/2+5*scale}" rx="${5*scale}" ry="${3*scale}" fill="#FFFFFF"/>
      <!-- 嘴巴和舌头 -->
      <path d="M ${size/2-20*scale} ${size/2+25*scale} Q ${size/2} ${size/2+35*scale} ${size/2+20*scale} ${size/2+25*scale}" stroke="#000000" stroke-width="${3*scale}" fill="#FF6B6B"/>
      <ellipse cx="${size/2}" cy="${size/2+35*scale}" rx="${10*scale}" ry="${8*scale}" fill="#FF6B6B"/>
    `
  } else if (type === 'rabbit') {
    // 小兔：长耳朵，红眼睛，三瓣嘴
    svg += `
      <!-- 左耳（长） -->
      <ellipse cx="${size/2-40*scale}" cy="${size/2-90*scale}" rx="${20*scale}" ry="${50*scale}" fill="#FFFFFF" stroke="#FFB6C1" stroke-width="${3*scale}"/>
      <ellipse cx="${size/2-40*scale}" cy="${size/2-90*scale}" rx="${12*scale}" ry="${35*scale}" fill="#FFB6C1"/>
      <!-- 右耳（长） -->
      <ellipse cx="${size/2+40*scale}" cy="${size/2-90*scale}" rx="${20*scale}" ry="${50*scale}" fill="#FFFFFF" stroke="#FFB6C1" stroke-width="${3*scale}"/>
      <ellipse cx="${size/2+40*scale}" cy="${size/2-90*scale}" rx="${12*scale}" ry="${35*scale}" fill="#FFB6C1"/>
      <!-- 左眼（红色） -->
      <ellipse cx="${size/2-30*scale}" cy="${size/2}" rx="${15*scale}" ry="${18*scale}" fill="#DC143C" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2-30*scale}" cy="${size/2}" r="${5*scale}" fill="#FFFFFF"/>
      <!-- 右眼（红色） -->
      <ellipse cx="${size/2+30*scale}" cy="${size/2}" rx="${15*scale}" ry="${18*scale}" fill="#DC143C" stroke="#FFFFFF" stroke-width="${2*scale}"/>
      <circle cx="${size/2+30*scale}" cy="${size/2}" r="${5*scale}" fill="#FFFFFF"/>
      <!-- 粉色鼻子 -->
      <ellipse cx="${size/2}" cy="${size/2+20*scale}" rx="${12*scale}" ry="${10*scale}" fill="#FFB6C1"/>
      <!-- 三瓣嘴 -->
      <circle cx="${size/2-8*scale}" cy="${size/2+35*scale}" r="${5*scale}" fill="#FFB6C1"/>
      <circle cx="${size/2+8*scale}" cy="${size/2+35*scale}" r="${5*scale}" fill="#FFB6C1"/>
      <line x1="${size/2}" y1="${size/2+30*scale}" x2="${size/2}" y2="${size/2+40*scale}" stroke="#FFB6C1" stroke-width="${2*scale}"/>
    `
  } else if (type === 'panda') {
    // 熊猫：黑眼圈，黑白配色
    svg += `
      <!-- 左耳（黑色） -->
      <circle cx="${size/2-70*scale}" cy="${size/2-70*scale}" r="${25*scale}" fill="#000000"/>
      <!-- 右耳（黑色） -->
      <circle cx="${size/2+70*scale}" cy="${size/2-70*scale}" r="${25*scale}" fill="#000000"/>
      <!-- 左黑眼圈 -->
      <ellipse cx="${size/2-35*scale}" cy="${size/2-15*scale}" rx="${25*scale}" ry="${20*scale}" fill="#000000" transform="rotate(-20 ${size/2-35*scale} ${size/2-15*scale})"/>
      <!-- 右黑眼圈 -->
      <ellipse cx="${size/2+35*scale}" cy="${size/2-15*scale}" rx="${25*scale}" ry="${20*scale}" fill="#000000" transform="rotate(20 ${size/2+35*scale} ${size/2-15*scale})"/>
      <!-- 左眼白 -->
      <ellipse cx="${size/2-35*scale}" cy="${size/2-15*scale}" rx="${10*scale}" ry="${8*scale}" fill="#FFFFFF"/>
      <circle cx="${size/2-35*scale}" cy="${size/2-15*scale}" r="${3*scale}" fill="#000000"/>
      <!-- 右眼白 -->
      <ellipse cx="${size/2+35*scale}" cy="${size/2-15*scale}" rx="${10*scale}" ry="${8*scale}" fill="#FFFFFF"/>
      <circle cx="${size/2+35*scale}" cy="${size/2-15*scale}" r="${3*scale}" fill="#000000"/>
      <!-- 黑色鼻子 -->
      <ellipse cx="${size/2}" cy="${size/2+15*scale}" rx="${15*scale}" ry="${10*scale}" fill="#000000"/>
      <!-- 微笑嘴巴 -->
      <path d="M ${size/2-20*scale} ${size/2+30*scale} Q ${size/2} ${size/2+38*scale} ${size/2+20*scale} ${size/2+30*scale}" stroke="#000000" stroke-width="${3*scale}" fill="none"/>
    `
  }
  
  svg += '</svg>'
  
  // 生成 PNG 并确保尺寸正确
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(path.join(SCENE_DIR, `tile_${type}.png`))
  
  console.log(`✅ 生成动物脸谱：tile_${type}.png (${size}x${size})`)
}

/**
 * 生成拼图块（带编号的彩色方块，用于实际游戏）
 */
async function generatePuzzleTiles(animalType, count) {
  console.log(`\n🧩 生成 ${animalType} 拼图块 (共${count}块)...`)
  
  const tileSize = 256
  const colors = {
    cat: ['#FFA500', '#FF8C00', '#FF7F00', '#FF6347'],
    dog: ['#8B4513', '#A0522D', '#CD853F', '#DEB887'],
    rabbit: ['#FFB6C1', '#FF69B4', '#DB7093', '#C71585'],
    panda: ['#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3']
  }
  
  for (let i = 1; i <= count; i++) {
    const colorIndex = (i - 1) % colors[animalType].length
    const baseColor = colors[animalType][colorIndex]
    
    // 生成彩虹渐变背景
    const buffer = generateRainbowGradient(tileSize, tileSize, i * 30)
    
    await sharp(buffer, { raw: { width: tileSize, height: tileSize, channels: 4 } })
      .extend({
        top: 4, bottom: 4, left: 4, right: 4,
        background: { r: 255, g: 255, b: 255, alpha: 255 }
      })
      .png()
      .toFile(path.join(SCENE_DIR, `tile_${animalType}_${i}.png`))
    
    console.log(`  ✅ 生成拼图块：tile_${animalType}_${i}.png`)
  }
}

/**
 * 将完整的动物图片切割成拼图块（备用方案）
 */
async function cutAnimalIntoTiles(animalType, gridSize) {
  const tileSize = 256
  const fullSize = tileSize * gridSize
  
  console.log(`\n🐾 尝试切割 ${animalType} 动物拼图 (网格：${gridSize}x${gridSize})`)
  
  try {
    // 直接生成最终大小的完整图片
    await generateAnimalFace(animalType, fullSize)
    
    // 读取完整图片并调整到精确尺寸
    const imagePath = path.join(SCENE_DIR, `tile_${animalType}.png`)
    await sharp(imagePath)
      .resize(fullSize, fullSize, { fit: 'fill' })
      .png()
      .toFile(imagePath.replace('.png', '_resized.png'))
    
    fs.unlinkSync(imagePath)
    fs.renameSync(path.join(SCENE_DIR, `tile_${animalType}_resized.png`), imagePath)
    
    const image = sharp(imagePath)
    const metadata = await image.metadata()
    
    console.log(`  📊 完整图片尺寸：${metadata.width}x${metadata.height}`)
    
    // 切割成网格
    const tiles = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * tileSize
        const y = row * tileSize
        
        // 提取拼图块（添加白色边框）
        await image
          .extract({
            left: x,
            top: y,
            width: tileSize,
            height: tileSize
          })
          .extend({
            top: 4, bottom: 4, left: 4, right: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 }
          })
          .png()
          .toFile(path.join(SCENE_DIR, `tile_${animalType}_${row * gridSize + col + 1}.png`))
        
        tiles.push(`tile_${animalType}_${row * gridSize + col + 1}.png`)
        console.log(`  ✅ 切割拼图块 ${row * gridSize + col + 1}/${gridSize * gridSize}`)
      }
    }
    
    // 删除临时完整图片
    fs.unlinkSync(imagePath)
    
    console.log(`  🎉 ${animalType} 拼图块生成完成，共 ${tiles.length} 块\n`)
    return tiles
  } catch (error) {
    console.warn(`  ⚠️ 切割失败，使用备用方案：${error.message}`)
    // 使用备用方案：生成简单的彩色拼图块
    const count = gridSize * gridSize
    await generatePuzzleTiles(animalType, count)
    return Array.from({ length: count }, (_, i) => `tile_${animalType}_${i + 1}.png`)
  }
}

// ─── 图片生成函数 ──────────────────────────────────────

/**
 * 1. 生成背景：浅蓝色渐变天空
 */
async function generateBackground() {
  const width = 1920
  const height = 1080
  const buffer = Buffer.alloc(width * height * 4)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ratio = y / height
      // 从上到下的渐变：深蓝 → 浅蓝 → 浅黄
      const r = Math.floor(135 * (1 - ratio) + 255 * ratio)
      const g = Math.floor(206 * (1 - ratio) + 235 * ratio)
      const b = Math.floor(235 * (1 - ratio) + 200 * ratio)
      
      const idx = (y * width + x) * 4
      buffer[idx] = r
      buffer[idx + 1] = g
      buffer[idx + 2] = b
      buffer[idx + 3] = 255
    }
  }
  
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(SCENE_DIR, 'bg_main.png'))
  
  console.log('✅ 生成背景：bg_main.png')
}

/**
 * 2. 生成星星（不同大小）
 */
async function generateStars() {
  const sizes = [
    { id: 1, scale: 0.8 },
    { id: 2, scale: 1.0 },
    { id: 3, scale: 1.2 }
  ]
  
  for (const { id, scale } of sizes) {
    const size = Math.floor(128 * scale)
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="starGrad${id}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
          </radialGradient>
        </defs>
        <polygon 
          points="${size/2},0 ${size*0.618},${size*0.382} ${size},${size*0.382} ${size*0.691},${size*0.618} ${size*0.809},${size} ${size/2},${size*0.618} 0,${size} ${size*0.309},${size*0.618} 0,${size*0.382} ${size*0.382},0" 
          fill="url(#starGrad${id})" 
          stroke="#FF8C00" 
          stroke-width="${Math.floor(2 * scale)}"
        />
        <text x="${size/2}" y="${size*0.8}" text-anchor="middle" fill="#FFFFFF" font-size="${Math.floor(20 * scale)}" font-family="Arial" font-weight="bold">⭐</text>
      </svg>
    `
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(SCENE_DIR, `star_${id}.png`))
    
    console.log(`✅ 生成星星：star_${id}.png`)
  }
}

/**
 * 3. 生成 UI 按钮
 */
async function generateButton() {
  const width = 200
  const height = 60
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="btnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="15" ry="15" fill="url(#btnGrad)" stroke="#16a34a" stroke-width="3"/>
      <text x="${width/2}" y="${height/2 + 5}" text-anchor="middle" fill="white" font-size="24" font-family="Arial" font-weight="bold">重新开始</text>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(SCENE_DIR, 'btn_restart.png'))
  
  console.log('✅ 生成按钮：btn_restart.png')
}

/**
 * 4. 生成提示图标（灯泡）
 */
async function generateHintIcon() {
  const size = 64
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bulbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#FFFF00;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
        </radialGradient>
      </defs>
      <!-- 灯泡主体 -->
      <circle cx="${size/2}" cy="${size/2 - 5}" r="20" fill="url(#bulbGrad)" stroke="#FF8C00" stroke-width="2"/>
      <!-- 灯泡底部 -->
      <rect x="${size/2 - 8}" y="${size/2 + 10}" width="16" height="12" fill="#CCCCCC" stroke="#999999" stroke-width="2"/>
      <!-- 光芒 -->
      <line x1="${size/2}" y1="${size/2 - 30}" x2="${size/2}" y2="${size/2 - 35}" stroke="#FFD700" stroke-width="3"/>
      <line x1="${size/2 - 25}" y1="${size/2 - 15}" x2="${size/2 - 30}" y2="${size/2 - 18}" stroke="#FFD700" stroke-width="3"/>
      <line x1="${size/2 + 25}" y1="${size/2 - 15}" x2="${size/2 + 30}" y2="${size/2 - 18}" stroke="#FFD700" stroke-width="3"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(SCENE_DIR, 'icon_hint.png'))
  
  console.log('✅ 生成提示图标：icon_hint.png')
}

// ─── 音频生成函数 ──────────────────────────────────────

/**
 * 写入 WAV 文件
 */
function writeWAV(filename, durationSec, genSample) {
  const sampleRate = 44100
  const numSamples = Math.floor(durationSec * sampleRate)
  const dataSize = numSamples * 2
  const header = Buffer.alloc(44)
  
  // WAV header
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  
  // Audio data
  const samples = Buffer.alloc(dataSize)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const value = Math.max(-32767, Math.min(32767, Math.floor(genSample(t) * 32767)))
    samples.writeInt16LE(value, i * 2)
  }
  
  fs.writeFileSync(filename, Buffer.concat([header, samples]))
}

/**
 * 生成所有音频文件
 */
function generateAudio() {
  console.log('\n🎵 开始生成音频...')
  
  // BGM: 欢快的儿童音乐（C 大调和弦进行）
  writeWAV(path.join(AUDIO_DIR, 'bgm_main.wav'), 120, (t) => {
    const freqs = [262, 330, 392, 330, 294, 349, 392, 349] // C E G E F A C A
    const chord = Math.floor(t * 0.5) % 8
    const noteInChord = Math.floor(t * 8) % 4
    const freq = freqs[chord] * (noteInChord < 2 ? 1 : 0.5)
    const envelope = Math.exp(-((t * 8) % 1) * 2)
    return Math.sin(2 * Math.PI * freq * t) * envelope * 0.3
  })
  console.log('✔ bgm_main.wav (120s)')
  
  // 选中音效：短促清脆的"叮"声
  writeWAV(path.join(AUDIO_DIR, 'sfx_select.wav'), 0.15, (t) => {
    return Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 15) * 0.6
  })
  console.log('✔ sfx_select.wav (0.15s)')
  
  // 交换音效：滑动的"咻"声
  writeWAV(path.join(AUDIO_DIR, 'sfx_swap.wav'), 0.3, (t) => {
    const freq = 400 + 200 * Math.sin(t * Math.PI)
    return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.5
  })
  console.log('✔ sfx_swap.wav (0.3s)')
  
  // 正确归位音效：上升音阶
  writeWAV(path.join(AUDIO_DIR, 'sfx_correct.wav'), 0.4, (t) => {
    const freq = 523 + t * 500 // C5 -> G5
    return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.5
  })
  console.log('✔ sfx_correct.wav (0.4s)')
  
  // 胜利音效：欢快的庆祝旋律
  writeWAV(path.join(AUDIO_DIR, 'sfx_win.wav'), 1.5, (t) => {
    const melody = [523, 659, 784, 1047, 784, 1047] // C E G C(high) G C
    const note = Math.floor(t * 4) % 6
    const freq = melody[note]
    const envelope = Math.exp(-((t * 4) % 0.25) * 4)
    return Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
  })
  console.log('✔ sfx_win.wav (1.5s)')
  
  // UI 点击音效
  writeWAV(path.join(AUDIO_DIR, 'sfx_click.wav'), 0.1, (t) => {
    return Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 20) * 0.5
  })
  console.log('✔ sfx_click.wav (0.1s)')
  
  console.log('✅ 音频生成完成\n')
}

// ─── 生成 GTRS.json ────────────────────────────────────

function generateGTRS() {
  console.log('📝 生成 GTRS.json...')
  
  // 收集所有图片资源
  const sceneImages = {}
  const files = fs.readdirSync(SCENE_DIR)
  
  files.forEach(file => {
    if (file.endsWith('.png')) {
      const key = file.replace('.png', '')
      sceneImages[key] = {
        alias: key.replace(/_/g, ' '),
        src: `/themes/${THEME_CODE}/assets/scene/${key}.png`,
        type: 'png'
      }
    }
  })
  
  const gtrs = {
    specMeta: {
      specName: 'GTRS',
      specVersion: '1.0.0',
      compatibleVersion: '1.0.0'
    },
    themeInfo: {
      themeCode: THEME_CODE,
      themeName: `${GAME_NAME}默认主题`,
      gameId: GAME_CODE,
      ownerType: 'GAME',
      ownerId: GAME_CODE,
      isDefault: true,
      author: 'AI Assistant',
      description: `${GAME_NAME}动物主题默认主题`,
      version: '1.0.0'
    },
    globalStyle: {
      primaryColor: '#FFB347',
      secondaryColor: '#FFA500',
      bgColor: '#87CEEB',
      textColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '12px'
    },
    resources: {
      images: {
        scene: sceneImages,
        ui: {},
        icon: {},
        effect: {}
      },
      audio: {
        bgm: {
          bgm_main: {
            alias: '背景音乐',
            src: `/themes/${THEME_CODE}/assets/audio/bgm_main.mp3`,
            type: 'mp3',
            volume: 0.6
          }
        },
        effect: {
          sfx_select: {
            alias: '选中音效',
            src: `/themes/${THEME_CODE}/assets/audio/sfx_select.mp3`,
            type: 'mp3',
            volume: 0.8
          },
          sfx_swap: {
            alias: '交换音效',
            src: `/themes/${THEME_CODE}/assets/audio/sfx_swap.mp3`,
            type: 'mp3',
            volume: 0.8
          },
          sfx_correct: {
            alias: '正确归位音效',
            src: `/themes/${THEME_CODE}/assets/audio/sfx_correct.mp3`,
            type: 'mp3',
            volume: 0.8
          },
          sfx_win: {
            alias: '胜利音效',
            src: `/themes/${THEME_CODE}/assets/audio/sfx_win.mp3`,
            type: 'mp3',
            volume: 0.8
          },
          sfx_click: {
            alias: 'UI 点击音效',
            src: `/themes/${THEME_CODE}/assets/audio/sfx_click.mp3`,
            type: 'mp3',
            volume: 0.8
          }
        },
        voice: {}
      },
      video: {}
    }
  }
  
  const outputPath = path.join(PUBLIC_DIR, 'GTRS.json')
  fs.writeFileSync(outputPath, JSON.stringify(gtrs, null, 2), 'utf8')
  console.log(`✅ 生成 GTRS.json: ${outputPath}\n`)
  
  return gtrs
}

// ─── 主函数 ────────────────────────────────────────────

(async () => {
  console.log('🎨 '.repeat(20))
  console.log(`🚀 开始生成 ${GAME_NAME} 资源...\n`)
  
  try {
    // 1. 生成背景
    console.log('📸 生成图片资源...')
    await generateBackground()
    
    // 2. 生成动物拼图块（按难度生成）
    console.log('\n🐾 生成动物拼图块...')
    await cutAnimalIntoTiles('cat', 2)      // 简单：2×2 = 4 块
    await cutAnimalIntoTiles('dog', 3)      // 普通：3×3 = 9 块
    await cutAnimalIntoTiles('rabbit', 3)   // 额外：3×3 = 9 块
    await cutAnimalIntoTiles('panda', 4)    // 困难：4×4 = 16 块
    
    // 3. 生成 UI 元素
    console.log('\n🎯 生成 UI 元素...')
    await generateStars()
    await generateButton()
    await generateHintIcon()
    
    // 4. 生成音频
    generateAudio()
    
    // 5. 生成 GTRS.json
    generateGTRS()
    
    console.log('\n' + '🎉 '.repeat(20))
    console.log('✅ 资源生成完成！\n')
    console.log('⚠️  接下来需要执行以下步骤:\n')
    console.log('   1️⃣  转换 WAV 为 MP3:')
    console.log(`      cd ../../kids-game-frame-factory/tools/audio-converter`)
    console.log(`      node convert.js --input ../../kids-game-house/games/puzzle/public/themes/${THEME_CODE}/assets/audio --output ../../kids-game-house/games/puzzle/public/themes/${THEME_CODE}/assets/audio\n`)
    console.log('   2️⃣  复制 GTRS.json 到 src/config/:')
    console.log(`      Copy-Item public/themes/${THEME_CODE}/GTRS.json src/config/GTRS.json -Force\n`)
    console.log('🎊 准备进入下一阶段：配置文件设置\n')
    
  } catch (error) {
    console.error('\n❌ 资源生成失败:', error)
    process.exit(1)
  }
})()
