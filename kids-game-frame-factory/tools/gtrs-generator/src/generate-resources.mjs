/**
 * 飞机大战游戏资源生成器
 * 采用 Sharp 技术生成图像资源，直接生成 WAV 音频
 * 
 * 功能：
 * 1. 使用 Sharp 生成 PNG 图片（高性能、简单 API）
 * 2. 直接生成 WAV 音频二进制数据
 * 3. 生成 GTRS.json 配置文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 配置 ==========
const GAME_CODE = 'plane-shooter';
const GAME_NAME = '飞机大战';

// ⭐ 主题代码：决定资源路径前缀 /themes/{THEME_CODE}/
//    可通过命令行参数传入：node generate-resources.mjs --theme-code my_theme
//    也可通过环境变量 THEME_CODE 设置，默认值为 'default'
const _themeCodeArg = process.argv.find((a, i) => process.argv[i - 1] === '--theme-code');
const THEME_CODE = (_themeCodeArg || process.env.THEME_CODE || 'default')
  .toLowerCase().replace(/[^a-z0-9_]/g, '_');

// 输出根目录（public/themes/{THEME_CODE}/）
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'themes', THEME_CODE);
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const SCENE_DIR = path.join(ASSETS_DIR, 'scene');
const SPRITE_DIR = path.join(ASSETS_DIR, 'sprite');
const ICON_DIR = path.join(ASSETS_DIR, 'icon');
const EFFECT_DIR = path.join(ASSETS_DIR, 'effect');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');
const OUTPUT_CONFIG = path.join(__dirname, '..', 'src', 'config', 'GTRS.json');

// 游戏设计参数
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const GRID_SIZE = 40;

// ========== 工具函数 ==========

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录：${dir}`);
  }
}

/**
 * 生成 PNG 图片（使用 Sharp）
 * @param {string} filename - 文件名
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {function} drawFunc - 绘制函数 (x, y, width, height) => { r, g, b, a }
 * @param {string} outputDir - 输出目录
 */
async function generatePNG(filename, width, height, drawFunc, outputDir) {
  // 创建原始数据缓冲区
  const buffer = Buffer.alloc(width * height * 4);
  
  // 填充像素数据
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = drawFunc(x, y, width, height);
      const idx = (y * width + x) * 4;
      buffer[idx] = color.r;
      buffer[idx + 1] = color.g;
      buffer[idx + 2] = color.b;
      buffer[idx + 3] = color.a;
    }
  }
  
  // 使用 Sharp 处理并保存
  const filepath = path.join(outputDir, filename);
  await sharp(buffer, {
    raw: {
      width: width,
      height: height,
      channels: 4
    }
  })
  .png()
  .toFile(filepath);
  
  console.log(`🖼️  生成图片：${filename} (${width}x${height})`);
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
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
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
        const note = Math.floor(t * 4) % 4;
        const freqs = [frequency, frequency * 1.25, frequency * 1.5, frequency * 1.25];
        sample = Math.sin(2 * Math.PI * freqs[note] * t);
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
    
    // 应用音量和渐弱
    const fadeOut = 1 - (i / numSamples) * 0.3;
    const value = Math.floor(sample * volume * 32767 * fadeOut);
    samples.writeInt16LE(Math.max(-32768, Math.min(32767, value)), i * 2);
  }
  
  const wav = Buffer.concat([header, samples]);
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, wav);
  console.log(`🎵 生成音频：${filename} (${duration}s, ${frequency}Hz, ${type})`);
}

// ========== 图片绘制函数 ==========

/**
 * 颜色辅助函数
 */
function rgba(r, g, b, a = 255) {
  return { r, g, b, a };
}

/**
 * 绘制太空背景 - 深蓝渐变
 */
function drawSpaceBackground(x, y, w, h) {
  const ratio = y / h;
  const r = Math.floor(10 + ratio * 10);
  const g = Math.floor(10 + ratio * 15);
  const b = Math.floor(40 + ratio * 30);
  return rgba(r, g, b, 255);
}

/**
 * 绘制星空 - 随机星星点缀
 */
