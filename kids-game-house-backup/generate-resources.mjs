/**
 * 坦克大战游戏资源生成器
 * 生成图片资源 (PNG) 和音频资源 (WAV)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础路径 - 使用 GTRS 规范路径
const PUBLIC_DIR = path.join(__dirname, 'public', 'themes', 'default');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

// 游戏设计参数
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const GRID_SIZE = 30;

// ==================== PNG 生成工具 ====================

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
  const compressed = zlib.deflateSync(pixelData);
  
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
  length.writeUInt32BE(data.length);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * CRC32 校验
 */
function crc32(data) {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = ((crc >>> 8) & 0x00ffffff) ^ table[(crc ^ data[i]) & 0xff];
  }
  
  return crc ^ 0xffffffff;
}

/**
 * 获取 CRC32 表
 */
const crc32TableCache = null;
function getCRC32Table() {
  if (crc32TableCache) return crc32TableCache;
  
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xedb88320) : (crc >>> 1);
    }
    table[i] = crc;
  }
  
  // 缓存表
  globalThis.crc32TableCache = table;
  return table;
}

/**
 * 生成 PNG 图片
 */
function generatePNG(filename, width, height, drawFunc, category = 'scene') {
  const dir = path.join(IMAGES_DIR, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录：${dir}`);
  }
  
  const png = createSimplePNG(width, height, drawFunc);
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, png);
  console.log(`🖼️  生成图片：${category}/${filename} (${width}x${height})`);
}

// ==================== 图片绘制函数 ====================

/**
 * 颜色辅助函数
 */
function rgba(r, g, b, a = 255) {
  return { r, g, b, a };
}

/**
 * 绘制背景 - 深蓝渐变
 */
function drawBackground(x, y, w, h) {
  // 垂直渐变：上深下浅
  const ratio = y / h;
  const r = Math.floor(26);
  const g = Math.floor(26);
  const b = Math.floor(46 + ratio * 20);
  return rgba(r, g, b, 255);
}

/**
 * 绘制网格 - 半透明战术线
 */
function drawGrid(x, y, w, h) {
  const gridSize = GRID_SIZE;
  const lineWidth = 1;
  
  // 网格线
  if (x % gridSize < lineWidth || y % gridSize < lineWidth) {
    return rgba(100, 100, 100, 80); // 半透明灰线
  }
  
  // 交叉点加亮
  if ((x % gridSize === 0 || x % gridSize === lineWidth - 1) &&
      (y % gridSize === 0 || y % gridSize === lineWidth - 1)) {
    return rgba(150, 150, 150, 120);
  }
  
  return rgba(0, 0, 0, 0); // 透明
}

/**
 * 绘制砖墙 - 带砖块纹理
 */
function drawBrickWall(x, y, w, h) {
  const brickWidth = w / 2;
  const brickHeight = h / 3;
  const mortarSize = 2; // 灰缝大小
  
  const row = Math.floor(y / brickHeight);
  const col = Math.floor(x / brickWidth);
  const offsetX = (row % 2) * (brickWidth / 2); // 错缝排列
  
  const localX = (x + offsetX) % w;
  const localY = y % brickHeight;
  
  // 灰缝
  if (localX < mortarSize || localY < mortarSize || 
      localX > brickWidth - mortarSize || localY > brickHeight - mortarSize) {
    return rgba(108, 48, 10, 255); // 深色灰缝
  }
  
  // 砖块主体 - 添加一些变化
  const variation = ((x + y) % 7) - 3;
  return rgba(
    146 + variation, 
    64 + variation, 
    14 + variation, 
    255
  ); // 棕色砖块
}

/**
 * 绘制钢墙 - 带金属光泽和铆钉
 */
function drawSteelWall(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  
  // 金属底板 - 拉丝效果
  const baseGray = 156 + Math.floor((x / w) * 40);
  
  // 四个角的铆钉
  const rivetPositions = [
    [w/4, h/4], [3*w/4, h/4],
    [w/4, 3*h/4], [3*w/4, 3*h/4]
  ];
  
  for (const [rx, ry] of rivetPositions) {
    const dx = x - rx;
    const dy = y - ry;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < w/10) {
      // 铆钉 - 银色渐变
      const ratio = dist / (w/10);
      const shine = 200 + Math.floor((1 - ratio) * 55);
      return rgba(shine, shine, shine, 255);
    }
  }
  
  return rgba(baseGray, baseGray, baseGray, 255);
}

/**
 * 绘制草地
 */
function drawGrass(x, y, w, h) {
  return rgba(22, 101, 52, 255);
}

/**
 * 绘制水域
 */
function drawWater(x, y, w, h) {
  const wave = Math.sin(x * 0.1 + y * 0.05) * 20;
  return rgba(37, 99, 235 + wave, 255);
}

/**
 * 绘制基地
 */
function drawBase(x, y, w, h, destroyed = false) {
  if (destroyed) {
    return rgba(75, 85, 99, 255);
  }
  // 金色鹰标
  return rgba(251, 191, 36, 255);
}

/**
 * 绘制玩家坦克 - 带细节的绿色坦克
 */
function drawPlayerTank(x, y, w, h, direction = 'up') {
  const cx = w / 2;
  const cy = h / 2;
  
  // 计算到中心的距离
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // 主体 - 绿色渐变
  if (dist < w / 3) {
    return rgba(74, 222, 128, 255); // 亮绿
  } else if (dist < w / 2.5) {
    return rgba(34, 197, 94, 255); // 中绿
  }
  
  // 履带 - 深绿色
  const trackWidth = w / 6;
  if (Math.abs(dx) > w/3 && Math.abs(dx) < w/2.5) {
    return rgba(22, 163, 74, 255); // 履带
  }
  
  // 炮管
  const barrelWidth = w / 8;
  if (Math.abs(dx) < barrelWidth && dy < 0) {
    return rgba(34, 197, 94, 255); // 炮管
  }
  
  // 透明背景
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制敌方坦克 - 带细节
 */
function drawEnemyTank(x, y, w, h, type = 'basic') {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let mainColor, trackColor, detailColor;
  
  switch (type) {
    case 'fast':
      mainColor = rgba(251, 191, 36, 255);    // 黄色
      trackColor = rgba(217, 119, 6, 255);     // 深黄
      detailColor = rgba(180, 83, 9, 255);     // 棕黄
      break;
    case 'heavy':
      mainColor = rgba(107, 114, 128, 255);   // 灰色
      trackColor = rgba(75, 85, 99, 255);      // 深灰
      detailColor = rgba(31, 41, 55, 255);     // 黑灰
      break;
    default: // basic
      mainColor = rgba(239, 68, 68, 255);     // 红色
      trackColor = rgba(220, 38, 38, 255);     // 深红
      detailColor = rgba(153, 27, 27, 255);    // 暗红
  }
  
  // 主体
  if (dist < w / 3) {
    return mainColor;
  } else if (dist < w / 2.5) {
    return trackColor;
  }
  
  // 履带
  const trackWidth = w / 6;
  if (Math.abs(dx) > w/3 && Math.abs(dx) < w/2.5) {
    return trackColor;
  }
  
  // 炮管
  const barrelWidth = w / 8;
  if (Math.abs(dx) < barrelWidth && dy < 0) {
    return detailColor;
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制子弹 - 带渐变效果
 */
function drawBullet(x, y, w, h, isPlayer = true) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;
  
  // 圆形子弹
  if (dist > maxRadius) {
    return rgba(0, 0, 0, 0);
  }
  
  // 径向渐变效果
  const ratio = dist / maxRadius;
  
  if (isPlayer) {
    // 玩家子弹 - 黄色到橙色渐变
    if (ratio < 0.3) {
      return rgba(255, 255, 200, 255); // 中心亮黄
    } else if (ratio < 0.6) {
      return rgba(251, 191, 36, 255);  // 中间黄
    } else {
      return rgba(249, 115, 22, 255);  // 边缘橙
    }
  } else {
    // 敌人子弹 - 红色渐变
    if (ratio < 0.3) {
      return rgba(255, 100, 100, 255); // 中心亮红
    } else if (ratio < 0.6) {
      return rgba(239, 68, 68, 255);   // 中间红
    } else {
      return rgba(185, 28, 28, 255);   // 边缘暗红
    }
  }
}

/**
 * 绘制道具 - 带光泽效果
 */
function drawPowerUp(x, y, w, h, type) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;
  
  // 圆形道具
  if (dist > maxRadius) {
    return rgba(0, 0, 0, 0);
  }
  
  let baseR, baseG, baseB;
  
  switch (type) {
    case 'star':
      baseR = 255; baseG = 215; baseB = 0;   // 金色
      break;
    case 'clock':
      baseR = 65; baseG = 105; baseB = 225;  // 宝蓝
      break;
    case 'shovel':
      baseR = 148; baseG = 0; baseB = 211;   // 紫色
      break;
    case 'life':
      baseR = 255; baseG = 0; baseB = 0;     // 红色
      break;
  }
  
  // 径向渐变模拟光泽
  const ratio = dist / maxRadius;
  const shine = Math.floor((1 - ratio) * 100);
  
  return rgba(
    Math.min(255, baseR + shine),
    Math.min(255, baseG + shine),
    Math.min(255, baseB + shine),
    255
  );
}

/**
 * 绘制爆炸效果 - 带粒子感
 */
function drawExplosion(x, y, w, h, frame) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;
  
  // 基础颜色层
  let baseR, baseG, baseB;
  switch (frame) {
    case 1: // 黄色核心
      baseR = 255; baseG = 200; baseB = 50;
      break;
    case 2: // 橙色中间层
      baseR = 255; baseG = 140; baseB = 0;
      break;
    case 3: // 红色外层
      baseR = 255; baseG = 69; baseB = 0;
      break;
    case 4: // 深红烟雾
      baseR = 139; baseG = 0; baseB = 0;
      break;
  }
  
  // 透明度随距离衰减
  const ratio = dist / maxRadius;
  
  // 添加噪点效果模拟火焰
  const noise = (Math.random() - 0.5) * 50;
  const alpha = Math.max(0, 255 - ratio * 255 + noise);
  
  if (ratio > 0.9) {
    return rgba(0, 0, 0, 0); // 最外层透明
  }
  
  return rgba(
    Math.min(255, baseR + noise),
    Math.min(255, baseG + noise),
    Math.min(255, baseB + noise),
    alpha
  );
}

// ==================== WAV 音频生成 ====================

/**
 * 生成 WAV 音频文件
 */
function generateWAV(filename, duration, frequency, type = 'sine', volume = 0.5) {
  const sampleRate = 44100;
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(numSamples);
  
  // 生成音频数据
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
        // 简单的旋律
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
        const noteDuration = 0.25;
        const noteIndex = Math.floor(t / noteDuration) % notes.length;
        const noteFreq = notes[noteIndex];
        sample = Math.sin(2 * Math.PI * noteFreq * t) * 0.6;
        sample += Math.sin(2 * Math.PI * (noteFreq * 1.5) * t) * 0.3;
        break;
      case 'explosion':
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 5);
        const lowFreq = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 3);
        sample = (noise + lowFreq) * 0.8;
        break;
      case 'fire':
        sample = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 20) * 0.7;
        sample += (Math.random() * 2 - 1) * 0.2 * Math.exp(-t * 15);
        break;
      case 'hit':
        sample = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 10) * 0.5;
        sample += Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 8) * 0.3;
        break;
      case 'powerup':
        const risingFreq = 400 + t * 800;
        sample = Math.sin(2 * Math.PI * risingFreq * t) * Math.exp(-t * 2) * 0.6;
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }
    
    samples[i] = sample * volume;
  }
  
  // 编码为 WAV
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    console.log(`📁 创建目录：${AUDIO_DIR}`);
  }
  
  const wavBuffer = encodeWAV(samples, sampleRate);
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, wavBuffer);
  console.log(`🎵 生成音频：${filename} (${duration}s, ${frequency}Hz, ${type})`);
}

/**
 * 编码 WAV 文件
 */
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // 写入采样数据
  floatTo16BitPCM(view, 44, samples);
  
  return Buffer.from(buffer);
}

/**
 * 写入字符串
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Float 转 16-bit PCM
 */
function floatTo16BitPCM(view, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

// ==================== 主函数 ====================

function main() {
  console.log('='.repeat(60));
  console.log('🎮 坦克大战 资源生成器');
  console.log('='.repeat(60));
  
  // ========== 生成图片资源 ==========
  console.log('\n=== 生成图片资源 ===\n');
  
  // 场景图片
  generatePNG('background.png', GAME_WIDTH, GAME_HEIGHT, drawBackground, 'scene');
  generatePNG('grid.png', GAME_WIDTH, GAME_HEIGHT, drawGrid, 'scene');
  generatePNG('wall_brick.png', GRID_SIZE, GRID_SIZE, drawBrickWall, 'scene');
  generatePNG('wall_steel.png', GRID_SIZE, GRID_SIZE, drawSteelWall, 'scene');
  generatePNG('grass.png', GRID_SIZE, GRID_SIZE, drawGrass, 'scene');
  generatePNG('water.png', GRID_SIZE, GRID_SIZE, drawWater, 'scene');
  generatePNG('base.png', 60, 60, (x, y, w, h) => drawBase(x, y, w, h, false), 'scene');
  generatePNG('base_destroyed.png', 60, 60, (x, y, w, h) => drawBase(x, y, w, h, true), 'scene');
  
  // 玩家坦克
  for (const dir of ['up', 'down', 'left', 'right']) {
    generatePNG(`player_tank_${dir}.png`, 48, 48, (x, y, w, h) => drawPlayerTank(x, y, w, h, dir), 'sprite');
  }
  
  // 敌方坦克
  for (const type of ['basic', 'fast', 'heavy']) {
    const size = type === 'heavy' ? 54 : type === 'fast' ? 42 : 48;
    for (const dir of ['up', 'down', 'left', 'right']) {
      generatePNG(`enemy_${type}_${dir}.png`, size, size, (x, y, w, h) => drawEnemyTank(x, y, w, h, type), 'sprite');
    }
  }
  
  // 子弹
  generatePNG('bullet_player.png', 12, 12, drawBullet, 'sprite');
  generatePNG('bullet_enemy.png', 12, 12, (x, y, w, h) => drawBullet(x, y, w, h, false), 'sprite');
  
  // 道具
  for (const type of ['star', 'clock', 'shovel', 'life']) {
    generatePNG(`powerup_${type}.png`, 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, type), 'icon');
  }
  
  // 爆炸特效
  for (let i = 1; i <= 4; i++) {
    generatePNG(`explosion_${i}.png`, 60, 60, (x, y, w, h) => drawExplosion(x, y, w, h, i), 'effect');
  }
  
  // ========== 生成音频资源 ==========
  console.log('\n=== 生成音频资源 ===\n');
  
  // BGM
  generateWAV('bgm_main.wav', 180, 0, 'melody', 0.5);
  generateWAV('bgm_gameplay.wav', 120, 0, 'melody', 0.4);
  generateWAV('bgm_victory.wav', 30, 523, 'melody', 0.6);
  generateWAV('bgm_defeat.wav', 20, 330, 'melody', 0.5);
  
  // SFX
  generateWAV('sfx_button_click.wav', 0.1, 800, 'sine', 0.4);
  generateWAV('sfx_fire.wav', 0.2, 0, 'fire', 0.6);
  generateWAV('sfx_explosion.wav', 0.5, 0, 'explosion', 0.7);
  generateWAV('sfx_hit.wav', 0.15, 0, 'hit', 0.5);
  generateWAV('sfx_powerup_appear.wav', 0.3, 0, 'powerup', 0.6);
  generateWAV('sfx_powerup_pickup.wav', 0.4, 0, 'powerup', 0.6);
  generateWAV('sfx_base_destroyed.wav', 1.0, 0, 'explosion', 0.8);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有资源生成完成!');
  console.log('='.repeat(60));
  console.log(`📂 输出目录：${PUBLIC_DIR}`);
  console.log('');
}

main();
