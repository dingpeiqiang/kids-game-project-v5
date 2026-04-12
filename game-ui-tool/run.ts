/**
 * 游戏素材生成工具 - 使用示例
 * 
 * 运行: npx tsx run.ts
 */

import { 
  SDWebUI, 
  GAME_STYLES, 
  PROMPT_TEMPLATES,
  createSDClient 
} from './src/index.js';
import fs from 'fs';

async function main() {
  // 创建客户端
  const sd = new SDWebUI('http://localhost:7860');
  // 或使用快捷函数: const sd = createSDClient();

  console.log('🎮 游戏素材生成工具\n');

  // 1. 检查连接
  console.log('📡 检查连接...');
  const connected = await sd.ping();
  if (!connected) {
    console.error('❌ 无法连接到 SD WebUI，请确保服务运行在 http://localhost:7860');
    process.exit(1);
  }
  console.log('✅ 已连接到 SD WebUI\n');

  // 2. 获取可用模型
  console.log('📦 可用模型:');
  const models = await sd.getModels();
  models.slice(0, 3).forEach(m => console.log(`   - ${m.model_name}`));
  console.log(`   ...共 ${models.length} 个模型\n`);

  // 3. 列出游戏风格
  console.log('🎨 可用游戏风格:');
  GAME_STYLES.forEach(style => {
    console.log(`   [${style.id}] ${style.name}`);
  });
  console.log('');

  // 4. 列出 Prompt 模板
  console.log('📝 Prompt 模板:');
  PROMPT_TEMPLATES.forEach(cat => {
    console.log(`   ${cat.category}:`);
    Object.keys(cat.items).slice(0, 3).forEach(key => {
      console.log(`     - ${key}`);
    });
    if (Object.keys(cat.items).length > 3) {
      console.log(`     ...等 ${Object.keys(cat.items).length} 个`);
    }
  });
  console.log('');

  // 5. 示例：生成一张像素风角色
  console.log('🎯 示例：生成像素风游戏角色...');
  
  const result = await sd.generateWithStyle(
    'a cute game character, blue hair, smile',
    'pixel-art',
    {
      width: 512,
      height: 512,
      steps: 20,
      cfgScale: 7,
    }
  );

  console.log(`✅ 生成完成！`);
  console.log(`   - 种子: ${result.seed}`);
  console.log(`   - 图片数: ${result.images.length}`);
  console.log(`   - 尺寸: ${result.info.width}x${result.info.height}`);
  console.log(`   - 风格: ${result.info.sampler}`);
  console.log('');

  // 6. 保存图片
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  result.images.forEach((img, i) => {
    const buffer = SDWebUI.base64ToBuffer(img.base64);
    const filename = `${outputDir}/character_${result.seed}_${i}.png`;
    fs.writeFileSync(filename, buffer);
    console.log(`💾 已保存: ${filename}`);
  });

  // 7. 使用 Prompt 模板
  console.log('\n📌 使用模板生成怪物:');
  const monsterResult = await sd.generateFromTemplate(
    '怪物',
    'slime',
    'pixel-art',
    { width: 256, height: 256 }
  );
  
  const slimeBuffer = SDWebUI.base64ToBuffer(monsterResult.images[0].base64);
  fs.writeFileSync(`${outputDir}/slime_${monsterResult.seed}.png`, slimeBuffer);
  console.log(`💾 已保存: ${outputDir}/slime_${monsterResult.seed}.png`);

  // 8. 图生图示例 (需要先生成一张图)
  console.log('\n🔄 图生图示例:');
  const img2imgResult = await sd.img2img({
    prompt: 'change to red color scheme',
    initImages: [result.images[0].base64],
    denoisingStrength: 0.5,
    width: 512,
    height: 512,
  });
  
  const img2imgBuffer = SDWebUI.base64ToBuffer(img2imgResult.images[0].base64);
  fs.writeFileSync(`${outputDir}/transformed_${img2imgResult.seed}.png`, img2imgBuffer);
  console.log(`💾 已保存: ${outputDir}/transformed_${img2imgResult.seed}.png`);

  console.log('\n✨ 完成！');
}

// 运行
main().catch(console.error);
