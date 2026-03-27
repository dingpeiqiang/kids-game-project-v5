/**
 * AI 图片生成器
 * 支持 DALL-E 3、DALL-E 2、Stable Diffusion
 * 
 * 使用方式:
 *   node src/index.js --prompt "一个可爱的蓝色小蛇角色" --output assets/snake.png
 *   node src/index.js --provider dalle3 --prompt "游戏开始按钮" --size 1024x1024 --output assets/btn_start.png
 *   node src/index.js --provider sd --prompt "森林背景" --output assets/forest.png
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// 尝试加载 dotenv
let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config();
} catch (e) {
  console.log('dotenv not available, using env vars directly');
}

// ==================== 配置 ====================

const CONFIG = {
  // DALL-E 配置
  dalle: {
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard', // standard | hd
    style: 'vivid', // vivid | natural
  },
  
  // Stable Diffusion 配置
  sd: {
    url: process.env.SD_URL || 'http://localhost:7860',
    model: process.env.SD_MODEL || 'sd-v1-4',
    steps: 20,
    cfg_scale: 7,
    width: 512,
    height: 512,
  },
  
  // 输出目录
  outputDir: 'output',
};

// ==================== DALL-E 提供商 ====================

class DalleProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('请设置 OPENAI_API_KEY 环境变量');
    }
  }

  async generate(prompt, options = {}) {
    const { size, quality, style, model } = { ...CONFIG.dalle, ...options };
    
    // 动态导入 OpenAI
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: this.apiKey });

    console.log(`🎨 正在调用 DALL-E ${model || '3'} 生成图片...`);
    console.log(`   Prompt: ${prompt}`);

    const response = await client.images.generate({
      model: model || 'dall-e-3',
      prompt,
      size,
      quality,
      style,
      n: 1,
    });

    const imageUrl = response.data[0].url;
    console.log(`   图片 URL: ${imageUrl}`);

    return imageUrl;
  }

  async downloadAndSave(imageUrl, outputPath) {
    const { default: axios } = await import('axios');
    
    console.log(`⬇️  下载图片到: ${outputPath}`);
    
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    // 确保目录存在
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(outputPath, response.data);
    console.log(`✅ 图片已保存: ${outputPath}`);
    
    return outputPath;
  }
}

// ==================== Stable Diffusion 提供商 ====================

class StableDiffusionProvider {
  constructor() {
    this.url = CONFIG.sd.url;
  }

  async generate(prompt, options = {}) {
    const { width, height, steps, cfg_scale, model } = { ...CONFIG.sd, ...options };
    
    console.log(`🎨 正在调用 Stable Diffusion 生成图片...`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   尺寸: ${width}x${height}`);

    const payload = {
      prompt,
      negative_prompt: "low quality, blurry, distorted, bad anatomy",
      width,
      height,
      steps,
      cfg_scale,
      sampler_index: "Euler a",
    };

    if (model) {
      payload.sd_model_checkpoint = model;
    }

    const { default: axios } = await import('axios');

    try {
      // txt2img API
      const response = await axios.post(`${this.url}/sdapi/v1/txt2img`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const base64Image = response.data.images[0];
      console.log(`✅ 图片生成完成`);

      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`无法连接到 Stable Diffusion 服务: ${this.url}`);
      }
      throw error;
    }
  }

  async downloadAndSave(imageData, outputPath) {
    const { writeFileSync, mkdirSync } = await import('fs');
    const { dirname } = await import('path');

    console.log(`💾 保存图片到: ${outputPath}`);

    let base64Data = imageData;
    if (imageData.startsWith('data:')) {
      base64Data = imageData.split(',')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, buffer);
    console.log(`✅ 图片已保存: ${outputPath}`);

    return outputPath;
  }
}

// ==================== 主程序 ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    provider: 'dalle3',
    prompt: '',
    output: '',
    size: '',
    quality: '',
    style: '',
    width: 512,
    height: 512,
    steps: 20,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--prompt':
      case '-p':
        options.prompt = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--provider':
        options.provider = args[++i];
        break;
      case '--size':
        options.size = args[++i];
        break;
      case '--quality':
        options.quality = args[++i];
        break;
      case '--style':
        options.style = args[++i];
        break;
      case '--width':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
        options.height = parseInt(args[++i]);
        break;
      case '--steps':
        options.steps = parseInt(args[++i]);
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
🤖 AI 图片生成工具

用法:
  node src/index.js [选项]

选项:
  --prompt, -p <文本>      图片描述提示词 (必填)
  --output, -o <路径>     输出文件路径 (必填)
  --provider <名称>       AI 提供商: dalle3, dalle2, sd (默认: dalle3)
  --size <尺寸>          DALL-E 尺寸: 1024x1024, 1792x1024, 1024x1792 (默认: 1024x1024)
  --quality <质量>       DALL-E 质量: standard, hd (默认: standard)
  --style <风格>         DALL-E 风格: vivid, natural (默认: vivid)
  --width <像素>         Stable Diffusion 宽度 (默认: 512)
  --height <像素>        Stable Diffusion 高度 (默认: 512)
  --steps <数量>         Stable Diffusion 采样步数 (默认: 20)
  --help, -h             显示帮助

示例:
  # 使用 DALL-E 3 生成游戏角色
  node src/index.js -p "一个可爱的蓝色卡通小蛇角色，游戏精灵风格" -o output/snake_character.png

  # 使用 DALL-E 2 生成
  node src/index.js --provider dalle2 -p "游戏背景森林" -o output/forest.png

  # 使用 Stable Diffusion 生成
  node src/index.js --provider sd -p "像素风格城堡背景" -o output/castle.png --width 512 --height 512

环境变量:
  OPENAI_API_KEY         DALL-E API 密钥
  STABLE_DIFFUSION_URL   Stable Diffusion 服务地址 (默认: http://localhost:7860)
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.prompt) {
    console.error('❌ 错误: 请提供 --prompt 参数');
    printHelp();
    process.exit(1);
  }

  if (!options.output) {
    console.error('❌ 错误: 请提供 --output 参数');
    printHelp();
    process.exit(1);
  }

  try {
    let provider;
    let providerType = options.provider.toLowerCase();

    if (providerType === 'dalle3' || providerType === 'dalle2') {
      provider = new DalleProvider();
      if (providerType === 'dalle2') {
        options.model = 'dall-e-2';
        options.size = '1024x1024';
      }
    } else if (providerType === 'sd') {
      provider = new StableDiffusionProvider();
    } else {
      throw new Error(`未知提供商: ${options.provider}`);
    }

    // 生成图片
    const imageData = await provider.generate(options.prompt, {
      size: options.size,
      quality: options.quality,
      style: options.style,
      model: options.model,
      width: options.width,
      height: options.height,
      steps: options.steps,
    });

    // 保存图片
    await provider.downloadAndSave(imageData, options.output);

    console.log('\n✨ 完成!');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
