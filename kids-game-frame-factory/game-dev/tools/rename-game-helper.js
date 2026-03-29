#!/usr/bin/env node

/**
 * 游戏重命名辅助工具
 * 
 * 用途：帮助彻底重命名从贪吃蛇复制的游戏，避免代码污染
 * 使用：node rename-game-helper.js snake plane-shooter
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const [,, oldName, newName] = process.argv;

if (!oldName || !newName) {
  console.error('❌ 用法：node rename-game-helper.js <旧名称> <新名称>');
  console.error('示例：node rename-game-helper.js snake plane-shooter');
  process.exit(1);
}

// 需要跳过的目录（框架代码）
const SKIP_DIRS = ['core', 'rendering'];

// 需要跳过的文件
const SKIP_FILES = ['GameOrchestrator.ts'];

// 替换规则
const replacementRules = [
  // 高优先级：完整词组
  { pattern: new RegExp(`SnakeGame`, 'g'), replacement: `${capitalize(newName)}Game` },
  { pattern: new RegExp(`snakeGame`, 'g'), replacement: `${lowercaseFirst(newName)}Game` },
  { pattern: new RegExp(`useSnakeStore`, 'g'), replacement: `use${capitalize(newName)}Store` },
  
  // 中优先级：单独的 Snake/snake（不在路径中）
  { pattern: new RegExp(`\\bSnake\\b`, 'g'), replacement: capitalize(newName) },
  { pattern: new RegExp(`\\bsnake\\b(?!\\/|\\\\)`, 'g'), replacement: newName },
  
  // 低优先级：路径中的 snake（单独处理）
  { pattern: new RegExp(`(['"])snake/`, 'g'), replacement: `$1${newName}/` },
];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function lowercaseFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// 递归遍历目录
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过特定目录
      if (SKIP_DIRS.some(skipDir => dir.includes(skipDir))) {
        console.log(`⏭️  跳过框架目录：${filePath}`);
        continue;
      }
      walkDir(filePath, callback);
    } else {
      // 跳过特定文件
      if (SKIP_FILES.some(skipFile => filePath.endsWith(skipFile))) {
        console.log(`⏭️  跳过框架文件：${filePath}`);
        continue;
      }
      callback(filePath);
    }
  }
}

// 重命名文件内容
function renameInFileContent(filePath) {
  // 只处理 .ts, .vue, .json 文件
  const ext = path.extname(filePath);
  if (!['.ts', '.vue', '.json'].includes(ext)) {
    return;
  }
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ 读取失败 ${filePath}: ${error.message}`);
    return;
  }
  
  let newContent = content;
  let changedCount = 0;
  
  // 应用所有替换规则
  for (const rule of replacementRules) {
    const matches = newContent.match(rule.pattern);
    if (matches) {
      newContent = newContent.replace(rule.pattern, rule.replacement);
      changedCount += matches.length;
    }
  }
  
  // 如果有变化，写回文件
  if (changedCount > 0) {
    try {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ 更新 ${filePath} (${changedCount} 处)`);
    } catch (error) {
      console.error(`❌ 写入失败 ${filePath}: ${error.message}`);
    }
  }
}

// 重命名文件名
function renameFilePaths(rootDir) {
  const filesToRename = [];
  
  // 收集需要重命名的文件
  walkDir(rootDir, (filePath) => {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    
    // 检查是否包含旧名称
    if (fileName.toLowerCase().includes(oldName.toLowerCase())) {
      filesToRename.push(filePath);
    }
  });
  
  // 重命名文件（从最深层开始，避免路径问题）
  filesToRename.sort((a, b) => b.length - a.length);
  
  for (const filePath of filesToRename) {
    const dir = path.dirname(filePath);
    const oldFileName = path.basename(filePath);
    const newFileName = oldFileName.replace(
      new RegExp(oldName, 'gi'),
      (match) => {
        if (match === oldName.toUpperCase()) {
          return newName.toUpperCase();
        } else if (match === oldName.toLowerCase()) {
          return newName.toLowerCase();
        } else {
          return capitalize(newName);
        }
      }
    );
    
    if (oldFileName !== newFileName) {
      const newPath = path.join(dir, newFileName);
      try {
        fs.renameSync(filePath, newPath);
        console.log(`📝 重命名：${oldFileName} → ${newFileName}`);
      } catch (error) {
        console.error(`❌ 重命名失败 ${filePath}: ${error.message}`);
      }
    }
  }
}

// 验证函数：检查是否还有残留
function validateRename(rootDir) {
  console.log('\n🔍 开始验证重命名结果...\n');
  
  let hasIssues = false;
  const issues = [];
  
  walkDir(rootDir, (filePath) => {
    const ext = path.extname(filePath);
    if (!['.ts', '.vue', '.json'].includes(ext)) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const patterns = [
      { regex: /\bSnake\b/g, name: 'Snake' },
      { regex: /\bsnake\b(?!\/)/g, name: 'snake' },
      { regex: /SnakeGame/g, name: 'SnakeGame' },
      { regex: /useSnakeStore/g, name: 'useSnakeStore' },
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        issues.push({
          file: filePath,
          issue: pattern.name,
          count: matches.length
        });
        hasIssues = true;
      }
    }
  });
  
  if (hasIssues) {
    console.log('⚠️  发现以下残留（需要手动检查）:\n');
    issues.forEach(issue => {
      console.log(`  📄 ${issue.file}`);
      console.log(`     残留：${issue.issue} (${issue.count} 处)\n`);
    });
    console.log('💡 提示：使用 IDE 的全局搜索功能查找并替换这些残留\n');
  } else {
    console.log('✅ 验证通过！未发现残留的 snake/Snake 引用\n');
  }
  
  return hasIssues;
}

// 主函数
function main() {
  const targetDir = process.cwd();
  
  console.log('🚀 游戏重命名工具\n');
  console.log(`源名称：${oldName}`);
  console.log(`目标名称：${newName}`);
  console.log(`工作目录：${targetDir}\n`);
  
  console.log('📋 执行步骤：\n');
  
  // 步骤 1：重命名文件内容
  console.log('步骤 1/3: 重命名文件内容...');
  walkDir(targetDir, renameInFileContent);
  
  // 步骤 2：重命名文件名
  console.log('\n步骤 2/3: 重命名文件名...');
  renameFilePaths(targetDir);
  
  // 步骤 3：验证
  console.log('\n步骤 3/3: 验证重命名结果...');
  const hasIssues = validateRename(targetDir);
  
  // 输出总结
  console.log('\n' + '='.repeat(50));
  if (!hasIssues) {
    console.log('✅ 重命名完成！所有检查通过。\n');
  } else {
    console.log('⚠️  重命名基本完成，但发现少量残留。\n');
    console.log('请按照以下步骤手动清理：');
    console.log('1. 使用 IDE 全局搜索上述列出的残留关键字');
    console.log('2. 逐个检查并替换为新游戏的名称');
    console.log('3. 再次运行此工具验证\n');
  }
  
  console.log('📖 完整的检查清单请参考:');
  console.log('   docs/RENAME_CHECKLIST.md\n');
}

// 运行主函数
try {
  main();
} catch (error) {
  console.error(`\n❌ 发生错误：${error.message}`);
  console.error('\n请检查：');
  console.error('1. 是否在正确的游戏目录下运行');
  console.error('2. 参数是否正确');
  console.error('3. 是否有文件权限问题');
  process.exit(1);
}
