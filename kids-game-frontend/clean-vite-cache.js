#!/usr/bin/env node

/**
 * Vite 缓存清理工具
 * 
 * 功能：
 * 1. 清理 Vite 依赖预构建缓存 (node_modules/.vite)
 * 2. 清理构建产物 (dist)
 * 3. 可选：清理浏览器缓存提示
 */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 需要清理的目录
const pathsToClean = [
  join(__dirname, 'node_modules', '.vite'),
  join(__dirname, 'dist'),
];

console.log('🧹 开始清理 Vite 缓存...\n');

let cleanedCount = 0;

pathsToClean.forEach(dirPath => {
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ 已清理：${dirPath}`);
      cleanedCount++;
    } catch (error) {
      console.error(`❌ 清理失败 ${dirPath}:`, error.message);
    }
  } else {
    console.log(`⭕ 不存在：${dirPath}`);
  }
});

console.log('\n' + '='.repeat(50));
if (cleanedCount > 0) {
  console.log(`✨ 清理完成！共清理 ${cleanedCount} 个目录`);
  console.log('\n💡 提示：');
  console.log('   1. 重启开发服务器：npm run dev');
  console.log('   2. 如果问题仍然存在，请尝试：');
  console.log('      - 硬刷新浏览器：Ctrl + Shift + R (Windows) 或 Cmd + Shift + R (Mac)');
  console.log('      - 清除浏览器缓存和 Cookie');
  console.log('      - 使用浏览器无痕模式测试');
} else {
  console.log('ℹ️  没有发现需要清理的缓存');
}
console.log('='.repeat(50) + '\n');
