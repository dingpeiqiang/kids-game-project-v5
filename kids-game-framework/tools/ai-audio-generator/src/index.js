/**
 * AI 音频生成器
 * 支持 Suno AI 音乐生成、11 Labs 语音合成、程序化音效生成
 * 
 * 使用方式:
 *   node src/index.js --type music --prompt "欢快的卡通背景音乐" --output bgm_happy.mp3
 *   node src/index.js --type sfx --prompt "吃金币的声音" --output coin.wav
 *   node src/index.js --type voice --text "游戏开始" --output voice_start.mp3
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  // ignore
}

// ==================== 配置 ====================

const CONFIG = {
  outputDir: 'output',
};

// ==================== 音频合成器 (程序化生成) ====================

/**
 * 程序化音频生成器 - 纯代码生成简单音效
 * 免费、无需 API、即时生成
 */
class Synthesizer {
  constructor() {
    this.sampleRate = 44100;
  }

  /**
   * 生成正弦波音频
   */
  generateSine(frequency, duration, volume = 0.5) {
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2); // 16-bit
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      // 添加淡入淡出
      let envelope = 1;
      const fadeTime = 0.01;
      if (t < fadeTime) envelope = t / fadeTime;
      if (t > duration - fadeTime) envelope = (duration - t) / fadeTime;
      
      const value = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成方波音频
   */
  generateSquare(frequency, duration, volume = 0.3) {
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      let envelope = 1;
      const fadeTime = 0.01;
      if (t < fadeTime) envelope = t / fadeTime;
      if (t > duration - fadeTime) envelope = (duration - t) / fadeTime;
      
      const value = (Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1) * volume * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成噪音
   */
  generateNoise(duration, volume = 0.2) {
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      let envelope = 1;
      if (t < 0.01) envelope = t / 0.01;
      if (t > duration - 0.01) envelope = (duration - t) / 0.01;
      
      const value = (Math.random() * 2 - 1) * volume * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 吃金币
   */
  async generateCoinSound() {
    console.log('🎵 生成吃金币音效...');
    const duration = 0.15;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    // 快速上升音调 + 噪音
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      // 频率从 800Hz 上升到 2000Hz
      const freq = 800 + progress * 1200;
      const sine = Math.sin(2 * Math.PI * freq * t);
      
      // 快速衰减包络
      const envelope = Math.pow(1 - progress, 3);
      
      const value = sine * 0.6 * envelope + (Math.random() * 2 - 1) * 0.2 * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 爆炸
   */
  async generateExplosionSound() {
    console.log('🎵 生成爆炸音效...');
    const duration = 0.5;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      // 低频噪音 + 快速衰减
      const noise = Math.random() * 2 - 1;
      const envelope = Math.pow(1 - progress, 2);
      
      // 频率随时间下降
      const freq = 200 * (1 - progress * 0.8);
      const sine = Math.sin(2 * Math.PI * freq * t);
      
      const value = (noise * 0.8 + sine * 0.3) * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 跳跃
   */
  async generateJumpSound() {
    console.log('🎵 生成跳跃音效...');
    const duration = 0.2;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      // 频率上升
      const freq = 200 + progress * 400;
      const sine = Math.sin(2 * Math.PI * freq * t);
      
      const envelope = Math.sin(Math.PI * progress);
      
      const value = sine * 0.5 * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 按钮点击
   */
  async generateClickSound() {
    console.log('🎵 生成点击音效...');
    const duration = 0.05;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      const sine = Math.sin(2 * Math.PI * 1000 * t);
      const envelope = 1 - progress;
      
      const value = sine * 0.4 * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 游戏结束
   */
  async generateGameOverSound() {
    console.log('🎵 生成游戏结束音效...');
    const duration = 1.0;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      // 频率下降
      const freq = 600 - progress * 500;
      const sine = Math.sin(2 * Math.PI * freq * t);
      
      const envelope = 1 - progress;
      
      const value = sine * 0.4 * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }

  /**
   * 生成音效 - 得分
   */
  async generateScoreSound() {
    console.log('🎵 生成得分音效...');
    const duration = 0.3;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);
    
    // 两个音符
    const note1 = 0.1;
    const note2 = 0.25;
    
    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const progress = i / samples;
      
      let freq = 0;
      if (t < note1) {
        freq = 523; // C5
      } else {
        freq = 659; // E5
      }
      
      const sine = Math.sin(2 * Math.PI * freq * t);
      
      let envelope = 1;
      if (t < note1) {
        envelope = 1 - (t / note1) * 0.3;
      } else {
        envelope = 1 - ((t - note1) / (note2 - note1));
      }
      
      const value = sine * 0.4 * envelope;
      buffer.writeInt16LE(Math.floor(value * 32767), i * 2);
    }
    
    return buffer;
  }
}

// ==================== Suno 提供商 ====================

class SunoProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.SUNO_API_KEY;
    // Suno API 端点 (需要第三方服务或自托管)
    this.baseUrl = process.env.SUNO_URL || 'https://api.suno.ai';
  }

  async generate(prompt, options = {}) {
    console.log(`🎵 正在调用 Suno AI 生成音乐...`);
    console.log(`   Prompt: ${prompt}`);

    // 注意: Suno 官方 API 尚未公开，这里使用第三方/自托管方式
    // 实际使用需要配置 SUNO_URL 和相应的认证

    // 模拟 API 调用
    const { default: axios } = await import('axios');

    try {
      const response = await axios.post(
        `${this.baseUrl}/generate`,
        {
          prompt,
          duration: options.duration || 30,
          instrumental: options.instrumental || false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const audioUrl = response.data.audio_url;
      console.log(`   音频 URL: ${audioUrl}`);

      return audioUrl;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        console.log('   ⚠️ Suno API 不可用，尝试使用程序化生成器...');
        return null;
      }
      throw error;
    }
  }

  async downloadAndSave(audioUrl, outputPath) {
    if (!audioUrl) return null;

    const { default: axios } = await import('axios');
    const { mkdirSync, writeFileSync, existsSync } = await import('fs');
    const { dirname } = await import('path');

    console.log(`⬇️  下载音频到: ${outputPath}`);

    const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });

    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, response.data);
    console.log(`✅ 音频已保存: ${outputPath}`);

    return outputPath;
  }
}

