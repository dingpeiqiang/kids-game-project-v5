#!/usr/bin/env node

/**
 * 版本号管理脚本
 * 用途：每次构建时自动生成新版本号，用于强制刷新缓存
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 生成版本号：时间戳 + 随机数
function generateVersion() {
  const now = new Date();
  const timestamp = now.getTime();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// 生成简洁版本号：YYYYMMDD-HHmmss
function generateSimpleVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// 写入版本文件
function writeVersionFile(versionDir) {
  const version = generateSimpleVersion();
  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    gitCommit: process.env.GIT_COMMIT || 'unknown',
  };

  const versionFilePath = path.join(versionDir, 'version.json');
  fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));
  
  console.log(`✅ 版本号已生成: ${version}`);
  console.log(`📁 版本文件: ${versionFilePath}`);
  
  return version;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const outputDir = args[0] || 'dist';
  
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  writeVersionFile(outputDir);
}

main();
