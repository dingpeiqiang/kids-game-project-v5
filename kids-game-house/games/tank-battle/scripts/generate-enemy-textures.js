/**
 * 🔧 敌人生成方向纹理生成器 (使用 Sharp)
 * 
 * 说明：
 * - 从现有的 enemy_tank_1/2/3.png 生成四个方向的纹理
 * - 通过旋转原始图片创建 up/down/left/right
 * - 使用 sharp 库进行高效图片处理
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const INPUT_DIR = path.join(__dirname, '../public/themes/tank_default/assets/scene');
const OUTPUT_DIR = INPUT_DIR;

// 敌人坦克配置
const ENEMY_CONFIGS = [
  { base: 'enemy_tank_1.png', prefix: 'enemy_light', name: '轻型' },
  { base: 'enemy_tank_2.png', prefix: 'enemy_medium', name: '中型' },
  { base: 'enemy_tank_3.png', prefix: 'enemy_heavy', name: '重型' }
];

/**
 * 旋转图片
 */
async function rotateImage(sourcePath, outputPath, rotation) {
  try {
    await sharp(sourcePath)
      .rotate(rotation)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ 生成：${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ 失败：${outputPath}`, error.message);
    return false;
  }
}

/**
 * 生成一套四个方向的纹理
 */
async function generateEnemyTextures(config) {
  const { base, prefix, name } = config;
  const basePath = path.join(INPUT_DIR, base);
  
  console.log(`\n🎨 开始生成 ${name} 坦克纹理...`);
  
  // 检查基础图片是否存在
  if (!fs.existsSync(basePath)) {
    console.error(`❌ 基础图片不存在：${basePath}`);
    return false;
  }
  
  // 生成四个方向
  const directions = [
    { angle: 270, suffix: 'up', desc: '向上' },   // 逆时针 270° = 向上
    { angle: 90, suffix: 'down', desc: '向下' },   // 顺时针 90° = 向下
    { angle: 180, suffix: 'left', desc: '向左' },  // 旋转 180° = 向左
    { angle: 0, suffix: 'right', desc: '向右' }    // 不旋转 = 向右（假设原图向右）
  ];
  
  let successCount = 0;
  
  for (const dir of directions) {
    const outputPath = path.join(OUTPUT_DIR, `${prefix}_${dir.suffix}.png`);
    
    // 如果已经存在，跳过
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  已存在：${outputPath}`);
      successCount++;
      continue;
    }
    
    const success = await rotateImage(basePath, outputPath, dir.angle);
    if (success) {
      console.log(`   └─ ${dir.desc}: ${prefix}_${dir.suffix}.png`);
      successCount++;
    }
  }
  
  console.log(`✅ ${name} 坦克纹理生成完成：${successCount}/4`);
  return successCount === 4;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始生成敌人坦克方向纹理...\n');
  
  let totalSuccess = 0;
  
  for (const config of ENEMY_CONFIGS) {
    const success = await generateEnemyTextures(config);
    if (success) totalSuccess++;
  }
  
  console.log(`\n✅ 完成！成功生成 ${totalSuccess}/${ENEMY_CONFIGS.length} 套纹理`);
  console.log('\n📁 生成的文件列表：');
  console.log('  轻型坦克：');
  console.log('    - enemy_light_up.png');
  console.log('    - enemy_light_down.png');
  console.log('    - enemy_light_left.png');
  console.log('    - enemy_light_right.png');
  console.log('  中型坦克：');
  console.log('    - enemy_medium_up.png');
  console.log('    - enemy_medium_down.png');
  console.log('    - enemy_medium_left.png');
  console.log('    - enemy_medium_right.png');
  console.log('  重型坦克：');
  console.log('    - enemy_heavy_up.png');
  console.log('    - enemy_heavy_down.png');
  console.log('    - enemy_heavy_left.png');
  console.log('    - enemy_heavy_right.png');
}

// 执行
main().catch(console.error);
