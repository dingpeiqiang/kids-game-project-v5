/**
 * 贪吃蛇游戏资源生成器
 * 生成图片资源 (PNG) 和音频资源 (WAV)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础路径
const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets/themes/snake');
const SCENE_DIR = path.join(ASSETS_DIR, 'scene');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');

// 游戏设计参数（与 PhaserGame.ts 一致）
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const GRID_COLS = 32;
const GRID_ROWS = 18;
const CELL_SIZE = GAME_WIDTH / GRID_COLS; // 22.5

// ==================== 工具函数 ====================

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录: ${dir}`);
  }
}

/**
 * 生成 PNG 图片 (使用 Canvas)
 */
function generatePNG(filename, width, height, drawFunc) {
  // 使用纯 Node.js 方式生成简单的 PNG
  // 由于没有 canvas 库，我们使用一个简化的方法
  const canvas = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="transparent"/>
</svg>`;
  
  // 实际上我们需要生成真实的 PNG 数据
  // 这里使用一个简单的 PNG 生成器
  const png = createSimplePNG(width, height, drawFunc);
  const filepath = path.join(SCENE_DIR, filename);
  fs.writeFileSync(filepath, png);
  console.log(`🖼️  生成图片: ${filename} (${width}x${height})`);
}

/**
 * 创建简单的 PNG 文件
 */
function createSimplePNG(width, height, drawFunc) {
  // PNG 文件签名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // 创建像素数据
  const pixels = [];
  for (let y = 0; y < height; y++) {
    pixels.push(0); // 过滤器类型 (None)
    for (let x = 0; x < width; x++) {
      const color = drawFunc(x, y, width, height);
      pixels.push(color.r, color.g, color.b, color.a);
    }
  }
  
  const pixelData = Buffer.from(pixels);
  const compressed = zlibDeflateSync(pixelData);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method
  
  // 构建 PNG 文件
  const chunks = [
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ];
  
  return Buffer.concat([signature, ...chunks]);
}

/**
 * 创建 PNG chunk
 */
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * CRC32 计算
 */
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = getCRC32Table();
  
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return crc ^ 0xFFFFFFFF;
}

let crc32Table = null;
function getCRC32Table() {
  if (crc32Table) return crc32Table;
  
  crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[n] = c;
  }
  return crc32Table;
}

/**
 * 简化的 zlib deflate (使用 Node.js 内置)
 */
function zlibDeflateSync(data) {
  return zlib.deflateSync(data);
}

/**
 * 生成 WAV 音频文件
 */
function generateWAV(filename, duration, frequency, type = 'sine', volume = 0.5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(duration * sampleRate);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  
  // WAV 文件头
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20);  // audio format (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // block align
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // 生成音频数据
  const samples = Buffer.alloc(dataSize);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample;
    
    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        break;
      case 'noise':
        sample = Math.random() * 2 - 1;
        break;
      case 'melody':
        // 简单旋律
        const note = Math.floor(t * 4) % 4;
        const freqs = [frequency, frequency * 1.25, frequency * 1.5, frequency * 1.25];
        sample = Math.sin(2 * Math.PI * freqs[note] * t);
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }
    
    // 应用音量和渐弱
    const fadeOut = 1 - (i / numSamples) * 0.3;
    const value = Math.floor(sample * volume * 32767 * fadeOut);
    samples.writeInt16LE(Math.max(-32768, Math.min(32767, value)), i * 2);
  }
  
  const wav = Buffer.concat([header, samples]);
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, wav);
  console.log(`🎵 生成音频: ${filename} (${duration}s, ${frequency}Hz, ${type})`);
}

// ==================== 资源定义 ====================

/**
 * 生成所有图片资源
 */
function generateImages() {
  console.log('\n=== 生成图片资源 ===\n');
  
  // 1. 游戏主背景 (720x1280) - 无边框
  generatePNG('background.png', GAME_WIDTH, GAME_HEIGHT, (x, y, w, h) => {
    // 深色渐变背景
    const gradient = y / h;
    const r = Math.floor(26 + gradient * 10);
    const g = Math.floor(26 + gradient * 15);
    const b = Math.floor(46 + gradient * 20);
    return { r, g, b, a: 255 };
  });
  
  // 2. 网格背景 (720x1280) - 带边界框
  generatePNG('grid.png', GAME_WIDTH, GAME_HEIGHT, (x, y, w, h) => {
    // 网格区域边界（32列 x 18行）
    const gridWidth = GRID_COLS * CELL_SIZE;
    const gridHeight = GRID_ROWS * (GAME_HEIGHT / GRID_ROWS);
    const borderWidth = 1; // 1像素宽边框
    
    // 判断是否在网格边界框上
    const isLeftBorder = x < borderWidth;
    const isRightBorder = x >= gridWidth - borderWidth && x < gridWidth;
    const isTopBorder = y < borderWidth;
    const isBottomBorder = y >= gridHeight - borderWidth && y < gridHeight;
    
    // 网格边界框 - 明亮的青色边框
    if (isLeftBorder || isRightBorder || isTopBorder || isBottomBorder) {
      return { r: 100, g: 200, b: 255, a: 255 }; // 青色边框
    }
    
    // 网格区域外 - 完全透明
    if (x >= gridWidth || y >= gridHeight) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    // 网格内部 - 绘制网格线
    const cellX = x % CELL_SIZE;
    const cellY = y % (GAME_HEIGHT / GRID_ROWS);
    const isGridLine = cellX < 1 || cellY < 1;
    
    if (isGridLine) {
      return { r: 50, g: 70, b: 90, a: 80 }; // 网格线
    } else {
      return { r: 30, g: 40, b: 60, a: 30 }; // 网格背景
    }
  });
  
  const spriteSize = Math.floor(CELL_SIZE); // 22x22
  
  // 3. 蛇头
  generatePNG('snake_head.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const radius = Math.min(w, h) / 2 - 1;
    
    if (dist <= radius) {
      // 眼睛位置
      const eyeL = { x: cx - 4, y: cy - 3 };
      const eyeR = { x: cx + 4, y: cy - 3 };
      const distL = Math.sqrt((x - eyeL.x) ** 2 + (y - eyeL.y) ** 2);
      const distR = Math.sqrt((x - eyeR.x) ** 2 + (y - eyeR.y) ** 2);
      
      if (distL <= 2 || distR <= 2) {
        return { r: 0, g: 0, b: 0, a: 255 }; // 眼睛
      }
      
      // 蛇头主体 - 深绿色
      return { r: 34, g: 197, b: 94, a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 }; // 透明
  });
  
  // 4. 蛇身
  generatePNG('snake_body.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const radius = Math.min(w, h) / 2 - 2;
    
    if (dist <= radius) {
      // 蛇身 - 绿色渐变
      const brightness = 1 - (dist / radius) * 0.3;
      return { 
        r: Math.floor(74 * brightness), 
        g: Math.floor(222 * brightness), 
        b: Math.floor(128 * brightness), 
        a: 255 
      };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 5. 蛇尾
  generatePNG('snake_tail.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const radius = Math.min(w, h) / 2 - 3;
    
    if (dist <= radius) {
      // 蛇尾 - 浅绿色
      return { r: 144, g: 238, b: 144, a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 6. 苹果
  generatePNG('food_apple.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2 + 1;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const radius = Math.min(w, h) / 2 - 2;
    
    if (dist <= radius) {
      // 苹果主体 - 红色
      const brightness = 1 - (dist / radius) * 0.2;
      return { 
        r: Math.floor(239 * brightness), 
        g: Math.floor(68 * brightness), 
        b: Math.floor(68 * brightness), 
        a: 255 
      };
    }
    // 苹果柄
    if (x >= cx - 1 && x <= cx + 1 && y >= 1 && y <= 4) {
      return { r: 139, g: 69, b: 19, a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 7. 香蕉
  generatePNG('food_banana.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    
    // 香蕉形状 - 椭圆
    const a = w / 2 - 2;
    const b = h / 3;
    const angle = Math.atan2(y - cy, x - cx);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const maxDist = a * b / Math.sqrt((b * Math.cos(angle)) ** 2 + (a * Math.sin(angle)) ** 2);
    
    if (dist <= maxDist) {
      // 香蕉 - 黄色
      return { r: 250, g: 204, b: 21, a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 8. 樱桃
  generatePNG('food_cherry.png', spriteSize, spriteSize, (x, y, w, h) => {
    // 两个小圆
    const cx1 = w / 3, cy1 = h * 0.6;
    const cx2 = w * 2 / 3, cy2 = h * 0.6;
    const radius = w / 4;
    
    const dist1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2);
    const dist2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);
    
    // 樱桃柄
    if (x >= w / 2 - 1 && x <= w / 2 + 1 && y >= 2 && y <= h * 0.5) {
      return { r: 34, g: 139, b: 34, a: 255 };
    }
    
    if (dist1 <= radius || dist2 <= radius) {
      // 樱桃 - 深红色
      return { r: 220, g: 20, b: 60, a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 9. 石头障碍物
  generatePNG('obstacle_rock.png', spriteSize, spriteSize, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const radius = Math.min(w, h) / 2 - 1;
    
    if (dist <= radius) {
      // 石头 - 灰色纹理
      const noise = (Math.sin(x * 0.5) + Math.cos(y * 0.5)) * 20;
      const base = 100 + noise;
      return { r: Math.floor(base), g: Math.floor(base), b: Math.floor(base + 10), a: 255 };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  });
  
  // 10. 墙壁障碍物
  generatePNG('obstacle_wall.png', spriteSize, spriteSize, (x, y, w, h) => {
    // 砖墙纹理
    const brickH = 6;
    const brickW = 11;
    const row = Math.floor(y / brickH);
    const offsetX = (row % 2) * (brickW / 2);
    const col = Math.floor((x + offsetX) / brickW);
    
    const inBrick = (y % brickH < brickH - 1) && ((x + offsetX) % brickW < brickW - 1);
    
    if (inBrick) {
      // 砖块 - 红褐色
      return { r: 139, g: 90, b: 43, a: 255 };
    } else {
      // 砖缝 - 深灰色
      return { r: 60, g: 60, b: 60, a: 255 };
    }
  });
}

/**
 * 生成所有音频资源
 */
function generateAudio() {
  console.log('\n=== 生成音频资源 ===\n');
  
  // 背景音乐 (较长，简单旋律)
  generateWAV('bgm_main.wav', 3.0, 440, 'melody', 0.4);
  generateWAV('bgm_gameplay.wav', 4.0, 523, 'melody', 0.4);
  generateWAV('bgm_gameover.wav', 2.0, 330, 'melody', 0.5);
  
  // 音效 (短促)
  generateWAV('button_click.wav', 0.15, 800, 'sine', 0.3);
  generateWAV('crash.wav', 0.3, 200, 'noise', 0.5);
  generateWAV('eat.wav', 0.2, 880, 'sine', 0.4);
  generateWAV('gameover.wav', 0.5, 440, 'square', 0.5);
  generateWAV('levelup.wav', 0.4, 660, 'melody', 0.5);
}

// ==================== 主函数 ====================

function main() {
  console.log('🎮 贪吃蛇游戏资源生成器');
  console.log('='.repeat(50));
  
  // 确保目录存在
  ensureDir(SCENE_DIR);
  ensureDir(AUDIO_DIR);
  
  // 生成资源
  generateImages();
  generateAudio();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 所有资源生成完成！');
  console.log(`📁 图片资源: ${SCENE_DIR}`);
  console.log(`📁 音频资源: ${AUDIO_DIR}`);
}

main();
