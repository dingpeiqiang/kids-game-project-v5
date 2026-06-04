/**
 * PVZ 素材验证脚本
 * 检查所有生成的 PNG 文件是否有效
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, 'kids-game-house', 'games', 'pvz', 'public', 'themes', 'pvz', 'assets', 'scene');

async function validateAssets() {
  console.log('🔍 开始验证 PVZ 游戏素材...\n');
  
  // 获取所有 PNG 文件
  const files = fs.readdirSync(ASSETS_DIR)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  if (files.length === 0) {
    console.error('❌ 未找到任何 PNG 文件');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个 PNG 文件\n`);
  
  let validCount = 0;
  let invalidCount = 0;
  let totalSize = 0;
  
  const results = [];
  
  for (const file of files) {
    const filePath = path.join(ASSETS_DIR, file);
    
    try {
      // 读取文件信息
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      totalSize += fileSize;
      
      // 使用 sharp 验证图片
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // 检查是否为有效的 PNG
      const isValid = metadata.format === 'png';
      const hasAlpha = metadata.hasAlpha || false;
      
      const result = {
        name: file,
        valid: isValid,
        width: metadata.width,
        height: metadata.height,
        size: fileSize,
        sizeKB: (fileSize / 1024).toFixed(2),
        hasAlpha,
        channels: metadata.channels
      };
      
      results.push(result);
      
      if (isValid) {
        validCount++;
        console.log(`✅ ${file.padEnd(30)} ${result.sizeKB.padStart(8)} KB | ${metadata.width}x${metadata.height}${hasAlpha ? ' | 透明' : ''}`);
      } else {
        invalidCount++;
        console.log(`❌ ${file.padEnd(30)} 无效格式`);
      }
    } catch (error) {
      invalidCount++;
      console.log(`❌ ${file.padEnd(30)} 错误: ${error.message}`);
    }
  }
  
  // 打印总结
  console.log('\n' + '='.repeat(70));
  console.log('📊 验证结果总结');
  console.log('='.repeat(70));
  console.log(`总文件数:     ${files.length}`);
  console.log(`有效文件:     ${validCount} ✅`);
  console.log(`无效文件:     ${invalidCount} ❌`);
  console.log(`总大小:       ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`平均大小:     ${(totalSize / files.length / 1024).toFixed(2)} KB`);
  console.log('='.repeat(70));
  
  // 检查尺寸一致性
  const sizes = new Set(results.map(r => `${r.width}x${r.height}`));
  if (sizes.size === 1) {
    console.log(`✅ 所有素材尺寸一致: ${[...sizes][0]}`);
  } else {
    console.log(`⚠️  素材尺寸不统一:`);
    sizes.forEach(size => {
      const count = results.filter(r => `${r.width}x${r.height}` === size).length;
      console.log(`   - ${size}: ${count} 个文件`);
    });
  }
  
  // 检查透明度
  const withAlpha = results.filter(r => r.hasAlpha).length;
  const withoutAlpha = results.filter(r => !r.hasAlpha).length;
  console.log(`\n透明度统计:`);
  console.log(`   带透明通道: ${withAlpha} 个`);
  console.log(`   不带透明:   ${withoutAlpha} 个`);
  
  if (invalidCount === 0) {
    console.log('\n✨ 所有素材验证通过！');
  } else {
    console.log(`\n⚠️  发现 ${invalidCount} 个无效文件，请检查`);
  }
}

validateAssets().catch(console.error);