function drawStars(x, y, w, h) {
  // 使用伪随机生成星星（基于坐标的确定性"随机"）
  const seed = (x * 7 + y * 13) % 1000;
  const isStar = seed > 990;
  
  if (isStar) {
    const brightness = (seed % 100) + 155;
    return rgba(brightness, brightness, brightness, 255);
  }
  
  return rgba(0, 0, 0, 0); // 透明
}

/**
 * 绘制网格 - 半透明参考线
 */
function drawGrid(x, y, w, h) {
  const lineWidth = 1;
  
  if (x % GRID_SIZE < lineWidth || y % GRID_SIZE < lineWidth) {
    return rgba(100, 100, 100, 60); // 半透明灰线
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制玩家飞机 - 绿色战斗机
 */
function drawPlayerPlane(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  
  // 机身主体 - 流线型
  const bodyWidth = w * 0.3;
  const bodyHeight = h * 0.6;
  
  if (Math.abs(dx) < bodyWidth && Math.abs(dy) < bodyHeight) {
    return rgba(74, 222, 128, 255); // 亮绿机身
  }
  
  // 机翼 - 三角形
  const wingSpan = w * 0.8;
  const wingHeight = h * 0.2;
  
  if (Math.abs(dy) < wingHeight && Math.abs(dx) < wingSpan) {
    const wingRatio = Math.abs(dx) / wingSpan;
    if (Math.abs(dy) < wingHeight * (1 - wingRatio)) {
      return rgba(34, 197, 94, 255); // 深绿机翼
    }
  }
  
  // 尾翼
  const tailWidth = w * 0.2;
  const tailHeight = h * 0.15;
  if (dy > bodyHeight * 0.8 && Math.abs(dx) < tailWidth) {
    return rgba(22, 163, 74, 255);
  }
  
  // 驾驶舱
  const cockpitWidth = w * 0.15;
  const cockpitHeight = h * 0.2;
  if (Math.abs(dx) < cockpitWidth && Math.abs(dy - cy * 0.5) < cockpitHeight) {
    return rgba(96, 165, 250, 255); // 蓝色座舱
  }
  
  return rgba(0, 0, 0, 0); // 透明背景
}

/**
 * 绘制小型敌机 - 红色侦察机
 */
function drawEnemySmall(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  
  // 圆形机身
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < w * 0.4) {
    return rgba(239, 68, 68, 255); // 红色
  }
  
  // 机翼
  if (Math.abs(dy) < h * 0.15 && Math.abs(dx) < w * 0.4) {
    return rgba(220, 38, 38, 255); // 深红
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制中型敌机 - 紫色轰炸机
 */
function drawEnemyMedium(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  
  // 椭圆形机身
  const ellipseX = ((x - cx) / (w * 0.4)) ** 2;
  const ellipseY = ((y - cy) / (h * 0.5)) ** 2;
  
  if (ellipseX + ellipseY < 1) {
    return rgba(168, 85, 247, 255); // 紫色
  }
  
  // 机翼
  if (Math.abs(y - cy) < h * 0.2 && Math.abs(x - cx) < w * 0.45) {
    return rgba(147, 51, 234, 255); // 深紫
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制大型敌机 - 金色战舰
 */
function drawEnemyLarge(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  
  // 主体 - 矩形
  if (Math.abs(x - cx) < w * 0.35 && Math.abs(y - cy) < h * 0.4) {
    return rgba(251, 191, 36, 255); // 金色
  }
  
  // 侧翼
  if (Math.abs(y - cy) < h * 0.25 && Math.abs(x - cx) < w * 0.45) {
    return rgba(245, 158, 11, 255); // 深金
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制 Boss - 巨型母舰
 */
function drawEnemyBoss(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  
  // 核心圆形
  const coreRadius = w * 0.3;
  if (dx * dx + dy * dy < coreRadius * coreRadius) {
    return rgba(139, 92, 246, 255); // 紫色核心
  }
  
  // 外环
  const outerRadius = w * 0.45;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < outerRadius && dist > coreRadius) {
    return rgba(124, 58, 237, 255); // 深紫外环
  }
  
  // 触手
  const tentacleWidth = w * 0.1;
  const tentacleLength = h * 0.3;
  for (let i = -2; i <= 2; i++) {
    const tx = i * tentacleWidth * 1.5;
    if (Math.abs(dx - tx) < tentacleWidth && dy > coreRadius && dy < coreRadius + tentacleLength) {
      return rgba(109, 40, 217, 255);
    }
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制玩家子弹
 */
function drawPlayerBullet(x, y, w, h, level = 1) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // 子弹主体 - 根据等级不同颜色
  if (dist < w * 0.4) {
    switch (level) {
      case 1: return rgba(74, 222, 128, 255); // 绿色
      case 2: return rgba(59, 130, 246, 255); // 蓝色
      case 3: return rgba(251, 191, 36, 255); // 金色
      default: return rgba(74, 222, 128, 255);
    }
  }
  
  // 光晕效果
  if (dist < w * 0.5) {
    const ratio = dist / (w * 0.5);
    const alpha = Math.floor((1 - ratio) * 100);
    return rgba(255, 255, 255, alpha);
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制敌方子弹
 */
function drawEnemyBullet(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // 红色子弹
  if (dist < w * 0.4) {
    return rgba(239, 68, 68, 255);
  }
  
  // 光晕
  if (dist < w * 0.5) {
    const ratio = dist / (w * 0.5);
    const alpha = Math.floor((1 - ratio) * 80);
    return rgba(255, 100, 100, alpha);
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制道具
 */
function drawPowerUp(x, y, w, h, type) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // 圆形基础
  if (dist < w * 0.45) {
    let color;
    switch (type) {
      case 'weapon': color = rgba(239, 68, 68, 255); break; // 红色
      case 'speed': color = rgba(251, 191, 36, 255); break; // 黄色
      case 'shield': color = rgba(59, 130, 246, 255); break; // 蓝色
      case 'health': color = rgba(34, 197, 94, 255); break; // 绿色
      case 'bomb': color = rgba(168, 85, 247, 255); break; // 紫色
      default: color = rgba(255, 255, 255, 255);
    }
    return color;
  }
  
  // 光泽效果
  if (dist < w * 0.5) {
    const ratio = dist / (w * 0.5);
    const alpha = Math.floor((1 - ratio) * 150);
    return rgba(255, 255, 255, alpha);
  }
  
  return rgba(0, 0, 0, 0);
}

/**
 * 绘制爆炸特效
 */
function drawExplosion(x, y, w, h, frame) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;
  
  if (dist > maxRadius) {
    return rgba(0, 0, 0, 0);
  }
  
  // 根据帧数改变颜色和大小
  const ratio = dist / maxRadius;
  let baseR, baseG, baseB, alpha;
  
  switch (frame) {
    case 1: // 初始 - 白色核心
      baseR = 255; baseG = 255; baseB = 200;
      alpha = Math.floor((1 - ratio) * 255);
      break;
    case 2: // 中间 - 橙黄色
      baseR = 255; baseG = 140; baseB = 0;
      alpha = Math.floor((1 - ratio) * 200);
      break;
    case 3: // 后期 - 红色
      baseR = 255; baseG = 69; baseB = 0;
      alpha = Math.floor((1 - ratio) * 150);
      break;
    case 4: // 消散 - 深红烟雾
      baseR = 139; baseG = 0; baseB = 0;
      alpha = Math.floor((1 - ratio) * 100);
      break;
    default:
      baseR = 255; baseG = 100; baseB = 0;
      alpha = 255;
  }
  
  // 添加噪点增加火焰感
  const noise = (Math.random() - 0.5) * 30;
  return rgba(
    Math.min(255, Math.max(0, baseR + noise)),
    Math.min(255, Math.max(0, baseG + noise)),
    Math.min(255, Math.max(0, baseB + noise)),
    alpha
  );
}

// ========== 主函数 ==========

async function main() {
  console.log('='.repeat(60));
  console.log(`🎮 ${GAME_NAME} GTRS 资源生成器 (Sharp 版本)`);
  console.log(`🔑 主题代码：${THEME_CODE}  →  资源路径前缀：/themes/${THEME_CODE}/`);
  console.log('   （可通过 --theme-code <code> 参数或 THEME_CODE 环境变量指定）');
  console.log('='.repeat(60));
  
  // 1. 创建目录结构
  console.log('\n📂 创建目录结构...');
  ensureDir(ASSETS_DIR);
  ensureDir(SCENE_DIR);
  ensureDir(SPRITE_DIR);
  ensureDir(ICON_DIR);
  ensureDir(EFFECT_DIR);
  ensureDir(AUDIO_DIR);
  console.log(`✅ 输出位置：${PUBLIC_DIR}`);
  
  // 2. 生成图片资源
  console.log('\n=== 生成图片资源 ===\n');
  
  // Scene 场景资源
  await generatePNG('background.png', GAME_WIDTH, GAME_HEIGHT, drawSpaceBackground, SCENE_DIR);
  await generatePNG('stars.png', GAME_WIDTH, GAME_HEIGHT, drawStars, SCENE_DIR);
  await generatePNG('grid.png', GAME_WIDTH, GAME_HEIGHT, drawGrid, SCENE_DIR);
  
  // Sprite 精灵资源
  await generatePNG('player_plane.png', 60, 80, drawPlayerPlane, SPRITE_DIR);
  await generatePNG('enemy_small.png', 40, 40, drawEnemySmall, SPRITE_DIR);
  await generatePNG('enemy_medium.png', 50, 60, drawEnemyMedium, SPRITE_DIR);
  await generatePNG('enemy_large.png', 80, 80, drawEnemyLarge, SPRITE_DIR);
  await generatePNG('enemy_boss.png', 150, 150, drawEnemyBoss, SPRITE_DIR);
  await generatePNG('bullet_player_1.png', 10, 20, (x, y, w, h) => drawPlayerBullet(x, y, w, h, 1), SPRITE_DIR);
  await generatePNG('bullet_player_2.png', 20, 20, (x, y, w, h) => drawPlayerBullet(x, y, w, h, 2), SPRITE_DIR);
  await generatePNG('bullet_player_3.png', 30, 20, (x, y, w, h) => drawPlayerBullet(x, y, w, h, 3), SPRITE_DIR);
  await generatePNG('bullet_enemy.png', 10, 10, drawEnemyBullet, SPRITE_DIR);
  
  // Icon 图标资源
  await generatePNG('powerup_weapon.png', 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, 'weapon'), ICON_DIR);
  await generatePNG('powerup_speed.png', 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, 'speed'), ICON_DIR);
  await generatePNG('powerup_shield.png', 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, 'shield'), ICON_DIR);
  await generatePNG('powerup_health.png', 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, 'health'), ICON_DIR);
  await generatePNG('powerup_bomb.png', 30, 30, (x, y, w, h) => drawPowerUp(x, y, w, h, 'bomb'), ICON_DIR);
  
  // Effect 特效资源
  await generatePNG('explosion_1.png', 80, 80, (x, y, w, h) => drawExplosion(x, y, w, h, 1), EFFECT_DIR);
  await generatePNG('explosion_2.png', 80, 80, (x, y, w, h) => drawExplosion(x, y, w, h, 2), EFFECT_DIR);
  await generatePNG('explosion_3.png', 80, 80, (x, y, w, h) => drawExplosion(x, y, w, h, 3), EFFECT_DIR);
  await generatePNG('explosion_4.png', 80, 80, (x, y, w, h) => drawExplosion(x, y, w, h, 4), EFFECT_DIR);
  
  // 3. 生成音频资源
  console.log('\n=== 生成音频资源 ===\n');
  
  // BGM
  generateWAV('bgm_main.wav', 180, 440, 'melody', 0.6);
  generateWAV('bgm_gameplay.wav', 120, 523, 'melody', 0.5);
  generateWAV('bgm_victory.wav', 30, 659, 'melody', 0.7);
  generateWAV('bgm_defeat.wav', 20, 330, 'melody', 0.5);
  
  // SFX
  generateWAV('effect_fire.wav', 0.2, 0, 'fire', 0.6);
  generateWAV('effect_explosion.wav', 0.5, 0, 'explosion', 0.7);
  generateWAV('effect_hit.wav', 0.15, 0, 'hit', 0.5);
  generateWAV('effect_powerup.wav', 0.3, 0, 'powerup', 0.6);
  generateWAV('effect_button_click.wav', 0.1, 800, 'sine', 0.5);
  
  // 4. 生成 GTRS.json
  console.log('\n📄 生成 GTRS.json 配置...');
  
  const gtrsConfig = {
    specMeta: {
      specName: 'GTRS',
      specVersion: '1.0.0',
      compatibleVersion: '1.0.0'
    },
    themeInfo: {
      themeCode: THEME_CODE,
      themeId: `${GAME_CODE.replace(/-/g, '_')}_${THEME_CODE}`,
      gameId: GAME_CODE,
      ownerType: 'GAME',
      ownerId: GAME_CODE,
      themeName: `${GAME_NAME} - ${THEME_CODE === 'default' ? '默认主题' : THEME_CODE}`,
      isDefault: THEME_CODE === 'default',
      author: '官方',
      description: `${GAME_NAME}${THEME_CODE === 'default' ? '默认' : THEME_CODE}主题配置`
    },
    globalStyle: {
      bgColor: '#0a0a28',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#4ade80',
      secondaryColor: '#3b82f6',
      textColor: '#ffffff'
    },
    resources: {
      images: {
        login: {},
        scene: {
          scene_bg_main: { alias: '太空背景', src: `/themes/${THEME_CODE}/assets/scene/background.png`, type: 'png' },
          scene_bg_stars: { alias: '星空',     src: `/themes/${THEME_CODE}/assets/scene/stars.png`,      type: 'png' },
          scene_grid:     { alias: '网格',     src: `/themes/${THEME_CODE}/assets/scene/grid.png`,       type: 'png' }
        },
        ui: {},
        icon: {},
        effect: {}
      },
      audio: {
        bgm: {
          bgm_main:      { alias: '主菜单音乐', src: `/themes/${THEME_CODE}/assets/audio/bgm_main.wav`,      type: 'wav', volume: 0.6 },
          bgm_gameplay:  { alias: '游戏音乐',   src: `/themes/${THEME_CODE}/assets/audio/bgm_gameplay.wav`,  type: 'wav', volume: 0.5 },
          bgm_victory:   { alias: '胜利音乐',   src: `/themes/${THEME_CODE}/assets/audio/bgm_victory.wav`,   type: 'wav', volume: 0.7 },
          bgm_defeat:    { alias: '失败音乐',   src: `/themes/${THEME_CODE}/assets/audio/bgm_defeat.wav`,    type: 'wav', volume: 0.5 }
        },
        effect: {
          effect_fire:         { alias: '射击音效', src: `/themes/${THEME_CODE}/assets/audio/effect_fire.wav`,         type: 'wav', volume: 0.6 },
          effect_explosion:    { alias: '爆炸音效', src: `/themes/${THEME_CODE}/assets/audio/effect_explosion.wav`,    type: 'wav', volume: 0.7 },
          effect_hit:          { alias: '击中音效', src: `/themes/${THEME_CODE}/assets/audio/effect_hit.wav`,          type: 'wav', volume: 0.5 },
          effect_powerup:      { alias: '道具音效', src: `/themes/${THEME_CODE}/assets/audio/effect_powerup.wav`,      type: 'wav', volume: 0.6 },
          effect_button_click: { alias: '按钮音效', src: `/themes/${THEME_CODE}/assets/audio/effect_button_click.wav`, type: 'wav', volume: 0.5 }
        },
        voice: {}
      },
      video: {}
    }
  };
  
  // 输出到两个位置
  const configOutput = path.join(__dirname, '..', 'src', 'config', 'GTRS.json');
  fs.writeFileSync(configOutput, JSON.stringify(gtrsConfig, null, 4));
  console.log(`✅ GTRS.json 已生成：${configOutput}`);
  
  const publicOutput = path.join(PUBLIC_DIR, 'GTRS.json');
  fs.writeFileSync(publicOutput, JSON.stringify(gtrsConfig, null, 4));
  console.log(`✅ GTRS.json 已复制：${publicOutput}`);
  
  // 5. 完成总结
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有资源生成完成！');
  console.log('='.repeat(60));
  console.log(`📊 统计:`);
  console.log(`   - 场景图片：3 张`);
  console.log(`   - 精灵图片：10 张`);
  console.log(`   - 图标图片：5 张`);
  console.log(`   - 特效图片：4 张`);
  console.log(`   - 音频：9 首`);
  console.log(`   - 输出目录：${PUBLIC_DIR}`);
  console.log('');
}

main();
