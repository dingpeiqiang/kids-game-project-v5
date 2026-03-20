#!/usr/bin/env node
/**
 * 主题资源生成器 - 完整版（图片 + 音频）
 * 使用 Node.js + Canvas 生成精美图片
 * 使用 Web Audio API 生成音效
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 输出目录配置
const OUTPUT_DIR = path.join(__dirname, 'kids-game-frontend', 'dist', 'games');
const ASSETS_DIR = path.join(__dirname, 'kids-game-frontend', 'assets', 'games');
const AUDIO_OUTPUT_DIR = path.join(OUTPUT_DIR, 'audio');
const AUDIO_ASSETS_DIR = path.join(ASSETS_DIR, 'audio');

// 确保音频目录存在
[AUDIO_OUTPUT_DIR, AUDIO_ASSETS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 主题配置（保持不变）
const THEMES = {
  snake: {
    default: {
      name: '清新绿',
      colors: {
        snakeHead: '#4ade80',
        snakeBody: '#22c55e',
        snakeTail: '#16a34a',
        food: '#ef4444',
        bgStart: '#0f172a',
        bgEnd: '#1e293b'
      }
    },
    retro: {
      name: '经典复古',
      colors: {
        snakeHead: '#22c55e',
        snakeBody: '#16a34a',
        snakeTail: '#15803d',
        food: '#eab308',
        bgStart: '#000000',
        bgEnd: '#1a1a1a'
      }
    },
    orange: {
      name: '活力橙',
      colors: {
        snakeHead: '#f97316',
        snakeBody: '#ea580c',
        snakeTail: '#c2410c',
        food: '#06b6d4',
        bgStart: '#1e1b4b',
        bgEnd: '#312e81'
      }
    }
  },
  pvz: {
    default: {
      name: '阳光活力',
      colors: {
        plant: '#4ade80',
        zombie: '#6b7280',
        sun: '#fbbf24',
        pea: '#22c55e',
        bgGrass: '#166534',
        bgSky: '#1e3a8a'
      }
    },
    moon: {
      name: '月夜幽深',
      colors: {
        plant: '#a78bfa',
        zombie: '#4b5563',
        sun: '#fcd34d',
        pea: '#9333ea',
        bgGrass: '#2e1065',
        bgSky: '#0f172a'
      }
    },
    cute: {
      name: '卡通萌系',
      colors: {
        plant: '#fb7185',
        zombie: '#9ca3af',
        sun: '#fdba74',
        pea: '#f472b6',
        bgGrass: '#fce7f3',
        bgSky: '#fbcfe8'
      }
    }
  }
};

/**
 * 颜色辅助函数
 */
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * 保存 Canvas 为 PNG
 */
function saveCanvas(canvas, filePath) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

/**
 * 生成正弦波音频数据
 */
function generateSineWave(frequency, duration, sampleRate = 44100) {
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    buffer[i] = Math.sin(2 * Math.PI * frequency * t);
  }
  
  return buffer;
}

/**
 * 生成方波音频数据
 */
function generateSquareWave(frequency, duration, sampleRate = 44100) {
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t);
    buffer[i] = value > 0 ? 0.3 : -0.3;
  }
  
  return buffer;
}

/**
 * 生成三角波音频数据
 */
function generateTriangleWave(frequency, duration, sampleRate = 44100) {
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const phase = (2 * Math.PI * frequency * t) % (2 * Math.PI);
    buffer[i] = (2 / Math.PI) * Math.asin(Math.sin(phase)) * 0.5;
  }
  
  return buffer;
}

/**
 * 应用包络（ADSR）
 */
function applyEnvelope(buffer, attack, decay, sustain, release, sampleRate = 44100) {
  const samples = buffer.length;
  const attackSamples = Math.floor(attack * sampleRate);
  const decaySamples = Math.floor(decay * sampleRate);
  const releaseSamples = Math.floor(release * sampleRate);
  const sustainSamples = samples - attackSamples - decaySamples - releaseSamples;
  
  let index = 0;
  
  // Attack
  for (let i = 0; i < attackSamples && index < samples; i++, index++) {
    buffer[index] *= i / attackSamples;
  }
  
  // Decay
  for (let i = 0; i < decaySamples && index < samples; i++, index++) {
    buffer[index] *= 1 - (i / decaySamples) * (1 - sustain);
  }
  
  // Sustain
  for (let i = 0; i < sustainSamples && index < samples; i++, index++) {
    buffer[index] *= sustain;
  }
  
  // Release
  for (let i = 0; i < releaseSamples && index < samples; i++, index++) {
    buffer[index] *= 1 - (i / releaseSamples);
  }
  
  return buffer;
}

