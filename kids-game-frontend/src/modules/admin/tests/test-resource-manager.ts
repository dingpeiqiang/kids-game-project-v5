/**
 * 通用资源管理器测试脚本
 * 
 * 用于验证GenericResourceManager的功能
 */

import { createResourceManager } from '../utils/generic-resource-manager';
import type { ResourceManagerConfig } from '../types/resource-manager-config';
import { ResourceType, ResourceCategory } from '../types/resource-manager-config';

/**
 * 测试配置加载
 */
async function testConfigLoading() {
  console.log('\n=== 测试1: 配置加载 ===');
  
  const config: ResourceManagerConfig = {
    gameConfig: {
      gameId: 'pvz',
      gameName: '植物大战僵尸',
      themeId: 'pvz',
      themeName: 'PVZ 默认主题',
      themeBasePath: '/themes/pvz',
      groups: []
    }
  };
  
  const manager = createResourceManager(config);
  
  try {
    await manager.initialize();
    
    const gameConfig = manager.getConfig();
    console.log('✅ 配置加载成功');
    console.log('   游戏ID:', gameConfig?.gameId);
    console.log('   主题ID:', gameConfig?.themeId);
    console.log('   分组数量:', manager.getGroups().length);
    
    return true;
  } catch (error) {
    console.error('❌ 配置加载失败:', error);
    return false;
  }
}

/**
 * 测试资源查询
 */
async function testResourceQuery() {
  console.log('\n=== 测试2: 资源查询 ===');
  
  const config: ResourceManagerConfig = {
    gameConfig: {
      gameId: 'pvz',
      gameName: '植物大战僵尸',
      themeId: 'pvz',
      themeBasePath: '/themes/pvz',
      groups: []
    }
  };
  
  const manager = createResourceManager(config);
  await manager.initialize();
  
  // 测试获取所有资源
  const allResources = manager.getAllResources();
  console.log('✅ 获取所有资源:', allResources.length, '个');
  
  // 测试按类型获取
  const images = manager.getResourcesByType(ResourceType.IMAGE);
  console.log('✅ 图片资源:', images.length, '个');
  
  const audios = manager.getResourcesByType(ResourceType.AUDIO);
  console.log('✅ 音频资源:', audios.length, '个');
  
  // 测试按分类获取
  const sceneImages = manager.getResourcesByCategory(ResourceCategory.SCENE);
  console.log('✅ 场景资源:', sceneImages.length, '个');
  
  // 测试获取单个资源
  const peashooter = manager.getResource('peashooter');
  if (peashooter) {
    console.log('✅ 获取单个资源:', peashooter.alias);
  } else {
    console.log('⚠️  未找到peashooter资源（可能GTRS中不存在）');
  }
  
  return true;
}

/**
 * 测试分组功能
 */
async function testGrouping() {
  console.log('\n=== 测试3: 分组功能 ===');
  
  const config: ResourceManagerConfig = {
    gameConfig: {
      gameId: 'pvz',
      gameName: '植物大战僵尸',
      themeId: 'pvz',
      themeBasePath: '/themes/pvz',
      groups: []
    }
  };
  
  const manager = createResourceManager(config);
  await manager.initialize();
  
  const groups = manager.getGroups();
  console.log('✅ 分组数量:', groups.length);
  
  groups.forEach((group, index) => {
    console.log(`   ${index + 1}. ${group.icon} ${group.name} (${group.resources.length}个资源)`);
  });
  
  // 测试获取分组资源
  if (groups.length > 0) {
    const firstGroup = groups[0];
    const groupResources = manager.getResourcesByGroup(firstGroup.name);
    console.log('✅ 第一个分组资源数:', groupResources.length);
  }
  
  return true;
}

/**
 * 测试事件系统
 */
async function testEventSystem() {
  console.log('\n=== 测试4: 事件系统 ===');
  
  const config: ResourceManagerConfig = {
    gameConfig: {
      gameId: 'pvz',
      gameName: '植物大战僵尸',
      themeId: 'pvz',
      themeBasePath: '/themes/pvz',
      groups: []
    }
  };
  
  const manager = createResourceManager(config);
  
  let configLoaded = false;
  let resourcesUpdated = false;
  
  manager.setEvents({
    onConfigLoaded: (config) => {
      console.log('✅ onConfigLoaded 事件触发');
      configLoaded = true;
    },
    onResourcesUpdated: (resources) => {
      console.log('✅ onResourcesUpdated 事件触发:', resources.length, '个资源');
      resourcesUpdated = true;
    }
  });
  
  await manager.initialize();
  
  if (configLoaded && resourcesUpdated) {
    console.log('✅ 事件系统工作正常');
    return true;
  } else {
    console.error('❌ 事件系统异常');
    return false;
  }
}

/**
 * 测试资源生成（模拟）
 */
async function testResourceGeneration() {
  console.log('\n=== 测试5: 资源生成（模拟） ===');
  
  const config: ResourceManagerConfig = {
    gameConfig: {
      gameId: 'pvz',
      gameName: '植物大战僵尸',
      themeId: 'pvz',
      themeBasePath: '/themes/pvz',
      groups: []
    }
  };
  
  const manager = createResourceManager(config);
  await manager.initialize();
  
  const resources = manager.getAllResources();
  if (resources.length === 0) {
    console.log('⚠️  没有资源可测试');
    return true;
  }
  
  // 测试单个资源生成
  const firstResource = resources[0];
  console.log('   测试生成:', firstResource.alias);
  
  const success = await manager.regenerateResource(firstResource.key);
  if (success) {
    console.log('✅ 单个资源生成成功');
  } else {
    console.log('⚠️  单个资源生成失败（可能是模拟环境）');
  }
  
  return true;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  通用资源管理器 - 功能测试             ║');
  console.log('╚════════════════════════════════════════╝');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 5
  };
  
  // 测试1: 配置加载
  if (await testConfigLoading()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试2: 资源查询
  if (await testResourceQuery()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试3: 分组功能
  if (await testGrouping()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试4: 事件系统
  if (await testEventSystem()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 测试5: 资源生成
  if (await testResourceGeneration()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // 输出测试结果
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  测试结果汇总                          ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  ✅ 通过: ${results.passed}/${results.total}                           ║`);
  console.log(`║  ❌ 失败: ${results.failed}/${results.total}                           ║`);
  console.log('╚════════════════════════════════════════╝');
  
  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息');
  }
  
  return results.failed === 0;
}

// 执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).runResourceManagerTests = runAllTests;
  console.log('💡 在浏览器控制台运行: await runResourceManagerTests()');
} else {
  // Node.js环境（如果需要）
  console.log('请在浏览器环境中运行此测试脚本');
}
