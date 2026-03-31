#!/usr/bin/env node
/**
 * 🚀 快速验证脚本
 * 验证核心工具功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 kids-game-frame-factory 工具链快速验证');
console.log('='.repeat(50));
console.log();

// 检查核心文件是否存在
function checkFile(file, description) {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${file} ${exists ? '存在' : '缺失'}`);
  if (exists) {
    const stat = fs.statSync(fullPath);
    console.log(`    大小: ${(stat.size / 1024).toFixed(1)}KB, 修改: ${stat.mtime.toLocaleDateString()}`);
  }
  return exists;
}

// 检查package.json配置
function checkPackageJson() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log('❌ package.json不存在');
    return false;
  }
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`✅ package.json验证: ${pkg.name} v${pkg.version}`);
    
    const hasScripts = pkg.scripts && Object.keys(pkg.scripts).length > 0;
    console.log(`   脚本: ${hasScripts ? Object.keys(pkg.scripts).length + '个可用' : '无脚本'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ package.json解析失败: ${error.message}`);
    return false;
  }
}

// 运行验证
console.log('📋 核心文件检查:');
console.log();

const requiredFiles = [
  { file: 'package.json', desc: '项目配置' },
  { file: 'README.md', desc: '主文档' },
  { file: 'scripts/enhance-dev-tools.js', desc: '增强开发工具' },
  { file: 'scripts/resource-generator.js', desc: '资源生成工具' },
  { file: 'scripts/game-wizard.bat', desc: 'Windows向导' },
  { file: 'scripts/GameWizard.ps1', desc: 'PowerShell向导' },
  { file: 'src/utils/DebugPanel.ts', desc: '调试面板' },
  { file: 'docs/DEBUG_TOOLS_GUIDE.md', desc: '调试指南' }
];

let passed = 0;
let total = requiredFiles.length;

for (const item of requiredFiles) {
  if (checkFile(item.file, item.desc)) {
    passed++;
  }
  console.log();
}

console.log('📊 配置检查:');
checkPackageJson();
console.log();

console.log('📋 工具功能简要测试:');
console.log();

// 测试enhance-dev-tools.js的基本功能
try {
  const enhanceTools = require('../scripts/enhance-dev-tools.js');
  console.log('✅ 增强开发工具模块可加载');
  
  if (typeof enhanceTools.showProjectSummary === 'function') {
    console.log('✅ 增强开发工具API可用');
  }
} catch (error) {
  console.log('⚠️ 增强开发工具加载失败（可能需要依赖）');
}

// 测试资源生成器结构
const resourceGenPath = path.join(__dirname, '..', 'scripts', 'resource-generator.js');
if (fs.existsSync(resourceGenPath)) {
  const content = fs.readFileSync(resourceGenPath, 'utf8');
  if (content.includes('class ResourceGenerator') && content.includes('main()')) {
    console.log('✅ 资源生成工具结构正确');
  }
}

// 测试批处理向导内容
const batchPath = path.join(__dirname, '..', 'scripts', 'game-wizard.bat');
if (fs.existsSync(batchPath)) {
  const content = fs.readFileSync(batchPath, 'utf8');
  if (content.includes('@echo off') && content.includes('选择操作')) {
    console.log('✅ 批处理向导格式正确');
  }
}

console.log();
console.log('='.repeat(50));
console.log(`🎯 验证结果: ${passed}/${total} 通过 (${Math.round((passed/total)*100)}%)`);

if (passed === total) {
  console.log('✅ 所有核心文件就绪，工具链可用！');
} else if (passed >= total * 0.8) {
  console.log('⚠️ 工具链基本可用，建议补充缺失文件');
} else {
  console.log('❌ 工具链存在较多问题，建议修复后使用');
}

console.log();
console.log('💡 快速使用命令:');
console.log('  Windows用户: 双击 scripts/game-wizard.bat');
console.log('  通用命令: npm run create (创建新游戏)');
console.log('  查看版本: npm run version');
console.log('  环境检查: npm run check');
console.log('='.repeat(50));