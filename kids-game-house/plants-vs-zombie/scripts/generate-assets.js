/**
 * 游戏资源生成工具
 * 
 * 用于生成占位图片和音频资源
 * 运行方式: node scripts/generate-assets.js
 * 
 * 生成内容:
 * - 植物图片 (64x64 PNG)
 * - 僵尸图片 (64x64 PNG)
 * - 子弹图片 (16x16 PNG)
 * - 阳光图片 (48x48 PNG)
 * - 简单音效 (WAV)
 * 
 * 自定义资源替换:
 * 将自己的图片/音频文件放到 public/assets/game/ 目录下
 * 修改 src/config/game-assets.config.ts 中的 customPath 即可使用自定义资源
 */

const fs = require('fs');
const path = require('path');

// 配置
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'game');
const SIZES = {
  plant: 64,
  zombie: 64,
  projectile: 16,
  sun: 48,
  ui: { background: [720, 480], card: [80, 100], lawn: [720, 480] }
};

// 颜色配置
const COLORS = {
  plants: {
    sunflower: '#FFD700',
    peashooter: '#228B22',
    wallnut: '#8B4513',
    cherrybomb: '#FF0000',
    snowpea: '#87CEEB'
  },
  zombies: {
    normal: '#556B2F',
    cone: '#FF8C00',
    bucket: '#708090',
    imp: '#8B0000'
  },
  projectiles: {
    pea: '#32CD32',
    snowpea: '#00BFFF'
  }
};

