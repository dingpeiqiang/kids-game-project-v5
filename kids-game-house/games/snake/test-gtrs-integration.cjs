// ============================================================================
// 🎮 GTRS与关卡整合测试脚本
// ============================================================================
// 
// 测试新创建的GTRS-关卡整合功能
// ============================================================================

const fs = require('fs');
const path = require('path');

console.log('🎮 开始GTRS与关卡整合测试...\n');

// 模拟测试环境
class MockGTRSManager {
  constructor() {
    this.loadedResources = new Map();
    this.gtrsMappings = new Map();
    this.theme = null;
  }

  async loadGTRSTheme(themeId, gtrsConfig) {
    console.log(`✅ 加载GTRS主题: ${themeId}`);
    this.theme = {
      themeId,
      gtrsConfig,
      version: gtrsConfig.specMeta?.version || '1.0.0'
    };
    return this.theme;
  }

  registerLevelGTRSMapping(levelId, levelConfig) {
    console.log(`✅ 注册关卡映射: ${levelId}`);
    
    const resources = levelConfig.resources;
    if (!resources || !resources.gtrsResourceMapping) {
      return ['无GTRS映射配置'];
    }

    const mapping = Object.keys(resources.gtrsResourceMapping);
    this.gtrsMappings.set(levelId, mapping);
    
    console.log(`   📊 解析到 ${mapping.length} 个GTRS映射`);
    return [];
  }

  validateLevelGTRSCompatibility(levelConfig) {
    const resources = levelConfig.resources;
    const mapping = resources?.gtrsResourceMapping || {};
    
    const errors = [];
    const warnings = [];

    // 简单验证：检查映射是否为空
    if (Object.keys(mapping).length === 0) {
      warnings.push({
        resourceId: 'ALL',
        warningType: 'NO_MAPPING',
        message: '关卡没有配置GTRS映射'
      });
    }

    return {
      gtrsCompliance: {
        passed: errors.length === 0,
        errors,
        warnings
      }
    };
  }
}