/**
 * 将 Float32Array 转换为 WAV 格式
 */
function floatToWav(floatData, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = floatData.length * bytesPerSample;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  let offset = 44;
  for (let i = 0; i < floatData.length; i++) {
    const sample = Math.max(-1, Math.min(1, floatData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  return Buffer.from(buffer);
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * 生成吃东西音效（高频短音）
 */
function generateEatSound() {
  const sampleRate = 44100;
  const duration = 0.15;
  
  // 生成频率滑动的正弦波（从 800Hz 到 1200Hz）
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 800 + (400 * t / duration);
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
  }
  
  // 应用包络
  applyEnvelope(buffer, 0.01, 0.02, 0.7, 0.05, sampleRate);
  
  return floatToWav(buffer, sampleRate);
}

/**
 * 生成游戏结束音效（下降音调）
 */
function generateGameOverSound() {
  const sampleRate = 44100;
  const duration = 0.8;
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 400 * Math.pow(0.5, t / duration);
    buffer[i] = Math.sin(2 * Math.PI * freq * t) * 0.4;
  }
  
  applyEnvelope(buffer, 0.05, 0.1, 0.5, 0.3, sampleRate);
  
  return floatToWav(buffer, sampleRate);
}

/**
 * 生成射击音效（类似豌豆发射）
 */
function generateShootSound() {
  const sampleRate = 44100;
  const duration = 0.2;
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  // 混合正弦波和噪声
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const sine = Math.sin(2 * Math.PI * 600 * t) * 0.3;
    const noise = (Math.random() - 0.5) * 0.2;
    buffer[i] = sine + noise;
  }
  
  applyEnvelope(buffer, 0.01, 0.05, 0.3, 0.1, sampleRate);
  
  return floatToWav(buffer, sampleRate);
}

/**
 * 生成收集音效（阳光收集）
 */
function generateCollectSound() {
  const sampleRate = 44100;
  const duration = 0.3;
  
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  // 上升的琶音
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  for (let n = 0; n < notes.length; n++) {
    const noteStart = n * (samples / notes.length);
    const noteEnd = (n + 1) * (samples / notes.length);
    
    for (let i = Math.floor(noteStart); i < Math.floor(noteEnd) && i < samples; i++) {
      const t = i / sampleRate;
      const noteInNote = (i - noteStart) / (noteEnd - noteStart);
      const envelope = Math.sin(Math.PI * noteInNote);
      buffer[i] += Math.sin(2 * Math.PI * notes[n] * t) * 0.3 * envelope;
    }
  }
  
  return floatToWav(buffer, sampleRate);
}

/**
 * 生成背景音乐（简单的循环旋律）
 */
function generateBackgroundMusic(themeName, duration = 30) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  // 根据主题选择调式
  let scale;
  if (themeName.includes('清新') || themeName.includes('活力')) {
    scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C 大调
  } else if (themeName.includes('复古')) {
    scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00]; // G 大调
  } else {
    scale = [220.00, 261.63, 329.63, 440.00, 523.25, 659.25]; // A 小调
  }
  
  // 生成简单的分解和弦
  const beatDuration = 0.5; // 每拍 0.5 秒
  const beats = Math.floor(duration / beatDuration);
  
  for (let b = 0; b < beats; b++) {
    const noteIndex = b % scale.length;
    const noteFreq = scale[noteIndex];
    const noteStart = b * Math.floor(beatDuration * sampleRate);
    const noteSamples = Math.floor(beatDuration * sampleRate);
    
    for (let i = 0; i < noteSamples && noteStart + i < samples; i++) {
      const t = (noteStart + i) / sampleRate;
      const noteT = i / noteSamples;
      
      // 使用三角波获得更柔和的声音
      const phase = (2 * Math.PI * noteFreq * t) % (2 * Math.PI);
      let wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
      
      // 添加包络
      const envelope = Math.sin(Math.PI * noteT);
      
      // 添加和声
      const harmony = Math.sin(2 * Math.PI * (noteFreq * 1.5) * t) * 0.3;
      
      buffer[noteStart + i] += (wave * 0.3 + harmony * 0.1) * envelope;
    }
  }
  
  // 归一化
  let maxVal = 0;
  for (let i = 0; i < samples; i++) {
    maxVal = Math.max(maxVal, Math.abs(buffer[i]));
  }
  
  if (maxVal > 0) {
    for (let i = 0; i < samples; i++) {
      buffer[i] /= maxVal;
    }
  }
  
  return floatToWav(buffer, sampleRate);
}

