/**
 * 批量 AI 图片生成器
 * 从配置文件批量生成游戏素材
 * 
 * 使用方式:
 *   node src/batch.js
 *   node src/batch.js --config custom-config.json
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// 默认配置
const DEFAULT_CONFIG = {
  provider: 'dalle3',
  outputDir: 'output',
  prompts: [
    // 角色
    { key: 'snake_head', prompt: '可爱的蓝色卡通蛇头角色，游戏精灵风格，正面视角', output: 'characters/snake_head.png' },
    { key: 'snake_body', prompt: '蓝色卡通蛇身段，游戏精灵风格，透明背景', output: 'characters/snake_body.png' },
    { key: 'snake_tail', prompt: '蓝色卡通蛇尾，游戏精灵风格，透明背景', output: 'characters/snake_tail.png' },
    
    // 食物/道具
    { key: 'food_apple', prompt: '红色苹果卡通图标，游戏道具风格，透明背景', output: 'items/food_apple.png' },
    { key: 'food_banana', prompt: '黄色香蕉卡通图标，游戏道具风格，透明背景', output: 'items/food_banana.png' },
    { key: 'item_speed', prompt: '蓝色闪电图标，游戏加速道具，透明背景', output: 'items/item_speed.png' },
    { key: 'item_magnify', prompt: '放大镜图标，游戏道具，透明背景', output: 'items/item_magnify.png' },
    
    // 场景
    { key: 'scene_grass', prompt: '绿色草地卡通背景，游戏场景，1920x1080', output: 'scenes/grass.png' },
    { key: 'scene_desert', prompt: '黄色沙漠卡通背景，游戏场景，1920x1080', output: 'scenes/desert.png' },
    { key: 'scene_ice', prompt: '蓝色冰块卡通背景，游戏场景，1920x1080', output: 'scenes/ice.png' },
    
    // UI
    { key: 'btn_start', prompt: '绿色开始按钮，卡通游戏UI风格，简洁', output: 'ui/btn_start.png' },
    { key: 'btn_pause', prompt: '黄色暂停按钮，卡通游戏UI风格，简洁', output: 'ui/btn_pause.png' },
    { key: 'panel_score', prompt: '金色奖杯图标，分数面板用，游戏UI风格', output: 'ui/panel_score.png' },
    
    // 图标
    { key: 'icon_coin', prompt: '金色硬币图标，游戏货币风格，圆形', output: 'icons/coin.png' },
    { key: 'icon_gem', prompt: '彩色宝石图标，游戏钻石风格，菱形', output: 'icons/gem.png' },
    { key: 'icon_star', prompt: '黄色星星图标，游戏评分风格', output: 'icons/star.png' },
  ]
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' || arg === '-c') {
      options.config = args[++i];
    }
  }

  return options;
}

async function main() {
  const args = parseArgs();
  
  // 加载配置
  let config;
  if (args.config) {
    if (!existsSync(args.config)) {
      console.error(`❌ 配置文件不存在: ${args.config}`);
      process.exit(1);
    }
    const content = readFileSync(args.config, 'utf-8');
    config = JSON.parse(content);
  } else {
    config = DEFAULT_CONFIG;
  }

  console.log(`\n🤖 批量 AI 图片生成器`);
  console.log(`   提供商: ${config.provider}`);
  console.log(`   输出目录: ${config.outputDir}`);
  console.log(`   生成数量: ${config.prompts.length}`);
  console.log('');

  // 动态导入主模块
  const { default: axios } = await import('axios');
  
  // 根据提供商选择
  let apiKey = process.env.OPENAI_API_KEY;
  let useDalle = config.provider === 'dalle3' || config.provider === 'dalle2';
  
  if (useDalle && !apiKey) {
    console.error('❌ 请设置 OPENAI_API_KEY 环境变量');
    process.exit(1);
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });

  const results = {
    success: [],
    failed: [],
  };

  for (const item of config.prompts) {
    console.log(`\n📦 生成: ${item.key}`);
    console.log(`   Prompt: ${item.prompt}`);

    try {
      let imageUrl;

      if (useDalle) {
        // 使用 DALL-E
        const response = await client.images.generate({
          model: config.provider === 'dalle2' ? 'dall-e-2' : 'dall-e-3',
          prompt: item.prompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          n: 1,
        });
        imageUrl = response.data[0].url;
      } else {
        // TODO: Stable Diffusion 批量支持
        console.log('   ⚠️ Stable Diffusion 批量模式暂未实现');
        continue;
      }

      // 下载图片
      const outputPath = join(config.outputDir, item.output);
      const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      const { mkdirSync, writeFileSync, existsSync } = await import('fs');
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(outputPath, response2.data);
      
      console.log(`   ✅ 已保存: ${outputPath}`);
      results.success.push(item.key);
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      results.failed.push({ key: item.key, error: error.message });
    }

    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 生成结果:');
  console.log(`   ✅ 成功: ${results.success.length}`);
  console.log(`   ❌ 失败: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n失败列表:');
    for (const item of results.failed) {
      console.log(`   - ${item.key}: ${item.error}`);
    }
  }

  console.log('\n✨ 批量生成完成!');
}

main().catch(console.error);