// ==================== 11 Labs 提供商 ====================

class ElevenLabsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ELEVEN_LABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async generate(text, options = {}) {
    const voice = options.voice || 'Rachel';
    const model = options.model || 'eleven_multilingual_v2';

    console.log(`🎤 正在调用 11 Labs 生成语音...`);
    console.log(`   文本: ${text}`);
    console.log(`   声音: ${voice}`);

    const { default: axios } = await import('axios');

    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voice}`,
        {
          text,
          model_id: model,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarity_boost || 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('11 Labs API Key 无效');
      }
      throw error;
    }
  }

  async downloadAndSave(audioBuffer, outputPath) {
    const { mkdirSync, writeFileSync, existsSync } = await import('fs');
    const { dirname } = await import('path');

    console.log(`💾 保存语音到: ${outputPath}`);

    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, audioBuffer);
    console.log(`✅ 语音已保存: ${outputPath}`);

    return outputPath;
  }
}

// ==================== 主程序 ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    type: 'sfx',        // music, sfx, voice
    prompt: '',
    text: '',
    output: '',
    provider: 'synth', // synth, suno, elevenlabs
    voice: 'Rachel',
    duration: 10,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--type':
        options.type = args[++i];
        break;
      case '--prompt':
      case '-p':
        options.prompt = args[++i];
        break;
      case '--text':
      case '-t':
        options.text = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--provider':
        options.provider = args[++i];
        break;
      case '--voice':
        options.voice = args[++i];
        break;
      case '--duration':
        options.duration = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🤖 AI 音频生成工具

用法:
  node src/index.js [选项]

音效生成 (程序化):
  node src/index.js --type coin
  node src/index.js --type explosion
  node src/index.js --type jump
  node src/index.js --type click

音乐生成 (需 Suno API):
  node src/index.js --type music --prompt "欢快的卡通背景音乐" -o bgm.mp3

语音生成 (需 11 Labs API):
  node src/index.js --type voice --text "游戏开始" -o voice.mp3

选项:
  --type <类型>        类型: music, sfx, voice, coin, explosion, jump, click, score
  --prompt, -p <文本>  音乐描述提示词 (音乐生成)
  --text, -t <文本>    语音文本 (语音生成)
  --output, -o <路径>  输出文件路径
  --provider <名称>    提供商: synth, suno, elevenlabs (默认: synth)
  --voice <名称>       11 Labs 声音ID (默认: Rachel)
  --duration <秒>     音乐时长 (默认: 10)
  --help, -h          显示帮助

预设音效类型:
  coin        吃金币
  explosion   爆炸
  jump        跳跃
  click       按钮点击
  gameover    游戏结束
  score       得分

环境变量:
  SUNO_API_KEY        Suno API 密钥
  ELEVEN_LABS_API_KEY 11 Labs API 密钥
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.output) {
    console.error('❌ 错误: 请提供 --output 参数');
    printHelp();
    process.exit(1);
  }

  try {
    const synth = new Synthesizer();
    let audioBuffer = null;

    // 预设音效
    const presetSounds = {
      coin: () => synth.generateCoinSound(),
      explosion: () => synth.generateExplosionSound(),
      jump: () => synth.generateJumpSound(),
      click: () => synth.generateClickSound(),
      gameover: () => synth.generateGameOverSound(),
      score: () => synth.generateScoreSound(),
    };

    // 根据类型生成
    if (presetSounds[options.type]) {
      // 程序化预设音效
      audioBuffer = await presetSounds[options.type]();
    } else if (options.type === 'music' || options.type === 'sfx') {
      if (options.provider === 'synth') {
        // 默认生成简单音效
        audioBuffer = await synth.generateCoinSound();
      } else if (options.provider === 'suno') {
        const suno = new SunoProvider();
        const audioUrl = await suno.generate(options.prompt, { duration: options.duration });
        if (audioUrl) {
          await suno.downloadAndSave(audioUrl, options.output);
          console.log('\n✨ 完成!');
          return;
        }
      }
    } else if (options.type === 'voice') {
      if (!options.text) {
        console.error('❌ 错误: 语音生成需要 --text 参数');
        process.exit(1);
      }

      if (!process.env.ELEVEN_LABS_API_KEY) {
        console.error('❌ 错误: 语音生成需要设置 ELEVEN_LABS_API_KEY 环境变量');
        process.exit(1);
      }

      const eleven = new ElevenLabsProvider();
      audioBuffer = await eleven.generate(options.text, { voice: options.voice });
      await eleven.downloadAndSave(audioBuffer, options.output);
      console.log('\n✨ 完成!');
      return;
    }

    if (audioBuffer) {
      // 保存 WAV 文件
      const { mkdirSync, existsSync } = await import('fs');
      const { dirname } = await import('path');
      
      const outputPath = options.output;
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // 添加 WAV 头
      const wavBuffer = addWavHeader(audioBuffer, synth.sampleRate);
      writeFileSync(outputPath, wavBuffer);
      
      console.log(`✅ 音频已保存: ${outputPath}`);
    }

    console.log('\n✨ 完成!');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

/**
 * 添加 WAV 文件头
 */
function addWavHeader(audioBuffer, sampleRate) {
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = audioBuffer.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // audio format (PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, audioBuffer]);
}

main();