/**
 * 保存音频文件
 */
function saveAudioFile(buffer, filePath) {
  fs.writeFileSync(filePath, buffer);
}

/**
 * 生成贪吃蛇音效
 */
function generateSnakeAudio() {
  console.log('🎵 生成贪吃蛇音效...');
  
  // 吃东西音效
  const eatSound = generateEatSound();
  saveAudioFile(eatSound, path.join(AUDIO_OUTPUT_DIR, 'snake_eat.wav'));
  saveAudioFile(eatSound, path.join(AUDIO_ASSETS_DIR, 'snake_eat.wav'));
  
  // 游戏结束音效
  const gameOverSound = generateGameOverSound();
  saveAudioFile(gameOverSound, path.join(AUDIO_OUTPUT_DIR, 'snake_gameover.wav'));
  saveAudioFile(gameOverSound, path.join(AUDIO_ASSETS_DIR, 'snake_gameover.wav'));
  
  // 背景音乐（为每个主题生成不同风格）
  Object.entries(THEMES.snake).forEach(([name, config]) => {
    const bgm = generateBackgroundMusic(config.name, 30);
    saveAudioFile(bgm, path.join(AUDIO_OUTPUT_DIR, `snake_bgm_${name}.wav`));
    saveAudioFile(bgm, path.join(AUDIO_ASSETS_DIR, `snake_bgm_${name}.wav`));
  });
  
  console.log('✅ 贪吃蛇音效完成');
}

/**
 * 生成 PVZ 音效
 */
function generatePVZAudio() {
  console.log('🎵 生成 PVZ 音效...');
  
  // 射击音效
  const shootSound = generateShootSound();
  saveAudioFile(shootSound, path.join(AUDIO_OUTPUT_DIR, 'pvz_shoot.wav'));
  saveAudioFile(shootSound, path.join(AUDIO_ASSETS_DIR, 'pvz_shoot.wav'));
  
  // 收集音效
  const collectSound = generateCollectSound();
  saveAudioFile(collectSound, path.join(AUDIO_OUTPUT_DIR, 'pvz_collect.wav'));
  saveAudioFile(collectSound, path.join(AUDIO_ASSETS_DIR, 'pvz_collect.wav'));
  
  // 击中音效
  const hitSound = generateShootSound(); // 复用射击音效，稍作修改
  saveAudioFile(hitSound, path.join(AUDIO_OUTPUT_DIR, 'pvz_hit.wav'));
  saveAudioFile(hitSound, path.join(AUDIO_ASSETS_DIR, 'pvz_hit.wav'));
  
  // 种植音效
  const plantSound = generateEatSound();
  saveAudioFile(plantSound, path.join(AUDIO_OUTPUT_DIR, 'pvz_plant.wav'));
  saveAudioFile(plantSound, path.join(AUDIO_ASSETS_DIR, 'pvz_plant.wav'));
  
  // 背景音乐
  Object.entries(THEMES.pvz).forEach(([name, config]) => {
    const bgm = generateBackgroundMusic(config.name, 30);
    saveAudioFile(bgm, path.join(AUDIO_OUTPUT_DIR, `pvz_bgm_${name}.wav`));
    saveAudioFile(bgm, path.join(AUDIO_ASSETS_DIR, `pvz_bgm_${name}.wav`));
  });
  
  console.log('✅ PVZ 音效完成');
}

// ============================================
// 以下是图片生成函数（保持原有代码）
// ============================================

function createGradientBackground(width, height, colorStart, colorEnd) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas;
}

