/**
 * AI 语音生成器
 * 使用 11 Labs 生成游戏语音
 * 
 * 使用方式:
 *   node src/voice.js "游戏开始" output/voice_start.mp3
 *   node src/voice.js "恭喜通关" output/voice_win.mp3 --voice Adam
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// 11 Labs 可用声音
const VOICES = {
  Rachel: 'Rachel - 温暖女声',
  Adam: 'Adam - 自然男声',
  Sam: 'Sam - 年轻男声',
  Dora: 'Dora - 活泼女声',
  Arnold: 'Arnold - 成熟男声',
  Bella: 'Bella - 柔和女声',
  Antoni: 'Antoni - 专业男声',
  Josh: 'Josh - 友好男声',
};

function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'list' || args[0] === '-l') {
    console.log('\n🎤 可用的 11 Labs 声音:\n');
    for (const [id, desc] of Object.entries(VOICES)) {
      console.log(`  ${id.padEnd(10)} - ${desc}`);
    }
    console.log('\n用法: node src/voice.js <文本> [输出文件] [--voice <声音ID>]\n');
    return;
  }

  const text = args[0];
  const outputPath = args[1] || 'output/voice.mp3';
  
  let voice = 'Rachel';
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--voice' && args[i + 1]) {
      voice = args[i + 1];
    }
  }

  if (!text) {
    console.error('❌ 请提供语音文本');
    console.log('用法: node src/voice.js <文本> [输出文件] [--voice <声音ID>]');
    process.exit(1);
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置 ELEVEN_LABS_API_KEY 环境变量');
    console.log('获取 API Key: https://elevenlabs.io/api');
    process.exit(1);
  }

  console.log(`\n🎤 生成语音...`);
  console.log(`   文本: ${text}`);
  console.log(`   声音: ${voice} (${VOICES[voice] || '默认'})`);

  generateSpeech(text, outputPath, voice, apiKey);
}

async function generateSpeech(text, outputPath, voiceId, apiKey) {
  const axios = (await import('axios')).default;

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // 确保目录存在
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // 保存为 MP3
    writeFileSync(outputPath, Buffer.from(response.data));
    console.log(`✅ 语音已保存: ${outputPath}`);

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ API Key 无效');
    } else if (error.response?.status === 422) {
      console.error('❌ 文本无效或声音ID不存在');
    } else {
      console.error('❌ 错误:', error.message);
    }
    process.exit(1);
  }
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