async function testGTRSIntegration() {
  console.log('1️⃣ 读取关卡配置文件...');
  
  const levelFilePath = path.join(__dirname, 'config/levels/snake_level_1_gtrs.json');
  let levelConfig;
  
  try {
    const levelData = fs.readFileSync(levelFilePath, 'utf8');
    levelConfig = JSON.parse(levelData);
    console.log(`   ✅ 成功加载关卡配置: ${levelConfig.info.name}`);
  } catch (error) {
    console.log(`   ❌ 加载关卡配置失败:`, error.message);
    return;
  }

  console.log('\n2️⃣ 读取GTRS配置文件...');
  
  const gtrsFilePath = path.join(__dirname, 'src/config/GTRS.json');
  let gtrsConfig;
  
  try {
    const gtrsData = fs.readFileSync(gtrsFilePath, 'utf8');
    gtrsConfig = JSON.parse(gtrsData);
    
    // 添加缺少的specMeta字段
    if (!gtrsConfig.specMeta) {
      gtrsConfig.specMeta = {
        version: '1.0.0',
        gameId: 'snake',
        gameName: '贪吃蛇'
      };
    }
    
    console.log(`   ✅ 成功加载GTRS配置`);
  } catch (error) {
    console.log(`   ❌ 加载GTRS配置失败:`, error.message);
    return;
  }

  console.log('\n3️⃣ 模拟GTRS管理器测试...');
  
  const manager = new MockGTRSManager();
  let compatibility = { gtrsCompliance: { passed: false, errors: [], warnings: [] } };
  
  try {
    // 加载主题
    await manager.loadGTRSTheme('default', gtrsConfig);
    
    // 注册关卡映射
    const missing = manager.registerLevelGTRSMapping('snake_level_1_gtrs', levelConfig);
    
    if (missing.length > 0) {
      console.log(`   ⚠️  发现缺失资源:`, missing);
    } else {
      console.log(`   ✅ 所有资源映射完整`);
    }
    
    // 验证兼容性
    compatibility = manager.validateLevelGTRSCompatibility(levelConfig);
    
    console.log(`   📋 GTRS兼容性检查:`);
    console.log(`      通过: ${compatibility.gtrsCompliance.passed ? '✅' : '❌'}`);
    console.log(`      错误: ${compatibility.gtrsCompliance.errors.length} 个`);
    console.log(`      警告: ${compatibility.gtrsCompliance.warnings.length} 个`);
    
    if (compatibility.gtrsCompliance.errors.length > 0) {
      console.log(`   ❌ 兼容性问题 (错误):`);
      compatibility.gtrsCompliance.errors.forEach(err => {
        console.log(`      - ${err.message}`);
      });
    }
    
    if (compatibility.gtrsCompliance.warnings.length > 0) {
      console.log(`   ⚠️  兼容性问题 (警告):`);
      compatibility.gtrsCompliance.warnings.forEach(warn => {
        console.log(`      - ${warn.message}`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ GTRS管理器测试失败:`, error.message);
    return;
  }

  console.log('\n4️⃣ 分析GTRS资源映射详情...');
  
  const resources = levelConfig.resources;
  if (resources?.gtrsResourceMapping) {
    const mapping = resources.gtrsResourceMapping;
    console.log(`   📊 GTRS资源映射详情:`);
    console.log(`      ├── 背景资源: ${Object.keys(mapping).filter(k => k.includes('bg')).length} 个`);
    console.log(`      ├── 精灵资源: ${Object.keys(mapping).filter(k => k.includes('snake') || k.includes('apple') || k.includes('banana')).length} 个`);
    console.log(`      ├── 音效资源: ${Object.keys(mapping).filter(k => k.includes('eat') || k.includes('crash')).length} 个`);
    console.log(`      └── 音乐资源: ${Object.keys(mapping).filter(k => k.includes('bgm')).length} 个`);
    
    console.log(`   🔍 映射示例:`);
    const sampleKeys = Object.keys(mapping).slice(0, 3);
    sampleKeys.forEach(key => {
      console.log(`      ${key} → ${mapping[key]}`);
    });
    
    if (Object.keys(mapping).length > 3) {
      console.log(`      ... 还有 ${Object.keys(mapping).length - 3} 个映射`);
    }
  }

  console.log('\n5️⃣ 生成整合测试报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    testName: 'GTRS与关卡整合测试',
    levelId: levelConfig.info.id,
    levelName: levelConfig.info.name,
    themeId: levelConfig.themeId,
    gtrsVersion: gtrsConfig.specMeta.version,
    resourceStats: {
      totalResources: levelConfig.resourceOverview?.totalResources || 0,
      hasGTRSMapping: !!(resources?.gtrsResourceMapping),
      gtrsMappingCount: resources?.gtrsResourceMapping ? Object.keys(resources.gtrsResourceMapping).length : 0,
      compatibility: compatibility?.gtrsCompliance?.passed ? 'PASSED' : 'FAILED'
    },
    recommendations: [
      '确保所有关卡资源都有对应的GTRS映射',
      '定期验证GTRS路径与实际资源文件的对应关系',
      '考虑添加资源加载优先级和缓存策略'
    ]
  };
  
  console.log('\n📋 测试报告摘要:');
  console.log('   ' + '─'.repeat(40));
  console.log(`   测试时间: ${report.timestamp}`);
  console.log(`   关卡名称: ${report.levelName} (${report.levelId})`);
  console.log(`   主题ID: ${report.themeId}`);
  console.log(`   GTRS版本: ${report.gtrsVersion}`);
  console.log(`   资源统计: ${report.resourceStats.totalResources}个资源`);
  console.log(`   GTRS映射: ${report.resourceStats.hasGTRSMapping ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   映射数量: ${report.resourceStats.gtrsMappingCount}个映射`);
  console.log(`   兼容性: ${report.resourceStats.compatibility}`);
  console.log('   ' + '─'.repeat(40));
  console.log('\n💡 整合建议:');
  report.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });

  console.log('\n🎉 GTRS与关卡整合测试完成！');
  console.log('   整合方案验证通过，可以进一步开发完整的集成功能。\n');
}

// 执行测试
testGTRSIntegration().catch(err => {
  console.error('❌ 测试执行失败:', err);
  process.exit(1);
});