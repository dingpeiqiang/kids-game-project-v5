/**
 * 程序化游戏音效生成器
 * 纯代码生成，无需 API，直接可用
 * 
 * 使用方式:
 *   node src/sfx.js coin output/coin.wav
 *   node src/sfx.js explosion output/explosion.wav
 *   node src/sfx.js list
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const SAMPLE_RATE = 44100;

// ==================== 音效生成器 ====================

class SFXGenerator {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
  }

  createBuffer(duration) {
    return Buffer.alloc(Math.floor(this.sampleRate * duration) * 2);
  }

  writeSample(buffer, index, value) {
    buffer.writeInt16LE(Math.floor(value * 32767), index * 2);
  }

  /**
   * 通用正弦波生成
   */
  sine(frequency, duration, volume = 0.5, fadeOut = true) {
    const buffer = this.createBuffer(duration);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      let envelope = 1;
      const fadeTime = 0.02;
      if (fadeOut && t > duration - fadeTime) {
        envelope = (duration - t) / fadeTime;
      }

      const value = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
      this.writeSample(buffer, i, value);
    }

    return buffer;
  }

  /**
   * 方波
   */
  square(frequency, duration, volume = 0.3) {
    const buffer = this.createBuffer(duration);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      let envelope = 1;
      if (t > duration - 0.02) envelope = (duration - t) / 0.02;

      const value = (Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1) * volume * envelope;
      this.writeSample(buffer, i, value);
    }

    return buffer;
  }

  /**
   * 白噪音
   */
  noise(duration, volume = 0.2) {
    const buffer = this.createBuffer(duration);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      let envelope = 1;
      if (t < 0.01) envelope = t / 0.01;
      if (t > duration - 0.1) envelope = (duration - t) / 0.1;

      const value = (Math.random() * 2 - 1) * volume * envelope;
      this.writeSample(buffer, i, value);
    }

    return buffer;
  }

  // ==================== 预设音效 ====================

  /** 吃金币 */
  coin() {
    const buffer = this.createBuffer(0.15);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 800 + progress * 1500;
      const sine = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.pow(1 - progress, 2.5);

      this.writeSample(buffer, i, sine * 0.5 * envelope);
    }

    return buffer;
  }

  /** 爆炸 */
  explosion() {
    const buffer = this.createBuffer(0.6);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const noise = Math.random() * 2 - 1;
      const envelope = Math.pow(1 - progress, 1.8);

      this.writeSample(buffer, i, noise * 0.6 * envelope);
    }

    return buffer;
  }

  /** 跳跃 */
  jump() {
    const buffer = this.createBuffer(0.2);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 200 + progress * 600;
      const sine = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.sin(Math.PI * progress);

      this.writeSample(buffer, i, sine * 0.5 * envelope);
    }

    return buffer;
  }

  /** 点击 */
  click() {
    const buffer = this.createBuffer(0.05);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const sine = Math.sin(2 * Math.PI * 1200 * t);
      const envelope = 1 - progress;

      this.writeSample(buffer, i, sine * 0.4 * envelope);
    }

    return buffer;
  }

  /** 游戏结束 */
  gameOver() {
    const buffer = this.createBuffer(1.0);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 500 * (1 - progress * 0.7);
      const sine = Math.sin(2 * Math.PI * freq * t);
      const envelope = 1 - progress;

      this.writeSample(buffer, i, sine * 0.4 * envelope);
    }

    return buffer;
  }

  /** 得分/升级 */
  levelUp() {
    const buffer = this.createBuffer(0.4);
    const samples = buffer.length / 2;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const noteIndex = Math.min(Math.floor(progress * notes.length), notes.length - 1);
      const freq = notes[noteIndex];
      const sine = Math.sin(2 * Math.PI * freq * t);

      let envelope = 1;
      const noteProgress = (progress * notes.length) % 1;
      if (noteProgress > 0.8) envelope = (1 - noteProgress) / 0.2;

      this.writeSample(buffer, i, sine * 0.4 * envelope);
    }

    return buffer;
  }

  /** 移动/滑行 */
  move() {
    const buffer = this.createBuffer(0.1);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 300 + progress * 100;
      const sine = Math.sin(2 * Math.PI * freq * t);
      const envelope = 1 - progress;

      this.writeSample(buffer, i, sine * 0.3 * envelope);
    }

    return buffer;
  }

  /** 错误/警告 */
  error() {
    const buffer = this.createBuffer(0.3);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 150 + (Math.sin(progress * Math.PI * 6) * 30);
      const square = (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1);
      const envelope = 1 - progress;

      this.writeSample(buffer, i, square * 0.3 * envelope);
    }

    return buffer;
  }

  /** 拾取道具 */
  pickup() {
    const buffer = this.createBuffer(0.12);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 400 + progress * 800;
      const sine = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.pow(1 - progress, 3);

      this.writeSample(buffer, i, sine * 0.5 * envelope);
    }

    return buffer;
  }

  /** 发射/射击 */
  shoot() {
    const buffer = this.createBuffer(0.15);
    const samples = buffer.length / 2;

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;

      const freq = 800 * (1 - progress * 0.5);
      const noise = Math.random() * 2 - 1;
      const envelope = 1 - progress;

      const value = (noise * 0.5 + Math.sin(2 * Math.PI * freq * t) * 0.3) * envelope;
      this.writeSample(buffer, i, value);
    }

    return buffer;
  }
}

// ==================== WAV 头部 ====================

function addWavHeader(audioBuffer, sampleRate) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = audioBuffer.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, audioBuffer]);
}

// ==================== 主程序 ====================

const SOUNDS = {
  coin: '吃金币',
  explosion: '爆炸',
  jump: '跳跃',
  click: '按钮点击',
  gameover: '游戏结束',
  levelup: '升级/得分',
  move: '移动/滑行',
  error: '错误/警告',
  pickup: '拾取道具',
  shoot: '发射/射击',
};

function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'list' || args[0] === '-l') {
    console.log('\n🎮 可用的预设音效:\n');
    for (const [key, desc] of Object.entries(SOUNDS)) {
      console.log(`  ${key.padEnd(12)} - ${desc}`);
    }
    console.log('\n用法: node src/sfx.js <类型> [输出文件]\n');
    return;
  }

  const soundType = args[0] || 'coin';
  const outputPath = args[1] || `output/${soundType}.wav`;

  if (!SOUNDS[soundType]) {
    console.error(`❌ 未知音效类型: ${soundType}`);
    console.log('可用类型: ' + Object.keys(SOUNDS).join(', '));
    process.exit(1);
  }

  const gen = new SFXGenerator(SAMPLE_RATE);
  let buffer;

  switch (soundType) {
    case 'coin': buffer = gen.coin(); break;
    case 'explosion': buffer = gen.explosion(); break;
    case 'jump': buffer = gen.jump(); break;
    case 'click': buffer = gen.click(); break;
    case 'gameover': buffer = gen.gameOver(); break;
    case 'levelup': buffer = gen.levelUp(); break;
    case 'move': buffer = gen.move(); break;
    case 'error': buffer = gen.error(); break;
    case 'pickup': buffer = gen.pickup(); break;
    case 'shoot': buffer = gen.shoot(); break;
  }

  // 确保目录存在
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const wavBuffer = addWavHeader(buffer, SAMPLE_RATE);
  writeFileSync(outputPath, wavBuffer);

  console.log(`✅ 已生成 ${SOUNDS[soundType]} 音效: ${outputPath}`);
}

function existsSync(path) {
  try {
    require('fs').accessSync(path);
    return true;
  } catch {
    return false;
  }
}

main();
