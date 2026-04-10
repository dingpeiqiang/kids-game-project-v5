const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置：输出目录
const OUTPUT_DIR = path.join(__dirname, '../kids-game-house/games/pvz/assets/generated');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 植物大战僵尸 - 图片生成工具');
console.log('=' .repeat(50));

// 定义要生成的图片列表
const assetsToGenerate = [
  // 植物
  {
    name: 'sunflower',
    prompt: 'pixel art sunflower, Plants vs Zombies style, retro game sprite, 16-bit, transparent background',
    output: 'sunflower.png'
  },
  {
    name: 'peashooter',
    prompt: 'pixel art peashooter plant, Plants vs Zombies style, retro game sprite, green color, transparent background',
    output: 'peashooter.png'
  },
  {
    name: 'iceshooter',
    prompt: 'pixel art ice shooter plant, Plants vs Zombies style, blue ice color, retro game sprite, transparent background',
    output: 'iceshooter.png'
  },
  {
    name: 'repeater',
    prompt: 'pixel art repeater plant, double peashooter, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'repeater.png'
  },
  {
    name: 'cherrybomb',
    prompt: 'pixel art cherry bomb, two cherries, Plants vs Zombies style, red color, retro game sprite, transparent background',
    output: 'cherrybomb.png'
  },
  {
    name: 'potatomine',
    prompt: 'pixel art potato mine, Plants vs Zombies style, brown potato, retro game sprite, transparent background',
    output: 'potatomine.png'
  },
  {
    name: 'wallnut',
    prompt: 'pixel art walnut plant, tough defense, Plants vs Zombies style, brown color, retro game sprite, transparent background',
    output: 'wallnut.png'
  },
  
  // 僵尸
  {
    name: 'zombie-normal',
    prompt: 'pixel art zombie, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'zombie-normal.png'
  },
  {
    name: 'zombie-conehead',
    prompt: 'pixel art zombie with traffic cone on head, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'zombie-conehead.png'
  },
  {
    name: 'zombie-buckethead',
    prompt: 'pixel art zombie with metal bucket on head, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'zombie-buckethead.png'
  },
  {
    name: 'zombie-newspaper',
    prompt: 'pixel art zombie reading newspaper, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'zombie-newspaper.png'
  },
  
  // 其他素材
  {
    name: 'pea',
    prompt: 'pixel art green pea projectile, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'pea.png'
  },
  {
    name: 'sun',
    prompt: 'pixel art sun, bright yellow, Plants vs Zombies style, retro game sprite, transparent background',
    output: 'sun.png'
  }
];

/**
 * 调用bitart-generator生成图片
 */
function generateImage(asset) {
  const outputPath = path.join(OUTPUT_DIR, asset.output);
  
  console.log(`\n📝 生成: ${asset.name}`);
  console.log(`   提示词: ${asset.prompt.substring(0, 60)}...`);
  console.log(`   输出: ${asset.output}`);
  
  try {
    // 构建bitart命令
    const bitartPath = path.join(__dirname, '../kids-game-frame-factory/bitart-generator/npm/bin/run.js');
    const command = `node "${bitartPath}" -p "${asset.prompt}" -o "${outputPath}"`;
    
    console.log(`   执行: ${command}`);
    
    // 执行命令
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log(`✅ ${asset.name} 生成成功!`);
    return true;
  } catch (error) {
    console.error(`❌ ${asset.name} 生成失败:`, error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`\n📦 准备生成 ${assetsToGenerate.length} 个素材`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const asset of assetsToGenerate) {
    const success = generateImage(asset);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 稍微延迟一下，避免API限流
    if (assetsToGenerate.indexOf(asset) < assetsToGenerate.length - 1) {
      console.log('   等待 2 秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 生成完成!');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
}

// 运行主函数
main().catch(console.error);

// 导出模块供其他脚本使用
module.exports = {
  generateImage,
  assetsToGenerate,
  OUTPUT_DIR
};