// Emoji 映射
const EMOJIS = {
  plants: {
    sunflower: '🌻',
    peashooter: '🌱',
    wallnut: '🥔',
    cherrybomb: '🍒',
    snowpea: '❄️'
  },
  zombies: {
    normal: '🧟',
    cone: '🧟',
    bucket: '🧟',
    imp: '👶'
  },
  projectiles: {
    pea: '🟢',
    snowpea: '❄️'
  },
  sun: '☀️'
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 生成简单的 SVG 图片（带 Emoji）
function generateSVG(emoji, size, bgColor = 'transparent') {
  const escapedEmoji = emoji.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.floor(size * 0.7);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  ${bgColor !== 'transparent' ? `<rect width="${size}" height="${size}" fill="${bgColor}" rx="${size * 0.1}"/>` : ''}
  <text x="50%" y="55%" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji">
    ${escapedEmoji}
  </text>
</svg>`;
}

// 生成植物图片
function generatePlantImages() {
  const dir = path.join(OUTPUT_DIR, 'plants');
  ensureDir(dir);
  
  Object.entries(EMOJIS.plants).forEach(([name, emoji]) => {
    const size = SIZES.plant;
    const svg = generateSVG(emoji, size, null);
    const filepath = path.join(dir, `${name}.svg`);
    fs.writeFileSync(filepath, svg);
    console.log(`  ✅ 生成: plants/${name}.svg`);
  });
}

// 生成僵尸图片
function generateZombieImages() {
  const dir = path.join(OUTPUT_DIR, 'zombies');
  ensureDir(dir);
  
  Object.entries(EMOJIS.zombies).forEach(([name, emoji]) => {
    const size = SIZES.zombie;
    const svg = generateSVG(emoji, size, null);
    const filepath = path.join(dir, `zombie-${name}.svg`);
    fs.writeFileSync(filepath, svg);
    console.log(`  ✅ 生成: zombies/zombie-${name}.svg`);
  });
}

// 生成子弹图片
function generateProjectileImages() {
  const dir = path.join(OUTPUT_DIR, 'projectiles');
  ensureDir(dir);
  
  Object.entries(EMOJIS.projectiles).forEach(([name, emoji]) => {
    const size = SIZES.projectile;
    const svg = generateSVG(emoji, size, null);
    const filepath = path.join(dir, `${name}.svg`);
    fs.writeFileSync(filepath, svg);
    console.log(`  ✅ 生成: projectiles/${name}.svg`);
  });
}

// 生成阳光图片
function generateSunImages() {
  const dir = path.join(OUTPUT_DIR);
  ensureDir(dir);
  
  const size = SIZES.sun;
  const svg = generateSVG(EMOJIS.sun, size, null);
  const filepath = path.join(dir, `sun.svg`);
  fs.writeFileSync(filepath, svg);
  console.log(`  ✅ 生成: sun.svg`);
}

// 生成简单的 WAV 音频文件
function generateWAV(samples, sampleRate = 44100, filename) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * 2;
  const fileSize = 36 + dataSize;
  
  const buffer = Buffer.alloc(44 + dataSize);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Write samples
  samples.forEach((sample, i) => {
    const clamped = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(clamped, 44 + i * 2);
  });
  
  const filepath = path.join(OUTPUT_DIR, 'audio', filename);
  ensureDir(path.join(OUTPUT_DIR, 'audio'));
  fs.writeFileSync(filepath, buffer);
}

// 生成音效
function generateSounds() {
  console.log('  📝 生成音频文件...');
  
  // 射击音效 - 短促的高频声音
  const shootSamples = [];
  for (let i = 0; i < 2205; i++) {
    shootSamples.push(Math.sin(i * 0.1) * Math.exp(-i * 0.005));
  }
  generateWAV(shootSamples, 44100, 'shoot.wav');
  console.log(`  ✅ 生成: audio/shoot.wav`);
  
  // 种植音效 - 上升音调
  const plantSamples = [];
  for (let i = 0; i < 4410; i++) {
    const freq = 300 + (i / 4410) * 600;
    plantSamples.push(Math.sin(i * 2 * Math.PI * freq / 44100) * Math.exp(-i * 0.001));
  }
  generateWAV(plantSamples, 44100, 'plant.wav');
  console.log(`  ✅ 生成: audio/plant.wav`);
  
  // 收集阳光 - 叮当声
  const sunSamples = [];
  for (let i = 0; i < 8820; i++) {
    const env = Math.exp(-i * 0.003) * (i < 2000 ? i / 2000 : 1);
    sunSamples.push((Math.sin(i * 0.15) + Math.sin(i * 0.2)) * env * 0.5);
  }
  generateWAV(sunSamples, 44100, 'sun-collect.wav');
  console.log(`  ✅ 生成: audio/sun-collect.wav`);
  
  // 僵尸吃食物 - 低沉咀嚼声
  const eatSamples = [];
  for (let i = 0; i < 4410; i++) {
    eatSamples.push((Math.random() * 2 - 1) * Math.exp(-i * 0.002) * 0.3);
  }
  generateWAV(eatSamples, 44100, 'zombie-eat.wav');
  console.log(`  ✅ 生成: audio/zombie-eat.wav`);
  
  // 僵尸死亡 - 下降音调
  const dieSamples = [];
  for (let i = 0; i < 8820; i++) {
    const freq = 400 - (i / 8820) * 300;
    dieSamples.push(Math.sin(i * 2 * Math.PI * freq / 44100) * Math.exp(-i * 0.0005));
  }
  generateWAV(dieSamples, 44100, 'zombie-die.wav');
  console.log(`  ✅ 生成: audio/zombie-die.wav`);
  
  // 爆炸音效
  const explodeSamples = [];
  for (let i = 0; i < 8820; i++) {
    explodeSamples.push((Math.random() * 2 - 1) * Math.exp(-i * 0.001));
  }
  generateWAV(explodeSamples, 44100, 'explosion.wav');
  console.log(`  ✅ 生成: audio/explosion.wav`);
  
  // 游戏结束 - 下降和弦
  const gameOverSamples = [];
  for (let i = 0; i < 44100; i++) {
    const t = i / 44100;
    const env = Math.max(0, 1 - t * 0.5);
    gameOverSamples.push(
      (Math.sin(i * 2 * Math.PI * 262 / 44100) + 
       Math.sin(i * 2 * Math.PI * 220 / 44100) * 0.8 +
       Math.sin(i * 2 * Math.PI * 196 / 44100) * 0.6) * env * 0.3
    );
  }
  generateWAV(gameOverSamples, 44100, 'game-over.wav');
  console.log(`  ✅ 生成: audio/game-over.wav`);
  
  // 简单 BGM - 循环旋律
  const bgmSamples = [];
  const notes = [262, 294, 330, 262, 294, 330, 392, 330, 294, 262];
  const noteLen = 4000;
  for (let n = 0; n < notes.length; n++) {
    for (let i = 0; i < noteLen; i++) {
      const t = i / 44100;
      const env = Math.sin(Math.PI * i / noteLen);
      bgmSamples.push(Math.sin(i * 2 * Math.PI * notes[n] / 44100) * env * 0.2);
    }
  }
  // 循环3次
  const bgmFinal = [...bgmSamples];
  for (let j = 0; j < 2; j++) {
    bgmFinal.push(...bgmSamples);
  }
  generateWAV(bgmFinal, 44100, 'bgm.wav');
  console.log(`  ✅ 生成: audio/bgm.wav`);
}

// 生成说明文件
function generateReadme() {
  const readmePath = path.join(OUTPUT_DIR, 'README.txt');
  const readme = `游戏资源说明
==============

本目录包含游戏的占位资源文件。

目录结构:
- plants/     - 植物图片
- zombies/    - 僵尸图片  
- projectiles/- 子弹图片
- audio/      - 音效文件

自定义资源替换:
---------------
1. 准备符合规格的图片/音频文件
2. 将文件放到对应目录
3. 修改 src/config/game-assets.config.ts 中的 customPath
4. 示例: 将 customPath 改为 'assets/game/plants/mysunflower.png'

资源规格要求:
-------------
植物/僵尸: 64x64 PNG 透明背景
子弹: 16x16 PNG 透明背景
阳光: 48x48 PNG 透明背景
音效: MP3 或 WAV 格式

如需使用图片而非 SVG，请将 SVG 文件替换为对应名称的 PNG 文件。
游戏会自动识别 PNG 文件（如果存在则优先使用 PNG）。
`;
  fs.writeFileSync(readmePath, readme);
  console.log(`  ✅ 生成: README.txt`);
}

// 主函数
function main() {
  console.log('\n🎮 植物大战僵尸 - 资源生成工具\n');
  console.log('📁 输出目录:', OUTPUT_DIR);
  console.log('');
  
  ensureDir(OUTPUT_DIR);
  
  console.log('🖼️  生成植物图片...');
  generatePlantImages();
  
  console.log('\n🧟 生成僵尸图片...');
  generateZombieImages();
  
  console.log('\n💥 生成子弹图片...');
  generateProjectileImages();
  
  console.log('\n☀️  生成阳光图片...');
  generateSunImages();
  
  console.log('\n🔊 生成音效...');
  generateSounds();
  
  console.log('\n📝 生成说明文件...');
  generateReadme();
  
  console.log('\n✅ 资源生成完成！');
  console.log('\n提示: 如果需要更高质量的资源，可以:');
  console.log('  1. 使用 AI 图像生成工具创建原创图片');
  console.log('  2. 找设计师定制游戏素材');
  console.log('  3. 从游戏素材网站下载');
  console.log('');
}

main();