function createSnakeHead(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 2;
  
  const gradient = ctx.createRadialGradient(center - 5, center - 5, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 20));
  gradient.addColorStop(1, color);
  
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  const eyeRadius = size / 8;
  const eyeOffset = size / 4;
  
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.beginPath();
  ctx.arc(center - eyeOffset, center - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(center + eyeOffset, center - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  const pupilRadius = eyeRadius / 2;
  
  ctx.beginPath();
  ctx.arc(center - eyeOffset + 2, center - eyeOffset / 2, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(center + eyeOffset + 2, center - eyeOffset / 2, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const highlightSize = pupilRadius / 1.5;
  
  ctx.beginPath();
  ctx.arc(center - eyeOffset + 3, center - eyeOffset / 2 - 1, highlightSize, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(center + eyeOffset + 3, center - eyeOffset / 2 - 1, highlightSize, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function createSnakeBody(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const margin = 2;
  const width = size - margin * 2;
  const height = size - margin * 2;
  const radius = Math.min(8, width / 4);
  
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, lightenColor(color, 15));
  gradient.addColorStop(1, color);
  
  ctx.beginPath();
  ctx.roundRect(margin, margin, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.strokeStyle = darkenColor(color, 20);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  const dotSize = 3;
  ctx.beginPath();
  ctx.arc(margin + 8, margin + 8, dotSize, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function createFood(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 3;
  
  const gradient = ctx.createRadialGradient(center - 3, center - 3, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 30));
  gradient.addColorStop(0.7, color);
  gradient.addColorStop(1, darkenColor(color, 20));
  
  ctx.beginPath();
  ctx.arc(center, center + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(center, center - radius + 3, 4, 8, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(center - 4, center - 2, radius / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function createPlant(size, color, type = 'peashooter') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  
  if (type === 'sunflower') {
    const petalCount = 12;
    const petalLength = size / 3;
    const petalWidth = size / 6;
    
    for (let i = 0; i < petalCount; i++) {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((i * 2 * Math.PI) / petalCount);
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, -petalLength / 2, petalWidth, petalLength / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    const centerGradient = ctx.createRadialGradient(center, center, 0, center, center, size / 4);
    centerGradient.addColorStop(0, '#92400e');
    centerGradient.addColorStop(1, '#78350f');
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(center, center, size / 5, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (type === 'wallnut') {
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(center, center, size / 2 - 2, size / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center - 5, center - 5, 8, 0, Math.PI * 2);
    ctx.stroke();
    
  } else {
    const headGradient = ctx.createRadialGradient(center - 2, center - 2, 0, center, center, size / 3);
    headGradient.addColorStop(0, lightenColor(color, 20));
    headGradient.addColorStop(1, color);
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(center, center, size / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(center + 8, center, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center - 3, center - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center - 2, center - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return canvas;
}

function createZombie(size, color, type = 'normal') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  
  ctx.fillStyle = color;
  ctx.fillRect(center - 10, center - 5, 20, 25);
  
  ctx.fillStyle = lightenColor(color, 10);
  ctx.beginPath();
  ctx.arc(center, center - 10, 12, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(center - 4, center - 12, 4, 0, Math.PI * 2);
  ctx.arc(center + 4, center - 12, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(center - 3, center - 12, 2, 0, Math.PI * 2);
  ctx.arc(center + 5, center - 12, 2, 0, Math.PI * 2);
  ctx.fill();
  
  if (type === 'conehead') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(center - 10, center - 18);
    ctx.lineTo(center + 10, center - 18);
    ctx.lineTo(center, center - 28);
    ctx.closePath();
    ctx.fill();
  }
  
  return canvas;
}

function createPea(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 1;
  
  const gradient = ctx.createRadialGradient(center - 1, center - 1, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 30));
  gradient.addColorStop(1, color);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(center - 2, center - 2, radius / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function createSun(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const rays = 12;
  
  for (let i = 0; i < rays; i++) {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((i * 2 * Math.PI) / rays);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size / 6);
    ctx.lineTo(3, -size / 2);
    ctx.lineTo(-3, -size / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 3);
  gradient.addColorStop(0, '#fef3c7');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, darkenColor(color, 20));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, size / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

function generateSnakeTheme(themeName, themeConfig) {
  console.log(`🐍 生成贪吃蛇 - ${themeConfig.name} 主题...`);
  
  const outputDir = path.join(OUTPUT_DIR, 'snake-vue3', 'themes', themeName, 'images');
  const assetsDir = path.join(ASSETS_DIR, 'snake-vue3', 'themes', themeName, 'images');
  
  [outputDir, assetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const colors = themeConfig.colors;
  
  const snakeHead = createSnakeHead(64, colors.snakeHead);
  saveCanvas(snakeHead, path.join(outputDir, 'snakeHead.png'));
  saveCanvas(snakeHead, path.join(assetsDir, 'snakeHead.png'));
  
  const snakeBody = createSnakeBody(48, colors.snakeBody);
  saveCanvas(snakeBody, path.join(outputDir, 'snakeBody.png'));
  saveCanvas(snakeBody, path.join(assetsDir, 'snakeBody.png'));
  
  const snakeTail = createSnakeBody(32, colors.snakeTail);
  saveCanvas(snakeTail, path.join(outputDir, 'snakeTail.png'));
  saveCanvas(snakeTail, path.join(assetsDir, 'snakeTail.png'));
  
  const food = createFood(32, colors.food);
  saveCanvas(food, path.join(outputDir, 'food.png'));
  saveCanvas(food, path.join(assetsDir, 'food.png'));
  
  const background = createGradientBackground(1920, 1080, colors.bgStart, colors.bgEnd);
  saveCanvas(background, path.join(outputDir, 'background.png'));
  saveCanvas(background, path.join(assetsDir, 'background.png'));
  
  console.log(`✅ 贪吃蛇 - ${themeConfig.name} 主题完成`);
}

function generatePVZTheme(themeName, themeConfig) {
  console.log(`🧟 生成 PVZ - ${themeConfig.name} 主题...`);
  
  const outputDir = path.join(OUTPUT_DIR, 'plants-vs-zombie', 'themes', themeName, 'images');
  const assetsDir = path.join(ASSETS_DIR, 'plants-vs-zombie', 'themes', themeName, 'images');
  
  [outputDir, assetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const colors = themeConfig.colors;
  
  const peashooter = createPlant(64, colors.plant, 'peashooter');
  saveCanvas(peashooter, path.join(outputDir, 'plant_peashooter.png'));
  saveCanvas(peashooter, path.join(assetsDir, 'plant_peashooter.png'));
  
  const sunflower = createPlant(64, colors.plant, 'sunflower');
  saveCanvas(sunflower, path.join(outputDir, 'plant_sunflower.png'));
  saveCanvas(sunflower, path.join(assetsDir, 'plant_sunflower.png'));
  
  const wallnut = createPlant(64, colors.plant, 'wallnut');
  saveCanvas(wallnut, path.join(outputDir, 'plant_wallnut.png'));
  saveCanvas(wallnut, path.join(assetsDir, 'plant_wallnut.png'));
  
  const normalZombie = createZombie(64, colors.zombie, 'normal');
  saveCanvas(normalZombie, path.join(outputDir, 'zombie_normal.png'));
  saveCanvas(normalZombie, path.join(assetsDir, 'zombie_normal.png'));
  
  const coneheadZombie = createZombie(64, colors.zombie, 'conehead');
  saveCanvas(coneheadZombie, path.join(outputDir, 'zombie_conehead.png'));
  saveCanvas(coneheadZombie, path.join(assetsDir, 'zombie_conehead.png'));
  
  const sun = createSun(48, colors.sun);
  saveCanvas(sun, path.join(outputDir, 'sun.png'));
  saveCanvas(sun, path.join(assetsDir, 'sun.png'));
  
  const pea = createPea(16, colors.pea);
  saveCanvas(pea, path.join(outputDir, 'pea.png'));
  saveCanvas(pea, path.join(assetsDir, 'pea.png'));
  
  const background = createGradientBackground(800, 600, colors.bgSky, colors.bgGrass);
  saveCanvas(background, path.join(outputDir, 'gameBg.png'));
  saveCanvas(background, path.join(assetsDir, 'gameBg.png'));
  
  console.log(`✅ PVZ - ${themeConfig.name} 主题完成`);
}

/**
 * 主函数
 */
function main() {
  console.log('=' .repeat(60));
  console.log('🎨 开始生成完整主题资源（图片 + 音频）');
  console.log('=' .repeat(60));
  console.log();
  
  try {
    require.resolve('canvas');
  } catch (e) {
    console.error('❌ 错误：未找到 canvas 模块，请先运行：npm install canvas');
    process.exit(1);
  }
  
  // 生成图片资源
  console.log('📷 生成图片资源...');
  Object.entries(THEMES.snake).forEach(([name, config]) => {
    generateSnakeTheme(name, config);
  });
  
  console.log();
  
  Object.entries(THEMES.pvz).forEach(([name, config]) => {
    generatePVZTheme(name, config);
  });
  
  console.log();
  
  // 生成音频资源
  console.log('🎵 生成音频资源...');
  generateSnakeAudio();
  generatePVZAudio();
  
  console.log();
  console.log('=' .repeat(60));
  console.log('✅ 所有主题资源生成完成！');
  console.log('=' .repeat(60));
  console.log();
  console.log('📂 资源位置:');
  console.log(`   - 图片:`);
  console.log(`     开发版本：${OUTPUT_DIR}`);
  console.log(`     源文件：${ASSETS_DIR}`);
  console.log(`   - 音频:`);
  console.log(`     开发版本：${AUDIO_OUTPUT_DIR}`);
  console.log(`     源文件：${AUDIO_ASSETS_DIR}`);
  console.log();
  console.log('下一步操作:');
  console.log('1. 启动前端服务器：cd kids-game-frontend && npm run dev');
  console.log('2. 更新数据库配置（包含音频 URL）');
  console.log();
}

main();
