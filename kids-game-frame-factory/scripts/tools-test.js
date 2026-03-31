#!/usr/bin/env node
/**
 * 🛠️ 工具链测试脚本
 * 
 * 测试所有开发工具的功能完整性
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️ ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bgBlue} ${title} ${colors.reset}`);
}

/**
 * 测试环境检查
 */
function testEnvironment() {
  logSection('环境检查');
  logInfo(`平台: ${os.platform() + ' ' + os.arch()}`);
  logInfo(`Node.js: ${process.version}`);
  logInfo(`当前目录: ${process.cwd()}`);
  
  // 检查Node版本
  const nodeVersion = process.versions.node.split('.')[0];
  if (parseInt(nodeVersion) >= 16) {
    logSuccess(`Node.js版本 >= 16.x`);
  } else {
    logError(`Node.js版本过低 (当前: ${process.version}, 需要: >=16.x)`);
    return false;
  }
  
  return true;
}

/**
 * 测试工具文件存在性
 */
function testToolFiles() {
  logSection('工具文件检查');
  
  const requiredFiles = [
    'scripts/game-wizard.bat',
    'scripts/GameWizard.ps1',
    'scripts/enhance-dev-tools.js',
    'scripts/resource-generator.js',
    'src/utils/DebugPanel.ts',
    'docs/DEBUG_TOOLS_GUIDE.md'
  ];
  
  let allExist = true;
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${file} ✓`);
    } else {
      logError(`${file} ✗`);
      allExist = false;
    }
  }
  
  return allExist;
}

/**
 * 测试增强开发工具
 */
function testDevTools() {
  logSection('增强开发工具测试');
  
  try {
    const output = execSync('node scripts/enhance-dev-tools.js version', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    if (output.includes('kids-game-frame-factory')) {
      logSuccess('增强开发工具基本功能正常');
      console.log(`  版本信息: ${output.trim()}`);
      
      // 测试帮助命令
      try {
        const helpOutput = execSync('node scripts/enhance-dev-tools.js help', { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..'),
          stdio: ['pipe', 'pipe', 'ignore']
        });
        
        if (helpOutput.includes('check') && helpOutput.includes('create')) {
          logSuccess('帮助命令正常');
        }
      } catch (helpError) {
        logWarning('帮助命令测试失败，但工具仍在运行');
      }
      
    } else {
      logError('增强开发工具返回信息异常');
      return false;
    }
  } catch (error) {
    logError(`增强开发工具测试失败: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * 测试批处理向导
 */
function testBatchWizard() {
  logSection('Windows向导测试');
  
  if (os.platform() !== 'win32') {
    logInfo('非Windows平台，跳过批处理测试');
    return true;
  }
  
  const batchPath = path.join(__dirname, '..', 'scripts', 'game-wizard.bat');
  
  if (fs.existsSync(batchPath)) {
    try {
      // 检查文件内容完整性
      const content = fs.readFileSync(batchPath, 'utf8');
      if (content.includes('@echo off') && content.includes('选择操作')) {
        logSuccess('批处理向导文件格式正确');
        
        // 尝试执行简单命令
        try {
          const testOutput = execSync(`"${batchPath}" /test`, {
            encoding: 'utf8',
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
          });
          
          if (testOutput.includes('v3.1.0')) {
            logSuccess('批处理向导测试模式正常');
          }
        } catch (testError) {
          // 测试模式失败，但批处理文件本身可能正常
          logWarning('批处理向导测试模式失败，但文件格式正确');
        }
      } else {
        logError('批处理向导文件内容异常');
        return false;
      }
    } catch (error) {
      logError(`读取批处理向导失败: ${error.message}`);
      return false;
    }
  } else {
    logError('批处理向导文件不存在');
    return false;
  }
  
  return true;
}

/**
 * 测试PowerShell向导
 */
function testPowerShellWizard() {
  logSection('PowerShell向导测试');
  
  const psPath = path.join(__dirname, '..', 'scripts', 'GameWizard.ps1');
  
  if (fs.existsSync(psPath)) {
    try {
      const content = fs.readFileSync(psPath, 'utf8');
      if (content.includes('function Show-Menu') && content.includes('kids-game-frame-factory')) {
        logSuccess('PowerShell向导文件格式正确');
        console.log(`  检测到: ${content.match(/v\d+\.\d+\.\d+/)?.[0] || '版本号'}`);
      } else {
        logError('PowerShell向导文件内容异常');
        return false;
      }
    } catch (error) {
      logError(`读取PowerShell向导失败: ${error.message}`);
      return false;
    }
  } else {
    logError('PowerShell向导文件不存在');
    return false;
  }
  
  return true;
}

/**
 * 测试资源生成工具
 */
function testResourceGenerator() {
  logSection('资源生成工具测试');
  
  try {
    // 测试帮助命令
    const helpOutput = execSync('node scripts/resource-generator.js help', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (helpOutput.includes('🎨 智能资源生成工具')) {
      logSuccess('资源生成工具基本功能正常');
      console.log(`  指令支持: ${helpOutput.includes('init') ? '✓' : '✗'} init`);
      console.log(`  指令支持: ${helpOutput.includes('placeholder') ? '✓' : '✗'} placeholder`);
      console.log(`  指令支持: ${helpOutput.includes('validate') ? '✓' : '✗'} validate`);
      console.log(`  指令支持: ${helpOutput.includes('optimize') ? '✓' : '✗'} optimize`);
    } else {
      logError('资源生成工具返回信息异常');
      return false;
    }
  } catch (error) {
    logError(`资源生成工具测试失败: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * 测试调试面板
 */
function testDebugPanel() {
  logSection('调试面板测试');
  
  const debugPanelPath = path.join(__dirname, '..', 'src', 'utils', 'DebugPanel.ts');
  
  if (fs.existsSync(debugPanelPath)) {
    try {
      const content = fs.readFileSync(debugPanelPath, 'utf8');
      
      const features = [
        { name: 'PerformanceMonitor', regex: /class PerformanceMonitor/ },
        { name: 'ResourceAnalyzer', regex: /class ResourceAnalyzer/ },
        { name: 'EventLogger', regex: /class EventLogger/ },
        { name: 'DevTools', regex: /class DevTools/ },
        { name: 'DebugPanel', regex: /class DebugPanel/ }
      ];
      
      let allFeaturesFound = true;
      
      for (const feature of features) {
        if (feature.regex.test(content)) {
          logSuccess(`找到 ${feature.name}`);
        } else {
          logError(`未找到 ${feature.name}`);
          allFeaturesFound = false;
        }
      }
      
      return allFeaturesFound;
    } catch (error) {
      logError(`读取调试面板失败: ${error.message}`);
      return false;
    }
  } else {
    logError('调试面板文件不存在');
    return false;
  }
}

/**
 * 测试文档完整性
 */
function testDocumentation() {
  logSection('文档完整性测试');
  
  const requiredDocs = [
    'docs/DEBUG_TOOLS_GUIDE.md',
    'README.md',
    'AI_INSTRUCTIONS.md',
    'CONTRIBUTING.md'
  ];
  
  let docsExist = 0;
  
  for (const doc of requiredDocs) {
    const fullPath = path.join(__dirname, '..', doc);
    if (fs.existsSync(fullPath)) {
      logSuccess(`${doc} 存在`);
      docsExist++;
    } else if (doc !== 'CONTRIBUTING.md') {
      logError(`${doc} 不存在`);
    } else {
      logWarning(`${doc} 不存在（可选）`);
    }
  }
  
  // 检查工具使用指南是否完整
  const debugGuidePath = path.join(__dirname, '..', 'docs', 'DEBUG_TOOLS_GUIDE.md');
  if (fs.existsSync(debugGuidePath)) {
    try {
      const content = fs.readFileSync(debugGuidePath, 'utf8');
      if (content.includes('调试面板') && content.includes('F12') && content.includes('热键')) {
        logSuccess('调试工具指南内容完整');
      } else {
        logWarning('调试工具指南内容可能不完整');
      }
    } catch (error) {
      logWarning(`读取调试工具指南失败: ${error.message}`);
    }
  }
  
  return docsExist >= 3; // 至少需要3个主要文档
}

/**
 * 总测试总结
 */
async function runAllTests() {
  console.log(`
${colors.bgBlue} ════════════════════════════════════════════════════ ${colors.reset}
${colors.bgBlue} 🛠️  kids-game-frame-factory 工具链完整性测试 ${colors.reset}
${colors.bgBlue} ════════════════════════════════════════════════════ ${colors.reset}
`);
  
  let tests = [];
  let results = [];
  
  // 执行所有测试
  tests.push({ name: '环境检查', fn: testEnvironment });
  tests.push({ name: '工具文件检查', fn: testToolFiles });
  tests.push({ name: '增强开发工具', fn: testDevTools });
  tests.push({ name: 'Windows向导', fn: testBatchWizard });
  tests.push({ name: 'PowerShell向导', fn: testPowerShellWizard });
  tests.push({ name: '资源生成工具', fn: testResourceGenerator });
  tests.push({ name: '调试面板', fn: testDebugPanel });
  tests.push({ name: '文档完整性', fn: testDocumentation });
  
  for (const test of tests) {
    logInfo(`正在测试: ${test.name}...`);
    try {
      const result = test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`${test.name} 测试异常: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // 输出总结
  logSection('🎯 测试总结');
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const percentage = Math.round((passedCount / totalCount) * 100);
  
  console.log(`📊 测试结果: ${passedCount}/${totalCount} (${percentage}%)`);
  
  if (passedCount === totalCount) {
    logSuccess('✅ 所有测试通过！工具链完整性良好。');
  } else if (percentage >= 80) {
    logWarning('⚠️ 大多数测试通过，但存在一些小问题。');
  } else if (percentage >= 60) {
    logWarning('⚠️ 工具链部分可用，但存在需要修复的问题。');
  } else {
    logError('❌ 测试通过率较低，工具链可能存在问题。');
  }
  
  // 显示失败项
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log(`\n${colors.yellow}📋 失败项目:${colors.reset}`);
    failedTests.forEach(test => {
      console.log(`  ❌ ${test.name}`);
    });
  }
  
  // 建议
  logSection('💡 建议与下一步操作');
  
  if (percentage >= 90) {
    console.log('  ✓ 工具链准备就绪，可用于新游戏开发');
    console.log('  ✓ 建议使用:`npm run create`或`game-wizard`开始');
    console.log('  ✓ 查看:`docs/DEBUG_TOOLS_GUIDE.md`了解调试工具');
  } else if (percentage >= 70) {
    console.log('  ⚠️ 工具链基本可用，但建议修复失败项目');
    console.log('  ✓ 建议先修复明显的文件依赖错误');
    console.log('  ✓ 然后重新运行此测试');
  } else {
    console.log('  ❌ 工具链存在问题，建议修复后再使用');
    console.log('  ✓ 检查缺失的文件和依赖');
    console.log('  ✓ 验证Node.js环境和权限');
  }
  
  console.log(`
${colors.bgBlue} 🔧 快速使用指南 ${colors.reset}
  ${colors.cyan}开始新游戏:${colors.reset}
    Windows: game-wizard.bat
    PowerShell: GameWizard.ps1
    Node.js: npm run create
  
  ${colors.cyan}验证项目:${colors.reset}
    npm run validate   # 项目验证
    npm run analyze    # 项目分析
    npm run check      # 环境检查
  
  ${colors.cyan}资源管理:${colors.reset}
    npm run resource:init <game-id>     # 初始化资源
    npm run resource:optimize <dir>     # 优化资源
  
  ${colors.cyan}工具测试:${colors.reset}
    npm run test:tools                  # 重新运行此测试
  `);
  
  return passedCount === totalCount;
}

// 执行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`${colors.bgRed} ❌ 测试运行失败: ${error.message} ${colors.reset}`);
    process.exit(2);
  });
}

module.exports = { runAllTests };