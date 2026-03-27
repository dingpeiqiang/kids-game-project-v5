/**
 * WAV 转 MP3 工具
 * 使用 fluent-ffmpeg 批量转换 WAV 文件为 MP3
 * 
 * 使用方法:
 *   node convert-wav-to-mp3.mjs [audio_dir]
 * 
 * 示例:
 *   node convert-wav-to-mp3.mjs
 *   node convert-wav-to-mp3.mjs ./public/themes/default/assets/audio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const AUDIO_DIR = process.argv[2] || path.join(__dirname, '..', 'public', 'themes', 'default', 'assets', 'audio');
const BITRATE = '192k';  // 比特率
const QUALITY = 2;       // 质量：0-9，越小质量越高

console.log('='.repeat(60));
console.log('🎵 WAV 转 MP3 工具 (fluent-ffmpeg)');
console.log('='.repeat(60));
console.log(`📂 音频目录：${AUDIO_DIR}`);
console.log(`🎼 比特率：${BITRATE}`);
console.log(`⭐ 质量：${QUALITY} (0=最高，9=最低)`);
console.log('');

// 确保目录存在
if (!fs.existsSync(AUDIO_DIR)) {
  console.error(`❌ 目录不存在：${AUDIO_DIR}`);
  process.exit(1);
}

// 查找所有 WAV 文件（排除临时文件）
const wavFiles = fs.readdirSync(AUDIO_DIR)
  .filter(file => file.toLowerCase().endsWith('.wav') && !file.includes('_temp.wav'))
  .map(file => path.join(AUDIO_DIR, file));

if (wavFiles.length === 0) {
  console.log('⚠️  未找到需要转换的 WAV 文件');
  process.exit(0);
}

console.log(`📋 找到 ${wavFiles.length} 个 WAV 文件\n`);

// 批量转换
async function convertFile(wavPath) {
  const filename = path.basename(wavPath, '.wav');
  const mp3Path = path.join(AUDIO_DIR, `${filename}.mp3`);
  
  // 跳过已存在的 MP3
  if (fs.existsSync(mp3Path)) {
    console.log(`⏭️  跳过：${filename}.mp3 (已存在)`);
    return;
  }
  
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(wavPath)
        .outputOptions([
          '-codec:a libmp3lame',  // MP3 编码器
          `-b:a ${BITRATE}`,      // 比特率
          `-qscale:a ${QUALITY}`, // 质量
          '-vn'                   // 无视频
        ])
        .save(mp3Path)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
    
    console.log(`✅ 转换成功：${filename}.mp3`);
  } catch (error) {
    console.error(`❌ 转换失败：${filename}`, error.message);
  }
}

async function main() {
  for (const wavPath of wavFiles) {
    await convertFile(wavPath);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 批量转换完成！');
  console.log('='.repeat(60));
  
  // 统计
  const mp3Files = fs.readdirSync(AUDIO_DIR)
    .filter(file => file.toLowerCase().endsWith('.mp3'));
  
  console.log(`📊 统计:`);
  console.log(`   - 原始 WAV: ${wavFiles.length} 个`);
  console.log(`   - 生成 MP3: ${mp3Files.length} 个`);
  console.log(`   - 输出目录：${AUDIO_DIR}`);
  console.log('');
}

main();
