import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SDWebUI } from './game-ui-tool/src/index.js';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const OUTPUT_DIR = path.join(__dirname, 'kids-game-house/games/pvz/assets/generated-new');
const SD_API_URL = 'http://localhost:7860';

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 植物大战僵尸 - 素材生成工具 (v2 - game-ui-tool)');
console.log('='.repeat(60));

// 定义要生成的图片列表
const assetsToGenerate = [
  // 植物
  {
    name: 'sunflower',
    prompt: 'cute sunflower plant, bright yellow, happy face, Plants vs Zombies style, cartoon art, transparent background',
    output: 'sunflower.png'
  },
  {
    name: 'peashooter',
    prompt: 'green peashooter plant, ready to shoot, Plants vs Zombies style, cartoon art, transparent background',
    output: 'peashooter.png'
  },
  {
    name: 'iceshooter',
    prompt: 'ice shooter plant, blue color, frozen, Plants vs Zombies style, cartoon art, transparent background',
    output: 'iceshooter.png'
  },
  {
    name: 'repeater',
    prompt: 'double peashooter plant, two heads, Plants vs Zombies style, cartoon art, transparent background',
    output: 'repeater.png'
  },
  {
    name: 'cherrybomb',
    prompt: 'two cherries with explosive effect, red color, Plants vs Zombies style, cartoon art, transparent background',
    output: 'cherrybomb.png'
  },
  {
    name: 'potatomine',
    prompt: 'potato mine with angry face, brown color, Plants vs Zombies style, cartoon art, transparent background',
    output: 'potatomine.png'
  },
  {
    name: 'wallnut',
    prompt: 'tough walnut plant, brown color, strong defense, Plants vs Zombies style, cartoon art, transparent background',
    output: 'wallnut.png'
  },
  
  // 僵尸
  {
    name: 'zombie-normal',
    prompt: 'funny zombie character, green skin, tattered suit, Plants vs Zombies style, cartoon art, transparent background',
    output: 'zombie-normal.png'
  },
  {
    name: 'zombie-conehead',
    prompt: 'zombie with orange traffic cone on head, Plants vs Zombies style, cartoon art, transparent background',
    output: 'zombie-conehead.png'
  },
  {
    name: 'zombie-buckethead',
    prompt: 'zombie with metal bucket on head, Plants vs Zombies style, cartoon art, transparent background',
    output: 'zombie-buckethead.png'
  },
  {
    name: 'zombie-newspaper',
    prompt: 'zombie reading newspaper, Plants vs Zombies style, cartoon art, transparent background',
    output: 'zombie-newspaper.png'
  },
  
  // 其他素材
  {
    name: 'pea',
    prompt: 'green pea projectile, round, Plants vs Zombies style, cartoon art, transparent background',
    output: 'pea.png'
  },
  {
    name: 'sun',
    prompt: 'bright yellow sun, smiling face, Plants vs Zombies style, cartoon art, transparent background',
    output: 'sun.png'
  },
  {
    name: 'grass-bg',
    prompt: 'green grass texture, tileable, Plants vs Zombies style, cartoon art, top view',
    output: 'grass-bg.png'
  }
];

// 负面提示词
const negativePrompt = 'photorealistic, 3d render, realistic, blurry, low quality, ugly, distorted, watermark, text, signature';

async function generateImage(sd: SDWebUI, asset: any) {
  const outputPath = path.join(OUTPUT_DIR, asset.output);
  
  console.log(`\n📝 生成: ${asset.name}`);
  console.log(`   提示词: ${asset.prompt.substring(0, 60)}...`);
  console.log(`   输出: ${asset.output}`);
  
  try {
    const result = await sd.generateWithStyle(
      asset.prompt,
      'cartoon',
      {
        width: 256,
        height: 256,
        negativePrompt: negativePrompt,
        steps: 30,
        cfgScale: 8
      }
    );
    
    if (result.images && result.images.length > 0) {
      const buffer = SDWebUI.base64ToBuffer(result.images[0].base64);
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ ${asset.name} 生成成功!`);
      return true;
    } else {
      console.error(`❌ ${asset.name} 生成失败: 无图片返回`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ ${asset.name} 生成失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log(`\n📦 准备生成 ${assetsToGenerate.length} 个素材`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`🔗 API地址: ${SD_API_URL}`);
  
  const sd = new SDWebUI(SD_API_URL);
  
  // 检查 API 连接
  console.log('\n🔍 检查 API 连接...');
  try {
    const connected = await sd.ping();
    if (!connected) {
      console.error('❌ 无法连接到 sd-webui-aki API!');
      console.error('请确保:');
      console.error('1. sd-webui-aki 已启动');
      console.error('2. 使用 --api 参数启动');
      console.error('3. API 地址正确 (默认: http://localhost:7860)');
      process.exit(1);
    }
    console.log('✅ API 连接成功!');
  } catch (error) {
    console.error('❌ API 连接检查失败:', error);
    process.exit(1);
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const asset of assetsToGenerate) {
    const success = await generateImage(sd, asset);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 稍微延迟一下，避免API限流
    if (assetsToGenerate.indexOf(asset) < assetsToGenerate.length - 1) {
      console.log('   等待 1 秒...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 生成完成!');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有素材生成成功!');
  } else {
    console.log('\n⚠️  部分素材生成失败，请检查日志');
  }
}

// 运行主函数
main().catch(console.error);
